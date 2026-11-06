const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_FILE = 'opensquad/_opensquad/_browser_profile/contabilidade-rf.json';
const ACTION = process.argv[2];

let browser, context, page;

async function initBrowser() {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  page = await context.newPage();
  
  if (fs.existsSync(SESSION_FILE)) {
    const state = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    await context.setCookie(...state.cookies);
    console.error('Session loaded');
  }
  
  return { browser, context, page };
}

async function saveSession() {
  const state = await context.cookies();
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ cookies: state }, null, 2));
  console.error('Session saved');
}

(async () => {
  try {
    await initBrowser();
    
    let result = { success: false };
    
    if (ACTION === 'navigate' || ACTION === 'goto') {
      const URL = process.argv[3];
      await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      const title = await page.title();
      result = { action: 'navigate', success: true, title, url: page.url() };
      await saveSession();
    }
    else if (ACTION === 'fill') {
      const SEL = process.argv[3];
      const VAL = process.argv[4];
      const filled = await page.fill(SEL, VAL).then(() => true).catch(() => false);
      await page.waitForTimeout(500);
      result = { action: 'fill', success: filled, selector: SEL, value: VAL };
    }
    else if (ACTION === 'click') {
      const SEL = process.argv[3];
      await page.click(SEL);
      await page.waitForTimeout(2000);
      result = { action: 'click', success: true, selector: SEL };
      await saveSession();
    }
    else if (ACTION === 'screenshot') {
      const FILE = process.argv[3];
      await page.screenshot({ path: FILE, fullPage: true });
      result = { action: 'screenshot', success: true, file: FILE };
    }
    else if (ACTION === 'text') {
      const SEL = process.argv[3];
      const text = await page.textContent(SEL).catch(() => '');
      result = { action: 'text', success: true, text: text?.trim() || '' };
    }
    else if (ACTION === 'exists') {
      const SEL = process.argv[3];
      const count = await page.locator(SEL).count();
      result = { action: 'exists', success: true, exists: count > 0, count };
    }
    else if (ACTION === 'title') {
      result = { action: 'title', success: true, title: await page.title() };
    }
    else if (ACTION === 'url') {
      result = { action: 'url', success: true, url: page.url() };
    }
    else if (ACTION === 'html') {
      result = { action: 'html', success: true, html: await page.content() };
    }
    else if (ACTION === 'wait') {
      const MS = parseInt(process.argv[3] || 1000);
      await page.waitForTimeout(MS);
      result = { action: 'wait', success: true, ms: MS };
    }
    else if (ACTION === 'close') {
      await saveSession();
      await browser.close();
      result = { action: 'close', success: true };
    }
    
    console.log(JSON.stringify(result));
  } catch (e) {
    console.log(JSON.stringify({ success: false, error: e.message }));
    if (browser) await browser.close().catch(() => {});
  }
})();