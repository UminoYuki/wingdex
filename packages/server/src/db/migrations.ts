import type { Database } from 'better-sqlite3'

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS species (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grp TEXT NOT NULL DEFAULT '鸟纲',
    cn_name TEXT NOT NULL,
    scientific_name TEXT,
    en_name TEXT,
    aliases TEXT,
    order_name TEXT,
    family_name TEXT,
    genus_name TEXT,
    iucn_status TEXT,
    iucn_year INTEGER,
    cn_protection_level TEXT,
    cn_protection_source TEXT,
    is_sanyou INTEGER NOT NULL DEFAULT 0,
    length_cm TEXT,
    weight_g TEXT,
    wingspan_cm TEXT,
    morphology_source TEXT,
    distribution TEXT,
    habitats TEXT,
    residence_type TEXT,
    diet TEXT,
    eco_type TEXT,
    summary_zh TEXT,
    summary_en TEXT,
    wiki_title TEXT,
    wiki_url TEXT,
    wiki_en_url TEXT,
    qid TEXT,
    wiki_image_key TEXT,
    image_credit TEXT,
    sound_path TEXT,
    video_path TEXT,
    fetch_status TEXT NOT NULL DEFAULT 'pending',
    fetch_error TEXT,
    fetched_at TEXT,
    cover_photo_id INTEGER,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    is_wishlist INTEGER NOT NULL DEFAULT 0,
    wish_note TEXT,
    note TEXT,
    tags TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species_id INTEGER,
    file_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    ext TEXT,
    file_size INTEGER,
    file_mtime TEXT,
    hash TEXT,
    width INTEGER,
    height INTEGER,
    orientation INTEGER,
    taken_at TEXT,
    camera_make TEXT,
    camera_model TEXT,
    lens TEXT,
    focal_len REAL,
    focal_35 REAL,
    aperture REAL,
    shutter TEXT,
    iso INTEGER,
    exposure_comp REAL,
    gps_lat REAL,
    gps_lon REAL,
    gps_alt REAL,
    place_id INTEGER,
    place_name TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    tags TEXT,
    thumb_state TEXT NOT NULL DEFAULT 'pending',
    imported_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (species_id) REFERENCES species(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_photos_species ON photos(species_id)`,
  `CREATE INDEX IF NOT EXISTS idx_photos_taken ON photos(taken_at)`,
  `CREATE INDEX IF NOT EXISTS idx_photos_hash ON photos(hash)`,
  `CREATE INDEX IF NOT EXISTS idx_photos_place ON photos(place_id)`,

  `CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL,
    lon REAL,
    icon_key TEXT,
    note TEXT,
    use_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_card_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS card_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    preset TEXT,
    overrides TEXT,
    layers TEXT,
    back_config TEXT,
    preview_card_id INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species_id INTEGER NOT NULL,
    title TEXT,
    attribute TEXT,
    stars INTEGER NOT NULL DEFAULT 1,
    stars_source TEXT,
    atk INTEGER NOT NULL DEFAULT 0,
    def INTEGER NOT NULL DEFAULT 0,
    value_source TEXT,
    rarity TEXT NOT NULL DEFAULT 'N',
    photo_id INTEGER,
    photo_crop TEXT,
    theme TEXT,
    preset TEXT,
    template_id INTEGER,
    overrides TEXT,
    layers TEXT,
    effect_text TEXT,
    effect_source TEXT NOT NULL DEFAULT 'auto',
    record_text TEXT,
    serial_no TEXT,
    show_scientific INTEGER NOT NULL DEFAULT 1,
    show_exif INTEGER NOT NULL DEFAULT 1,
    holo INTEGER NOT NULL DEFAULT 0,
    back_theme TEXT NOT NULL DEFAULT 'feather',
    back_emblem TEXT,
    back_text TEXT,
    back_print TEXT,
    back_gear_text TEXT,
    deck_id INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (species_id) REFERENCES species(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cards_species ON cards(species_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id)`,

  `CREATE TABLE IF NOT EXISTS achievement_state (
    key TEXT PRIMARY KEY,
    unlocked_at TEXT,
    progress REAL NOT NULL DEFAULT 0,
    target REAL NOT NULL DEFAULT 0,
    seen INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS wiki_cache (
    cache_key TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS scan_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    root TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    total INTEGER NOT NULL DEFAULT 0,
    processed INTEGER NOT NULL DEFAULT 0,
    imported INTEGER NOT NULL DEFAULT 0,
    duplicated INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS library_roots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    note TEXT,
    photo_count INTEGER NOT NULL DEFAULT 0,
    last_scan_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
]

const COLUMN_PATCHES: Array<{ table: string; column: string; ddl: string }> = [
  { table: 'species', column: 'is_wishlist', ddl: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'species', column: 'tags', ddl: 'TEXT' },
  { table: 'photos', column: 'tags', ddl: 'TEXT' },
  { table: 'cards', column: 'layers', ddl: 'TEXT' },
  { table: 'cards', column: 'template_id', ddl: 'INTEGER' },
]

export function runMigrations(db: Database): void {
  const tx = db.transaction(() => {
    for (const sql of STATEMENTS) db.exec(sql)

    for (const patch of COLUMN_PATCHES) {
      const cols = db
        .prepare(`PRAGMA table_info(${patch.table})`)
        .all() as Array<{ name: string }>
      if (!cols.some((c) => c.name === patch.column)) {
        db.exec(`ALTER TABLE ${patch.table} ADD COLUMN ${patch.column} ${patch.ddl}`)
      }
    }

    db.prepare(
      `INSERT INTO app_meta (key, value) VALUES ('schema_version', '1')
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    ).run()
  })

  tx()
}
