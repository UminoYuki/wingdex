/**
 * 冒烟脚本：启动本地服务并依次访问关键接口，验证数据层、媒体层与业务层可正常协作。
 * 可重复运行：物种已存在时自动复用，卡片编辑器相关接口会写入一次真实草稿再验证校验与保存。
 * 运行：npm run smoke -w @ba/server
 */
import { startServer } from '../src/index'

const PORT = Number(process.env.BA_SMOKE_PORT ?? 41731)
const base = `http://127.0.0.1:${PORT}/api`

interface Result {
  status: number
  body: unknown
}

async function call(path: string, init?: RequestInit): Promise<Result> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const text = await res.text()
  let body: unknown = text
  try {
    body = JSON.parse(text)
  } catch {
    body = text.slice(0, 120)
  }
  return { status: res.status, body }
}

function flag(ok: boolean): string {
  return ok ? 'PASS' : 'FAIL'
}

function report(name: string, status: number, extra = ''): void {
  console.log(`[${flag(status >= 200 && status < 400)}] ${name} -> ${status} ${extra}`)
}

/** 断言接口落到期望状态码（例如超限文本必须被拒绝） */
function expect(name: string, status: number, wanted: number, extra = ''): void {
  console.log(`[${flag(status === wanted)}] ${name} -> ${status} (期望 ${wanted}) ${extra}`)
}

function pick<T>(body: unknown, key: string): T | undefined {
  return (body as Record<string, T> | null)?.[key]
}

async function main(): Promise<void> {
  const handle = await startServer({ port: PORT, host: '127.0.0.1' })
  console.log(`服务已启动：${handle.url}`)

  const health = await call('/health')
  report('GET /api/health', health.status, JSON.stringify(pick<unknown>(health.body, 'counts') ?? {}))

  const world = await call('/geo/world')
  report('GET /api/geo/world', world.status, `features=${pick<unknown[]>(world.body, 'features')?.length ?? 0}`)

  const china = await call('/geo/china')
  report('GET /api/geo/china', china.status, `features=${pick<unknown[]>(china.body, 'features')?.length ?? 0}`)

  // 物种：已存在则复用，保证脚本可重复执行
  const created = await call('/species', {
    method: 'POST',
    body: JSON.stringify({ cnName: '白鹭', group: '鸟纲', note: '冒烟测试物种' }),
  })
  let speciesId = pick<number>(created.body, 'id')
  if (created.status === 409) {
    const found = await call('/species?q=%E7%99%BD%E9%B9%AD&limit=1')
    speciesId = pick<Array<{ id: number }>>(found.body, 'items')?.[0]?.id
    console.log(`[PASS] POST /api/species -> 409（已存在，复用）id=${speciesId ?? 'n/a'}`)
  } else {
    report('POST /api/species', created.status, `id=${speciesId ?? 'n/a'}`)
  }

  const listed = await call('/species?limit=5')
  report('GET /api/species', listed.status, `total=${pick<number>(listed.body, 'total') ?? 0}`)

  // 维基抓取依赖外网：限流/断网时接口返回 503 与可读提示，不算冒烟失败
  const wikiPreview = await call('/wiki/preview?q=%E7%99%BD%E9%B9%AD')
  const wikiMessage = String(
    pick<string>(wikiPreview.body, 'error') ?? pick<string>(wikiPreview.body, 'message') ?? '',
  ).slice(0, 60)
  if (wikiPreview.status === 200) {
    const candidates = pick<Array<{ title?: string }>>(wikiPreview.body, 'candidates')
    report('GET /api/wiki/preview（维基候选）', wikiPreview.status, `candidates=${candidates?.length ?? 0}`)
  } else if (wikiPreview.status === 503 || wikiPreview.status === 504) {
    console.log(`[WARN] GET /api/wiki/preview -> ${wikiPreview.status}（外网受限，降级提示：${wikiMessage}）`)
  } else {
    report('GET /api/wiki/preview（维基候选）', wikiPreview.status, wikiMessage)
  }

  const scanStatus = await call('/scan/status')
  report('GET /api/scan/status', scanStatus.status)

  const roots = await call('/roots')
  report('GET /api/roots', roots.status, `items=${pick<unknown[]>(roots.body, 'items')?.length ?? 0}`)

  if (speciesId) {
    const cardId = await runCardFlow(speciesId)
    if (cardId) {
      await runTemplateFlow(cardId)
      // 冒烟数据不留在库里，避免多次运行堆垃圾卡片
      const cleaned = await call(`/cards/${cardId}`, { method: 'DELETE' })
      report('DELETE /api/cards/:id（清理冒烟卡片）', cleaned.status)
    }
  }

  const assets = await call('/media/assets')
  report('GET /api/media/assets', assets.status, `items=${pick<unknown[]>(assets.body, 'items')?.length ?? 0}`)

  const stats = await call('/stats')
  report(
    'GET /api/stats',
    stats.status,
    `species=${(pick<{ overview?: { speciesCount?: number } }>(stats.body, 'overview')?.speciesCount) ?? 0}`,
  )

  const achievements = await call('/achievements')
  report(
    'GET /api/achievements',
    achievements.status,
    `unlocked=${pick<{ summary?: { unlocked?: number } }>(achievements.body, 'summary')?.unlocked ?? 0}`,
  )

  await handle.close()
  console.log('冒烟测试完成')
}

/** 卡片编辑器核心链路：默认值 → 创建 → 草稿保存 → 字数校验 → 重生成 → 重算 → 复制 */
async function runCardFlow(speciesId: number): Promise<number | null> {
  const defaults = await call(`/cards/defaults?speciesId=${speciesId}`)
  report('GET /api/cards/defaults', defaults.status)

  const created = await call('/cards', { method: 'POST', body: JSON.stringify({ speciesId }) })
  const cardId = pick<number>(created.body, 'id')
  report('POST /api/cards', created.status, `id=${cardId ?? 'n/a'} serial=${pick<string>(created.body, 'serialNo') ?? 'n/a'}`)
  if (!cardId) return null

  const detail = await call(`/cards/${cardId}`)
  report(
    'GET /api/cards/:id',
    detail.status,
    `species=${pick<{ cnName?: string }>(detail.body, 'species')?.cnName ?? 'n/a'} photos=${pick<unknown[]>(detail.body, 'photos')?.length ?? 0}`,
  )

  // 一份真实草稿：图层微调 + 自由文本层 + 卡背印花 + 卡图裁切 + 手动文本
  const patch = {
    title: '晨雾里的守候',
    stars: 8,
    effectText: '中型涉禽，通体白色，栖息于湿地与稻田，以鱼虾为食。',
    effectSource: 'manual',
    recordText: '2026-04-06 · 崇明东滩 · 600mm 手持守候两小时',
    backText: '第一次见到成群起飞的白鹭',
    photoCrop: { x: 0.5, y: 0.45, scale: 1.2 },
    overrides: {
      effect: { dx: 1.5, dy: -0.5, scale: 1.08, rotate: -2, fontScale: 1.05, color: '#E8EFE9' },
      name: { order: 3, locked: false },
      backPrints: { visible: true },
      backText: { order: 6, content: '第一次见到成群起飞的白鹭' },
    },
    layers: [
      {
        id: 'text-smoke',
        kind: 'text',
        content: '2026 春季迁徙 · 摄于崇明东滩',
        x: 50,
        y: 88,
        dx: 0,
        dy: 0,
        scale: 1,
        rotate: 0,
        color: '#E8EFE9',
        fontSize: 6,
        fontWeight: 500,
        opacity: 1,
        blendMode: 'normal',
        shadow: false,
      },
    ],
    backPrint: {
      tone: 'gold',
      intensity: 0.6,
      aperture: { enabled: true, blades: 9, rotate: 30 },
      exifRing: { enabled: true, text: '600mm · f/4 · 1/1000s · ISO 800' },
      filmstrip: { enabled: true },
    },
  }

  const saved = await call(`/cards/${cardId}`, { method: 'PATCH', body: JSON.stringify(patch) })
  report('PATCH /api/cards/:id（图层/印花/裁切）', saved.status, `title=${pick<string>(saved.body, 'title') ?? 'n/a'}`)

  const overLimit = await call(`/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify({ effectText: '白'.repeat(160) }),
  })
  expect('PATCH /api/cards/:id（简介 160 字超限）', overLimit.status, 400)

  const regenerated = await call(`/cards/${cardId}/regenerate`, { method: 'POST', body: JSON.stringify({ force: true }) })
  const effect = pick<string>(regenerated.body, 'effectText') ?? ''
  report('POST /api/cards/:id/regenerate', regenerated.status, `简介 ${effect.length} 字`)

  const recalc = await call(`/cards/${cardId}/recalc`, { method: 'POST' })
  report(
    'POST /api/cards/:id/recalc',
    recalc.status,
    `★${pick<number>(recalc.body, 'stars') ?? 0} ATK ${pick<number>(recalc.body, 'atk') ?? 0} DEF ${pick<number>(recalc.body, 'def') ?? 0}`,
  )

  const duplicated = await call(`/cards/${cardId}/duplicate`, { method: 'POST' })
  const duplicateId = pick<number>(duplicated.body, 'id')
  report('POST /api/cards/:id/duplicate', duplicated.status, `id=${duplicateId ?? 'n/a'}`)
  if (duplicateId) {
    const removed = await call(`/cards/${duplicateId}`, { method: 'DELETE' })
    report('DELETE /api/cards/:id（清理副本）', removed.status)
  }

  const cards = await call('/cards?limit=5')
  report('GET /api/cards', cards.status, `total=${pick<number>(cards.body, 'total') ?? 0}`)

  return cardId
}

/** 模板链路：从卡片生成模板 → 套用到卡片 → 删除模板 */
async function runTemplateFlow(cardId: number): Promise<void> {
  const created = await call('/card-templates/from-card', {
    method: 'POST',
    body: JSON.stringify({ cardId, name: `冒烟模板 ${new Date().toISOString().slice(0, 10)}` }),
  })
  const templateId = pick<number>(created.body, 'id')
  report('POST /api/card-templates/from-card', created.status, `id=${templateId ?? 'n/a'}`)

  const templates = await call('/card-templates')
  report('GET /api/card-templates', templates.status, `items=${pick<unknown[]>(templates.body, 'items')?.length ?? 0}`)

  if (templateId) {
    const applied = await call(`/card-templates/${templateId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ cardId }),
    })
    report('POST /api/card-templates/:id/apply', applied.status)

    const removed = await call(`/card-templates/${templateId}`, { method: 'DELETE' })
    report('DELETE /api/templates/:id（清理模板）', removed.status)
  }
}

void main().catch((error) => {
  console.error('冒烟测试失败：', error)
  process.exitCode = 1
})
