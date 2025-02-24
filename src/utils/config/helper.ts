import { SearchMode } from 'components/searchModes'
import { storageHelper } from 'utils/storageHelper'
import { migrateConfig } from './migrations'

export type Config = {
  sideBarWidth: number
  shortcut: string | undefined
  accessToken: string | undefined
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
  intelligentToggle: boolean | null // `null` stands for intelligent, boolean for sidebar open state
  icons: 'rich' | 'dim' | 'native'
  toggleButtonVerticalDistance: number
  toggleButtonContent: 'logo' | 'octoface'
  recursiveToggleFolder: 'shift' | 'alt'
  searchMode: SearchMode
  sidebarToggleMode: 'persistent' | 'float'
  commentToggle: boolean
  codeFolding: boolean
  compactFileTree: boolean
  restoreExpandedFolders: boolean
}

enum configKeys {
  sideBarWidth = 'sideBarWidth',
  shortcut = 'shortcut',
  accessToken = 'accessToken',
  compressSingletonFolder = 'compressSingletonFolder',
  copyFileButton = 'copyFileButton',
  copySnippetButton = 'copySnippetButton',
  intelligentToggle = 'intelligentToggle',
  icons = 'icons',
  toggleButtonVerticalDistance = 'toggleButtonVerticalDistance',
  toggleButtonContent = 'toggleButtonContent',
  recursiveToggleFolder = 'recursiveToggleFolder',
  searchMode = 'searchMode',
  sidebarToggleMode = 'sidebarToggleMode',
  commentToggle = 'commentToggle',
  codeFolding = 'codeFolding',
  compactFileTree = 'compactFileTree',
  restoreExpandedFolders = 'restoreExpandedFolders',
}

// do NOT use platform name
const platformStorageKey = `platform_` + window.location.host.toLowerCase()

export const defaultConfigs: Config = {
  sideBarWidth: 260,
  shortcut: undefined,
  accessToken: '',
  compressSingletonFolder: true,
  copyFileButton: platformStorageKey !== 'platform_github.com', // false when on github.com,
  copySnippetButton: platformStorageKey !== 'platform_github.com', // false when on github.com
  intelligentToggle: null,
  icons: 'rich',
  toggleButtonVerticalDistance: 124, // align with GitHub's navbar items
  toggleButtonContent: 'logo',
  recursiveToggleFolder: 'shift',
  searchMode: 'fuzzy',
  sidebarToggleMode: 'float',
  commentToggle: true,
  codeFolding: true,
  compactFileTree: false,
  restoreExpandedFolders: true,
}

const configKeyArray = Object.values(configKeys)

function applyDefaultConfigs(configs: Partial<Config>) {
  return configKeyArray.reduce((applied, key) => {
    Object.assign(applied, { [key]: key in configs ? configs[key] : defaultConfigs[key] })
    return applied
  }, {} as Config)
}

export type VersionedConfig<SiteConfig> = Record<string, SiteConfig> & { configVersion: string }

const prepareConfig = new Promise<void>(async resolve => {
  await migrateConfig()
  resolve()
})

async function get(): Promise<Config> {
  await prepareConfig
  const config = await storageHelper.get<Record<string, Config>>([platformStorageKey])
  return applyDefaultConfigs(config?.[platformStorageKey] || {})
}

async function set(config: Config) {
  return await storageHelper.set({ [platformStorageKey]: config })
}

export const configHelper = { get, set }
