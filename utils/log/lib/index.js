'use strict';
// 日志定制
const log = require('npmlog')

// level 表示以谁的数字作为参照，默认为 'info'，值为 2000，即参数 2 小于 2000 的指令不会生效
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'// 判断 debug 模式

log.heading = 'lyf' // log 前添加前缀
log.headingStyle = { fg: 'white', bg: 'black' } // 前缀样式

// 通过 addLevel 添加自定义指令
log.addLevel('success', 2000, {fg: 'green', bold: true})

module.exports = log;
