import fs from 'node:fs'
import path from 'node:path'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import { config } from './config'
import { logger } from './logger'
import { errorHandler, notFoundHandler } from './api/utils'
import healthRouter from './api/routes/health'
import speciesRouter from './api/routes/species'
import wikiRouter from './api/routes/wiki'
import photosRouter from './api/routes/photos'
import scanRouter, { rootsRouter } from './api/routes/scan'
import mediaRouter from './api/routes/media'
import statsRouter from './api/routes/stats'
import geoRouter from './api/routes/geo'
import placesRouter from './api/routes/places'
import achievementsRouter from './api/routes/achievements'
import wishlistRouter from './api/routes/wishlist'
import cardsRouter from './api/routes/cards'
import templatesRouter from './api/routes/templates'
import decksRouter from './api/routes/decks'
import exportsRouter from './api/routes/exports'
import settingsRouter from './api/routes/settings'

function localCors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin
  if (origin && /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
}

/**
 * 查找前端构建产物：优先环境变量（桌面壳写入），其次仓库布局 packages/web/dist，
 * 最后兼容打包后与 server 同级的 web 目录。找不到就只提供 API（Vite 开发模式）。
 */
export function webDistDir(): string | null {
  const candidates = [
    process.env.BA_WEB_DIST,
    path.resolve(__dirname, '..', '..', 'web', 'dist'),
    path.resolve(config.appDir, 'packages', 'web', 'dist'),
    path.resolve(config.appDir, '..', 'web', 'dist'),
    path.resolve(config.appDir, 'web', 'dist'),
  ].filter((value): value is string => Boolean(value))
  const found = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')))
  return found ?? null
}

export function createApp(): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(localCors)
  app.use(express.json({ limit: '25mb' }))
  app.use(express.urlencoded({ extended: false }))

  app.use((req, _res, next) => {
    if (!req.path.startsWith('/api/media')) logger.debug({ method: req.method, path: req.path }, '请求')
    next()
  })

  app.use('/api/health', healthRouter)
  app.use('/api/species', speciesRouter)
  app.use('/api/wiki', wikiRouter)
  app.use('/api/photos', photosRouter)
  app.use('/api/scan', scanRouter)
  app.use('/api/roots', rootsRouter)
  app.use('/api/media', mediaRouter)
  app.use('/api/stats', statsRouter)
  app.use('/api/geo', geoRouter)
  app.use('/api/places', placesRouter)
  app.use('/api/achievements', achievementsRouter)
  app.use('/api/wishlist', wishlistRouter)
  app.use('/api/cards', cardsRouter)
  app.use('/api/card-templates', templatesRouter)
  app.use('/api/decks', decksRouter)
  app.use('/api/exports', exportsRouter)
  app.use('/api/settings', settingsRouter)

  app.use('/api', notFoundHandler)

  const dist = webDistDir()
  if (dist) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next()
        return
      }
      res.sendFile(path.join(dist, 'index.html'))
    })
    logger.info({ dist }, '已挂载前端静态资源')
  } else {
    logger.warn('未找到前端构建产物，仅提供 API（开发模式请访问 Vite 端口）')
  }

  app.use(errorHandler)
  return app
}

export type { Request, Response }
