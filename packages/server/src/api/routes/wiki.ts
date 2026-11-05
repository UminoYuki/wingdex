import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, ApiError, parseQuery } from '../utils'
import { logger } from '../../logger'
import { fetchDetail, fetchEntity, searchCandidates } from '../../services/wikiService'
import { parseMorphology } from '../../services/morphology'
import { summarizeForCard } from '../../services/summarize'
import { matchProtection } from '../../services/protectionService'

const router = Router()

const searchSchema = z.object({ q: z.string().min(1, '请输入物种名称') })

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q } = parseQuery(searchSchema, req.query)
    const items = await searchCandidates(q)
    res.json({ items })
  }),
)

const detailSchema = z.object({ title: z.string().min(1, '缺少词条标题') })

router.get(
  '/detail',
  asyncHandler(async (req, res) => {
    const { title } = parseQuery(detailSchema, req.query)
    const detail = await fetchDetail(title)
    if (!detail) throw new ApiError(404, `维基百科未找到词条「${title}」`)

    const morphology = parseMorphology(detail.extract, detail.extractEn ?? undefined)
    const protection = matchProtection({
      cnName: /[\u4e00-\u9fa5]/.test(title) ? title : undefined,
      scientificName: detail.scientificName,
      orderName: detail.orderName,
    })
    const summary = summarizeForCard(detail.extract)

    res.json({ detail, morphology, protection, cardSummary: summary })
  }),
)

/** 录入页：一次调用完成候选搜索 + 首条详情抓取 */
router.get(
  '/preview',
  asyncHandler(async (req, res) => {
    const { q } = parseQuery(searchSchema, req.query)
    const candidates = await searchCandidates(q)
    const first = candidates.find((item) => item.title) ?? null
    if (!first) {
      res.json({ candidates, detail: null, morphology: null })
      return
    }
    // 检索即预览：跳过配图下载，少一次外网请求并明显加快出结果
    const detail = await fetchDetail(first.title, { withImage: false }).catch((error) => {
      // 详情失败只丢预览，候选列表照常返回，避免整块面板报错
      logger.warn({ title: first.title, err: error instanceof Error ? error.message : String(error) }, '预览详情抓取失败')
      return null
    })
    const morphology = detail ? parseMorphology(detail.extract, detail.extractEn ?? undefined) : null
    res.json({ candidates, detail, morphology, cardSummary: detail ? summarizeForCard(detail.extract) : null })
  }),
)

const entitySchema = z.object({ qid: z.string().regex(/^Q\d+$/, 'QID 形如 Q1234') })

router.get(
  '/entity',
  asyncHandler(async (req, res) => {
    const { qid } = parseQuery(entitySchema, req.query)
    res.json(await fetchEntity(qid))
  }),
)

export default router
