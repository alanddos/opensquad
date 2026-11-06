const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BROWSER_PROFILE = path.join(__dirname, '..', '..', '_browser_profile');

class AutonomousAgent {
  constructor(config = {}) {
    this.config = {
      headless: config.headless ?? false,
      viewport: config.viewport ?? { width: 1280, height: 720 },
      timeout: config.timeout ?? 30000,
      ...config
    };
    this.browser = null;
    this.page = null;
    this.context = null;
    this.history = [];
    this.state = 'idle';
  }

  async start() {
    console.log('🚀 Starting autonomous browser...');
    
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
    });
    
    this.page = await this.context.newPage();
    
    this.state = 'running';
    console.log('✅ Browser ready\n');
  }

  async goTo(url) {
    console.log(`🌐 Navigating to ${url}...`);
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: this.config.timeout });
    await this.waitForPageReady();
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForFunction(() => document.readyState === 'complete');
  }

  async see() {
    const analysis = await this.page.evaluate(() => {
      const getVisibleText = () => {
        const walker = document.createTreeWalker(
          document.body, 
          NodeFilter.SHOW_TEXT, 
          null, 
          false
        );
        let text = '';
        let node;
        while (node = walker.nextNode()) {
          const trimmed = node.textContent.trim();
          if (trimmed && trimmed.length < 200) text += trimmed + ' ';
        }
        return text.replace(/\s+/g, ' ').trim();
      };

      const getInteractiveElements = () => {
        const selectors = ['button', 'a', 'input', 'select', 'textarea', '[role="button"]', '[role="link"]'];
        const elements = [];
        
        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && el.offsetParent !== null) {
              const tag = el.tagName.toLowerCase();
              const id = el.id || '';
              const classes = el.className || '';
              const text = (el.textContent || el.value || '').trim().substring(0, 100);
              const name = el.getAttribute('name') || '';
              const type = el.getAttribute('type') || '';
              const href = el.href || '';
              const placeholder = el.placeholder || '';
              const visible = el.checkVisibility();
              
              if (visible && text) {
                elements.push({ tag, id, classes, text, name, type, href, placeholder });
              }
            }
          });
        });
        return elements;
      };

      const getForms = () => {
        const forms = [];
        document.querySelectorAll('form').forEach(form => {
          const action = form.action || '';
          const method = form.method || 'get';
          const inputs = [];
          form.querySelectorAll('input, select, textarea').forEach(input => {
            const name = input.getAttribute('name') || '';
            const type = input.getAttribute('type') || input.tagName.toLowerCase();
            const id = input.id || '';
            const placeholder = input.placeholder || '';
            const label = (input.labels?.[0]?.textContent || '').trim();
            if (name) inputs.push({ name, type, id, placeholder, label });
          });
          if (inputs.length) forms.push({ action, method, inputs });
        });
        return forms;
      };

      const getPageTitle = () => document.title;
      const getUrl = () => window.location.href;

      return {
        title: getPageTitle(),
        url: getUrl(),
        text: getVisibleText(),
        interactive: getInteractiveElements(),
        forms: getForms()
      };
    });

    this.history.push({ action: 'see', timestamp: new Date().toISOString() });
    return analysis;
  }

  async click(selector) {
    console.log(`👆 Clicking: ${selector}`);
    try {
      await this.page.click(selector, { timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await this.waitForPageReady();
      this.history.push({ action: 'click', selector, timestamp: new Date().toISOString() });
      return { success: true };
    } catch (e) {
      console.log(`❌ Click failed: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  async type(selector, text) {
    console.log(`⌨️  Typing in ${selector}: "${text.substring(0, 20)}..."`);
    try {
      await this.page.fill(selector, text);
      this.history.push({ action: 'type', selector, text: text.substring(0, 10) + '...', timestamp: new Date().toISOString() });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async select(selector, value) {
    console.log(`📋 Selecting ${selector} = ${value}`);
    try {
      await this.page.selectOption(selector, value);
      this.history.push({ action: 'select', selector, value, timestamp: new Date().toISOString() });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async wait(seconds) {
    console.log(`⏳ Waiting ${seconds}s...`);
    await this.page.waitForTimeout(seconds * 1000);
  }

  async screenshot(name = 'screenshot') {
    const filename = path.join(__dirname, '..', 'screenshots', `${name}-${Date.now()}.png`);
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot: ${filename}`);
    return filename;
  }

  async extractTable(selector) {
    return await this.page.evaluate((sel) => {
      const table = document.querySelector(sel);
      if (!table) return null;
      
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach(cell => {
          cells.push(cell.textContent.trim());
        });
        if (cells.length) rows.push(cells);
      });
      return rows;
    }, selector);
  }

  async find(text) {
    return await this.page.getByText(text, { exact: false }).first();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.state = 'closed';
      console.log('🔚 Browser closed');
    }
  }

  getHistory() {
    return this.history;
  }

  async isLoggedIn() {
    const cookies = await this.context.cookies();
    return cookies.some(c => c.name.includes('session') || c.name.includes('auth'));
  }
}

module.exports = { AutonomousAgent };