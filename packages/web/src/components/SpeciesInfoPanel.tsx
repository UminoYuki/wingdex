import { BookOpen, GitBranch, MapPinned, Ruler, Shield, Sparkles, Utensils } from 'lucide-react'
import type { Morphology, ProtectionMatch, SpeciesWithStats } from '../api/types'
import { Badge, Panel, Progress, Separator } from './ui'
import { RangeBar } from './RangeBar'
import { habitatIconKey, PlaceIcon, ProtectionIcon, protectionIconKey, taxonIconKey, TaxonIcon } from '../icons/registry'
import { formatMetric, percent } from '../lib/format'

interface SpeciesInfoPanelProps {
  species: SpeciesWithStats
  morphology?: Morphology | null
  protection?: ProtectionMatch | null
  className?: string
}

const IUCN_TONE: Record<string, 'danger' | 'gold' | 'moss' | 'plume' | 'neutral'> = {
  CR: 'danger',
  EN: 'danger',
  VU: 'gold',
  NT: 'plume',
  LC: 'moss',
  DD: 'neutral',
}

/** 物种完整资料面板：分类面包屑、双盾牌、形态量规、栖息地、居留与生态 */
export function SpeciesInfoPanel({ species, morphology, protection, className }: SpeciesInfoPanelProps) {
  const breadcrumb = [
    { key: taxonIconKey(species.group), label: species.group ?? '未分类' },
    { key: 'bird', label: species.orderName ?? '目未记录' },
    { key: 'bird', label: species.familyName ?? '科未记录' },
    { key: 'bird', label: species.genusName ?? '属未记录' },
  ]

  const length = species.lengthCm ?? morphology?.lengthCm ?? null
  const weight = species.weightG ?? morphology?.weightG ?? null
  const wingspan = species.wingspanCm ?? morphology?.wingspanCm ?? null

  const completeness = [
    species.scientificName,
    species.orderName,
    species.familyName,
    species.iucnStatus,
    species.cnProtectionLevel ?? (species.isSanyou ? '三有' : null),
    length ?? weight ?? wingspan,
    species.distribution.length ? species.distribution.join('、') : null,
    species.habitats.length ? species.habitats.join('') : null,
    species.residenceType,
    species.summaryZh,
  ]
  const filled = completeness.filter(Boolean).length

  return (
    <div className={className}>
      <Panel
        title="物种资料"
        subtitle={`${species.wikiTitle ?? species.cnName} · 抓取状态 ${species.fetchStatus}`}
        icon={<BookOpen className="h-4 w-4" />}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1.5 text-caption text-fog-200">
            {breadcrumb.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <span className="text-fog-300">/</span> : null}
                <TaxonIcon name={item.key} size={14} className="text-moss" />
                <span>{item.label}</span>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={species.cnProtectionLevel && /一级/.test(species.cnProtectionLevel) ? 'danger' : species.cnProtectionLevel ? 'gold' : species.isSanyou ? 'moss' : 'neutral'}
              size="md"
              icon={<ProtectionIcon name={protectionIconKey(species.cnProtectionLevel, species.isSanyou)} size={13} />}
            >
              {species.cnProtectionLevel ?? (species.isSanyou ? '三有保护动物' : '未列入国家名录')}
            </Badge>
            <Badge tone={IUCN_TONE[species.iucnStatus ?? 'DD'] ?? 'neutral'} size="md">
              IUCN {species.iucnStatus ?? 'DD'}
              {species.iucnYear ? ` (${species.iucnYear})` : ''}
            </Badge>
            {protection?.source ? <Badge tone="outline" size="md">名录来源：{protection.source}</Badge> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <RangeBar label="体长" value={length} min={6} max={180} unit="cm" tone="moss" />
            <RangeBar label="体重" value={weight} min={5} max={20000} unit="g" tone="plume" />
            <RangeBar label="翼展" value={wingspan} min={15} max={300} unit="cm" tone="gold" />
          </div>

          <Separator />

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-fog-300">
                <MapPinned className="h-3 w-3" /> 分布区域
              </dt>
              <dd className="text-caption leading-relaxed text-fog-100">
                {species.distribution.length ? species.distribution.join('、') : '待补录'}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-fog-300">
                <GitBranch className="h-3 w-3" /> 居留型 / 生态型
              </dt>
              <dd className="text-caption leading-relaxed text-fog-100">
                {[species.residenceType, species.ecoType].filter(Boolean).join(' · ') || '待补录'}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-fog-300">
                <Utensils className="h-3 w-3" /> 食性
              </dt>
              <dd className="text-caption leading-relaxed text-fog-100">{species.diet ?? '待补录'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-fog-300">
                <Ruler className="h-3 w-3" /> 形态数据来源
              </dt>
              <dd className="text-caption leading-relaxed text-fog-100">
                {species.morphologySource ?? morphology?.source ?? '待补录'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-micro uppercase tracking-wide text-fog-300">
              <PlaceIcon name="pin" size={12} /> 栖息地标签
            </span>
            <div className="flex flex-wrap gap-1.5">
              {species.habitats.length === 0 ? (
                <span className="text-caption text-fog-300">待补录</span>
              ) : (
                species.habitats.map((habitat) => (
                  <Badge key={habitat} tone="moss" size="md" icon={<PlaceIcon name={habitatIconKey(habitat)} size={12} />}>
                    {habitat}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {species.aliases.length ? (
            <div className="flex flex-wrap items-center gap-1.5 text-micro text-fog-300">
              <Sparkles className="h-3 w-3" />
              别名：
              {species.aliases.map((alias) => (
                <span key={alias} className="rounded-full bg-line/[0.05] px-2 py-0.5 text-fog-200">
                  {alias}
                </span>
              ))}
            </div>
          ) : null}

          <Progress
            label="资料完整度"
            value={filled}
            max={completeness.length}
            hint={`${percent(filled, completeness.length)}% · ${filled}/${completeness.length} 项`}
            tone={filled >= 8 ? 'moss' : 'gold'}
          />

          <Separator />

          <div className="grid gap-2 text-caption text-fog-200 sm:grid-cols-3">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-fog-300" /> 学名：
              <span className="italic text-fog-100">{species.scientificName ?? '待补录'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              英文名：<span className="text-fog-100">{species.enName ?? '待补录'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              体长记录：<span className="text-fog-100">{formatMetric(length, 'cm')}</span>
            </span>
          </div>
        </div>
      </Panel>
    </div>
  )
}
