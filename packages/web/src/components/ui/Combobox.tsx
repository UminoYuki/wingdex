import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface ComboboxItem {
  value: string
  label: string
  hint?: string
  description?: string
}

interface ComboboxProps {
  value: string
  onValueChange: (value: string) => void
  items: ComboboxItem[]
  placeholder?: string
  emptyHint?: string
  loading?: boolean
  className?: string
  /** 允许输入任意文本（不限于候选项） */
  freeInput?: boolean
  onInputChange?: (text: string) => void
}

export function Combobox({
  value,
  onValueChange,
  items,
  placeholder = '搜索',
  emptyHint = '没有匹配结果',
  loading,
  className,
  freeInput = true,
  onInputChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState(value)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => setKeyword(value), [value])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text || text === value.toLowerCase()) return items.slice(0, 12)
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(text) ||
          item.value.toLowerCase().includes(text) ||
          (item.hint ?? '').toLowerCase().includes(text),
      )
      .slice(0, 12)
  }, [items, keyword, value])

  const commit = (item: ComboboxItem) => {
    onValueChange(item.value)
    onInputChange?.(item.label)
    setKeyword(item.label)
    setOpen(false)
  }

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <div className="flex h-9 items-center gap-2 rounded-md border border-white/[0.10] bg-black/25 px-3 focus-within:border-moss/60 focus-within:shadow-[0_0_0_3px_rgba(87,199,133,0.12)]">
        <Search className="h-3.5 w-3.5 text-fog-300" />
        <input
          value={keyword}
          placeholder={placeholder}
          onChange={(event) => {
            const text = event.target.value
            setKeyword(text)
            setActive(0)
            setOpen(true)
            if (freeInput) onValueChange(text)
            onInputChange?.(text)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              setActive((index) => Math.min(index + 1, filtered.length - 1))
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((index) => Math.max(index - 1, 0))
            }
            if (event.key === 'Enter' && open && filtered[active]) {
              event.preventDefault()
              commit(filtered[active])
            }
            if (event.key === 'Escape') setOpen(false)
          }}
          className="h-full w-full border-0 bg-transparent text-body text-fog-100 placeholder:text-fog-300 focus:outline-none"
        />
        {keyword ? (
          <button
            type="button"
            aria-label="清空"
            onClick={() => {
              setKeyword('')
              onValueChange('')
              setOpen(true)
            }}
            className="text-fog-300 transition-colors hover:text-fog-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] overflow-hidden rounded-md border border-white/[0.10] bg-ink-800/96 shadow-elev-3 backdrop-blur-xl animate-fade-in">
          {loading ? (
            <p className="px-3 py-2.5 text-caption text-fog-300">正在检索维基百科…</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-caption text-fog-300">{emptyHint}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {filtered.map((item, index) => (
                <li key={`${item.value}-${index}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => commit(item)}
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors duration-fast',
                      index === active ? 'bg-moss/12 text-fog-100' : 'text-fog-200 hover:bg-white/[0.05]',
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-body">{item.label}</span>
                      {item.hint ? <span className="text-micro text-fog-300">{item.hint}</span> : null}
                    </span>
                    {item.description ? (
                      <span className="clamp-1 text-micro text-fog-300">{item.description}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
