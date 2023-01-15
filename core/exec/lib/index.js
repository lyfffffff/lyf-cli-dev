'use strict';
const Package = require('@lyf-cli-dev/package')
const cp = require('child_process')
const path = require('path')
const log = require("@lyf-cli-dev/log")
const SETTINGS = {
    init: 'npmlog' // 包名
}
const CACHE_DIR = 'dependencies' // 缓存目录
// 动态调用 init 的脚手架
async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH;
    let pkg
    let storeDir = ''
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)

    const cmbObj = arguments[arguments.length - 1]
    const cmbName = cmbObj.name()
    const packageName = SETTINGS[cmbName]
    const packageVersion = 'latest'
    if (!targetPath) {
        // 生成缓存路径
        targetPath = path.resolve(homePath, CACHE_DIR)
        storeDir = path.resolve(targetPath, 'node_modules')
        log.verbose('targetPath', targetPath)
        log.verbose('storeDir', storeDir)
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        })
        if (await pkg.exists()) {
            console.log('更新package')
            // 更新 package
            await pkg.update()
        } else {
            // 安装 package
            await pkg.install()
        }
    } else {
        // 直接调用
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        })
    }

    const rootFile = pkg.getRootFilePath()
    console.log('rootFile', rootFile) // 执行的路径
    if (rootFile) {
        // 在当前进程中执行
        // require(rootFile).apply(null, arguments) // 执行入口文件
        // 希望在 Node 子进程中执行
        // 一旦 Nodejs 被调用，则产生 Windows 产生 Nodejs 进程，
        // 在 Nodejs 中使用 child_process 设置 Node 的子进程，故进程是一层层的嵌套关系
        // windows 获取进程使用 netstat -ano
        try {
            const args = Array.from(arguments)
            const cmd = args[args.length - 1]
            const o = Object.create(null)
            // 为 cmd 对象瘦身
            Object.keys(cmd).forEach(key => {
                if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                    o[key] = cmd[key]
                }
            })
            args[args.length - 1] = o
            const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            })
            child.on('error', e => {
                log.error(e.message)
                process.exit(1)
            })
            child.on('exit', e => {
                log.verbose('命令执行成功', e)
            })
            // require(rootFile).call(null, Array.from(arguments)) // 执行入口文件
        } catch (e) {
            log.error(e.message)
        }
    }
}
// 兼容 window 系统
function spawn(command, args, options) {
    const win32 = process.platform === 'win32'

    const cmd = win32 ? 'cmd' : command
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args

    return cp.spawn(cmd, cmdArgs, options || {})

}

module.exports = exec;
