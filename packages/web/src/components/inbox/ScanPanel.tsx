import { useState } from 'react'
import { FolderPlus, HardDrive, History, Play, RefreshCw, Trash2 } from 'lucide-react'
import type { LibraryRoot, ScanStatus } from '../../api/types'
import { Badge, Button, EmptyState, IconButton, Input, Progress, Separator } from '../ui'
import { cn } from '../../lib/cn'
import { formatDate, formatNumber, relativeTime } from '../../lib/format'

interface ScanPanelProps {
  roots: LibraryRoot[]
  status?: ScanStatus
  busy?: boolean
  onAddRoot: (path: string) => void
  onRemoveRoot: (id: number) => void
  onScan: (path: string) => void
  className?: string
}

/** 扫描控制台：图库目录、进度、最近任务 */
export function ScanPanel({ roots, status, busy, onAddRoot, onRemoveRoot, onScan, className }: ScanPanelProps) {
  const [path, setPath] = useState('')
  const running = Boolean(status?.running)
  const progress = status && status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0

  const pickDirectory = async () => {
    const picked = await window.birdAtlas?.selectDirectory?.()
    if (picked?.[0]) setPath(picked[0])
  }

  const submit = () => {
    const value = path.trim()
    if (!value) return
    onAddRoot(value)
    setPath('')
  }

  return (
    <section className={cn('glass flex flex-col gap-4 rounded-lg px-4 py-4 shadow-elev-1', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-moss" />
          <h2 className="text-title text-fog-100">扫描控制台</h2>
          {running ? <Badge tone="plume">扫描中</Badge> : <Badge tone="neutral">空闲</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="例如 D:\\Photos\\2025 外拍"
            className="w-[300px]"
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
          />
          {window.birdAtlas ? (
            <Button variant="ghost" size="sm" icon={<FolderPlus className="h-3.5 w-3.5" />} onClick={() => void pickDirectory()}>
              浏览
            </Button>
          ) : null}
          <Button size="sm" disabled={!path.trim()} loading={busy} onClick={submit}>
            加入图库
          </Button>
        </div>
      </header>

      {running ? (
        <div className="flex flex-col gap-1.5">
          <Progress value={progress} label={`已处理 ${formatNumber(status?.processed ?? 0)} / ${formatNumber(status?.total ?? 0)}`} />
          <span className="text-micro text-fog-300">
            开始于 {formatDate(status?.startedAt ?? null, true)}，可以先去筛选照片
          </span>
        </div>
      ) : status?.lastResult ? (
        <div className="flex flex-wrap items-center gap-3 text-caption text-fog-200">
          <span className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-moss" />
            上次扫描：共 {formatNumber(status.lastResult.total)} 张，新导入 {formatNumber(status.lastResult.imported)} 张
          </span>
          <span>重复 {formatNumber(status.lastResult.duplicated)}</span>
          <span className={status.lastResult.failed ? 'text-danger' : undefined}>失败 {formatNumber(status.lastResult.failed)}</span>
        </div>
      ) : (
        <p className="text-caption text-fog-300">还没有扫描记录。加入一个常用拍摄目录后点「开始扫描」，首次扫描会解析 EXIF 并生成缩略图。</p>
      )}

      <Separator />

      {roots.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="h-5 w-5" />}
          title="图库目录为空"
          description="可以加入多个目录，例如「年度外拍」与「手机随手拍」，扫描时会自动去重。"
          compact
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {roots.map((root) => (
            <li
              key={root.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-col">
                <span className="clamp-1 text-body text-fog-100">{root.path}</span>
                <span className="text-micro text-fog-300">
                  {formatNumber(root.photoCount)} 张已索引 · 最近扫描 {root.lastScanAt ? relativeTime(root.lastScanAt) : '从未'}
                  {root.note ? ` · ${root.note}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Play className="h-3.5 w-3.5" />}
                  disabled={running}
                  onClick={() => onScan(root.path)}
                >
                  开始扫描
                </Button>
                <IconButton label="移出图库" variant="ghost" size="sm" onClick={() => onRemoveRoot(root.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {status?.jobs?.length ? (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-fog-300">
            <History className="h-3 w-3" /> 最近任务
          </span>
          <ul className="flex flex-col gap-1">
            {status.jobs.slice(0, 4).map((job, index) => (
              <li key={index} className="flex items-center justify-between text-micro text-fog-300">
                <span className="clamp-1">{String(job.root ?? job.path ?? '任务')}</span>
                <span className="tabular-nums">
                  {String(job.status ?? '—')} · 导入 {String(job.imported ?? 0)} / 重复 {String(job.duplicated ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
