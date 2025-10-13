import { Builder, By, until } from 'selenium-webdriver';

async function main() {
  const base = process.env.BASE_URL || 'http://host.docker.internal:3001';
  const driver = await new Builder()
    .usingServer(process.env.SELENIUM_URL || 'http://localhost:4444/wd/hub')
    .forBrowser('chrome')
    .build();
  try {
    console.log(`🔍 Selenium: navigating to ${base}`);
    await driver.get(base);
    await driver.wait(until.titleContains('Tokiflow'), 10000);
    const cta = await driver.findElement(By.css('a[href="/auth/signin"]'));
    console.log('✅ Selenium smoke: homepage loaded, signin link present');
    
    // Navigate to signin page
    await cta.click();
    await driver.wait(until.urlContains('/auth/signin'), 5000);
    const emailInput = await driver.findElement(By.css('input[name="email"]'));
    console.log('✅ Selenium smoke: signin page loaded, email input present');
  } finally {
    await driver.quit();
  }
}

main().catch((err) => {
  console.error('❌ Selenium smoke failed', err);
  process.exit(1);
});


