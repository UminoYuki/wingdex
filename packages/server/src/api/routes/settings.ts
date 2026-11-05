import { Router } from 'express'
import { APP_NAME, APP_VERSION, config } from '../../config'

const router = Router()

/** 只读的运行设置：数据目录、端口与可用环境变量。数据目录只能通过 BA_DATA_DIR 修改。 */
router.get('/', (req, res) => {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
    dataDir: config.dataDir,
    portableDataDir: config.portableDataDir,
    dbPath: config.dbPath,
    port: req.socket.localPort ?? config.port,
    host: config.host,
    desktop: process.env.BA_DESKTOP === '1',
    env: {
      BA_DATA_DIR: process.env.BA_DATA_DIR ?? null,
      BA_PORT: process.env.BA_PORT ?? null,
      BA_HOST: process.env.BA_HOST ?? null,
      BA_USER_AGENT: process.env.BA_USER_AGENT ?? null,
    },
  })
})

export default router
