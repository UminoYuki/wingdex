import { create } from 'zustand'

export interface PhotoViewerState {
  photoIds: number[]
  index: number
  /** 查看器内是否展示 EXIF 面板 */
  showExif: boolean
}

export type AtlasView = 'grid' | 'stream'

interface UiState {
  quickCreateOpen: boolean
  openQuickCreate: () => void
  closeQuickCreate: () => void
  /** 图鉴墙展示方式：卡片墙 / 拍摄日志流 */
  atlasView: AtlasView
  setAtlasView: (view: AtlasView) => void
  viewer: PhotoViewerState | null
  openViewer: (photoIds: number[], index: number) => void
  setViewerIndex: (index: number) => void
  toggleViewerExif: () => void
  closeViewer: () => void
  /** 编辑器窄窗口底部抽屉展开态 */
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  quickCreateOpen: false,
  openQuickCreate: () => set({ quickCreateOpen: true }),
  closeQuickCreate: () => set({ quickCreateOpen: false }),
  atlasView: 'grid',
  setAtlasView: (view) => set({ atlasView: view }),
  viewer: null,
  openViewer: (photoIds, index) => set({ viewer: { photoIds, index, showExif: false } }),
  setViewerIndex: (index) =>
    set((state) => (state.viewer ? { viewer: { ...state.viewer, index } } : state)),
  toggleViewerExif: () =>
    set((state) => (state.viewer ? { viewer: { ...state.viewer, showExif: !state.viewer.showExif } } : state)),
  closeViewer: () => set({ viewer: null }),
  inspectorOpen: false,
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
}))
