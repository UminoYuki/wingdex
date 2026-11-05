/**
 * 打包前置：为 Electron 准备 ABI 匹配的原生模块副本。
 *
 * npm 装下来的 better-sqlite3 是按当前 Node 的 NODE_MODULE_VERSION 编译的（Node 22 = 127），
 * 而 Electron 自带的是另一套 ABI（Electron 33 = 130）。直接把 Node 版打进包里，
 * 启动时内嵌服务会抛
 *   `The module ... was compiled against a different Node.js version using NODE_MODULE_VERSION 127.
 *    This version of Node.js requires NODE_MODULE_VERSION 130.`
 * 主进程捕获后弹窗并 app.exit(1)，看起来就是「双击没反应」。
 *
 * 这里用 prebuild-install 拉一份 Electron ABI 的预编译二进制，放到 packages/desktop/node_modules 下。
 * 该目录在 Node 解析顺序里优先于仓库根 node_modules，于是：
 *   桌面端（开发运行 + 打包产物）→ 用 Electron ABI 版本
 *   仓库根（packages/server 的纯 Node 开发流）→ 仍是 Node ABI 版本
 * 互不干扰。不要改用 electron-builder 的 npmRebuild / @electron/rebuild：它会就地改写
 * 仓库根的原生模块，把 Node 开发流一起改坏。
 */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const MODULE_NAME = 'better-sqlite3'

const desktopDir = path.resolve(__dirname, '..')
const repoDir = path.resolve(desktopDir, '..', '..')
const sourceDir = path.join(repoDir, 'node_modules', MODULE_NAME)
const targetDir = path.join(desktopDir, 'node_modules', MODULE_NAME)
const binaryPath = path.join(targetDir, 'build', 'Release', 'better_sqlite3.node')
const markerPath = path.join(targetDir, '.electron-abi')

/** devDependencies 里的 electron 版本（prebuild-install 的 --target 要求精确版本号） */
function readElectronVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(desktopDir, 'package.json'), 'utf8'))
  const raw = (pkg.devDependencies || {}).electron || (pkg.dependencies || {}).electron
  if (!raw) throw new Error('packages/desktop/package.json 里没有声明 electron 依赖')
  return raw.replace(/^[^\d]*/, '')
}

function findPrebuildInstall() {
  const local = path.join(repoDir, 'node_modules', 'prebuild-install', 'bin.js')
  if (fs.existsSync(local)) return local
  return require.resolve('prebuild-install/bin.js', { paths: [repoDir, desktopDir] })
}

const electronVersion = readElectronVersion()

const cached = (() => {
  if (!fs.existsSync(binaryPath)) return null
  try {
    return fs.readFileSync(markerPath, 'utf8').trim()
  } catch {
    return null
  }
})()

if (cached === electronVersion) {
  console.log(`[stage-native] 已就绪 ${MODULE_NAME} (electron ${electronVersion})`)
  process.exit(0)
}

if (!fs.existsSync(sourceDir)) {
  console.error(`[stage-native] 未找到 ${path.relative(repoDir, sourceDir)}，请先执行 npm install`)
  process.exit(1)
}

// 复制一份包骨架：排除 build（ABI 相关，交给 prebuild-install 重新写入）与已有标记
fs.rmSync(targetDir, { recursive: true, force: true })
fs.cpSync(sourceDir, targetDir, {
  recursive: true,
  filter: (from) => {
    const rel = path.relative(sourceDir, from)
    if (rel.split(path.sep)[0] === 'build') return false
    return path.basename(from) !== '.electron-abi'
  },
})

console.log(
  `[stage-native] 正在获取 ${MODULE_NAME} 的 Electron ABI 预编译包 ` +
    `(electron ${electronVersion}, ${process.platform}-${process.arch})`,
)
execFileSync(
  process.execPath,
  [
    findPrebuildInstall(),
    '--runtime=electron',
    `--target=${electronVersion}`,
    `--arch=${process.arch}`,
    `--platform=${process.platform}`,
  ],
  { cwd: targetDir, stdio: 'inherit' },
)

if (!fs.existsSync(binaryPath)) {
  console.error(`[stage-native] ${path.relative(repoDir, binaryPath)} 未生成，Electron 打包会启动失败`)
  process.exit(1)
}

fs.writeFileSync(markerPath, `${electronVersion}\n`)
console.log(`[stage-native] 已就绪 ${path.relative(desktopDir, targetDir)} (electron ${electronVersion})`)
