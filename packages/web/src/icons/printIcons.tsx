import { createIconMap, type IconProps } from './base'

/** 镜头印花元件 8 种：光圈叶片 / 焦段刻度环 / 卡口三爪 / 胶片齿孔 / 取景框 / 快门帘幕 / EXIF 文字环 / 机身剪影 */
export const printIcons = createIconMap({
  aperture: () => (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 3.4L8.4 12h7.2L12 3.4Z" />
      <path d="M4.2 15.6L12 12l-4.4 8" />
      <path d="M19.8 15.6L12 12l4.4 8" />
    </>
  ),
  focusRing: () => (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="6.4" />
      <path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4" />
      <path d="M7.4 7.4l1.4 1.4M15.2 15.2l1.4 1.4M16.6 7.4l-1.4 1.4M8.8 15.2l-1.4 1.4" />
    </>
  ),
  mount: () => (
    <>
      <circle cx="12" cy="12" r="7.6" />
      <path d="M6.4 8.2h11.2M6.4 15.8h11.2" />
      <path d="M9.4 5.6v3M14.6 5.6v3M9.4 15.4v3M14.6 15.4v3" />
    </>
  ),
  filmstrip: () => (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="1.5" />
      <path d="M6 6v12M18 6v12" />
      <path d="M6.8 9h.9M6.8 12h.9M6.8 15h.9M16.3 9h.9M16.3 12h.9M16.3 15h.9" />
    </>
  ),
  viewfinder: () => (
    <>
      <path d="M4 8.5V5.5A1.5 1.5 0 0 1 5.5 4h3M20 8.5v-3A1.5 1.5 0 0 0 18.5 4h-3M4 15.5v3A1.5 1.5 0 0 0 5.5 20h3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9V6.5M12 15v2.5M9 12H6.5M15 12h2.5" />
    </>
  ),
  shutter: () => (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M3.5 9.5h17M6 14.5h12M6 17h12" />
    </>
  ),
  exifRing: () => (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="5.4" />
      <path d="M12 6.6v1.4M14.6 7.4l-.7 1.2M16.4 10l-1.3.7M16.4 14l-1.3-.7M14.6 16.6l-.7-1.2M12 17.4v-1.4M9.4 16.6l.7-1.2M7.6 14l1.3-.7M7.6 10l1.3.7M9.4 7.4l.7 1.2" />
    </>
  ),
  bodySilhouette: () => (
    <>
      <path d="M4 9.5h2.6L8 7h6.6l1.4 2.5H20a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1h-3l-1-1.5H8L7 18H4a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1Z" />
      <circle cx="12.4" cy="12.8" r="2.6" />
      <path d="M17.5 10.5h1.4" />
    </>
  ),
})

export type PrintIconKey = keyof typeof printIcons

export function PrintIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = printIcons[name as PrintIconKey] ?? printIcons.aperture
  return <Component {...props} />
}
