/**
 * 打包后校验：asar 内的生产依赖是否都能被 Node 的解析规则找到。
 *
 * 背景：electron-builder 25.x 依赖 app-builder 的 `node-dep-tree --flatten` 计算结果
 * 决定第三方库「提升到 node_modules 根」还是「嵌套进父包」。该算法在遇到
 * 菱形依赖（依赖 A 与 B 同时依赖 C）时会出错，例如 archiver@7 的
 * archiver → archiver-utils 与 archiver → zip-stream → archiver-utils：
 * archiver-utils 被塞进 node_modules/archiver/node_modules 下，
 * 而并列在同一层的 zip-stream 在运行期按 Node 规则向上找 node_modules/archiver-utils
 * 找不到，应用启动即失败（`Cannot find module 'archiver-utils'`）。
 * 这类布局错误在 asar 里静默存在，只有真正运行才暴露，所以这里在打包后立刻校验。
 *
 * 校验方式：不借助 app-builder 的结论，直接读 asar 内每个包的 package.json，
 * 按 Node 的查找顺序（自身 node_modules → 逐级向上 → 根 node_modules）验证每个
 * dependencies 是否能落在包内；缺失即报错退出，避免打出「启动即崩」的包。
 */
const fs = require('node:fs')
const path = require('node:path')
const { builtinModules } = require('node:module')
const asar = require('@electron/asar')

const desktopDir = path.resolve(__dirname, '..')
// 默认校验 win 解包目录；也可传入其它 asar 路径（如便携版解包后的位置）
const archivePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(desktopDir, 'release', 'win-unpacked', 'resources', 'app.asar')
const unpackedDir = `${archivePath}.unpacked`

// asar 内部路径统一成不带前导斜杠的 POSIX 形式
// listPackage 返回的是「带前置分隔符」的平台路径，asar 内部按平台分隔符查找
const toPosix = (p) => p.replace(/^[\\/]+/, '').split(path.sep).join('/')
const toArchivePath = (p) => p.split('/').join(path.sep)
const builtins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)])

/** asar 内路径（统一用 /），以及 app.asar.unpacked 里同名文件的集合 */
const files = asar.listPackage(archivePath).map(toPosix)
const fileSet = new Set(files)

const unpackedSet = new Set()
if (fs.existsSync(unpackedDir)) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else unpackedSet.add(toPosix(path.relative(unpackedDir, full)))
    }
  }
  walk(unpackedDir)
}

/** 包根目录：形如 node_modules/<name> 或 <pkg>/node_modules/<name>（name 可为 @scope/name） */
const isPackageRoot = (p) => /(?:^|\/)node_modules\/(?:@[^/]+\/)?[^/]+$/.test(p)
const packageRoots = new Set(files.filter(isPackageRoot))

const readJson = (internalPath) => {
  if (fileSet.has(internalPath)) {
    return JSON.parse(asar.extractFile(archivePath, toArchivePath(internalPath)).toString('utf8'))
  }
  const unpackedPath = path.join(unpackedDir, internalPath)
  if (fs.existsSync(unpackedPath)) {
    return JSON.parse(fs.readFileSync(unpackedPath, 'utf8'))
  }
  return null
}

/** Node 解析顺序：要求者自身 node_modules → 逐级向外 → 根 node_modules */
const resolveInsideArchive = (fromPackageDir, dep) => {
  let base = fromPackageDir
  for (;;) {
    const candidate = `${base}/node_modules/${dep}`
    if (packageRoots.has(candidate)) return true
    const idx = base.lastIndexOf('/node_modules/')
    if (idx === -1) return packageRoots.has(`node_modules/${dep}`)
    base = base.slice(0, idx)
  }
}

const missing = []
let checked = 0

for (const pkgDir of packageRoots) {
  const pkg = readJson(`${pkgDir}/package.json`)
  if (!pkg) continue
  const optional = new Set(Object.keys(pkg.optionalDependencies || {}))
  for (const dep of Object.keys(pkg.dependencies || {})) {
    if (builtins.has(dep) || optional.has(dep)) continue
    checked++
    if (!resolveInsideArchive(pkgDir, dep)) {
      missing.push(`${pkgDir} 需要 ${dep}`)
    }
  }
}

console.log(`[verify-pack] 校验 ${packageRoots.size} 个包、${checked} 条生产依赖`)

if (missing.length > 0) {
  console.error('[verify-pack] 以下依赖在 asar 内无法按 Node 规则解析，运行期会 "Cannot find module"：')
  for (const item of missing) console.error(`  - ${item}`)
  console.error(
    '[verify-pack] 通常是 electron-builder 的依赖提升算法把包嵌套错了位置；\n' +
      '            可在 packages/desktop/package.json 中显式声明该包，让它落到 node_modules 根。',
  )
  process.exit(1)
}

console.log('[verify-pack] 通过：asar 内生产依赖布局可正常解析')
