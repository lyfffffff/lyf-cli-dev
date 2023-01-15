'use strict';
const Command = require('@lyf-cli-dev/command')
const log = require('@lyf-cli-dev/log')
const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

//  lyf-cli-dev init --targetPath F:/demo/vue-test/lyf-cli-dev/commands/init --force test-project
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }

    async exec() {
        try {
            // 1. 准备阶段
            const projectInfo = await this.prepare()
            if(projectInfo){
                log.verbose('projectInfo',projectInfo)
            }
            // 2. 下载模板
            // 3. 安装模版
        } catch (e) {
            log.error(e.message)
        }

    }

    async prepare() {
        const localPath = process.cwd()
        // 1.判断当前目录是否为空
        if (!this.isDirEmpty(localPath)) {
            let ifContinue = false

            if (!this.force) {
                // 1.1 询问是否继续创建
                ifContinue = (await inquirer.prompt({
                    type: "confirm",
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })).ifContinue
                if (!ifContinue) {
                    return
                }
            }

            if (ifContinue || this.force) {
                // 给用户做二次确认
                // 2. 是否启动强制更新
                const {confirmDelete} = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？'
                })
                if (confirmDelete) {
                    // 若确认创建，则清空当前目录
                    // fse.removeSync(localPath)// 连带目录一起清空
                    fse.emptydirSync(localPath) // 清空目录下所有文件，但保留该目录
                }
            }
        }
        return this.getProjectInfo()
    }

    isDirEmpty(localPath) {
        // const localPath = process.cwd() // 执行命令的目录
        // console.log(path.resolve('.')) // 执行命令的目录
        // console.log(__dirname) // 当前文件
        let fileList = fs.readdirSync(localPath) // 执行目录下的所有文件和文件夹（一层）
        // 文件过滤
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0 // 以 '.' 开头的文件，例如 .gitignore。和 node_modules 文件夹都可以忽略
        ))
        return !fileList || fileList.length <= 0
    }

    async getProjectInfo() {
        let projectInfo = {}
        // 1. 选择创建项目或组件
        const {type} = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [{name: '项目', value: TYPE_PROJECT}, {
                name: '组件', value: TYPE_COMPONENT
            }]
        })
        log.verbose('type', type)
        if (type == TYPE_PROJECT) {
            // 2. 获取项目的基本信息
            const project = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function (v) {
                    // 异步函数，按下回车时会调用的 done，可以在不合法时提供帮助信息
                    const done = this.async();
                    // 1. 首字符必须为英文字符
                    // 2. 尾字符必须为英文或数字
                    // 3. 字符仅允许 '_-'，其后面必须跟英文字符

                    setTimeout(function () {
                        if (!/^[a-zA-Z]([-][a-zA-Z][a-zA-Z0-9]|[_][a-zA-Z][a-zA-Z0-9]|[a-zA-Z0-9])*$/.test(v)) {
                            done('请输入合法的项目名称');
                            return;
                        }
                        // 若参数2为true，进入下一步，否则一直停留在这个交互
                        done(null, true);
                    }, 0);
                },
                filter: function (v) {
                    return v
                }
            }, {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate: function (v) {
                    // 通过 semver 检查版本号
                    const done = this.async();

                    setTimeout(function () {
                        if (!(!!semver.valid(v))) {
                            done('请输入合法的项目版本号');
                            return;
                        }
                        // 若参数2为true，进入下一步，否则一直停留在这个交互
                        done(null, true);
                    }, 0);
                },
                filter: function (v) {
                    if (!!semver.valid(v)) {
                        return semver.valid(v)
                    } else {
                        return v
                    }
                }
            }])
            projectInfo = {
                type,
                ...project
            }

        } else if (type == TYPE_COMPONENT) {

        }
        // return 项目的基本信息 (object)
        return projectInfo
    }

    downloadTemplate(){
        // 1. 通过项目模板API获取项目模板信息
        // 1.1 通过 egg.js 搭建一套后端系统
        // 1.2 通过 npm 存储项目模板
        // 1.3 将项目模板信息存储到 mongodb 数据库中
        // 1.4 通过 egg.js 获取 mongodb 中的数据并且通过 API 返回

    }
}

function init(argv) {
    // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH) // 需要在全局获取
    return new InitCommand(argv)
}

module.exports = init;
module.exports.InitCommand = InitCommand
