import { Database, FolderCog, Palette, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAddRoot, useRemoveRoot, useRoots, useScanStatus, useSettings, useStartScan, useVerifyLibrary } from '../api/hooks'
import { errorMessage } from '../api/client'
import { PageHeader } from '../components/AppShell'
import { ScanPanel } from '../components/inbox/ScanPanel'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { BACK_SKINS, CARD_SKINS } from '../card/skins/cardSkin'
import { usePrefsStore } from '../store/prefsStore'
import { Badge, Button, ErrorState, Panel, Segmented, Skeleton, notify } from '../components/ui'

const ENV_HELP: Array<{ key: 'BA_DATA_DIR' | 'BA_PORT' | 'BA_HOST' | 'BA_USER_AGENT'; desc: string }> = [
  { key: 'BA_DATA_DIR', desc: '数据目录（数据库、缩略图、维基缓存、导出）' },
  { key: 'BA_PORT', desc: '后端接口端口，默认 5176' },
  { key: 'BA_HOST', desc: '监听地址，默认 127.0.0.1' },
  { key: 'BA_USER_AGENT', desc: '访问维基媒体时使用的 User-Agent' },
]

/** 设置：只读展示数据目录，管理照片图库目录 */
export default function SettingsPage() {
  const settings = useSettings()
  const roots = useRoots()
  const scanStatus = useScanStatus()
  const addRoot = useAddRoot()
  const removeRoot = useRemoveRoot()
  const startScan = useStartScan()
  const verifyLibrary = useVerifyLibrary()
  const data = settings.data
  const cardSkin = usePrefsStore((state) => state.cardSkin)
  const setCardSkin = usePrefsStore((state) => state.setCardSkin)
  const backSkin = usePrefsStore((state) => state.backSkin)
  const setBackSkin = usePrefsStore((state) => state.setBackSkin)

  const rescanAll = () => {
    const first = roots.data?.items[0]
    if (!first) return
    startScan.mutate(
      { root: first.path },
      { onSuccess: () => notify.info('扫描已开始', '一次扫描一个目录，完成后可继续扫下一个') },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="设置" subtitle={data ? `${data.name} · v${data.version}` : 'Wingdex · 生灵图鉴'} />

      <Panel
        title="外观"
        subtitle="主题和卡面皮肤保存在这台浏览器。窄屏顶栏会收起主题点，在这里仍然可以切换。皮肤不写入卡片，导出的 PNG 仍是典藏卡面。"
        icon={<Palette className="h-4 w-4" />}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-micro uppercase tracking-wide text-fog-300">界面主题</span>
            <ThemeSwitcher />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-micro uppercase tracking-wide text-fog-300">卡组正面</span>
            <Segmented
              size="sm"
              value={cardSkin}
              onValueChange={setCardSkin}
              options={CARD_SKINS.map((item) => ({ value: item.id, label: item.label }))}
            />
            <p className="text-caption text-fog-300">{CARD_SKINS.find((item) => item.id === cardSkin)?.description}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-micro uppercase tracking-wide text-fog-300">卡组背面</span>
            <Segmented
              size="sm"
              value={backSkin}
              onValueChange={setBackSkin}
              options={BACK_SKINS.map((item) => ({ value: item.id, label: item.label }))}
            />
            <p className="text-caption text-fog-300">{BACK_SKINS.find((item) => item.id === backSkin)?.description}</p>
          </div>
        </div>
      </Panel>

      <Panel
        title="数据目录"
        subtitle="数据库、缩略图、维基缓存与导出文件都在这里。照片原图只索引不复制。"
        icon={<Database className="h-4 w-4" />}
      >
        {settings.isLoading ? (
          <Skeleton className="h-16" />
        ) : settings.isError || !data ? (
          <ErrorState message={`读取设置失败：${errorMessage(settings.error)}`} onRetry={() => void settings.refetch()} />
        ) : (
          <div className="flex flex-col gap-3 text-caption text-fog-200">
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-line/[0.05] px-2 py-1 font-mono text-fog-100 break-all">{data.dataDir}</code>
              <Badge tone={data.portableDataDir ? 'moss' : 'neutral'}>{data.portableDataDir ? '便携' : '系统目录'}</Badge>
              <Badge tone="neutral">端口 {data.port}</Badge>
            </div>
            <p className="leading-relaxed text-fog-300">
              数据目录在启动时决定，界面里不能改：设置环境变量 <code className="font-mono text-fog-100">BA_DATA_DIR</code>{' '}
              为绝对路径后重启即可（例如 <code className="font-mono">set BA_DATA_DIR=E:\WingdexData</code>）。换目录前先把原目录整体拷过去。
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {ENV_HELP.map((item) => (
                <li key={item.key} className="rounded-md border border-line/[0.07] px-3 py-2">
                  <span className="font-mono text-fog-100">{item.key}</span>
                  <span className="ml-2 text-fog-300">{item.desc}</span>
                  <div className="mt-0.5 font-mono text-micro text-fog-300">当前：{data.env[item.key] ?? '未设置'}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel
        title="照片图库"
        subtitle="管理要扫描的照片目录。移除目录不会删除照片文件。"
        icon={<FolderCog className="h-4 w-4" />}
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              loading={verifyLibrary.isPending}
              onClick={() =>
                verifyLibrary.mutate(undefined, {
                  onSuccess: (result) => notify.success(`已检查 ${result.checked} 张`, `原图缺失 ${result.missing} 张`),
                })
              }
            >
              校验原图
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              disabled={!roots.data?.items.length || scanStatus.data?.running}
              onClick={rescanAll}
            >
              重新扫描首个目录
            </Button>
          </>
        }
      >
        <ScanPanel
          roots={roots.data?.items ?? []}
          status={scanStatus.data}
          busy={startScan.isPending || addRoot.isPending}
          onAddRoot={(path) => addRoot.mutate({ path }, { onSuccess: () => notify.success('图库目录已加入', path) })}
          onRemoveRoot={(id) => removeRoot.mutate(id)}
          onScan={(path) =>
            startScan.mutate(
              { root: path },
              {
                onSuccess: (result) =>
                  'accepted' in result
                    ? notify.info('扫描已开始', '进度会实时更新')
                    : notify.success(`扫描完成：新导入 ${result.imported} 张`),
              },
            )
          }
        />
      </Panel>
    </div>
  )
}
