import { useState } from 'react'
import { ExternalLink, Globe2, Languages, RefreshCw } from 'lucide-react'
import type { SpeciesWithStats } from '../api/types'
import { Badge, Button, Panel, Segmented } from './ui'
import { formatDate, relativeTime } from '../lib/format'

interface WikiPanelProps {
  species: SpeciesWithStats
  onRefetch?: () => void
  refetching?: boolean
  className?: string
}

/** 维基百科来源面板：双语完整简介、来源链接与抓取时间 */
export function WikiPanel({ species, onRefetch, refetching, className }: WikiPanelProps) {
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const summary = lang === 'zh' ? species.summaryZh : species.summaryEn

  return (
    <Panel
      className={className}
      icon={<Globe2 className="h-4 w-4" />}
      title="维基百科资料"
      subtitle={`抓取于 ${relativeTime(species.fetchedAt)}`}
      actions={
        <div className="flex items-center gap-2">
          <Segmented
            size="sm"
            value={lang}
            onValueChange={(value) => setLang(value as 'zh' | 'en')}
            options={[
              { value: 'zh', label: '中文' },
              { value: 'en', label: 'English' },
            ]}
          />
          {onRefetch ? (
            <Button
              size="sm"
              variant="outline"
              icon={<RefreshCw className={refetching ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />}
              onClick={onRefetch}
            >
              重新抓取
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={species.fetchStatus === 'ok' ? 'success' : species.fetchStatus === 'failed' ? 'danger' : 'gold'}>
            抓取状态：{species.fetchStatus}
          </Badge>
          {species.qid ? <Badge tone="plume">Wikidata {species.qid}</Badge> : null}
          {species.imageCredit ? <Badge tone="outline">配图：{species.imageCredit}</Badge> : null}
          <span className="flex items-center gap-1 text-micro text-fog-300">
            <Languages className="h-3 w-3" /> {lang === 'zh' ? '中文导语' : '英文导语'}
          </span>
        </div>

        <div className="max-h-[420px] overflow-y-auto rounded-md border border-white/[0.06] bg-black/20 p-4">
          {summary ? (
            <p className="whitespace-pre-wrap text-caption leading-[1.85] text-fog-100">{summary}</p>
          ) : (
            <p className="text-caption leading-relaxed text-fog-300">
              {lang === 'zh'
                ? '还没有抓取到中文简介，可点击「重新抓取」从维基百科拉取，或在编辑页手动补录。'
                : '暂无英文简介，点击上方切换回中文，或在编辑页手动补录中文资料。'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-micro text-fog-300">
          <span>资料更新：{formatDate(species.fetchedAt, true)}</span>
          <div className="flex items-center gap-2">
            {species.wikiUrl ? (
              <a
                href={species.wikiUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-plume transition-colors hover:text-fog-100"
              >
                中文维基 <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            {species.wikiEnUrl ? (
              <a
                href={species.wikiEnUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-plume transition-colors hover:text-fog-100"
              >
                English Wikipedia <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  )
}
