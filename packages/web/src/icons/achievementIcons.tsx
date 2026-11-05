import { createIconMap, type IconProps } from './base'

/** 成就徽章图标：32 项，覆盖图鉴/拍摄/装备/地点/时间/卡牌/探索/记录/坚持九大类 */
export const achievementIcons = createIconMap({
  feather: () => (
    <>
      <path d="M20 4c0 6.5-4.8 11-11 11H5" />
      <path d="M20 4c-7 0-11 4-11 9" />
      <path d="M4 20l6.5-6.5" />
    </>
  ),
  egg: () => <path d="M12 3c3.6 0 6.5 4.5 6.5 9a6.5 6.5 0 0 1-13 0C5.5 7.5 8.4 3 12 3Z" />,
  nest: () => (
    <>
      <path d="M3 13h18c0 4-4 7-9 7s-9-3-9-7Z" />
      <path d="M6 13c1.5-2 3.6-3 6-3s4.5 1 6 3" />
      <path d="M9 8.5c0-1.7 1.4-3 3-3s3 1.3 3 3" />
    </>
  ),
  binoculars: () => (
    <>
      <circle cx="6" cy="15" r="3.2" />
      <circle cx="18" cy="15" r="3.2" />
      <path d="M6 11.8V8a2 2 0 0 1 2-2h1" />
      <path d="M18 11.8V8a2 2 0 0 0-2-2h-1" />
      <path d="M9.2 15h5.6" />
    </>
  ),
  telescope: () => (
    <>
      <path d="M4 15l10-8 4 3-10 8-4-3Z" />
      <path d="M17.5 6.5L21 4" />
      <path d="M9 17l-2 4" />
      <path d="M14 15l3 6" />
    </>
  ),
  camera: () => (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  lens: () => (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 4v2.4M12 17.6V20M4 12h2.4M17.6 12H20" />
    </>
  ),
  flash: () => (
    <>
      <path d="M13 3L6 13h5l-1 8 7-10h-5l1-8Z" />
    </>
  ),
  tripod: () => (
    <>
      <path d="M12 4v9" />
      <path d="M6 20l6-7 6 7" />
      <path d="M8 9h8" />
      <circle cx="12" cy="3.6" r="1.6" />
    </>
  ),
  backpack: () => (
    <>
      <path d="M7 8a5 5 0 0 1 10 0v12H7V8Z" />
      <path d="M7 12h10" />
      <path d="M10 8v4M14 8v4" />
      <path d="M9 20v-2h6v2" />
    </>
  ),
  mapPin: () => (
    <>
      <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.4" />
    </>
  ),
  compass: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9l-2 5-4 1 2-5 4-1Z" />
    </>
  ),
  globe: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
    </>
  ),
  mountain: () => (
    <>
      <path d="M3 19l5.5-9 3.4 5 2.3-3.2L21 19H3Z" />
      <path d="M8.5 10l1.6 2" />
    </>
  ),
  wave: () => (
    <>
      <path d="M3 9c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0" />
      <path d="M3 15c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0" />
    </>
  ),
  leaf: () => (
    <>
      <path d="M4 20c0-8 5-14 16-15 0 11-5 15-11 15H4Z" />
      <path d="M9 15c2-3 4.4-5.2 8-7" />
    </>
  ),
  calendar: () => (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
      <circle cx="12" cy="15" r="1.6" />
    </>
  ),
  flame: () => (
    <>
      <path d="M12 3c3.5 3.6 6 6.4 6 10a6 6 0 0 1-12 0c0-2 1-3.6 2.4-5" />
      <path d="M12 20c1.7 0 3-1.2 3-3s-1.4-3-3-4.4C10.4 14 9 15.2 9 17s1.3 3 3 3Z" />
    </>
  ),
  trophy: () => (
    <>
      <path d="M8 5h8v5a4 4 0 0 1-8 0V5Z" />
      <path d="M8 6H5.5a2.5 2.5 0 0 0 2.5 5M16 6h2.5A2.5 2.5 0 0 1 16 11" />
      <path d="M12 14v3.5M9 20h6l-.7-2.5h-4.6L9 20Z" />
    </>
  ),
  medal: () => (
    <>
      <circle cx="12" cy="15" r="4.5" />
      <path d="M8.6 11.2L7 4h10l-1.6 7.2" />
      <path d="M12 13.4l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3.9-1.8Z" />
    </>
  ),
  crown: () => (
    <>
      <path d="M4 18l-1-9 5 3 4-6 4 6 5-3-1 9H4Z" />
      <path d="M5.5 21h13" />
    </>
  ),
  star: () => <path d="M12 4l2.4 5 5.6.8-4 4 .9 5.6L12 16.8 7.1 19.4 8 13.8l-4-4 5.6-.8L12 4Z" />,
  sparkles: () => (
    <>
      <path d="M11 4l1.4 3.6L16 9l-3.6 1.4L11 14l-1.4-3.6L6 9l3.6-1.4L11 4Z" />
      <path d="M17.5 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" />
    </>
  ),
  target: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  timer: () => (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 10v3.5l2.5 1.5M9.5 3h5M12 3v3.5" />
    </>
  ),
  footprints: () => (
    <>
      <path d="M7.5 4c1.7 0 2.8 2.2 2.8 5S9.6 17 7.6 17 4.6 13 4.6 10 5.8 4 7.5 4Z" />
      <path d="M16.5 8c1.7 0 2.8 2 2.8 4.4s-.7 6.6-2.7 6.6-3-3.2-3-5.8S14.8 8 16.5 8Z" />
      <path d="M5 20h5M14 20h5" />
    </>
  ),
  moon: () => <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  sunrise: () => (
    <>
      <path d="M3 18h18M6 14.5a6 6 0 0 1 12 0" />
      <path d="M12 4v3M5.6 6.6l2 2M18.4 6.6l-2 2M3 21h18" />
    </>
  ),
  shield: () => (
    <>
      <path d="M12 3l7 2.5v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9v-6L12 3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  book: () => (
    <>
      <path d="M5 4.5h6.5a2.5 2.5 0 0 1 2.5 2.5V20a2 2 0 0 0-2-2H5V4.5Z" />
      <path d="M19 4.5h-3.5A2.2 2.2 0 0 0 13.3 7V20" />
      <path d="M19 4.5V14" />
    </>
  ),
  microscope: () => (
    <>
      <path d="M9 4h3v6H9V4Z" />
      <path d="M6 20h12M8 20a5 5 0 0 1 5-5c1.6 0 3 .7 4 1.8" />
      <path d="M10.5 10l4 2.5" />
    </>
  ),
  palette: () => (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 2-2s-.8-1.6-.8-2.6c0-1 .8-1.9 1.9-1.9H18a3 3 0 0 0 3-3c0-4.1-4-7.5-9-7.5Z" />
      <circle cx="8" cy="11" r="1.2" />
      <circle cx="12" cy="8" r="1.2" />
      <circle cx="15.8" cy="10.2" r="1.2" />
    </>
  ),
  layers: () => (
    <>
      <path d="M12 3.5l8 4.2-8 4.3-8-4.3 8-4.2Z" />
      <path d="M4 12.5l8 4.2 8-4.2M4 16.5l8 4.2 8-4.2" />
    </>
  ),
  gauge: () => (
    <>
      <path d="M4 18a8.5 8.5 0 1 1 16 0" />
      <path d="M12 18l4-5" />
      <circle cx="12" cy="18" r="1.2" />
    </>
  ),
  wing: () => (
    <>
      <path d="M20 5c-1.6 6.5-6 11.5-13 13l-3-3c3.6-4.2 8.8-7.2 16-10Z" />
      <path d="M12 10.5c1.4 1.4 2 3 2 5" />
    </>
  ),
  clock: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  door: () => (
    <>
      <path d="M6 20V5.5A1.5 1.5 0 0 1 7.5 4h7A1.5 1.5 0 0 1 16 5.5V20" />
      <path d="M4 20h16M13.5 12h.01" />
    </>
  ),
  users: () => (
    <>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6S14 16 14.6 19" />
      <path d="M16 6.4a3 3 0 0 1 0 5.2M17.5 14.8c1.6.6 2.7 1.9 3 3.7" />
    </>
  ),
  dice: () => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.1" />
      <circle cx="15" cy="15" r="1.1" />
      <circle cx="12" cy="12" r="1.1" />
    </>
  ),
  infinity: () => (
    <path d="M8.2 9a3 3 0 1 0 0 6c2.6 0 4-6 6.6-6a3 3 0 1 1 0 6c-2.6 0-4-6-6.6-6Z" />
  ),
})

export type AchievementIconKey = keyof typeof achievementIcons

export function AchievementIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = achievementIcons[name as AchievementIconKey] ?? achievementIcons.feather
  return <Component {...props} />
}
