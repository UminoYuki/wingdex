/**
 * 打包前置：把 workspace 里的 @ba/server 从符号链接换成真实副本。
 *
 * npm workspaces 会把 `node_modules/@ba/server` 做成指向 packages/server 的软链，
 * electron-builder 在做 asar 解包判定时要求依赖路径「在项目内」或「路径里含 node_modules」，
 * 软链会解析成 packages/server/dist/...（两者都不满足）从而报
 * `... must be under ...\packages\desktop\` 并中断打包。
 * 这里只复制运行期需要的 dist 与 package.json（其 dependencies 决定随包携带的第三方库）。
 */
const fs = require('node:fs')
const path = require('node:path')

const desktopDir = path.resolve(__dirname, '..')
const sourceDir = path.resolve(desktopDir, '..', 'server')
const targetDir = path.join(desktopDir, 'node_modules', '@ba', 'server')

if (!fs.existsSync(path.join(sourceDir, 'dist', 'index.js'))) {
  console.error('[stage-server] 未找到 packages/server/dist/index.js，请先执行 npm run build')
  process.exit(1)
}

fs.rmSync(targetDir, { recursive: true, force: true })
fs.mkdirSync(targetDir, { recursive: true })
fs.copyFileSync(path.join(sourceDir, 'package.json'), path.join(targetDir, 'package.json'))
fs.cpSync(path.join(sourceDir, 'dist'), path.join(targetDir, 'dist'), {
  recursive: true,
  filter: (file) => !file.endsWith('.map'),
})

console.log(`[stage-server] 已就绪 ${path.relative(desktopDir, targetDir)}`)
