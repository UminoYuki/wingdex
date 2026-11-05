import { Router } from 'express'
import { APP_VERSION, config } from '../../config'
import { getDb } from '../../db'
import { one, type Row } from '../../db/queries'
import { webDistDir } from '../../app'

const router = Router()

router.get('/', (_req, res) => {
  const row = one<Row>(
    getDb(),
    `SELECT
      (SELECT COUNT(*) FROM species) AS species,
      (SELECT COUNT(*) FROM photos) AS photos,
      (SELECT COUNT(*) FROM photos WHERE species_id IS NULL) AS inbox,
      (SELECT COUNT(*) FROM cards) AS cards,
      (SELECT COUNT(*) FROM places) AS places,
      (SELECT COUNT(*) FROM achievement_state WHERE unlocked_at IS NOT NULL) AS achievements`,
  )

  res.json({
    ok: true,
    version: APP_VERSION,
    uptimeSec: Math.round(process.uptime()),
    dataDir: config.dataDir,
    portableDataDir: config.portableDataDir,
    dbPath: config.dbPath,
    webDist: webDistDir(),
    counts: {
      species: Number(row?.species ?? 0),
      photos: Number(row?.photos ?? 0),
      inbox: Number(row?.inbox ?? 0),
      cards: Number(row?.cards ?? 0),
      places: Number(row?.places ?? 0),
      achievements: Number(row?.achievements ?? 0),
    },
  })
})

export default router
