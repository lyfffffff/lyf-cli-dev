'use strict';

// 用于获取 Npm API 中的 Info

const urlJoin = require("url-join");
const axios = require('axios')
const semver = require('semver')

// 获取 Npm 的所有信息
function getNpmInfo(npmName, registry) {
    if (!npmName) return null
    const registryUrl = registry || getDefaultRegistry()
    const npmInfoUrl = urlJoin(registryUrl, npmName)
    return axios.get(npmInfoUrl).then(res => {
        if (res.status == 200) {
            return res.data
        }
        return null
    }).catch(err => {
        return Promise.reject(err)
    })
}

// 获取请求链接
function getDefaultRegistry(isOriginal = false) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

// 获取 Npm 中的版本信息
async function getNpmVersions(npmName, registry) {
    const data = await getNpmInfo(npmName, registry)
    if (data) {
        return Object.keys(data.versions)
    } else {
        return []
    }

}

// 获取比现在高的版本号数组
function getSemverVersion(baseVersion, versions) {
    versions = versions
        .filter(version => semver.satisfies(version, `^${baseVersion}`))
        .sort((a, b) => semver.gt(b, a)) // 大于该版本的并降序排序
    return versions
}

// 请求所有版本号，并返回比现在高版本的版本号数组中最高版本
async function getNpmSemverVersion(baseVersion, npmName, registry) {
    const versions = await getNpmVersions(npmName, registry)
    const newVersion = getSemverVersion(baseVersion, versions)
    if (newVersion && newVersion.length > 0) {
        return newVersion[0]
    }
}

// 获取包的最新版本号
async function getNpmLatestVersion(npmName, registry) {
    const versions = await getNpmVersions(npmName, registry)
    if (versions) {
        return versions.sort((a, b) => semver.gt(b, a))[0]
    }
    return null
}

module.exports = {
    getNpmInfo, getNpmLatestVersion, getNpmVersions, getNpmSemverVersion, getDefaultRegistry
}
;