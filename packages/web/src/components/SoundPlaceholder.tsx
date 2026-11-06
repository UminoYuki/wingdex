import { AudioLines, Video } from 'lucide-react'
import { mediaUrl } from '../api/client'
import { Badge, Panel } from './ui'
import { cn } from '../lib/cn'

interface SoundPlaceholderProps {
  speciesId: number
  kind: 'sound' | 'video'
  filePath: string | null
  className?: string
}

const BARS = [8, 18, 30, 14, 24, 34, 12, 22, 30, 16, 26, 10, 20, 28, 14, 8]

/** 鸣声 / 视频卡：有文件时直接播放，未上传时展示频谱占位 */
export function SoundPlaceholder({ speciesId, kind, filePath, className }: SoundPlaceholderProps) {
  const isSound = kind === 'sound'
  const title = isSound ? '鸣声记录' : '视频片段'

  return (
    <Panel
      className={className}
      icon={isSound ? <AudioLines className="h-4 w-4" /> : <Video className="h-4 w-4" />}
      title={title}
      subtitle={filePath ? filePath.split(/[\\/]/).at(-1) : '尚未上传本地文件'}
      actions={
        filePath ? (
          <Badge tone="moss">已关联</Badge>
        ) : (
          <Badge tone="outline">待补录</Badge>
        )
      }
    >
      {filePath ? (
        isSound ? (
          <audio className="w-full" controls preload="none" src={mediaUrl.speciesAsset(speciesId, 'sound')} />
        ) : (
          <video className="w-full rounded-md" controls preload="none" src={mediaUrl.speciesAsset(speciesId, 'video')} />
        )
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line/[0.10] bg-line/[0.02] px-4 py-6">
          <div className="flex h-12 items-end gap-[3px]">
            {BARS.map((height, index) => (
              <span
                key={index}
                className={cn(
                  'w-[3px] rounded-full bg-gradient-to-t from-moss-deep/40 to-moss/70',
                  index % 3 === 0 ? 'animate-pulse' : '',
                )}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <p className="max-w-sm text-center text-caption leading-relaxed text-fog-300">
            {isSound
              ? '还没有关联鸣声文件。可在物种编辑页选择本地录音（wav / mp3 / m4a），用于辨识与留档。'
              : '还没有关联视频文件。可在物种编辑页选择本地视频（mp4 / mov），记录飞行与行为细节。'}
          </p>
        </div>
      )}
    </Panel>
  )
}
