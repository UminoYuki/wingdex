import fs from 'node:fs'
import path from 'node:path'
import pino from 'pino'
import { config } from './config'

const dest = pino.destination({
  dest: path.join(config.logDir, 'server.log'),
  sync: false,
  mkdir: true,
})

const pretty = process.env.BA_LOG_PRETTY === '1'

export const logger = pino(
  {
    level: process.env.BA_LOG_LEVEL ?? 'info',
    base: { app: 'wingdex' },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pretty
    ? pino.transport({
        target: 'pino/file',
        options: { destination: 1 },
      })
    : pino.multistream([{ stream: dest }, { stream: process.stdout }]),
)

export function logToFile(line: string): void {
  try {
    fs.appendFileSync(
      path.join(config.logDir, 'server.log'),
      `${new Date().toISOString()} ${line}\n`,
    )
  } catch (error) {
    console.error('[logger] append failed', error)
  }
}
