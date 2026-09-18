import _ from 'lodash'

import typesUtils from 'src/utils/types'

class LoginSettings {
  constructor (appData) {
    // AppData for domain login lives under MailLoginFormWebclient (backend module).
    const data = typesUtils.pObject(appData.MailLoginFormWebclient)
    this.hashModuleName = 'mail'
    if (!_.isEmpty(data)) {
      this.hashModuleName = typesUtils.pString(data.HashModuleName, this.hashModuleName)
    }
  }
}

let settings = null

export default {
  init (appData) {
    settings = new LoginSettings(appData)
  },

  getSetting (settingName) {
    return settings ? settings[settingName] : null
  },
}
