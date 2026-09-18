import settings from './settings'

export default {
  moduleName: 'MailLoginFormMobileWebclient',

  requiredModules: [],

  init (appdata) {
    settings.init(appdata)
  },

  getAnonymousPages () {
    const hashModuleName = settings.getSetting('hashModuleName') || 'mail'
    return [
      {
        pageName: 'mail-login',
        pagePath: `/${hashModuleName}`,
        pageComponent: () => import('./pages/Login'),
      },
    ]
  },
}
