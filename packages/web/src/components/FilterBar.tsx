import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { Button, IconButton, Input, Segmented, Select, Switch } from './ui'
import { useFacets } from '../api/hooks'
import type { SpeciesFilters } from '../api/hooks'
import { cn } from '../lib/cn'
import type { AtlasView } from '../store/uiStore'

interface FilterBarProps {
  filters: SpeciesFilters
  onChange: (next: SpeciesFilters) => void
  view: AtlasView
  onViewChange: (view: AtlasView) => void
  total?: number
  className?: string
}

const SORT_OPTIONS = [
  { value: 'recent', label: '最近拍摄' },
  { value: 'first', label: '首次记录' },
  { value: 'photos', label: '照片数量' },
  { value: 'stars', label: '稀有星级' },
  { value: 'name', label: '名称排序' },
]

function facetOptions(rows: Array<{ value: string; count: number }> | undefined, all: string) {
  return [{ value: '', label: all }, ...(rows ?? []).map((row) => ({ value: row.value, label: row.value, hint: String(row.count) }))]
}

/** 图鉴墙筛选条：关键词 + 分类 + 收藏/想拍 + 排序 + 视图切换 */
export function FilterBar({ filters, onChange, view, onViewChange, total, className }: FilterBarProps) {
  const { data: facets } = useFacets()
  const patch = (next: Partial<SpeciesFilters>) => onChange({ ...filters, ...next, offset: 0 })

  const dirty =
    Boolean(filters.q) ||
    Boolean(filters.group) ||
    Boolean(filters.order) ||
    Boolean(filters.family) ||
    Boolean(filters.protection) ||
    Boolean(filters.habitat) ||
    Boolean(filters.camera) ||
    Boolean(filters.lens) ||
    Boolean(filters.favorite) ||
    Boolean(filters.wishlist)

  return (
    <div className={cn('glass flex flex-col gap-3 rounded-lg px-4 py-3.5 shadow-elev-1', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={filters.q ?? ''}
          onChange={(event) => patch({ q: event.target.value })}
          placeholder="搜索中文名 / 学名 / 别名"
          prefixIcon={<Search className="h-3.5 w-3.5" />}
          className="min-w-[220px] flex-1"
        />
        <Select
          className="w-[150px]"
          value={filters.sort ?? 'recent'}
          onValueChange={(value) => patch({ sort: value as SpeciesFilters['sort'] })}
          options={SORT_OPTIONS}
        />
        <Segmented
          value={view}
          onValueChange={(value) => onViewChange(value as AtlasView)}
          options={[
            { value: 'grid', label: '卡片墙' },
            { value: 'stream', label: '日志流' },
          ]}
        />
        {dirty ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => onChange({ sort: filters.sort, limit: filters.limit })}
          >
            重置筛选
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-fog-300">
          <SlidersHorizontal className="h-3 w-3" /> 分类
        </span>
        <Select
          className="w-[130px]"
          size="sm"
          value={filters.group ?? ''}
          onValueChange={(value) => patch({ group: value || undefined })}
          options={facetOptions(facets?.groups, '全部类群')}
        />
        <Select
          className="w-[190px]"
          size="sm"
          value={filters.order ?? ''}
          onValueChange={(value) => patch({ order: value || undefined })}
          options={facetOptions(facets?.orders, '全部目')}
        />
        <Select
          className="w-[170px]"
          size="sm"
          value={filters.family ?? ''}
          onValueChange={(value) => patch({ family: value || undefined })}
          options={facetOptions(facets?.families, '全部科')}
        />
        <Select
          className="w-[160px]"
          size="sm"
          value={filters.protection ?? ''}
          onValueChange={(value) => patch({ protection: value || undefined })}
          options={facetOptions(facets?.protections, '全部保护级别')}
        />
        <Select
          className="w-[130px]"
          size="sm"
          value={filters.habitat ?? ''}
          onValueChange={(value) => patch({ habitat: value || undefined })}
          options={facetOptions(facets?.habitats, '全部栖息地')}
        />
        <Select
          className="w-[170px]"
          size="sm"
          value={filters.camera ?? ''}
          onValueChange={(value) => patch({ camera: value || undefined })}
          options={facetOptions(facets?.cameras, '全部机身')}
        />
        <Select
          className="w-[170px]"
          size="sm"
          value={filters.lens ?? ''}
          onValueChange={(value) => patch({ lens: value || undefined })}
          options={facetOptions(facets?.lenses, '全部镜头')}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Switch
            className="w-auto gap-2"
            checked={Boolean(filters.favorite)}
            onCheckedChange={(checked) => patch({ favorite: checked || undefined })}
            label="只看收藏"
          />
          <Switch
            className="w-auto gap-2"
            checked={Boolean(filters.wishlist)}
            onCheckedChange={(checked) => patch({ wishlist: checked || undefined })}
            label="只想拍"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-micro text-fog-300">
            共 <span className="tabular-nums text-fog-100">{total ?? 0}</span> 个物种
          </span>
        </div>
      </div>
    </div>
  )
}
