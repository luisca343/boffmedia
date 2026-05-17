import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class AuthPage extends BasePage {
  readonly heading: Locator
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly emailInput: Locator
  readonly confirmPasswordInput: Locator
  readonly signInButton: Locator
  readonly registerButton: Locator
  readonly processingButton: Locator

  // Validation error messages
  readonly usernameRequiredError: Locator
  readonly passwordLengthError: Locator
  readonly passwordMismatchError: Locator

  constructor(page: Page) {
    super(page)
    // Scoped to level 2 — the only h2 on /auth is the mode heading
    this.heading = page.getByRole("heading", { level: 2 })
    this.usernameInput = page.getByPlaceholder("Enter your username")
    this.passwordInput = page.getByPlaceholder("Enter your password")
    this.emailInput = page.getByPlaceholder("Enter your email")
    this.confirmPasswordInput = page.getByPlaceholder("Confirm your password")
    this.signInButton = page.getByRole("button", { name: "Sign In", exact: true })
    this.registerButton = page.getByRole("button", { name: "Register", exact: true })
    this.processingButton = page.getByRole("button", { name: "Processing..." })
    this.usernameRequiredError = page.getByText("Username is required")
    this.passwordLengthError = page.getByText(/at least 8 characters/i)
    this.passwordMismatchError = page.getByText(/Passwords don't match/i)
  }

  async goto() {
    await this.page.goto("/auth")
  }

  async gotoRegister() {
    await this.page.goto("/auth?mode=register")
  }

  async submitLogin(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.signInButton.click()
  }

  async submitRegister(username: string, email: string, password: string, confirmPassword: string) {
    await this.usernameInput.fill(username)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
    await this.registerButton.click()
  }
}
