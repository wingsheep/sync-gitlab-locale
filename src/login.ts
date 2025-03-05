import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import consola from 'consola'
import puppeteer from 'puppeteer'
import { Env } from './type'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function login(mode = 'dev', isGlobal = false): Promise<string> {
  const { HGJ_USER_NAME, HGJ_USER_PASSWORD } = process.env
  if (!HGJ_USER_NAME) {
    consola.error(chalk.red('请设置环境变量海管家后台用户名：HGJ_USER_NAME'))
    process.exit()
  }
  if (!HGJ_USER_PASSWORD) {
    consola.error(chalk.red('请设置环境变量海管家后台密码：HGJ_USER_NAME'))
    process.exit()
  }
  let loginUrl = `http://${mode === Env.PROD ? '' : `${mode}-`}manage.hgj.net/unified-web/sign-in`
  if (isGlobal) {
    if (mode === Env.DEV || mode === Env.BETA) {
      loginUrl = `https://dev-manage.globalhgj.com/unified-web/sign-in`
    }
    else if (mode === Env.PROD) {
      loginUrl = `https://manage.globalhgj.com/unified-web/sign-in`
    }
  }
  consola.info(chalk.blue(`Login: ${loginUrl}`))
  const browser = await puppeteer.launch({ headless: true })

  const page = await browser.newPage()
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForNavigation()

  // 登录
  await page.type('input[type="text"]', HGJ_USER_NAME)
  await page.type('input[type="password"]', HGJ_USER_PASSWORD)
  await page.click('button')
  consola.info(chalk.yellow('Login succeeded'))
  await page.waitForNavigation()
  consola.info(chalk.yellow('Redirection succeeded'))

  const cookies = await page.cookies()
  const sessionId = cookies.find(item => item.name === 'manager_session_id')?.value || ''
  await page.close()
  await browser.close()
  if (!sessionId) {
    consola.error(chalk.red('Got sessionId failed'))
    process.exit()
  }
  consola.success(chalk.green(`Got sessionId: ${sessionId} `))
  // 重写 config.ts managerSessionId
  const configPath = path.resolve(__dirname, 'config.ts')
  let configContent = fs.readFileSync(configPath, 'utf-8')
  if (isGlobal) {
    configContent = configContent.replace(/globalManagerSessionId:\s*['"].*['"]/g, `globalManagerSessionId: '${sessionId}'`)
  }
  else {
    configContent = configContent.replace(/managerSessionId:\s*['"].*['"]/g, `managerSessionId: '${sessionId}'`)
  }
  fs.writeFileSync(configPath, configContent, 'utf-8')
  consola.success(chalk.green(`Updated ${isGlobal ? 'globalManagerSessionId' : 'managerSessionId'} in config.ts`))
  return sessionId
}
