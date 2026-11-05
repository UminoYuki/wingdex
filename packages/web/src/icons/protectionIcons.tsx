import { createIconMap, type IconProps } from './base'

/** 保护级别盾牌 8 种：国内一级/二级/三有 + IUCN CR/EN/VU/NT/LC-DD */
export const protectionIcons = createIconMap({
  national1: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M12 8.5v5.5M9.6 11h4.8" />
    </>
  ),
  national2: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M9.2 11.4l2.8-2.6 2.8 2.6M9.6 14h4.8" />
    </>
  ),
  sanyou: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M9.2 12.6l2 2 3.8-4.4" />
    </>
  ),
  CR: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M8.8 15.5l6.4-7M9 9.4h.9M14.2 12.6h.9" />
    </>
  ),
  EN: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M9 15V9h4.4M9 12h3.4" />
    </>
  ),
  VU: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M8.6 9l3.4 6.4L15.4 9" />
    </>
  ),
  NT: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M8.8 9v6.4M15.2 9v6.4M8.8 9h6.4" />
    </>
  ),
  LC: () => (
    <>
      <path d="M12 3l7.5 2.6v5.8c0 4.6-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5-7.5-9.6V5.6L12 3Z" />
      <path d="M9 15.4V9h1.8M9 12.2h3" />
      <circle cx="15.2" cy="13.8" r="2" />
    </>
  ),
})

export type ProtectionIconKey = keyof typeof protectionIcons

export function ProtectionIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = protectionIcons[name as ProtectionIconKey] ?? protectionIcons.LC
  return <Component {...props} />
}
