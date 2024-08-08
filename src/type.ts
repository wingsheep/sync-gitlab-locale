export interface Locale {
  lang: string
  path: string
}

export interface Project {
  id: number
  name: Item
  url: string
  isGlobal: boolean
  branch?: string // 分支是可选的
  locale?: Locale[] // locale 是可选的
}

export enum Item {
  ISF = 'isf',
  AMS = 'ams',
  AFR = 'afr',
  ACI = 'aci',
}

export enum Env {
  DEV = 'dev',
  PROD = 'prod',
}

export interface Config {
  /** 环境 */
  env: Env
  /** 国内版开发环境beta token */
  managerSessionId: string
  /** 国外站开发环境beta token */
  globalManagerSessionId: string
  /** 国内版生产环境prod token */
  prodManagerSessionId: string
  /** 国外版生产环境prod token */
  prodGlobalManagerSessionId: string
  /** 国内站需要同步的项目，默认全量 */
  include: Item[]
  /** 国外站需要同步的项目，默认全量 */
  includeGlobal: Item[]
  /** 需要同步的全局分支 */
  branch: string
  /** 需要同步的全局语言包 */
  locale: Locale[]
  /** 需要同步的项目 */
  project: Project[]
}
