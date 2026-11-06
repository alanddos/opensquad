const { chromium } = require('playwright');
const fs = require('fs');

const CNPJ = '63815659000116';

(async () => {
  let browser, context, page;
  
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
    
    await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    const cnpjInput = html.match(/id="([^"]*CNPJ[^"]*)"/i)?.[1];
    const codInput = html.match(/id="([^"]*Codigo[^"]*)"/i)?.[1];
    
    if (cnpjInput) await page.fill(`#${cnpjInput}`, CNPJ);
    await page.waitForTimeout(500);
    if (codInput) await page.fill(`#${codInput}`, '908141580981');
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      const btn = document.querySelector('input[type="submit"]');
      console.log('Button disabled:', btn?.disabled);
      console.log('Button class:', btn?.className);
    });
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/rf-check2.png', fullPage: true });
    
    const status = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const vals = Array.from(inputs).map(i => ({ id: i.id, name: i.name, value: i.value, type: i.type, disabled: i.disabled }));
      return JSON.stringify(vals);
    });
    
    console.error('Input status:', status);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    if (browser) await browser.close();
  }
})();