# aurora-module-mobile-webclient-mail-login-form

Displays a mobile login form where the user enters **username only**; the mail
domain is either shown as a fixed suffix (single domain) or chosen from a
dropdown (multiple domains). Backend API comes from `MailLoginFormWebclient`.

Vue UI lives under `vue-mobile/` (same pattern as `StandardLoginFormMobileWebclient`).

# Development
This repository has a pre-commit hook. To make it work you need to configure git to use the particular hooks folder.

`git config --local core.hooksPath .githooks/`

# License
This module is licensed under AGPLv3 license if free version of the product is used or Afterlogic Software License if commercial version of the product was purchased.
