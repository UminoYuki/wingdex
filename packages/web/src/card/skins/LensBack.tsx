import type { Card3DExif } from '../Card3D'
import { cn } from '../../lib/cn'
import { lensCaption } from './cardSkin'

interface LensBackProps {
  exif?: Card3DExif | null
  serialNo?: string | null
  className?: string
}

/** 长焦镜头浮雕卡背。中心是图鉴自己的字标，不放商业徽记。 */
export function LensBack({ exif, serialNo, className }: LensBackProps) {
  const caption = lensCaption(exif)
  return (
    <div className={cn('wd-skin wd-lens', className)} data-skin="lens">
      <div className="wd-lens-knurl">
        <div className="wd-lens-ring">
          <div className="wd-lens-spin" aria-hidden>
            <span>WINGDEX OPTICS · {caption}</span>
            <span>FIELD ARCHIVE</span>
          </div>
          <div className="wd-lens-iris">
            <div className="wd-lens-coat" />
            <div className="wd-lens-core">
              <span aria-hidden>羽</span>
              <b>WINGDEX</b>
            </div>
          </div>
        </div>
      </div>
      <div className="wd-lens-foot">{serialNo ? `${serialNo} · ` : ''}AVIAN FIELD ARCHIVE</div>
    </div>
  )
}
