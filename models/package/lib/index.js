'use strict';
const pkgDir = require('pkg-dir').sync
const pathExists = require('path-exists').sync
const fse = require('fs-extra')
const path = require('path')
const npminstall = require('npminstall')
const {isObject} = require('@lyf-cli-dev/utils')
const {getDefaultRegistry, getNpmLatestVersion} = require('@lyf-cli-dev/get-npm-info')
const formatpath = require('@lyf-cli-dev/format-path')

// 根据动态命令，执行安装（install 缓存没有）或者更新包（update 有缓存但不是最新版本），或者直接获取缓存中的包。
class Package {
    constructor(options) {
        if (!options) {
            throw new Error('Package 类的 options 参数不能为空')
        }
        if (!isObject(options)) {
            throw new Error('Package 类的 options 参数必须为对象')
        }
        // package 的路径
        this.targetPath = options.targetPath
        // 缓存 package 的路径
        this.storeDir = options.storeDir;
        // package 的名称
        this.packageName = options.packageName
        // package 的Version
        this.packageVersion = options.packageVersion
        // package 缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            fse.mkdirpSync(this.storeDir)
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
        // 最终文件目录 _@imooc-cli_init@1.1.2@@imooc-cli/
        // 实际指令 @imooc-cli/init 1.1.2

    }

    // 获取缓存路径
    get cahcheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    // 获取指定版本的缓存路径
    getSpecificCacheFilePath(packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }

    // 判断 Package 是否存在
    async exists() {
        if (this.storeDir) {
            await this.prepare()
            return pathExists(this.cahcheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }

    // 安装 Package
    async install() {
        await this.prepare()
        // promise 对象
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [{
                name: this.packageName, version: this.packageVersion
            }]
        })
    }

    // 更新 Package
    async update() {
        await this.prepare()
        // 1，获取最新版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageName)
        // 2，判断最新版本号是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
        // 3，若不存在，则安装最新版本
        if (!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [{
                    name: this.packageName, version: latestPackageVersion
                }]
            })
            this.packageVersion = latestPackageVersion
        }
    }

    // 获取入口文件的路径
    getRootFilePath() {
        function _getRootFile(targetPath) {
            // 1.获取 package.json 库的源码
            const dir = pkgDir(targetPath)
            // 2.读取 package.json
            if (dir) {
                // 2.读取 package.json
                const pkgFile = require(path.resolve(dir, 'package.json'))
                // 3.main/lib
                if (pkgFile && pkgFile.main) {
                    // 4.路径兼容
                    return formatpath(path.resolve(dir, pkgFile.main))
                }
            }
        }

        if (this.storeDir) {
            return _getRootFile(this.cahcheFilePath)
        } else {
            return _getRootFile(this.targetPath)
        }
    }
}

module.exports = Package;
