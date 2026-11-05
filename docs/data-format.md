# 数据格式说明

Wingdex · 生灵图鉴 的全部状态都在一个**数据目录**里，照片原图只被索引，不复制、不修改。

## 数据目录在哪

按顺序取第一个可写的目录（启动时决定，设置页可查看当前值）：

1. 环境变量 `BA_DATA_DIR`
2. 程序目录下 `.data/`（开发时即仓库根 `.data/`；便携版 exe 为 exe 同目录 `.data/`）
3. 回退：服务端 `%APPDATA%/BirdAtlas`；打包桌面端 `%APPDATA%/拍鸟图鉴/data`，再不行 `~/.bird-atlas`

回退目录沿用改名前的名字，升级后老数据仍能被找到。

## 目录布局

```
<数据目录>/
├── atlas.db            # SQLite 主库（WAL 模式，旁边会有 atlas.db-wal / atlas.db-shm）
├── cache/
│   ├── thumbs/         # 缩略图 <photoId>_<240|640|1600>.webp，可随时删，会按需重建
│   ├── preview/        # RAW / HEIC 等格式的 JPEG 预览
│   ├── wiki/           # 维基配图，文件名为 URL 哈希
│   └── assets/         # 贴纸等本地素材
├── exports/            # 导出的卡片 PNG、批量 zip、A4 拼版
├── logs/               # server.log
└── tmp/                # 临时文件
```

## SQLite 表

| 表 | 内容 |
| --- | --- |
| `species` | 物种：中文名、学名、英文名、目科属、IUCN 与国内保护级别、体长/体重/翼展、栖息地、中英简介、维基链接与 QID、封面照片、收藏/想拍标记、备注与标签、抓取状态 |
| `photos` | 照片索引：`file_path`（绝对路径，唯一）、文件大小与修改时间、`hash`、宽高、EXIF（拍摄时间、机身、镜头、焦距、光圈、快门、ISO、曝光补偿、GPS）、所属物种与地点、评分、收藏、缩略图状态 |
| `places` | 拍摄地点：名称、经纬度、图标 |
| `cards` | 动物卡：物种、卡图照片与裁切、属性/星级/ATK/DEF/稀有度、效果文本与拍摄记录、图层 JSON、卡背配置、所属卡组 |
| `card_templates` | 卡片模板：预设、覆盖样式、图层与卡背配置 |
| `decks` | 卡组 |
| `achievement_state` | 成就进度与解锁时间 |
| `wiki_cache` | 维基 / Wikidata 响应缓存（`cache_key`、`kind`、JSON `payload`） |
| `scan_jobs` | 扫描任务记录：目录、总数、导入/重复/失败数 |
| `library_roots` | 照片图库目录：`path`（绝对路径，唯一）、照片数、上次扫描时间 |
| `app_meta` | 内部键值（迁移版本等） |

表结构在 `packages/server/src/db/migrations.ts`，启动时自动建表并补齐新增列。

## 照片、图库目录与 EXIF

- 在设置页或「导入待分类」页添加图库目录（必须是已存在的绝对路径），扫描时递归查找 `.jpg .jpeg .png .webp .heic .heif .tif .tiff .dng .raf .cr2 .cr3 .arw .nef .orf` 等格式。扫描过的目录会自动记入 `library_roots`。
- 去重：取文件前 1 MB 加文件大小做 SHA-256，内容相同的照片只入库一次。
- EXIF 由 `exifr` 读取：拍摄时间、机身/镜头、曝光参数和 GPS，用于统计、热力日历、足迹地图与卡面拍摄记录。
- 新照片先进「导入待分类」，指派物种后才出现在图鉴墙。
- 移除图库目录只删除这条记录，不删除照片文件。原图被移动后，可在设置页「校验原图」把它们标成缺失。

## 维基缓存

物种资料来自 zh/en Wikipedia 与 Wikidata，响应写入 `wiki_cache` 表，配图写入 `cache/wiki/`。删掉缓存不会丢数据，只是下次要重新抓取。

## 备份与迁移

1. 关闭应用（或停止 `npm run dev`），确保 `atlas.db-wal` 已合并。
2. 整个数据目录拷走即可；只想保留核心数据，拷 `atlas.db` 和 `exports/` 就够，`cache/` 能重建。
3. 新位置设 `BA_DATA_DIR` 指向它再启动。
4. `photos.file_path` 存的是绝对路径：照片盘符或目录变了，需要重新添加图库目录并扫描，旧记录会显示为缺失。
