'use strict';
const LOWEST_NODE_VERSION = '14.0.0' // 最低的 Node 版本
const semver = require('semver')
const colors = require('colors')
const log = require('@lyf-cli-dev/log')
const {isObject} = require('@lyf-cli-dev/utils')

class Command {
    constructor(argv) {
        log.verbose('Command constructor', argv)
        if (!argv) {
            throw new Error('参数不能为空！')
        }
        if (!Array.isArray(argv)) {
            throw new Error('参数必须为数组！')
        }
        if (argv.length < 1) {
            throw new Error('参数列表为空！')
        }
        this._argv = argv
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve()
            // 链式调用处理异常
            chain = chain.then(() => this.checkNodeVersion())
            chain = chain.then(() => this.initArgs())
            chain = chain.then(() => this.init())
            chain = chain.then(() => this.exec())
            chain.catch(err => {
                log.error(err.message)
            })
        })
    }

    // 检查最低 Node 版本号
    checkNodeVersion() {
        // 1，检查当前版本号
        const currentVersion = process.version
        // 2，对比最低版本号
        const lowestVersion = LOWEST_NODE_VERSION
        // 3，通过 semver 版本管理库对比
        if (!semver.gte(currentVersion, lowestVersion)) {
            throw new Error(colors.red(`lyf-cli-dev 需要安装 v${lowestVersion} 以上版本的 Node.js`))
        }
    }

    // 处理参数
    initArgs() {
        this._cmd = this._argv[this._argv.length - 2]
        this._argv = this._argv.slice(0, this._argv.length - 1)
    }

    init() {
        throw new Error('init 必须实现')
    }

    exec() {
        throw new Error('exec 必须实现')
    }
}

module.exports = Command;