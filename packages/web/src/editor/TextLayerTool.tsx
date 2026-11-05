import { Eraser, Scissors, Sparkles, Undo2 } from 'lucide-react'
import type { CardOverride } from '../api/types'
import { TEXT_METRICS, estimateLines } from '../card/cardMetrics'
import { Button, Panel, Textarea } from '../components/ui'
import { EFFECT_TOTAL_LIMIT, TEXT_LIMITS, type CardDraft } from './draftTypes'

interface TextLayerToolProps {
  draft: CardDraft
  onPatch: (updater: Partial<CardDraft>, label: string) => void
  onPatchOverride: (id: string, patch: CardOverride, label: string) => void
  onRegenerate: () => void
  regenerating: boolean
}

/** 文本编辑：字数计数、超限红字、自动精简与两个快捷工具 */
export function TextLayerTool({ draft, onPatch, onPatchOverride, onRegenerate, regenerating }: TextLayerToolProps) {
  const effectLines = estimateLines(draft.effectText, TEXT_METRICS.effectCharsPerLine)
  const recordLines = estimateLines(draft.recordText, TEXT_METRICS.recordCharsPerLine)
  const total = draft.effectText.length + draft.recordText.length

  const trimSentences = () => {
    const text = draft.effectText
    if (!text) return
    const sentences = text
      .split(/(?<=[。！？；])/)
      .map((part) => part.trim())
      .filter(Boolean)
    const kept: string[] = []
    let length = 0
    for (const sentence of sentences) {
      if (length + sentence.length > TEXT_LIMITS.effect) break
      kept.push(sentence)
      length += sentence.length
    }
    onPatch({ effectText: kept.join('') || text.slice(0, TEXT_LIMITS.effect) }, '按句截断简介')
  }

  const stripBrackets = () => {
    const cleaned = draft.effectText
      .replace(/（[^）]*）/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\s{2,}/g, '')
      .trim()
    onPatch({ effectText: cleaned }, '移除括号内容')
  }

  return (
    <Panel
      title="文本与容量"
      subtitle={`效果框合计 ${total}/${EFFECT_TOTAL_LIMIT} 字 · 简介 ≈${effectLines} 行 / 上限 ${TEXT_METRICS.effectMaxLines} 行`}
      actions={
        <Button
          size="sm"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          loading={regenerating}
          onClick={onRegenerate}
        >
          自动精简
        </Button>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={<Scissors className="h-3.5 w-3.5" />} onClick={trimSentences}>
            按句截断
          </Button>
          <Button size="sm" variant="secondary" icon={<Eraser className="h-3.5 w-3.5" />} onClick={stripBrackets}>
            移除括号内容
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Undo2 className="h-3.5 w-3.5" />}
            onClick={() => {
              onPatchOverride('name', { content: null }, '恢复自动卡名')
              onPatchOverride('typeLine', { content: null }, '恢复自动类型行')
            }}
          >
            恢复自动文本
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Counter
          label="称号"
          value={draft.title}
          limit={TEXT_LIMITS.title}
          placeholder="例如：晨雾中的一抹白"
          rows={1}
          onChange={(value) => onPatch({ title: value }, '修改称号')}
        />
        <Counter
          label="卡名（覆盖物种中文名）"
          value={draft.overrides.name?.content ?? ''}
          limit={TEXT_LIMITS.name}
          placeholder="留空则使用物种中文名"
          rows={1}
          onChange={(value) => onPatchOverride('name', { content: value || null }, '修改卡名')}
        />
        <Counter
          label="类型行"
          value={draft.overrides.typeLine?.content ?? ''}
          limit={TEXT_LIMITS.typeLine}
          placeholder="例如：鸟纲·鹈形目/鹭科 涉禽"
          rows={1}
          onChange={(value) => onPatchOverride('typeLine', { content: value || null }, '修改类型行')}
        />
        <Counter
          label="物种简介"
          value={draft.effectText}
          limit={TEXT_LIMITS.effect}
          placeholder="自动精简后的 2–3 句导语"
          rows={4}
          onChange={(value) => onPatch({ effectText: value }, '修改物种简介')}
        />
        <Counter
          label={`拍摄记录（≈${recordLines} 行 / 上限 ${TEXT_METRICS.recordMaxLines} 行）`}
          value={draft.recordText}
          limit={TEXT_LIMITS.record}
          placeholder="2025-04-06 · 崇明东滩"
          rows={2}
          onChange={(value) => onPatch({ recordText: value }, '修改拍摄记录')}
        />
        <Counter
          label="卡背文字"
          value={draft.backText}
          limit={TEXT_LIMITS.backText}
          placeholder="例如：第 37 号野外记录"
          rows={1}
          onChange={(value) => onPatch({ backText: value }, '修改卡背文字')}
        />
      </div>
    </Panel>
  )
}

interface CounterProps {
  label: string
  value: string
  limit: number
  placeholder: string
  rows: number
  onChange: (value: string) => void
}

function Counter({ label, value, limit, placeholder, rows, onChange }: CounterProps) {
  const over = value.length > limit
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between">
        <span className="text-caption text-fog-100">{label}</span>
        <span className={`text-micro tabular-nums ${over ? 'text-alert' : 'text-fog-300'}`}>
          {value.length}/{limit}
        </span>
      </span>
      <Textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        invalid={over}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
