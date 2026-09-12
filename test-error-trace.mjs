import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', msg.text());
      const location = msg.location();
      console.log('Location:', location.url, 'Line:', location.lineNumber);
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    console.log('STACK:', error.stack);
  });
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:3000/login');
  
  console.log("Logging in...");
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'user100@example.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  console.log("Waiting for dashboard...");
  await page.waitForNavigation();
  
  console.log("Looking for incident links...");
  await page.waitForSelector('a[href^="/incident/"]');
  const links = await page.$$('a[href^="/incident/"]');
  if (links.length > 0) {
    console.log("Clicking first incident link...");
    await links[0].click();
    await new Promise(r => setTimeout(r, 5000));
  } else {
    console.log("No incidents found.");
  }
  
  await browser.close();
})();
