#!/usr/bin/env bun
/**
 * Comprehensive Selenium E2E Test Suite
 * Tests critical user flows for Saturn
 */

import { Builder, By, until, WebDriver, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const SELENIUM_URL = process.env.SELENIUM_URL || 'http://localhost:4444';
const TIMEOUT = 10000;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--headless');

  const driver = await new Builder()
    .forBrowser('chrome')
    .usingServer(SELENIUM_URL)
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: TIMEOUT });
  return driver;
}

async function runTest(name: string, testFn: (driver: WebDriver) => Promise<void>): Promise<void> {
  console.log(`\n🧪 Testing: ${name}`);
  const start = Date.now();
  let driver: WebDriver | null = null;

  try {
    driver = await createDriver();
    await testFn(driver);
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    console.log(`✅ PASSED: ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, error: error.message, duration });
    console.error(`❌ FAILED: ${name} - ${error.message}`);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Test 1: Homepage loads and displays correctly
async function testHomepage(driver: WebDriver) {
  await driver.get(BASE_URL);
  await driver.wait(until.titleContains('Saturn'), TIMEOUT);

  const title = await driver.getTitle();
  if (!title.includes('Saturn')) {
    throw new Error(`Expected title to contain 'Saturn', got: ${title}`);
  }

  // Check for hero heading
  const heading = await driver.findElement(By.css('h1'));
  const headingText = await heading.getText();
  if (!headingText.includes('Cron') || !headingText.includes('Monitor')) {
    throw new Error(`Hero heading not found or incorrect: ${headingText}`);
  }

  // Check for CTA buttons
  const buttons = await driver.findElements(By.css('a[href*="signin"]'));
  if (buttons.length === 0) {
    throw new Error('Sign in buttons not found');
  }

  // Check for features section
  const featuresHeading = await driver.findElement(By.xpath("//*[contains(text(), 'Beyond Simple Heartbeats')]"));
  if (!(await featuresHeading.isDisplayed())) {
    throw new Error('Features section not visible');
  }

  // Check for pricing section
  const pricingHeading = await driver.findElement(By.xpath("//*[contains(text(), 'Simple, Transparent Pricing')]"));
  if (!(await pricingHeading.isDisplayed())) {
    throw new Error('Pricing section not visible');
  }
}

// Test 2: Navigation to signin page
async function testSigninNavigation(driver: WebDriver) {
  await driver.get(BASE_URL);
  await driver.wait(until.titleContains('Saturn'), TIMEOUT);

  // Click signin button
  const signinButton = await driver.findElement(By.css('a[href="/auth/signin"]'));
  await signinButton.click();

  // Wait for signin page to load
  await driver.wait(until.urlContains('/auth/signin'), TIMEOUT);

  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/auth/signin')) {
    throw new Error(`Expected URL to contain '/auth/signin', got: ${currentUrl}`);
  }

  // Check for signin form elements
  const emailInput = await driver.findElement(By.css('input[type="email"]'));
  if (!(await emailInput.isDisplayed())) {
    throw new Error('Email input not visible on signin page');
  }
}

// Test 3: Signin page UI elements
async function testSigninPage(driver: WebDriver) {
  await driver.get(`${BASE_URL}/auth/signin`);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);

  // Check for email input
  const emailInput = await driver.findElement(By.css('input[type="email"]'));
  if (!(await emailInput.isDisplayed())) {
    throw new Error('Email input not visible');
  }

  // Check for password input
  const passwordInput = await driver.findElement(By.css('input[type="password"]'));
  if (!(await passwordInput.isDisplayed())) {
    throw new Error('Password input not visible');
  }

  // Check for sign in button
  const submitButtons = await driver.findElements(By.css('button[type="submit"]'));
  if (submitButtons.length === 0) {
    throw new Error('Submit button not found');
  }

  // Check for Google OAuth button
  const googleButton = await driver.findElement(By.xpath("//*[contains(text(), 'Google')]"));
  if (!(await googleButton.isDisplayed())) {
    throw new Error('Google sign in button not visible');
  }

  // Check for "Don't have an account?" link
  const signupLinks = await driver.findElements(By.css('a[href*="signup"]'));
  if (signupLinks.length === 0) {
    throw new Error('Signup link not found');
  }
}

// Test 4: Signup page navigation
async function testSignupNavigation(driver: WebDriver) {
  await driver.get(`${BASE_URL}/auth/signin`);
  await driver.wait(until.elementLocated(By.css('a[href*="signup"]')), TIMEOUT);

  // Click signup link
  const signupLink = await driver.findElement(By.css('a[href*="signup"]'));
  await signupLink.click();

  // Wait for signup page to load
  await driver.wait(until.urlContains('/auth/signup'), TIMEOUT);

  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/auth/signup')) {
    throw new Error(`Expected URL to contain '/auth/signup', got: ${currentUrl}`);
  }

  // Check for name input (unique to signup)
  const nameInput = await driver.findElement(By.css('input[name="name"]'));
  if (!(await nameInput.isDisplayed())) {
    throw new Error('Name input not visible on signup page');
  }
}

// Test 5: Form validation on signin page
async function testSigninFormValidation(driver: WebDriver) {
  await driver.get(`${BASE_URL}/auth/signin`);
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);

  // Try to submit empty form
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();

  // Wait a bit for validation to potentially trigger
  await driver.sleep(1000);

  // Check that we're still on signin page (didn't submit)
  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/auth/signin')) {
    throw new Error('Form submitted with empty fields');
  }

  // Fill in invalid email
  const emailInput = await driver.findElement(By.css('input[type="email"]'));
  await emailInput.sendKeys('not-an-email');

  // Fill in password
  const passwordInput = await driver.findElement(By.css('input[type="password"]'));
  await passwordInput.sendKeys('password123');

  // Try to submit
  await submitButton.click();
  await driver.sleep(1000);

  // Should still be on signin page or show error
  const urlAfter = await driver.getCurrentUrl();
  // If it redirected to error page, that's also acceptable
  const isOnSigninOrError = urlAfter.includes('/auth/signin') || urlAfter.includes('/auth/error');
  if (!isOnSigninOrError) {
    throw new Error('Form submitted with invalid email');
  }
}

// Test 6: Responsive design check
async function testResponsiveDesign(driver: WebDriver) {
  await driver.get(BASE_URL);
  await driver.wait(until.titleContains('Saturn'), TIMEOUT);

  // Test mobile viewport
  await driver.manage().window().setRect({ width: 375, height: 667 });
  await driver.sleep(500);

  // Check that content is still visible
  const heading = await driver.findElement(By.css('h1'));
  if (!(await heading.isDisplayed())) {
    throw new Error('Heading not visible in mobile viewport');
  }

  // Test tablet viewport
  await driver.manage().window().setRect({ width: 768, height: 1024 });
  await driver.sleep(500);

  if (!(await heading.isDisplayed())) {
    throw new Error('Heading not visible in tablet viewport');
  }

  // Test desktop viewport
  await driver.manage().window().setRect({ width: 1920, height: 1080 });
  await driver.sleep(500);

  if (!(await heading.isDisplayed())) {
    throw new Error('Heading not visible in desktop viewport');
  }
}

// Test 7: Footer links
async function testFooter(driver: WebDriver) {
  await driver.get(BASE_URL);
  await driver.wait(until.titleContains('Saturn'), TIMEOUT);

  // Scroll to footer
  await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
  await driver.sleep(500);

  // Check for footer
  const footer = await driver.findElement(By.css('footer'));
  if (!(await footer.isDisplayed())) {
    throw new Error('Footer not visible');
  }

  // Check for footer text
  const footerText = await footer.getText();
  if (!footerText.includes('Saturn') && !footerText.includes('2025')) {
    throw new Error('Footer text not found');
  }
}

// Test 8: API Ping endpoint (non-UI test via fetch)
async function testPingEndpoint(driver: WebDriver) {
  await driver.get(BASE_URL);

  // Use driver to execute fetch in browser context
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    fetch('${BASE_URL}/api/ping/pg_automation_test')
      .then(res => res.json())
      .then(data => callback({ ok: true, data }))
      .catch(err => callback({ ok: false, error: err.message }));
  `);

  const typedResult = result as { ok: boolean; data?: any; error?: string };
  if (!typedResult.ok) {
    throw new Error(`Ping endpoint failed: ${typedResult.error}`);
  }

  if (!typedResult.data || !typedResult.data.ok) {
    throw new Error('Ping endpoint did not return ok: true');
  }
}

// Test 9: Keyboard navigation
async function testKeyboardNavigation(driver: WebDriver) {
  await driver.get(BASE_URL);
  await driver.wait(until.titleContains('Saturn'), TIMEOUT);

  // Tab through interactive elements
  const body = await driver.findElement(By.css('body'));
  await body.sendKeys(Key.TAB);
  await driver.sleep(200);
  await body.sendKeys(Key.TAB);
  await driver.sleep(200);

  // Press Enter on focused element (should navigate somewhere or do something)
  // This is a basic accessibility check
  const activeElement = await driver.switchTo().activeElement();
  const tagName = await activeElement.getTagName();

  // Should be on a focusable element (button, a, input, etc)
  const focusableTags = ['a', 'button', 'input'];
  if (!focusableTags.includes(tagName.toLowerCase())) {
    throw new Error(`Expected focusable element, got: ${tagName}`);
  }
}

// Test 10: Features scroll navigation
async function testFeaturesScrolling(driver: WebDriver) {
  await driver.get(BASE_URL);
  await driver.wait(until.titleContains('Saturn'), TIMEOUT);

  // Find and click "View Features" button
  const viewFeaturesButton = await driver.findElement(By.xpath("//a[contains(text(), 'View Features')]"));
  await viewFeaturesButton.click();

  // Wait a bit for scroll animation
  await driver.sleep(1000);

  // Check if features section is in viewport
  const featuresSection = await driver.findElement(By.id('features'));
  const isDisplayed = await featuresSection.isDisplayed();

  if (!isDisplayed) {
    throw new Error('Features section not visible after clicking View Features');
  }

  // Check scroll position (features section should be near top of viewport)
  const scrollY = await driver.executeScript('return window.scrollY;') as number;
  if (scrollY < 100) {
    throw new Error('Page did not scroll to features section');
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Starting Comprehensive Selenium E2E Test Suite');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔗 Selenium Grid: ${SELENIUM_URL}\n`);

  // Run all tests
  await runTest('Homepage loads and displays correctly', testHomepage);
  await runTest('Navigation to signin page', testSigninNavigation);
  await runTest('Signin page UI elements', testSigninPage);
  await runTest('Signup page navigation', testSignupNavigation);
  await runTest('Signin form validation', testSigninFormValidation);
  await runTest('Responsive design', testResponsiveDesign);
  await runTest('Footer content', testFooter);
  await runTest('API Ping endpoint', testPingEndpoint);
  await runTest('Keyboard navigation', testKeyboardNavigation);
  await runTest('Features scrolling', testFeaturesScrolling);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

