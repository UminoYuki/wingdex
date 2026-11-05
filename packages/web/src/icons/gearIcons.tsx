import { createIconMap, type IconProps } from './base'

/** 装备图标 8 项：机身、镜头、长焦、三脚架、闪光灯、电池、存储卡、摄影包 */
export const gearIcons = createIconMap({
  cameraBody: () => (
    <>
      <path d="M4 8.5h3L8.5 6h7L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.4" />
      <path d="M18 11h1.5" />
    </>
  ),
  lens: () => (
    <>
      <path d="M9 5h6l1.5 3H19a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2.5L9 5Z" />
      <circle cx="12" cy="13" r="3.6" />
    </>
  ),
  telephoto: () => (
    <>
      <path d="M3 10h9l6-3v10l-6-3H3v-4Z" />
      <path d="M18 9.5h2.5v5H18" />
      <path d="M6 13.5V17M10 13.5V17" />
    </>
  ),
  tripod: () => (
    <>
      <path d="M12 3.5v10" />
      <path d="M5.5 20.5l6.5-7 6.5 7" />
      <path d="M8 8.5h8" />
      <circle cx="12" cy="3" r="1.5" />
    </>
  ),
  flash: () => (
    <>
      <path d="M8.5 3h7l-1.6 6H18l-6.5 12 1-8h-3.4L8.5 3Z" />
    </>
  ),
  battery: () => (
    <>
      <rect x="3" y="7" width="15" height="10" rx="2" />
      <path d="M18 10.5h2v3h-2" />
      <path d="M6 10.5v3M9 10.5v3M12 10.5v3" />
    </>
  ),
  memoryCard: () => (
    <>
      <path d="M6 3h9l3 3v15H6V3Z" />
      <path d="M9 3v4M12 3v4M15 3v4" />
      <path d="M9 12h6v6H9z" />
    </>
  ),
  bag: () => (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      <path d="M9 13h6" />
    </>
  ),
})

export type GearIconKey = keyof typeof gearIcons

export function GearIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = gearIcons[name as GearIconKey] ?? gearIcons.cameraBody
  return <Component {...props} />
}
