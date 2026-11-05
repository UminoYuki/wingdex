import type { ReactNode, SVGProps } from 'react'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number
  strokeWidth?: number
}

/** 统一图标基座：24 viewBox、线宽 1.5、圆角端点 */
export function IconBase({ size = 18, strokeWidth = 1.5, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

type IconShapes = (props: IconProps) => ReactNode

/** 由形状定义批量生成图标组件，保证 24 viewBox 与线宽一致 */
export function iconFrom(shapes: IconShapes) {
  return function GeneratedIcon(props: IconProps) {
    return <IconBase {...props}>{shapes(props)}</IconBase>
  }
}

export function createIconMap<T extends Record<string, IconShapes>>(map: T) {
  return Object.fromEntries(
    Object.entries(map).map(([key, shapes]) => [key, iconFrom(shapes)]),
  ) as { [K in keyof T]: ReturnType<typeof iconFrom> }
}
