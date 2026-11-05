import { Aperture, Camera, CircleDot, Film, Frame, Gauge, Hash, User } from 'lucide-react'
import type { CardBackPrint, Photo } from '../api/types'
import { BACK_THEMES, PRINT_TONES, type PrintToneKey } from '../card/cardTheme'
import { Button, Input, Panel, Select, Slider, Switch } from '../components/ui'
import { buildCardExif, type CardExif } from '../card/cardPreview'
import { exifRingText } from '../card/prints'
import type { CardDraft } from './draftTypes'

interface BackPanelProps {
  draft: CardDraft
  photo: Photo | null
  onPatch: (updater: Partial<CardDraft>, label: string) => void
}

/** 卡背配置：底纹主题、纹章、镜头印花与 EXIF 环 */
export function BackPanel({ draft, photo, onPatch }: BackPanelProps) {
  const print = draft.backPrint
  const exif: CardExif = buildCardExif(photo)
  const exifRingValue = exifRingText(exif)
  const patchPrint = (patch: Partial<CardBackPrint>, label: string) =>
    onPatch({ backPrint: { ...print, ...patch } }, label)

  const enabledCount = [
    print.aperture?.enabled,
    print.focusRing?.enabled,
    print.mount?.enabled,
    print.filmstrip?.enabled,
    print.viewfinder?.enabled,
    print.shutter?.enabled,
    print.exifRing?.enabled,
    print.bodySilhouette?.enabled,
  ].filter(Boolean).length

  return (
    <Panel
      title="卡背与镜头印花"
      subtitle={`已启用 ${enabledCount}/8 组印花 · 色调 ${PRINT_TONES[print.tone ?? 'gold'].line}`}
      actions={
        <Button
          size="sm"
          variant="ghost"
          onClick={() => patchPrint({ exifRing: { enabled: true, text: exifRingValue } }, '根据 EXIF 生成印花')}
        >
          按 EXIF 生成
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-micro text-fog-300">底纹主题</span>
            <Select
              size="sm"
              value={draft.backTheme}
              options={BACK_THEMES.map((theme) => ({ value: theme.key, label: theme.label }))}
              onValueChange={(value) => onPatch({ backTheme: value }, '更换卡背主题')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-micro text-fog-300">纹章</span>
            <Select
              size="sm"
              value={draft.backEmblem}
              options={[
                { value: 'feather', label: '羽毛' },
                { value: 'lens', label: '光圈' },
                { value: 'leaf', label: '枝叶' },
                { value: 'mountain', label: '山峦' },
                { value: 'wave', label: '水波' },
                { value: 'compass', label: '罗盘' },
              ]}
              onValueChange={(value) => onPatch({ backEmblem: value }, '更换纹章')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-micro text-fog-300">印花色调</span>
            <Select
              size="sm"
              value={print.tone ?? 'gold'}
              options={(Object.keys(PRINT_TONES) as PrintToneKey[]).map((key) => ({
                value: key,
                label: key === 'gold' ? '暗金' : key === 'gunmetal' ? '枪灰' : '苔绿',
              }))}
              onValueChange={(value) => patchPrint({ tone: value as PrintToneKey }, '更换印花色调')}
            />
          </div>
          <Slider
            label="印花强度"
            min={0.15}
            max={1}
            step={0.05}
            value={print.intensity ?? 0.6}
            format={(value) => `${Math.round(value * 100)}%`}
            onValueChange={(value) => patchPrint({ intensity: value }, '调整印花强度')}
          />
        </div>

        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 text-micro uppercase tracking-widest text-fog-300">
            <Camera className="h-3.5 w-3.5" />
            印花元件
          </span>

          <PrintRow
            icon={<Aperture className="h-4 w-4" />}
            title="光圈叶片"
            hint="右上角光圈环，可切换 6 / 9 片与相位"
            enabled={Boolean(print.aperture?.enabled)}
            onToggle={(checked) => patchPrint({ aperture: { enabled: checked, blades: 9, rotate: 0 } }, '切换光圈印花')}
            extra={
              print.aperture?.enabled ? (
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    size="sm"
                    value={String(print.aperture.blades)}
                    options={[
                      { value: '6', label: '6 片' },
                      { value: '9', label: '9 片' },
                    ]}
                    onValueChange={(value) => patchPrint({ aperture: { enabled: true, blades: Number(value) as 6 | 9, rotate: print.aperture?.rotate ?? 0 } }, '调整光圈叶片')}
                  />
                  <Slider
                    label="相位"
                    min={0}
                    max={180}
                    step={5}
                    value={print.aperture.rotate}
                    format={(value) => `${value}°`}
                    onValueChange={(value) => patchPrint({ aperture: { enabled: true, blades: print.aperture?.blades ?? 9, rotate: value } }, '调整光圈相位')}
                  />
                </div>
              ) : null
            }
          />

          <PrintRow
            icon={<CircleDot className="h-4 w-4" />}
            title="焦段刻度环"
            hint="底部刻度环，标注等效焦距"
            enabled={Boolean(print.focusRing?.enabled)}
            onToggle={(checked) =>
              patchPrint({ focusRing: { enabled: checked, focal: exif.focalLength ?? 400 } }, '切换焦段环')
            }
            extra={
              print.focusRing?.enabled ? (
                <Slider
                  label="标注焦距"
                  min={12}
                  max={1200}
                  step={4}
                  value={print.focusRing.focal ?? 400}
                  format={(value) => `${value}mm`}
                  onValueChange={(value) => patchPrint({ focusRing: { enabled: true, focal: value } }, '调整焦距标注')}
                />
              ) : null
            }
          />

          <PrintRow
            icon={<Frame className="h-4 w-4" />}
            title="卡口三爪"
            hint="左侧卡口标记，机身系统的隐喻"
            enabled={Boolean(print.mount?.enabled)}
            onToggle={(checked) => patchPrint({ mount: { enabled: checked } }, '切换卡口印花')}
          />

          <PrintRow
            icon={<Film className="h-4 w-4" />}
            title="胶片齿孔"
            hint="上下边缘齿孔，复古胶片感"
            enabled={Boolean(print.filmstrip?.enabled)}
            onToggle={(checked) => patchPrint({ filmstrip: { enabled: checked } }, '切换齿孔印花')}
          />

          <PrintRow
            icon={<Gauge className="h-4 w-4" />}
            title="取景框角标"
            hint="四角对焦框，强化取景器观感"
            enabled={Boolean(print.viewfinder?.enabled)}
            onToggle={(checked) => patchPrint({ viewfinder: { enabled: checked } }, '切换取景框角标')}
          />

          <PrintRow
            icon={<Hash className="h-4 w-4" />}
            title="快门帘幕"
            hint="边缘快门帘刻度，密度可调"
            enabled={Boolean(print.shutter?.enabled)}
            onToggle={(checked) => patchPrint({ shutter: { enabled: checked, density: 8 } }, '切换快门帘幕')}
            extra={
              print.shutter?.enabled ? (
                <Slider
                  label="帘幕密度"
                  min={4}
                  max={16}
                  step={1}
                  value={print.shutter.density ?? 8}
                  format={(value) => `${value} 格`}
                  onValueChange={(value) => patchPrint({ shutter: { enabled: true, density: value } }, '调整帘幕密度')}
                />
              ) : null
            }
          />

          <PrintRow
            icon={<Hash className="h-4 w-4" />}
            title="EXIF 微缩文字环"
            hint="把拍摄参数压成一行微缩文字"
            enabled={Boolean(print.exifRing?.enabled)}
            onToggle={(checked) =>
              patchPrint({ exifRing: { enabled: checked, text: print.exifRing?.text || exifRingValue } }, '切换 EXIF 文字环')
            }
            extra={
              print.exifRing?.enabled ? (
                <label className="flex flex-col gap-1">
                  <span className="flex items-center justify-between">
                    <span className="text-micro text-fog-300">文字内容</span>
                    <span className={`text-micro tabular-nums ${(print.exifRing.text ?? '').length > 60 ? 'text-alert' : 'text-fog-300'}`}>
                      {(print.exifRing.text ?? '').length}/60
                    </span>
                  </span>
                  <Input
                    value={print.exifRing.text ?? ''}
                    placeholder="600mm · f/4 · 1/1000s · ISO 800"
                    invalid={(print.exifRing.text ?? '').length > 60}
                    onChange={(event) => patchPrint({ exifRing: { enabled: true, text: event.target.value } }, '编辑 EXIF 文字')}
                  />
                </label>
              ) : null
            }
          />

          <PrintRow
            icon={<User className="h-4 w-4" />}
            title="机身剪影"
            hint="底部机身剪影，单反 / 微单两种"
            enabled={Boolean(print.bodySilhouette?.enabled)}
            onToggle={(checked) => patchPrint({ bodySilhouette: { enabled: checked, kind: 'dslr' } }, '切换机身剪影')}
            extra={
              print.bodySilhouette?.enabled ? (
                <Select
                  size="sm"
                  value={print.bodySilhouette.kind ?? 'dslr'}
                  options={[
                    { value: 'dslr', label: '单反' },
                    { value: 'mirrorless', label: '微单' },
                  ]}
                  onValueChange={(value) =>
                    patchPrint({ bodySilhouette: { enabled: true, kind: value as 'dslr' | 'mirrorless' } }, '更换机身剪影')
                  }
                />
              ) : null
            }
          />
        </div>
      </div>
    </Panel>
  )
}

interface PrintRowProps {
  icon: React.ReactNode
  title: string
  hint: string
  enabled: boolean
  onToggle: (checked: boolean) => void
  extra?: React.ReactNode
}

function PrintRow({ icon, title, hint, enabled, onToggle, extra }: PrintRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="text-plume">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-fog-100">{title}</p>
          <p className="text-micro text-fog-300">{hint}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {extra}
    </div>
  )
}
