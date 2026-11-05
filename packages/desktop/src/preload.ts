import { contextBridge, ipcRenderer } from 'electron'

const api = {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke('app:info'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  captureCard: (options: unknown) => ipcRenderer.invoke('card:capture', options),
  captureBatch: (options: unknown) => ipcRenderer.invoke('card:captureBatch', options),
  openExportDir: () => ipcRenderer.invoke('export:open'),
  revealExport: (file: string) => ipcRenderer.invoke('export:reveal', file),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  onAchievement: (handler: (payload: unknown) => void) => {
    const listener = (_event: unknown, payload: unknown) => handler(payload)
    ipcRenderer.on('achievement:new', listener)
    return () => ipcRenderer.removeListener('achievement:new', listener)
  },
}

contextBridge.exposeInMainWorld('birdAtlas', api)

export type BirdAtlasBridge = typeof api
