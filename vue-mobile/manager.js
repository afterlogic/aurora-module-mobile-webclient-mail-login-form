import settings from './settings'

export default {
  moduleName: 'MailLoginFormMobileWebclient',

  requiredModules: [],

  init (appdata) {
    settings.init(appdata)
  },

  getAnonymousPages () {
    // Desktop uses the shared HashModuleName ('mail' by default) for this screen because
    // its anonymous and authenticated screens live in separate hash namespaces. The mobile
    // router has a single flat route table, and '/mail' is already claimed by
    // MailMobileWebclient's inbox (see its manager.js), so reusing that setting here would
    // collide. Use a distinct, fixed path instead.
    return [
      {
        pageName: 'mail-login',
        pagePath: '/mail-login',
        pageComponent: () => import('./pages/Login'),
      },
    ]
  },
}
