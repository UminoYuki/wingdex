import { useId } from 'react'
import type { CardBackPrint } from '../api/types'
import { PRINT_TONES } from './cardTheme'
import {
  apertureBladePaths,
  exifRingText,
  focusTicks,
  mountClaws,
  shutterSlats,
  sprocketHoles,
  viewfinderCorners,
} from './prints'

interface CardBackPrintsProps {
  config: CardBackPrint
  exif: {
    cameraModel?: string | null
    lens?: string | null
    focalLength?: number | null
    aperture?: string | null
    shutter?: string | null
    iso?: number | null
  }
}

/** 卡背镜头印花层：光圈叶片、焦段刻度环、卡口三爪、胶片齿孔、取景框角标、快门帘幕、EXIF 文字环 */
export function CardBackPrints({ config, exif }: CardBackPrintsProps) {
  const uid = useId().replace(/[:]/g, '')
  const ringId = `exif-ring-${uid}`
  const clipId = `back-clip-${uid}`

  const tone = PRINT_TONES[config.tone ?? 'gold'] ?? PRINT_TONES.gold
  const opacity = Math.max(0.08, Math.min(0.85, config.intensity ?? 0.6))
  const ringText = config.exifRing?.text?.trim() || exifRingText(exif)
  const blades = config.aperture?.blades ?? 9
  const rotate = config.aperture?.rotate ?? 0
  const density = config.shutter?.density ?? 8

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
      aria-hidden
    >
      <defs>
        <path id={ringId} d="M50,50 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" fill="none" />
        <clipPath id={clipId}>
          <rect x="0" y="0" width="100" height="100" rx="2.6" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {config.filmstrip?.enabled
          ? sprocketHoles(16).map((hole, index) => (
              <rect key={`hole-${index}`} x={hole.x - 1} y={hole.y - 0.9} width="2" height="1.8" rx="0.4" fill={tone.faint} />
            ))
          : null}

        {config.shutter?.enabled
          ? shutterSlats(density).map((slat, index) => (
              <rect key={`slat-${index}`} x={slat.x} y={0} width={slat.width} height={100} fill={tone.faint} opacity={0.35} />
            ))
          : null}

        {config.focusRing?.enabled
          ? focusTicks(54, 33, 37).map((tick, index) => (
              <line
                key={`tick-${index}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={tone.line}
                strokeWidth={tick.major ? 0.42 : 0.22}
                opacity={tick.major ? 0.9 : 0.55}
              />
            ))
          : null}

        {config.aperture?.enabled ? (
          <g transform={`rotate(${rotate} 50 50)`}>
            {apertureBladePaths(7, 30, blades).map((path, index) => (
              <path key={`blade-${index}`} d={path} fill="none" stroke={tone.line} strokeWidth={0.3} opacity={0.7} />
            ))}
          </g>
        ) : null}

        {config.mount?.enabled
          ? mountClaws().map((path, index) => (
              <path key={`claw-${index}`} d={path} fill="none" stroke={tone.line} strokeWidth={0.32} opacity={0.65} />
            ))
          : null}

        {config.viewfinder?.enabled
          ? viewfinderCorners(10, 7).map((line, index) => (
              <line
                key={`corner-${index}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={tone.line}
                strokeWidth={0.4}
                opacity={0.75}
              />
            ))
          : null}

        {config.bodySilhouette?.enabled
          ? bodySilhouette(config.bodySilhouette.kind ?? 'dslr', tone.line)
          : null}

        {config.exifRing?.enabled && ringText ? (
          <text fill={tone.text} fontSize="1.9" letterSpacing="0.32" opacity={0.8}>
            <textPath href={`#${ringId}`} startOffset="6%">
              {ringText}
            </textPath>
          </text>
        ) : null}
      </g>
    </svg>
  )
}

/** 机身剪影：单反 / 微单 */
function bodySilhouette(kind: 'dslr' | 'mirrorless', stroke: string) {
  return (
    <g opacity={0.5} stroke={stroke} fill="none" strokeWidth={0.3}>
      <rect x="63" y="70" width="24" height="15" rx="2.4" />
      <circle cx="75" cy="77.5" r="5.4" />
      <rect x="82" y="72.4" width="4.6" height="3.4" rx="1" />
      {kind === 'dslr' ? <path d="M66 70 L69 66 L78 66 L80 70" /> : <rect x="66" y="66.5" width="7" height="3.5" rx="1.2" />}
    </g>
  )
}
