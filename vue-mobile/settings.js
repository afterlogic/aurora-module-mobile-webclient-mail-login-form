class LoginSettings {
  constructor (appData) {
    // AppData for domain login lives under MailLoginFormWebclient (backend module).
    // Keep this stub aligned with StandardLoginFormMobileWebclient.
  }
}

let settings = null

export default {
  init (appData) {
    settings = new LoginSettings(appData)
  },
}
