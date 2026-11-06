import { RefreshCw, Search, Sparkles } from 'lucide-react'
import { cardSummaryText, type CardSummary, type WikiCandidate, type WikiDetail, type Morphology, type ProtectionMatch } from '../../api/types'
import { Badge, Button, Input, Skeleton } from '../ui'
import { cn } from '../../lib/cn'

interface WikiPickerProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  candidates: WikiCandidate[]
  loading: boolean
  activeTitle: string | null
  onPick: (title: string) => void
  detail?: { detail: WikiDetail | null; morphology: Morphology | null; protection: ProtectionMatch | null; cardSummary: CardSummary | null } | null
  detailLoading?: boolean
  /** 候选检索失败原因（来自服务端，如限流、超时、网络不可达） */
  errorMessage?: string | null
  /** 详情抓取失败原因 */
  detailError?: string | null
  onRetry?: () => void
  onDetailRetry?: () => void
  onApply: () => void
  className?: string
}

/** 维基候选补全 + 抓取预览：选中后一键把资料写入表单 */
export function WikiPicker({
  keyword,
  onKeywordChange,
  candidates,
  loading,
  activeTitle,
  onPick,
  detail,
  detailLoading,
  errorMessage,
  detailError,
  onRetry,
  onDetailRetry,
  onApply,
  className,
}: WikiPickerProps) {
  return (
    <section className={cn('glass flex flex-col gap-3 rounded-lg px-4 py-4 shadow-elev-1', className)}>
      <header className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-gold" />
        <h3 className="text-title text-fog-100">维基资料抓取</h3>
      </header>
      <Input
        value={keyword}
        prefixIcon={<Search className="h-3.5 w-3.5" />}
        placeholder="输入中文名 / 学名 / 英文名，例如 白鹭"
        onChange={(event) => onKeywordChange(event.target.value)}
      />

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-danger">维基检索失败：{errorMessage}</p>
          {onRetry ? (
            <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={onRetry}>
              重试
            </Button>
          ) : null}
        </div>
      ) : candidates.length ? (
        <ul className="flex max-h-[260px] flex-col gap-2 overflow-y-auto pr-1">
          {candidates.map((candidate) => (
            <li key={candidate.title}>
              <button
                type="button"
                className={cn(
                  'w-full cursor-pointer rounded-md border px-3 py-2.5 text-left transition-colors duration-base',
                  activeTitle === candidate.title
                    ? 'border-moss/60 bg-moss/[0.08]'
                    : 'border-line/[0.08] bg-line/[0.02] hover:border-moss/35',
                )}
                onClick={() => onPick(candidate.title)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body text-fog-100">{candidate.title}</span>
                  {candidate.qid ? <Badge tone="outline">{candidate.qid}</Badge> : null}
                </div>
                {candidate.description ? (
                  <span className="clamp-1 text-micro text-fog-300">{candidate.description}</span>
                ) : null}
                {candidate.snippet ? (
                  <p className="mt-1 clamp-2 text-caption leading-relaxed text-fog-200">{stripHtml(candidate.snippet)}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : keyword.trim() ? (
        <p className="text-caption text-fog-300">没有找到候选条目，可直接手动填写下方表单。</p>
      ) : (
        <p className="text-caption text-fog-300">
          抓取会自动补全学名、目科属、IUCN、分布栖息与中英双语简介，抓到的结论仍可在表单里逐项改写。
        </p>
      )}

      {activeTitle ? (
        detailLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : detail?.detail ? (
          <div className="flex flex-col gap-2 rounded-md border border-line/[0.08] bg-line/[0.02] px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-body text-fog-100">{detail.detail.title}</span>
              {detail.detail.qid ? <Badge tone="outline">{detail.detail.qid}</Badge> : null}
              {detail.detail.iucnStatus ? <Badge tone="danger">{detail.detail.iucnStatus}</Badge> : null}
              {detail.protection?.level ? <Badge tone="gold">{detail.protection.level}</Badge> : null}
              {detail.protection?.isSanyou ? <Badge tone="plume">三有</Badge> : null}
            </div>
            <dl className="grid gap-1 text-micro text-fog-200">
              <div className="flex gap-2">
                <dt className="text-fog-300">学名</dt>
                <dd>{detail.detail.scientificName ?? '未标注'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-fog-300">分类</dt>
                <dd>
                  {[detail.detail.orderName, detail.detail.familyName, detail.detail.genusName].filter(Boolean).join(' / ') ||
                    '未标注'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-fog-300">形态</dt>
                <dd>
                  {[detail.morphology?.lengthCm && `体长 ${detail.morphology.lengthCm}cm`, detail.morphology?.weightG && `体重 ${detail.morphology.weightG}g`, detail.morphology?.wingspanCm && `翼展 ${detail.morphology.wingspanCm}cm`]
                    .filter(Boolean)
                    .join(' · ') || '未提取到'}
                </dd>
              </div>
            </dl>
            <p className="clamp-4 text-caption leading-relaxed text-fog-200">{detail.detail.extract}</p>
            {detail.detail.warnings?.length ? (
              <p className="text-micro text-amber-gold">部分资料缺失：{detail.detail.warnings.join('；')}</p>
            ) : null}
            {detail.cardSummary ? (
              <p className="rounded-sm bg-recess px-2.5 py-2 text-micro leading-relaxed text-fog-200">
                卡面摘要预览：{cardSummaryText(detail.cardSummary)}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button size="sm" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={onApply}>
                采用这份资料
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-md border border-danger/30 bg-danger/[0.06] px-3 py-2.5">
            <p className="text-caption text-danger">抓取失败：{detailError ?? '该条目缺少可用资料，可换一个候选或手动填写。'}</p>
            {onDetailRetry ? (
              <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={onDetailRetry}>
                重试
              </Button>
            ) : null}
          </div>
        )
      ) : null}
    </section>
  )
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '')
}
