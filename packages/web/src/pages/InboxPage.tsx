import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, FolderInput, FolderPlus, HardDriveDownload, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import type { Photo } from '../api/types'
import {
  useAddRoot,
  useAssignPhotos,
  useDeletePhoto,
  useRemoveRoot,
  useRoots,
  useScanStatus,
  useSpeciesOptions,
  useStartScan,
  useUpdatePhoto,
  useVerifyLibrary,
} from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { PhotoGrid } from '../components/PhotoGrid'
import { ScanPanel } from '../components/inbox/ScanPanel'
import { Badge, Button, Combobox, Dialog, EmptyState, ErrorState, IconButton, Panel, Skeleton, notify } from '../components/ui'
import { useInfinitePhotos } from '../hooks/useInfinitePhotos'
import { formatNumber } from '../lib/format'
import { useUiStore } from '../store/uiStore'

/** 导入待分类：扫描控制 + 批量指派 */
export default function InboxPage() {
  const navigate = useNavigate()
  const openViewer = useUiStore((state) => state.openViewer)
  const [selected, setSelected] = useState<number[]>([])
  const [targetId, setTargetId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null)

  const stream = useInfinitePhotos({ unassigned: true, order: 'taken_desc' })
  const scanStatus = useScanStatus()
  const roots = useRoots()
  const addRoot = useAddRoot()
  const removeRoot = useRemoveRoot()
  const startScan = useStartScan()
  const verifyLibrary = useVerifyLibrary()
  const assignPhotos = useAssignPhotos()
  const updatePhoto = useUpdatePhoto()
  const deletePhoto = useDeletePhoto()
  const speciesOptions = useSpeciesOptions()

  const photos = useMemo(() => (stream.data?.pages ?? []).flatMap((page) => page.items), [stream.data])
  const total = stream.data?.pages[0]?.total ?? photos.length
  const sentinel = useRef<HTMLDivElement>(null)

  const { hasNextPage, isFetchingNextPage, fetchNextPage, refetch: refetchStream } = stream

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // 扫描完成后刷新待分类列表：只在「进行中 → 结束」那一刻刷新一次。
  // 以前依赖整个 stream 对象，它每次渲染都是新的，扫描结束后会无限 refetch 第一页。
  const wasRunning = useRef(false)
  const scanRunning = Boolean(scanStatus.data?.running)
  useEffect(() => {
    if (wasRunning.current && !scanRunning) void refetchStream()
    wasRunning.current = scanRunning
  }, [scanRunning, refetchStream])

  const options = useMemo(
    () =>
      (speciesOptions.data?.items ?? []).map((item) => ({
        value: String(item.id),
        label: item.cnName,
        hint: item.scientificName ?? undefined,
      })),
    [speciesOptions.data],
  )

  const toggleSelect = (id: number) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const assign = () => {
    const speciesId = Number(targetId)
    if (!speciesId || selected.length === 0) return
    assignPhotos.mutate(
      { photoIds: selected, speciesId },
      {
        onSuccess: (result) => {
          notify.success(`已指派 ${result.changed} 张照片`, keyword ? `目标物种：${keyword}` : undefined)
          setSelected([])
          setTargetId('')
          setKeyword('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="导入待分类"
        subtitle="扫描本地目录只建立索引，不移动也不复制原图；指派物种后照片会自动进入图鉴、统计与卡片候选。"
        meta={
          <>
            <Badge tone="moss">待分类 {formatNumber(total)} 张</Badge>
            {scanStatus.data?.running ? <Badge tone="plume">扫描中 {scanStatus.data.processed}/{scanStatus.data.total}</Badge> : null}
            {roots.data?.items.length ? <Badge tone="neutral">{roots.data.items.length} 个图库目录</Badge> : null}
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ShieldCheck className="h-4 w-4" />}
              loading={verifyLibrary.isPending}
              onClick={() =>
                verifyLibrary.mutate(undefined, {
                  onSuccess: (result) => notify.info(`校验完成：${result.checked} 张，缺失 ${result.missing} 张`),
                })
              }
            >
              校验原图
            </Button>
            <Button
              variant="ghost"
              icon={<RefreshCw className="h-4 w-4" />}
              loading={stream.isFetching}
              onClick={() => void stream.refetch()}
            >
              刷新
            </Button>
          </>
        }
      />

      <ScanPanel
        roots={roots.data?.items ?? []}
        status={scanStatus.data}
        busy={startScan.isPending || addRoot.isPending}
        onAddRoot={(path) =>
          addRoot.mutate({ path }, { onSuccess: () => notify.success('图库目录已加入', path) })
        }
        onRemoveRoot={(id) => removeRoot.mutate(id)}
        onScan={(path) =>
          startScan.mutate(
            { root: path },
            {
              onSuccess: (result) =>
                'accepted' in result
                  ? notify.info('扫描已开始', '进度会实时更新，可继续筛选其他照片')
                  : notify.success(
                      `扫描完成：新导入 ${result.imported} 张`,
                      `重复跳过 ${result.duplicated} 张 · 失败 ${result.failed} 张`,
                    ),
            },
          )
        }
      />

      <Panel
        title="待分类池"
        subtitle={selected.length ? `已选 ${selected.length} 张，指派后立即出图鉴` : '勾选照片后可批量指派给物种'}
        actions={
          selected.length ? (
            <>
              <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => setSelected([])}>
                取消选择
              </Button>
              <Button
                size="sm"
                icon={<CheckCheck className="h-3.5 w-3.5" />}
                disabled={!targetId}
                loading={assignPhotos.isPending}
                onClick={assign}
              >
                指派给物种
              </Button>
            </>
          ) : null
        }
      >
        {selected.length ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-moss/25 bg-moss/[0.06] px-3 py-2.5">
            <Combobox
              className="w-[280px]"
              value={targetId}
              items={options}
              loading={speciesOptions.isLoading}
              placeholder="搜索已有物种（中文名 / 学名）"
              emptyHint="没有匹配的物种，可先去新建"
              onValueChange={setTargetId}
              onInputChange={setKeyword}
            />
            <Button variant="ghost" size="sm" onClick={() => navigate('/species/new')}>
              新建物种并录入
            </Button>
            <span className="text-micro text-fog-300">提示：物种封面与首次记录会按时间自动计算</span>
          </div>
        ) : null}

        {stream.isError ? (
          <ErrorState message="待分类照片加载失败" onRetry={() => void stream.refetch()} />
        ) : stream.isLoading ? (
          <PhotoGrid photos={[]} loading />
        ) : photos.length === 0 ? (
          <EmptyState
            icon={<FolderInput className="h-5 w-5" />}
            title="待分类池是空的"
            description="把常用拍摄目录加进图库后点「开始扫描」，新照片会自动进入这里等待指派。"
          />
        ) : (
          <>
            <PhotoGrid
              photos={photos}
              selectedIds={selected}
              onToggleSelect={toggleSelect}
              onOpen={(index) => openViewer(photos.map((photo) => photo.id), index)}
            />
            <div ref={sentinel} className="flex items-center justify-center py-5">
              {stream.hasNextPage ? (
                <Button variant="ghost" loading={stream.isFetchingNextPage} onClick={() => void stream.fetchNextPage()}>
                  加载更多
                </Button>
              ) : (
                <span className="text-micro text-fog-300">已加载全部 {formatNumber(photos.length)} 张</span>
              )}
            </div>
          </>
        )}
      </Panel>

      <Panel title="快捷评分" subtitle="挑片时先给张好照片打分，制卡会优先选中五星照">
        {photos.length === 0 ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {photos.slice(0, 12).map((photo) => (
              <div
                key={photo.id}
                className="flex w-[188px] items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-2"
              >
                <img src={`/api/media/photo/${photo.id}/thumb?size=240`} alt={photo.fileName} className="h-9 w-12 rounded-sm object-cover" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="clamp-1 text-micro text-fog-100">{photo.fileName}</span>
                  <span className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`评 ${value} 星`}
                        className="cursor-pointer text-micro text-fog-300 transition-colors hover:text-amber-gold"
                        onClick={() => updatePhoto.mutate({ id: photo.id, rating: value })}
                      >
                        ★
                      </button>
                    ))}
                  </span>
                </div>
                <IconButton label="删除记录" variant="ghost" size="sm" onClick={() => setDeleteTarget(photo)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-micro text-fog-300">
          <HardDriveDownload className="h-3 w-3" /> 删除只会移除索引记录，原图文件保持不动。
        </p>
      </Panel>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (open ? undefined : setDeleteTarget(null))}
        title="从图鉴移除这张照片？"
        description={deleteTarget ? `${deleteTarget.fileName} 会从索引中删除，原图仍保留在磁盘上。` : ''}
        width="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              loading={deletePhoto.isPending}
              onClick={() =>
                deleteTarget &&
                deletePhoto.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }
            >
              移除
            </Button>
          </div>
        }
      >
        <p className="text-caption text-fog-200">下次扫描该目录时，这张照片会重新出现在待分类池。</p>
      </Dialog>
    </div>
  )
}
