'use strict';

module.exports = core; // 导出的函数
// 库
const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home') // 获取当前主目录
const pathExists = require('path-exists').sync // 判断目录是否存在，使用 4.0.0 版本
const log = require('@lyf-cli-dev/log')
const commander = require("commander")
const exec = require('@lyf-cli-dev/exec')

// 相对资源
const pkg = require('../package.json')
const constant = require('./const')
const program = new commander.Command()
let args, config

// 未使用的资源
const init = require('@lyf-cli-dev/init')
const publish = require('@lyf-cli-dev/publish')
const dotenv = require("dotenv");
const minimist = require("minimist");
const rootCheck = require("root-check");

async function core() {
    // 使用 try-catch 获取，避免抛出大量错误信息
    try {
        await prepare()
        registerCommand()
    } catch (e) {
        log.error(e.message)
        if (program.debug) {
            console.log(e)
        }
    }
}

// 注册命令 使用 commander 库注册命令
function registerCommand() {
    program.name(Object.keys(pkg.bin)[0]).usage("<command> [options]").version(pkg.version).option('-d, --debug', '是否开启调试模式', false).option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', ''); // 当不为 Boolean 值时，手动使用标签定义属性，与选项同名

    // 开启 debug 模式
    program.on('option:debug', function () {
        if (program.opts().debug) { // program.debug 获取的为 undefined，需使用 opts 方法获取，若为横杠连接的多单词，使用驼峰命令，例如 '--test-name'，使用 program.opts().testName
            process.env.LOG_LEVEL = 'verbose'
        } else {
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL
    });

    // 指定 targetPath
    program.on('option:targetPath', function () {
        process.env.CLI_TARGET_PATH = program.opts().targetPath

    });

    // 自定义指令
    program.command("init [projectName]").option('-f, --force', '是否强制执行初始化项目').action(exec) // 参数 cmdObj 是本命令的克隆，能够获取本命令的 option，但不能识别全局命令，即能识别 -f，值为 {force：true}，但不能识别 -d，值为 {}
    // PS：脚手架初始化时自定义的，可能调用不同的包（init、my-init），需设置一个包类（Package），用于查找、更新、下载目标包


    // 对未知命名的监听
    program.on('command:*', function (obj) {
        const availableCommands = program.commands.map(cmd => cmd.name())
        if (availableCommands.length > 0) {
            console.log(colors.red('未知的命令：' + obj[0] + "\n可选择的命令：" + availableCommands.join(',')))
        }
    });

    program.parse(process.argv);

    // 当没有输入命令时，输出帮助文档，args 存储命令，自动识别命令和选项
    if (program.args && program.args.length < 1) {
        program.outputHelp()
        console.log() // 空行
    }
}

// 脚手架的启动阶段
async function prepare() {
    checjPkgVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
}

// 检查全局更新 更新至最新版本
async function checkGlobalUpdate() {
    // 1，获取当前的版本号和 npm 包名称
    const currentVersion = pkg.version
    const npmName = pkg.name
    // 2，获取当前安装的 npm API 的所有版本号
    let {getNpmSemverVersion} = require('@lyf-cli-dev/get-npm-info')
    let lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    // 3，若当前版本过低，提示用户进行更新
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn('更新提示', colors.yellow(`请手动更新${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
                更新命名：npm install -g ${npmName}`))
    }
}

// 检查环境变量
function checkEnv() {
    const dotenv = require('dotenv') // 加载当前目录下的 .env 文件并进行读取
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
}

// 配置默认的环境变量，并赋值给全局的环境变量
function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig['cliHome']
}

// 检查主目录
function checkUserHome() {
    console.log(userHome) // C:\User\pc
    if (!userHome || !pathExists(userHome)) {
        throw  new Error(colors.red('当前登录用户主目录不存在~'))
    }
}

// 检查 root 账号
function checkRoot() {
    // console.log(process.geteuid()) // 注意 windows 不支持此方法
    const rootCheck = require('root-check')
    rootCheck() // 检查是否为管理员且若是则自动进行降级，需使用 1.0.0 版本
}

// 检查最低 Node 版本号
function checkNodeVersion() {
    // 1，检查当前版本号
    const currentVersion = process.version
    // 2，对比最低版本号
    const lowestVersion = constant.LOWEST_NODE_VERSION
    // 3，通过 semver 版本管理库对比
    if (!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`lyf-cli-dev 需要安装 v${lowestVersion} 以上版本的 Node.js`))
    }
}

// 检查版本号
function checjPkgVersion() {
    log.info('cli', pkg.version) // 检查版本信息
}

/******* 开发雏形：即最终不使用的部分 ********/

// 检查命令入参，当传入 --debug 时，修改 log 的 level
function checkInputArgs() {
    const minimist = require('minimist')
    args = minimist(process.argv.slice(2))
    checkArgs()
}

function checkArgs() {
    if (args.debug) {
        process.env.LOG_LEVEL = 'verbose'
    } else {
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL // 手动修改 log 的 level。因为 log 包在 require 时就加载完毕了，此时 process.env.LOG_LEVEL 修改，其不会自主修改
}
