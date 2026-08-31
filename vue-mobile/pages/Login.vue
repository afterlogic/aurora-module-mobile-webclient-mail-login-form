<template>
  <LoginLayout :subheading="processLoginResultComponent ? '' : $t('MAILLOGINFORMMOBILEWEBCLIENT.LABEL_LOGIN_TO_CONTINUE')">
    <template v-if="processLoginResultComponent">
      <component
        :is="processLoginResultComponent"
        :login="fullLogin"
        :password="password"
        :loginResult="loginResult"
        @backToLogin="onBackToLogin"
      />
    </template>
    <template v-else>
      <div class="full-width q-my-auto">
        <div class="full-width">
          <q-form>
            <q-input
              class="login_input"
              data-test-id="login-username"
              type="text"
              spellcheck="false"
              autocomplete="username"
              v-model="username"
              @keydown.enter="onProceedToPassword"
              :placeholder="$t('COREWEBCLIENT.LABEL_LOGIN')"
            >
              <template v-slot:prepend>
                <q-icon name="person_outline" color="grey-5" />
              </template>
            </q-input>

            <div
              v-if="domains.length > 0"
              class="login_domain row items-center no-wrap q-mt-sm"
              data-test-id="login-domain-row"
            >
              <span class="login_domain__at text-grey-5 q-px-sm" aria-hidden="true">@</span>
              <q-select
                v-if="domains.length > 1"
                class="login_input col"
                data-test-id="login-domain"
                emit-value
                map-options
                :options="domainOptions"
                v-model="selectedDomain"
              />
              <div
                v-else
                class="login_domain__single col text-grey-7"
                data-test-id="login-domain-single"
              >
                {{ domains[0] }}
              </div>
            </div>

            <q-input
              class="login_input"
              data-test-id="login-password"
              ref="passwordInput"
              :type="isPasswordVisible ? 'text' : 'password'"
              v-model="password"
              @keydown.enter="onProceedToLogin"
              :placeholder="$t('COREWEBCLIENT.LABEL_PASSWORD')"
            >
              <template v-slot:prepend>
                <q-icon name="lock_outline" color="grey-5" />
              </template>
              <template v-slot:append>
                <q-icon
                  data-test-id="login-password-toggle"
                  :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
                  color="grey-5"
                  class="cursor-pointer"
                  @click="isPasswordVisible = !isPasswordVisible"
                />
              </template>
            </q-input>
            <component
              v-for="(component, index) in beforeButtonsComponents"
              :key="index"
              :is="component"
            />
          </q-form>
        </div>
      </div>
      <div class="q-pb-xl text-center">
        <AppButton
          data-test-id="login-submit"
          class="text-uppercase"
          :label="$t('COREWEBCLIENT.LABEL_LOGIN')"
          :loading="loading"
          @click="proceedLogin"
          :disabled="!canSubmit"
        />
      </div>
    </template>
  </LoginLayout>
</template>

<script>
import { ref, shallowRef, triggerRef, computed, onMounted } from 'vue'
import { i18n } from 'src/boot/i18n'
import _ from 'lodash'

import webApi from 'src/api/web-api'
import eventBus from 'src/event-bus'
import notification from 'src/utils/notification'

import { useCoreStore } from 'src/stores/index-pinia'
const coreStore = useCoreStore()

import AppButton from 'src/components/common/AppButton'
import LoginLayout from 'src/layouts/LoginLayout'

const MODULE_NAME = 'MailLoginFormMobileWebclient'
const API_MODULE_NAME = 'MailLoginFormWebclient'

export default {
  name: 'Login',

  components: {
    LoginLayout,
    AppButton,
  },

  setup() {
    const username = ref('')
    const password = ref('')
    const domains = ref([])
    const selectedDomain = ref('')
    const loginResult = ref(null)
    const loading = ref(false)
    const passwordInput = ref(null)
    const isPasswordVisible = ref(false)
    const processLoginResultComponent = shallowRef(null)
    const beforeButtonsComponents = shallowRef([])

    const domainOptions = computed(() => {
      return domains.value.map((domain) => ({ label: domain, value: domain }))
    })

    const resolvedDomain = computed(() => {
      if (domains.value.length > 1) {
        return selectedDomain.value || ''
      }
      return domains.value.length === 1 ? domains.value[0] : ''
    })

    const fullLogin = computed(() => {
      const local = _.trim(username.value)
      const domain = resolvedDomain.value
      if (!local) {
        return ''
      }
      return domain ? `${local}@${domain}` : local
    })

    const canSubmit = computed(() => {
      return !!_.trim(username.value) && !!password.value
    })

    const loadDomains = async () => {
      try {
        const result = await webApi.sendRequest({
          moduleName: API_MODULE_NAME,
          methodName: 'GetMailDomains',
          parameters: {},
          silentError: true,
        })
        if (_.isArray(result)) {
          domains.value = result
          if (result.length > 0) {
            selectedDomain.value = result[0]
          }
        }
      } catch (e) {
        domains.value = []
      }
    }

    const loadBeforeButtonsComponents = async () => {
      const params = {}
      eventBus.$emit(`${MODULE_NAME}::GetBeforeButtonsComponents`, params)
      if (!_.isArray(params.beforeButtonsComponents) || params.beforeButtonsComponents.length === 0) {
        beforeButtonsComponents.value = []
        return
      }

      const components = await Promise.all(params.beforeButtonsComponents.map((loader) => loader()))
      beforeButtonsComponents.value = components.map((component) => component.default).filter(Boolean)
      triggerRef(beforeButtonsComponents)
    }

    onMounted(() => {
      loadDomains()
      loadBeforeButtonsComponents()
    })

    const proceedLogin = async () => {
      const sLogin = _.trim(username.value)
      const sPassword = password.value
      if (!sLogin || !sPassword) {
        return
      }

      loading.value = true
      const parameters = {
        Domain: resolvedDomain.value,
        Login: sLogin,
        Password: sPassword,
        Language: '',
        SignMe: false,
      }
      const populateParams = {
        Module: MODULE_NAME,
        Parameters: parameters,
      }
      eventBus.$emit('AnonymousUserForm::PopulateFormSubmitParameters', populateParams)
      if (populateParams.Reject) {
        notification.showError(i18n.global.tc('COREWEBCLIENT.ERROR_CAPTCHA_IS_INCORRECT'))
        loading.value = false
        return
      }

      const result = await webApi.sendRequest({
        moduleName: API_MODULE_NAME,
        methodName: 'Login',
        parameters: populateParams.Parameters,
      }).then(r => r).catch(() => false)

      if (result?.AuthToken) {
        eventBus.$emit('AnonymousUserForm::LoginSucceed', { ModuleName: MODULE_NAME })
        await coreStore.setAuthToken(result.AuthToken)
      } else if (result) {
        const params = {}
        eventBus.$emit(`${MODULE_NAME}::GetProcessLoginResultComponent`, params)
        if (_.isFunction(params.getProcessLoginResultComponent)) {
          params.getProcessLoginResultComponent().then(component => {
            if (component?.default) {
              loginResult.value = result
              processLoginResultComponent.value = component.default
              triggerRef(processLoginResultComponent)
            } else {
              eventBus.$emit('AnonymousUserForm::LoginFailed', { ModuleName: MODULE_NAME })
              notification.showError(i18n.global.tc('COREWEBCLIENT.ERROR_PASS_INCORRECT'))
            }
          }, () => {
            eventBus.$emit('AnonymousUserForm::LoginFailed', { ModuleName: MODULE_NAME })
            notification.showError(i18n.global.tc('COREWEBCLIENT.ERROR_PASS_INCORRECT'))
          })
        } else {
          eventBus.$emit('AnonymousUserForm::LoginFailed', { ModuleName: MODULE_NAME })
          notification.showError(i18n.global.tc('COREWEBCLIENT.ERROR_PASS_INCORRECT'))
        }
      } else {
        eventBus.$emit('AnonymousUserForm::LoginFailed', { ModuleName: MODULE_NAME })
      }
      loading.value = false
    }

    const onProceedToPassword = () => {
      if (!_.trim(username.value)) return
      passwordInput.value.focus()
    }

    const onProceedToLogin = () => {
      if (!canSubmit.value) return
      proceedLogin()
    }

    const onBackToLogin = () => {
      processLoginResultComponent.value = null
      triggerRef(processLoginResultComponent)
    }

    return {
      username,
      password,
      domains,
      selectedDomain,
      domainOptions,
      fullLogin,
      canSubmit,
      loading,
      passwordInput,
      isPasswordVisible,
      loginResult,
      processLoginResultComponent,
      beforeButtonsComponents,
      proceedLogin,
      onProceedToPassword,
      onProceedToLogin,
      onBackToLogin,
    }
  },
}
</script>

<style lang="scss">
$login-autofill-bg: #e8f0fe;
$login-autofill-icon: #5f6368;

.login_input .q-field__control:after {
  transform: unset;
  opacity: 0;
  transition: opacity 0.3s;
}

.login_input.q-field--highlighted .q-field__control:after {
  opacity: 1;
  transform: unset;
}

// Chrome paints autofill only on the native input; cover the whole Quasar field.
.login_input:has(.q-field__native:-webkit-autofill) {
  .q-field__control {
    background-color: $login-autofill-bg;
    border-radius: 4px 4px 0 0;
  }

  .q-field__control:before,
  .q-field__control:after {
    z-index: 1;
  }

  .q-field__prepend .q-icon,
  .q-field__append .q-icon {
    color: $login-autofill-icon !important;
  }
}

.login_input .q-field__native:-webkit-autofill,
.login_input .q-field__native:-webkit-autofill:hover,
.login_input .q-field__native:-webkit-autofill:focus,
.login_input .q-field__native:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px $login-autofill-bg inset !important;
  -webkit-text-fill-color: inherit;
  caret-color: auto;
  transition: background-color 99999s ease-out;
}

.login_domain {
  min-height: 40px;
}

.login_domain__at {
  font-size: 1.25rem;
  line-height: 1;
}

.login_domain__single {
  font-size: 1rem;
  padding: 8px 0;
}
</style>
