#!/usr/bin/env node
// 判断
const importLocal = require('import-local')

if (importLocal(__filename)) {
    require('npmlog').info('cli', '正在使用 lyf-cli 本地')
} else {
    require('../lib')(process.argv.slice(2))
}

