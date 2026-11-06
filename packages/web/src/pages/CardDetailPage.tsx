import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Printer, RefreshCw, Trash2 } from 'lucide-react'
import { buildCardData, buildCardExif, composeTypeLine } from '../card/cardPreview'
import { SkinnedStage } from '../card/skins/SkinFace'
import { CARD_RATIO } from '../card/cardMetrics'
import { useCard, useDeleteCard } from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { Badge, Button, Dialog, ErrorState, Panel, Skeleton, notify } from '../components/ui'
import { exportCardPng } from '../lib/exportCard'
import { formatDate } from '../lib/format'
import { useUiStore } from '../store/uiStore'

/** 单张卡片详情：3D 正反面 + 数值面板 + 导出与打印入口 */
export default function CardDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cardId = Number(id)
  const valid = Number.isInteger(cardId) && cardId > 0

  const card = useCard(valid ? cardId : null)
  const remove = useDeleteCard()
  const openViewer = useUiStore((state) => state.openViewer)
  const [face, setFace] = useState<'front' | 'back'>('front')
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!valid) {
    return <ErrorState message="卡片编号无效，请从卡组进入" onRetry={() => navigate('/cards')} />
  }

  if (card.isError) {
    return <ErrorState message="卡片加载失败，请确认本地服务正在运行" onRetry={() => void card.refetch()} />
  }

  const data = card.data
  const cardData = data
    ? {
        ...buildCardData(data.card, data.species, data.photo),
        typeLine: composeTypeLine(data.species),
      }
    : null

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={data ? `卡片 · ${data.species.cnName}` : '卡片详情'}
        subtitle="拖拽卡片可以旋转查看厚度与高光，双击翻面；导出使用编辑器里保存的最终样式。"
        meta={
          data ? (
            <>
              <Badge tone="gold">{data.card.rarity}</Badge>
              <Badge tone="plume">{data.card.attribute}</Badge>
              <Badge tone="neutral">★ {data.card.stars}</Badge>
              {data.card.serialNo ? <Badge tone="outline">{data.card.serialNo}</Badge> : null}
            </>
          ) : null
        }
        actions={
          <>
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/cards')}>
              返回卡组
            </Button>
            <Button
              variant="secondary"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => window.open(`/cards/print/${cardId}?face=${face}&size=lg`, '_blank', 'noopener')}
            >
              打印视图
            </Button>
            <Button
              icon={<Download className="h-4 w-4" />}
              onClick={() => void exportCardPng({ id: cardId, face, size: 'lg' })}
            >
              导出 PNG
            </Button>
          </>
        }
      />

      {card.isLoading || !data || !cardData ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="mx-auto aspect-[59/86] w-full max-w-[420px] rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Panel
            title={face === 'front' ? '卡面' : '卡背'}
            subtitle="拖拽旋转 · 双击翻面 · 滚轮缩放"
            actions={
              <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => setFace(face === 'front' ? 'back' : 'front')}>
                翻到{face === 'front' ? '卡背' : '卡面'}
              </Button>
            }
          >
            {/* 卡片宽度同时受列宽与窗口高度约束，短窗口下也能看完整张卡 */}
            <div
              className="mx-auto w-full"
              style={{ maxWidth: `min(440px, calc((100vh - 300px) * ${CARD_RATIO}))` }}
            >
              <SkinnedStage
                card={data.card}
                data={cardData}
                exif={buildCardExif(data.photo)}
                face={face}
                onFaceChange={setFace}
                className="w-full"
              />
            </div>
          </Panel>

          <div className="flex flex-col gap-5">
            <Panel title="数值与来源" subtitle={`更新于 ${formatDate(data.card.updatedAt, true)}`}>
              <dl className="flex flex-col gap-3">
                <Row label="星级" value={`★ ${data.card.stars}（${data.card.starsSource ?? '自动'}）`} />
                <Row label="属性" value={`${data.card.attribute} 系`} />
                <Row label="ATK 珍稀值" value={String(data.card.atk)} />
                <Row label="DEF 记录值" value={String(data.card.def)} />
                <Row label="数值来源" value={data.card.valueSource ?? '默认规则'} />
                <Row
                  label="卡图"
                  value={data.photo ? `${data.photo.fileName}（${data.photo.cameraModel ?? '未知机身'}）` : '尚未选择照片'}
                />
                <Row label="卡背主题" value={`${data.card.backTheme} · ${data.card.backEmblem ?? '无纹章'}`} />
              </dl>
            </Panel>

            <Panel title="物种资料" subtitle={`${data.species.cnName} · ${data.species.photoCount} 张照片`}>
              <p className="text-caption leading-relaxed text-fog-200">{data.species.summaryZh ?? '还没有中文简介，可在编辑页抓取维基资料。'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigate(`/species/${data.species.id}`)}>
                  物种详情
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!data.photos.length}
                  onClick={() => openViewer(data.photos.map((photo) => photo.id), 0)}
                >
                  查看素材照片
                </Button>
              </div>
            </Panel>

            <Panel title="操作">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => navigate(`/cards/editor/${cardId}`)}>
                  进入编辑器
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => void exportCardPng({ id: cardId, face: 'back', size: 'lg' })}
                >
                  导出卡背
                </Button>
                <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirmOpen(true)}>
                  删除卡片
                </Button>
              </div>
              <p className="mt-3 text-micro leading-relaxed text-fog-300">
                删除只影响这张卡片，物种资料与照片都会保留，随时可以重新生成。
              </p>
            </Panel>
          </div>
        </div>
      )}

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除这张卡片？"
        description="删除后卡号会被释放，成就进度按实际留存卡片重新统计"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(cardId, {
                  onSuccess: () => {
                    notify.success('卡片已删除')
                    navigate('/cards')
                  },
                })
              }
            >
              确认删除
            </Button>
          </>
        }
      >
        <p className="text-caption leading-relaxed text-fog-200">
          将删除卡片 {data?.card.serialNo ?? `#${cardId}`}（{data?.species.cnName ?? '未知物种'}）。如果想保留素材，建议先导出 PNG。
        </p>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/[0.05] pb-2 last:border-0 last:pb-0">
      <dt className="shrink-0 text-caption text-fog-300">{label}</dt>
      <dd className="text-right text-caption text-fog-100">{value}</dd>
    </div>
  )
}
