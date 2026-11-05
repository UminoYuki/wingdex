import { createIconMap, type IconProps } from './base'

/** 卡牌属性图标 8 种 */
export const attributeIcons = createIconMap({
  林: () => (
    <>
      <path d="M12 3.5c5 2 7 5.6 7 9.4 0 3.4-3.1 6.6-7 7.6-3.9-1-7-4.2-7-7.6 0-3.8 2-7.4 7-9.4Z" />
      <path d="M12 20.5V9m0 4l3-3m-3 5-3-3" />
    </>
  ),
  泽: () => (
    <>
      <path d="M12 3.5c3 3.6 5.5 6.6 5.5 9.6a5.5 5.5 0 1 1-11 0c0-3 2.5-6 5.5-9.6Z" />
      <path d="M9.5 14c.6 1.2 1.6 1.8 2.8 1.8" />
    </>
  ),
  原: () => (
    <>
      <path d="M12 20V8" />
      <path d="M12 8c0-2.5 1.4-4.5 3.4-5.5C16 5.4 14.6 7.6 12 8Z" />
      <path d="M12 11c0-2.5-1.4-4.5-3.4-5.5C8 8.4 9.4 10.6 12 11Z" />
      <path d="M12 14.5c0-2.5 1.4-4.5 3.4-5.5" />
    </>
  ),
  海: () => (
    <>
      <path d="M3 9.5c2.4-2.4 4.6-2.4 7 0s4.6 2.4 7 0" />
      <path d="M3 13.5c2.4-2.4 4.6-2.4 7 0s4.6 2.4 7 0" />
      <path d="M3 17.5c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0" />
    </>
  ),
  山: () => (
    <>
      <path d="M3 19l6.4-10.6L14 15l2.6-3.6L21 19H3Z" />
      <path d="M9.4 8.4L11 11" />
    </>
  ),
  空: () => (
    <>
      <path d="M6.5 17.5h11a3.5 3.5 0 0 0 .4-7 5.5 5.5 0 0 0-10.6 1.6 3 3 0 0 0-.8 5.4Z" />
      <path d="M12 6.5V4M6 8l-1.4-1.4M18 8l1.4-1.4" />
    </>
  ),
  夜: () => (
    <>
      <path d="M20 14.8A8.5 8.5 0 0 1 9.2 4 8.5 8.5 0 1 0 20 14.8Z" />
      <path d="M17 4.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6Z" />
    </>
  ),
  都: () => (
    <>
      <path d="M4 20V9l4-2.5V20M8 20V11l5-2v11M13 20v-7l6 2v5" />
      <path d="M6 12h.01M6 15.5h.01M10.5 14h.01M10.5 17h.01M16 16h.01" />
    </>
  ),
})

/** 稀有度角标 5 档 */
export const rarityIcons = createIconMap({
  N: () => <circle cx="12" cy="12" r="7" />,
  R: () => (
    <>
      <path d="M12 4l7 8-7 8-7-8 7-8Z" />
      <path d="M12 8.5l3 3.5-3 3.5-3-3.5 3-3.5Z" />
    </>
  ),
  SR: () => (
    <>
      <path d="M12 3.5l2.6 3.4 4.2 1-2.2 3.7.5 4.3-4.1-.9-4.1.9.5-4.3L7.2 7.9l4.2-1L12 3.5Z" />
      <path d="M12 17.6V21M9.5 19h5" />
    </>
  ),
  UR: () => (
    <>
      <path d="M12 3l7 3v5.5c0 4-2.8 7.2-7 8.5-4.2-1.3-7-4.5-7-8.5V6l7-3Z" />
      <path d="M12 8.4l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.5-2.7 1.5.5-3L7.6 11.6l3-.4L12 8.4Z" />
    </>
  ),
  LEGEND: () => (
    <>
      <path d="M4 17l-1-9 5 3 4-6 4 6 5-3-1 9H4Z" />
      <path d="M5 20h14" />
      <path d="M12 13.6l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3.8-1.6Z" />
    </>
  ),
})

/** 卡背纹章 5 种 */
export const emblemIcons = createIconMap({
  feather: () => (
    <>
      <path d="M19 4c0 7-4.6 11.6-11 11.6H5.5" />
      <path d="M19 4c-7.4 0-11.5 4.2-11.5 9.4" />
      <path d="M5 20l6-6" />
    </>
  ),
  rings: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 3.5v2M12 18.5v2" />
    </>
  ),
  stars: () => (
    <>
      <path d="M12 3.5l1.8 4.2 4.2.6-3.2 3 .9 4.4-3.7-2.2-3.7 2.2.9-4.4-3.2-3 4.2-.6L12 3.5Z" />
      <path d="M18.5 15l.8 1.8 1.7.3-1.3 1.2.3 1.7-1.5-.9-1.5.9.3-1.7-1.3-1.2 1.7-.3.8-1.8Z" />
    </>
  ),
  aperture: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5L8 12h8L12 3.5Z" />
      <path d="M3.9 15.4L12 12l-4 8.2" />
      <path d="M20.1 15.4L12 12l4 8.2" />
    </>
  ),
  script: () => (
    <>
      <path d="M5 19c1.6 0 2.4-.9 2.6-2.4L9 5.6C7.4 5.4 6 6.2 5.6 7.8" />
      <path d="M9 5.6h9.4c-1 3.6-2.4 6.6-4.6 9.4-1.4 1.8-3 3-4.8 3.4" />
      <path d="M11 14h6" />
    </>
  ),
})

export type AttributeIconKey = keyof typeof attributeIcons

export function AttributeIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = attributeIcons[name as AttributeIconKey] ?? attributeIcons.林
  return <Component {...props} />
}

export function RarityIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = rarityIcons[name as keyof typeof rarityIcons] ?? rarityIcons.N
  return <Component {...props} />
}

export function EmblemIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = emblemIcons[name as keyof typeof emblemIcons] ?? emblemIcons.feather
  return <Component {...props} />
}
