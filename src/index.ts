/* eslint-disable no-console */
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { Gitlab } from '@gitbeaker/rest'
import chalk from 'chalk'
import type { Project } from './type'
import { Item } from './type'
import config from './config'

const gitlab = new Gitlab({
  host: 'http://git.hgj.net',
  token: process.env.GITLAB_TOKEN,
})

const isProd = (): boolean => config.env === 'prod'

// 根据include 和includeGlobal 筛选出需要同步的项目
function getProjectByConfig(): Project[] {
  let { include, includeGlobal, project } = config
  if (!include.length) {
    include = [Item.ACI, Item.AFR, Item.AMS, Item.ISF]
  }
  if (!includeGlobal.length) {
    includeGlobal = [Item.ACI, Item.AFR, Item.AMS, Item.ISF]
  }
  const result: Project[] = []
  project.forEach((item) => {
    if ((!item.isGlobal && include.includes(item.name)) || (includeGlobal.includes(item.name) && item.isGlobal)) {
      result.push(item)
    }
  })
  return result
}
// 获取远程内容
async function getRemoteFileContent(projectId: number, filePath: string, branchName: string): Promise<any> {
  try {
    const response = await gitlab.RepositoryFiles.show(projectId, filePath, branchName)
    const fileContent = response.content
    const decodedContent = Buffer.from(fileContent, 'base64').toString('utf8')
    return {
      data: decodedContent,
      size: response.size,
    }
  }
  catch (err: any) {
    if (err.name === 'GitbeakerRequestError') {
      console.log(chalk.red(`项目(${projectId}) / 分支(${branchName}) / 路径(${filePath})  不存在`))
      return null
    }
  }
}
// 国内同步
async function syncLocaleToRemote(project: string, locale: string, content: string): Promise<void> {
  const data = {
    locale,
    localeCode: locale,
    content,
    project,
  }

  const url = isProd() ? 'http://ingress-ng.hgj.com/overseas-manifest-common/admin/locale/set-message' : `http://${config.env}-apisix.hgj.com/overseas-manifest-common/admin/locale/set-message`
  const referer = isProd() ? 'http://manage.hgj.net/' : `http://${config.env}-manage.hgj.net/`
  const token = isProd() ? config.prodManagerSessionId : config.managerSessionId
  try {
    const res = await fetch(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'app-key': 'manifest-aci',
        'cache-control': 'no-cache',
        'content-type': 'application/json;charset=UTF-8',
        'manager-session-id': token,
        'pragma': 'no-cache',
        'Referer': referer,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      body: JSON.stringify(data),
      method: 'POST',
    })
    if (res!.status === 401) {
      console.log(chalk.red('登录已失效, 请重新配置token'))
      process.exit()
    }
  }
  catch (error) {
    console.log(error)
  }
}
// 海外版同步
async function syncGlobalLocaleToRemote(project: string, locale: string, content: string): Promise<void> {
  const data = {
    locale,
    localeCode: locale,
    project,
    content,
  }
  const url = isProd()
    ? 'https://manage.globalhgj.com/ingress/overseas-manifest-common/admin/locale/set-message'
    : 'https://dev-ingress.globalhgj.com/overseas-manifest-common/admin/locale/set-message'
  const referer = isProd() ? 'https://manage.globalhgj.com/aci/i18n/page' : 'https://dev-manage.globalhgj.com/'
  const token = isProd() ? config.prodGlobalManagerSessionId : config.globalManagerSessionId
  try {
    const res = await fetch(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'app-key': 'manifest-aci',
        'cache-control': 'no-cache',
        'content-type': 'application/json;charset=UTF-8',
        'manager-session-id': token,
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'cookie': 'hgj-lang=vi',
        'Referer': referer,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      body: JSON.stringify(data),
      method: 'POST',
    })
    if (res!.status === 401) {
      console.log(chalk.red('登录已失效, 请重新配置token'))
      process.exit()
    }
  }
  catch (error) {
    console.log(error)
  }
}

// 根据config 配置同步
async function syncLocale(): Promise<void> {
  console.log(chalk.green(`开始同步：${config.env}环境 语言包...\n`))
  const projectList = getProjectByConfig()
  for (const project of projectList) {
    const locale = [...config.locale, ...(project.locale ?? [])]
    const branchName = project?.branch || config.branch
    // 根据lang 去重locale
    const localeMap = new Map()
    for (const item of locale) {
      localeMap.set(item.lang, item)
    }
    if (project.isGlobal) {
      for (const [key, value] of localeMap) {
        const content = await getRemoteFileContent(project.id, value.path, branchName)
        if (content) {
          await syncGlobalLocaleToRemote(project.name, key, content.data)
          console.log('✅ 海外版：', project.name, key, chalk.green('同步成功'), content.size / 1024, 'kb', chalk.blue(project.url))
        }
        else {
          console.log('❌ 海外版：', project.name, key, chalk.red('同步失败'), chalk.red(project.url))
        }
      }
    }
    else {
      for (const [key, value] of localeMap) {
        const content = await getRemoteFileContent(project.id, value.path, branchName)
        if (content) {
          await syncLocaleToRemote(project.name, key, content.data)
          console.log('✅ 国内版：', project.name, key, chalk.green('同步成功'), content.size / 1024, 'kb', chalk.blue(project.url))
        }
        else {
          console.log('❌ 国内版：', project.name, key, chalk.red('同步失败'), chalk.blue(project.url))
        }
      }
    }
    console.log('\n')
  }

  console.log(chalk.green(`同步结束：${config.env}环境 语言包`))
}

function main(): void {
  if (!process.env.GITLAB_TOKEN) {
    console.log(chalk.red('请先配置系统变量GITLAB_TOKEN'))
    process.exit()
  }
  if (!config) {
    console.log(chalk.red('请先配置config'))
    process.exit()
  }
  syncLocale()
}

main()
