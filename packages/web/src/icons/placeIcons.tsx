import { createIconMap, type IconProps } from './base'

/** 地点与栖息地图标 6 项 + 通用定位点 */
export const placeIcons = createIconMap({
  wetland: () => (
    <>
      <path d="M3 16c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path d="M6 13c0-2.8 1.4-5 3-5s3 2.2 3 5" />
      <path d="M12 13c0-3.4 1.6-6 3.5-6S19 9.6 19 13" />
      <path d="M12 13v-3" />
    </>
  ),
  forest: () => (
    <>
      <path d="M8 20l-3.5-6H7L4 9h2.6L4 4h8l-2.6 5H12l-3 5h2.4L8 20Z" />
      <path d="M17 20V9m0 0l-3-3m3 3l3-3" />
    </>
  ),
  mountain: () => (
    <>
      <path d="M3 19l6-10 3.4 5.4L15 9l6 10H3Z" />
      <path d="M8.4 11.4l1.2 1.6" />
    </>
  ),
  coast: () => (
    <>
      <path d="M3 15c2.4-1.8 4.6-1.8 7 0s4.6 1.8 7 0" />
      <path d="M3 18.5c2.4-1.6 4.6-1.6 7 0s4.6 1.6 7 0" />
      <circle cx="17" cy="7" r="3" />
    </>
  ),
  grassland: () => (
    <>
      <path d="M3 19h18" />
      <path d="M7 19c0-4 1-7 3-9M12 19c0-5 .8-8 2.4-10M17 19c-.4-3.4-1.2-5.6-2.6-7" />
    </>
  ),
  urban: () => (
    <>
      <path d="M3 20V9l5-3v14M8 20V11l6-2v11M14 20V12l6 2v6" />
      <path d="M5.5 12h.01M5.5 15h.01M11 14h.01M11 17h.01M17 16h.01" />
    </>
  ),
  pin: () => (
    <>
      <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
})

export type PlaceIconKey = keyof typeof placeIcons

export function PlaceIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = placeIcons[name as PlaceIconKey] ?? placeIcons.pin
  return <Component {...props} />
}
