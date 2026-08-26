const path = require('path')
const { sharedHelper, moduleHelper, fixturePath } = require(path.join(
  process.env.AURORA_MOBILE_E2E_ROOT,
  'test/e2e/helpers/paths'
))
const { test, expect } = sharedHelper('fixtures')
const { step } = sharedHelper('login')

test.describe('Mobile mail login page', () => {
  test('shows username, domain area, and password', async ({ page }) => {
    await step('Open mobile URL', async () => {
      await page.goto('')
    })

    await step('Expect mail login form fields', async () => {
      await expect(page.getByTestId('login-username')).toBeVisible({
        timeout: 30000,
      })
      await expect(page.getByTestId('login-password')).toBeVisible()
      await expect(page.getByTestId('login-submit')).toBeVisible()
      // Domain row appears after GetMailDomains (may be empty on misconfigured stands).
      const domainRow = page.getByTestId('login-domain-row')
      if (await domainRow.isVisible().catch(() => false)) {
        const multi = page.getByTestId('login-domain')
        const single = page.getByTestId('login-domain-single')
        await expect(multi.or(single)).toBeVisible()
      }
    })
  })
})
