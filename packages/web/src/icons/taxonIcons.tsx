import { createIconMap, type IconProps } from './base'

/** 类群图标 5 项：鸟/兽/虫/爬行/两栖 */
export const taxonIcons = createIconMap({
  bird: () => (
    <>
      <path d="M4 14c0-4 3.2-7 7-7 1.4 0 2.6.4 3.6 1l4-1.4-1.4 3.2c.3.7.4 1.5.4 2.3 0 3.6-3.1 6-7 6-3.1 0-6.6-1.6-6.6-4.1Z" />
      <path d="M11 7.5c0-1.6 1.2-2.6 2.6-2.4" />
      <path d="M8 14.5c1.6.9 4 .9 6 0" />
    </>
  ),
  mammal: () => (
    <>
      <circle cx="12" cy="13" r="6" />
      <path d="M6.5 8.5L5 4.5l4 1.6M17.5 8.5L19 4.5l-4 1.6" />
      <path d="M9.5 12h.01M14.5 12h.01M12 15l-1 1.4h2L12 15Z" />
    </>
  ),
  insect: () => (
    <>
      <ellipse cx="12" cy="14" rx="4.5" ry="6" />
      <path d="M12 8V5.5M12 5.5l-2-2M12 5.5l2-2" />
      <path d="M7.5 11C4.5 9 3 6.5 3 6.5S6 6 8.5 8.5M16.5 11c3-2 4.5-4.5 4.5-4.5S18 6 15.5 8.5" />
      <path d="M9 11h6M9 14h6M9.5 17h5" />
    </>
  ),
  reptile: () => (
    <>
      <path d="M4 16c2-3.5 5-5 8-5s6 1.5 8 5" />
      <path d="M4 16c-1 0-2 .6-2 1.6C2 19 3.4 20 5 20c2.4 0 4.6-1.6 7-1.6s4.6 1.6 7 1.6" />
      <path d="M12 11V8" />
      <circle cx="12" cy="6.4" r="1.6" />
    </>
  ),
  amphibian: () => (
    <>
      <ellipse cx="12" cy="15" rx="7.5" ry="5" />
      <path d="M6 11c0-2.6 2.7-4.6 6-4.6s6 2 6 4.6" />
      <circle cx="9" cy="9.5" r="1.3" />
      <circle cx="15" cy="9.5" r="1.3" />
      <path d="M12 15.5c.8 0 1.4.5 1.4 1.2" />
    </>
  ),
})

export type TaxonIconKey = keyof typeof taxonIcons

export function TaxonIcon({ name, ...props }: IconProps & { name: string }) {
  const Component = taxonIcons[name as TaxonIconKey] ?? taxonIcons.bird
  return <Component {...props} />
}
