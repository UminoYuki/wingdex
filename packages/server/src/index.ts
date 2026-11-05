import type { Server } from 'node:http'
import { createApp } from './app'
import { config } from './config'
import { closeDb, getDb } from './db'
import { logger } from './logger'

export interface ServerHandle {
  server: Server
  url: string
  port: number
  close: () => Promise<void>
}

let running: ServerHandle | null = null

export async function startServer(options: { port?: number; host?: string } = {}): Promise<ServerHandle> {
  if (running) return running

  getDb()
  const app = createApp()
  const port = options.port ?? config.port
  const host = options.host ?? config.host

  const server = await new Promise<Server>((resolve, reject) => {
    const instance = app.listen(port, host, () => resolve(instance))
    instance.on('error', reject)
  })

  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  const browserHost = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host
  const url = `http://${browserHost}:${actualPort}`
  running = {
    server,
    url,
    port: actualPort,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
      closeDb()
      running = null
      logger.info('本地服务已停止')
    },
  }

  logger.info({ url, dataDir: config.dataDir, portable: config.portableDataDir }, 'Wingdex 服务已启动')
  return running
}

if (require.main === module) {
  void startServer().catch((error) => {
    logger.error({ err: String(error) }, '服务启动失败')
    process.exitCode = 1
  })

  const shutdown = () => {
    void running?.close().finally(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

export { createApp } from './app'
export { config } from './config'
export { getDb } from './db'
