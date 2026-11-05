import { useCallback, useMemo, useRef, useState } from 'react'
import type { CardDraft } from './draftTypes'

const MAX_HISTORY = 60

type Updater = Partial<CardDraft> | ((draft: CardDraft) => CardDraft)

export interface EditorHistory {
  draft: CardDraft | null
  /** 应用一次修改；commit=false 用于拖拽中的连续更新（不产生历史步） */
  apply: (updater: Updater, label: string, commit?: boolean) => void
  /** 结束连续修改（拖拽松手）时把整段并入一步历史 */
  flush: (label: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** 丢弃所有历史，重置为给定草稿（用于载入卡片、重置粒度） */
  reset: (next: CardDraft, label?: string) => void
  markSaved: () => void
  dirty: boolean
  lastLabel: string
  depth: number
}

/** 撤销重做栈：以整份草稿快照为单元，连续拖拽合并为一步 */
export function useEditorDraft(initial: CardDraft | null = null): EditorHistory {
  const [draft, setDraft] = useState<CardDraft | null>(initial)
  const [baseline, setBaseline] = useState<string>(initial ? JSON.stringify(initial) : '')
  const [stamp, setStamp] = useState(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [lastLabel, setLastLabel] = useState('')

  const past = useRef<Array<{ draft: CardDraft; label: string }>>([])
  const future = useRef<CardDraft[]>([])
  const transientBase = useRef<CardDraft | null>(null)

  const syncFlags = useCallback(() => {
    setCanUndo(past.current.length > 0)
    setCanRedo(future.current.length > 0)
    setStamp((value) => value + 1)
  }, [])

  const apply = useCallback(
    (updater: Updater, label: string, commit = true) => {
      setDraft((prev) => {
        if (!prev) return prev
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
        if (next === prev) return prev

        if (commit) {
          const base = transientBase.current ?? prev
          transientBase.current = null
          past.current = [...past.current, { draft: base, label }].slice(-MAX_HISTORY)
          future.current = []
        } else if (!transientBase.current) {
          transientBase.current = prev
        }
        setLastLabel(label)
        queueMicrotask(syncFlags)
        return next
      })
    },
    [syncFlags],
  )

  const flush = useCallback(
    (label: string) => {
      const base = transientBase.current
      transientBase.current = null
      if (!base) return
      past.current = [...past.current, { draft: base, label }].slice(-MAX_HISTORY)
      future.current = []
      setLastLabel(label)
      syncFlags()
    },
    [syncFlags],
  )

  const undo = useCallback(() => {
    const entry = past.current[past.current.length - 1]
    if (!entry) return
    past.current = past.current.slice(0, -1)
    setDraft((prev) => {
      if (prev) future.current = [...future.current, prev].slice(-MAX_HISTORY)
      return entry.draft
    })
    transientBase.current = null
    setLastLabel(`撤销：${entry.label}`)
    queueMicrotask(syncFlags)
  }, [syncFlags])

  const redo = useCallback(() => {
    const next = future.current[future.current.length - 1]
    if (!next) return
    future.current = future.current.slice(0, -1)
    setDraft((prev) => {
      if (prev) past.current = [...past.current, { draft: prev, label: '重做前状态' }].slice(-MAX_HISTORY)
      return next
    })
    setLastLabel('重做')
    queueMicrotask(syncFlags)
  }, [syncFlags])

  const reset = useCallback(
    (next: CardDraft, label?: string) => {
      past.current = []
      future.current = []
      transientBase.current = null
      setDraft(next)
      setLastLabel(label ?? '重置')
      queueMicrotask(syncFlags)
    },
    [syncFlags],
  )

  const markSaved = useCallback(() => {
    setDraft((prev) => {
      if (prev) setBaseline(JSON.stringify(prev))
      return prev
    })
  }, [])

  const dirty = useMemo(() => Boolean(draft) && JSON.stringify(draft) !== baseline, [draft, baseline])

  return {
    draft,
    apply,
    flush,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    markSaved,
    dirty,
    lastLabel,
    depth: stamp,
  }
}
