import { Bird, CalendarCheck, Camera, Heart, Images, Layers, MapPin, ShieldCheck, TreePine } from 'lucide-react'
import type { StatsBundle } from '../api/types'
import { StatTile } from './ui'
import { formatNumber, percent } from '../lib/format'

interface StatTilesProps {
  overview: StatsBundle['overview']
  className?: string
}

/** 概览统计磁贴：物种/照片/地点/科属/卡片/想拍/保护覆盖/连续打卡 */
export function StatTiles({ overview, className }: StatTilesProps) {
  const tiles = [
    { label: '物种', value: formatNumber(overview.speciesCount), hint: '已收录图鉴', icon: <Bird className="h-4 w-4" />, tone: 'moss' as const },
    { label: '照片', value: formatNumber(overview.photoCount), hint: `${overview.fiveStarRate}% 五星`, icon: <Images className="h-4 w-4" />, tone: 'plume' as const },
    { label: '地点', value: formatNumber(overview.placeCount), hint: '拍摄足迹', icon: <MapPin className="h-4 w-4" />, tone: 'moss' as const },
    {
      label: '目 / 科',
      value: `${overview.orderCount} / ${overview.familyCount}`,
      hint: '分类覆盖',
      icon: <TreePine className="h-4 w-4" />,
      tone: 'moss' as const,
    },
    { label: '卡片', value: formatNumber(overview.cardCount), hint: '动物卡藏品', icon: <Layers className="h-4 w-4" />, tone: 'gold' as const },
    {
      label: '想拍达成',
      value: `${overview.wishlistAchieved}/${overview.wishlistCount}`,
      hint: `完成度 ${percent(overview.wishlistAchieved, overview.wishlistCount)}%`,
      icon: <Heart className="h-4 w-4" />,
      tone: 'danger' as const,
    },
    {
      label: '受保护物种',
      value: `${overview.protectionCoverage.national1 + overview.protectionCoverage.national2}`,
      hint: `一级 ${overview.protectionCoverage.national1} · 二级 ${overview.protectionCoverage.national2}`,
      icon: <ShieldCheck className="h-4 w-4" />,
      tone: 'gold' as const,
    },
    {
      label: '连续拍摄',
      value: `${overview.currentStreak} 天`,
      hint: `最长 ${overview.longestStreak} 天 · 活跃 ${overview.activeDays} 天`,
      icon: <CalendarCheck className="h-4 w-4" />,
      tone: 'moss' as const,
    },
  ]

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>
      <p className="pt-2 text-micro text-fog-300">
        <Camera className="mr-1 inline h-3 w-3" />
        共使用 {overview.cameraCount} 台机身、{overview.lensCount} 支镜头，五星照片 {overview.fiveStarCount} 张
      </p>
    </div>
  )
}
