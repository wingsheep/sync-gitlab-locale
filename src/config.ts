import type { Config } from './type'
import { Env, Item } from './type'

const config: Config = {
  env: Env.DEV,
  managerSessionId: '',
  globalManagerSessionId: '',
  prodManagerSessionId: '',
  prodGlobalManagerSessionId: '',
  branch: 'feature/1.3.5',
  include: [Item.ISF],
  includeGlobal: [Item.ISF],
  locale: [
    {
      lang: 'en',
      path: 'src/plugins/vue-i18n/lang/en.json',
    },
    {
      lang: 'vi',
      path: 'src/plugins/vue-i18n/lang/vi.json',
    },
  ],
  project: [
    {
      id: 1019,
      name: Item.ISF,
      url: 'http://git.hgj.net/track/hgj-web/isf',
      isGlobal: false,
    },
    {
      id: 1812,
      name: Item.ISF,
      url: 'http://git.hgj.net/track/hgj-web/isf-web-global',
      isGlobal: true,
    },
    {
      id: 1017,
      name: Item.AMS,
      url: 'http://git.hgj.net/track/hgj-web/ams',
      isGlobal: false,
    },
    {
      id: 1814,
      name: Item.AMS,
      url: 'http://git.hgj.net/track/hgj-web/ams-web-global',
      isGlobal: true,
    },
    {
      id: 1020,
      name: Item.ACI,
      url: 'http://git.hgj.net/track/hgj-web/emaci',
      isGlobal: false,
    },
    {
      id: 1811,
      name: Item.ACI,
      url: 'http://git.hgj.net/track/hgj-web/emaci-web-global',
      isGlobal: true,
    },
    {
      id: 1018,
      name: Item.AFR,
      url: 'http://git.hgj.net/track/hgj-web/afr',
      isGlobal: false,
    },
    {
      id: 1813,
      name: Item.AFR,
      url: 'http://git.hgj.net/track/hgj-web/afr-web-global',
      isGlobal: true,
    },
  ],
}

export default config
