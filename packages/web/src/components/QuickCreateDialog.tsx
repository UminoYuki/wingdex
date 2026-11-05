import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { Badge, Button, Combobox, Dialog, Input } from './ui'
import { useWikiPreview } from '../api/hooks'
import { errorMessage } from '../api/client'
import { cardSummaryText } from '../api/types'
import { useUiStore } from '../store/uiStore'

/** 顶栏「录入物种」：先用维基候选检索，命中后跳转编辑页预填抓取结果 */
export function QuickCreateDialog() {
  const open = useUiStore((state) => state.quickCreateOpen)
  const close = useUiStore((state) => state.closeQuickCreate)
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [pending, setPending] = useState('')

  useEffect(() => {
    if (!open) setKeyword('')
  }, [open])

  const { data, isFetching, isError, error } = useWikiPreview(pending, open && pending.trim().length >= 2)

  const items = useMemo(
    () =>
      (data?.candidates ?? []).map((candidate) => ({
        value: candidate.title,
        label: candidate.title,
        hint: candidate.qid ?? undefined,
        description: candidate.description ?? candidate.snippet ?? undefined,
      })),
    [data],
  )

  const goCreate = (title: string, qid?: string | null) => {
    const params = new URLSearchParams({ title })
    if (qid) params.set('qid', qid)
    close()
    navigate(`/species/new?${params.toString()}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? undefined : close())}
      title="录入新物种"
      description="输入中文名、学名或英文名，系统会检索维基百科候选并自动抓取资料"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => goCreate(keyword.trim())}>
            跳过检索直接录入
          </Button>
          <Button variant="primary" size="sm" disabled={!pending && !keyword} onClick={() => goCreate(keyword.trim())}>
            下一步
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          autoFocus
          value={keyword}
          prefixIcon={<Search className="h-3.5 w-3.5" />}
          placeholder="例如：白鹭 / Egretta garzetta / Little Egret"
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') setPending(keyword.trim())
          }}
          onBlur={() => setPending(keyword.trim())}
        />

        <Combobox
          value={keyword}
          onValueChange={setKeyword}
          items={items}
          loading={isFetching}
          placeholder="继续输入或从候选中选择"
          emptyHint={pending.length < 2 ? '输入至少 2 个字符开始检索' : '没有找到匹配的维基词条'}
          onInputChange={(text) => {
            if (text.trim().length >= 2 && text !== keyword) setPending(text.trim())
          }}
        />

        {isError ? (
          <p className="text-caption text-danger">维基检索失败：{errorMessage(error)}（可跳过检索直接录入）</p>
        ) : null}

        {data?.detail ? (
          <div className="flex flex-col gap-2 rounded-md border border-moss/25 bg-moss/[0.06] p-3">
            <span className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-moss-soft">
              <Sparkles className="h-3 w-3" /> 已预览抓取结果
            </span>
            <p className="text-body text-fog-100">{data.detail.title}</p>
            <p className="clamp-3 text-caption leading-relaxed text-fog-200">{data.detail.extract}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {data.detail.scientificName ? <Badge tone="plume">{data.detail.scientificName}</Badge> : null}
              {data.detail.familyName ? <Badge tone="moss">{data.detail.familyName}</Badge> : null}
              {data.detail.iucnStatus ? <Badge tone="gold">IUCN {data.detail.iucnStatus}</Badge> : null}
              {data.cardSummary ? <Badge tone="outline">卡面摘要 {cardSummaryText(data.cardSummary).length} 字</Badge> : null}
            </div>
            <Button size="sm" variant="primary" className="w-fit" onClick={() => goCreate(data.detail!.title, data.detail!.qid)}>
              用该结果创建物种
            </Button>
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}
