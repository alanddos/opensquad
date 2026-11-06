const { chromium } = require('playwright');
const fs = require('fs');

const CNPJ = '63815659000116';
const CPF = '02023220173';
const CODIGO = '908141580981';

(async () => {
  let browser, context, page;
  
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
    
    await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/rf-login-pg1.png', fullPage: true });
    
    const html = await page.content();
    console.error('Has CNPJ:', html.includes('CNPJ'));
    console.error('Has Codigo:', html.includes('Codigo'));
    
    const cnpjInput = html.match(/<input[^>]*id="([^"]*CNPJ[^"]*)"/i);
    const cpfInput = html.match(/<input[^>]*id="([^"]*CPF[^"]*)"/i);
    const codInput = html.match(/<input[^>]*id="([^"]*Codigo[^"]*)"/i);
    const btnInput = html.match(/<input[^>]*type="submit"[^>]*id="([^"]*)"/i);
    
    console.error('CNPJ field:', cnpjInput?.[1]);
    console.error('CPF field:', cpfInput?.[1]);
    console.error('Codigo field:', codInput?.[1]);
    console.error('Submit btn:', btnInput?.[1]);
    
    if (cnpjInput) await page.fill(`#${cnpjInput[1]}`, CNPJ);
    await page.waitForTimeout(300);
    if (cpfInput) await page.fill(`#${cpfInput[1]}`, CPF);
    await page.waitForTimeout(300);
    if (codInput) await page.fill(`#${codInput[1]}`, CODIGO);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/rf-login-pg2.png', fullPage: true });
    
    if (btnInput) {
      await page.click(`#${btnInput[1]}`);
    } else {
      await page.click('input[type="submit"]');
    }
    await page.waitForTimeout(5000);
    
    const finalUrl = page.url();
    const finalTitle = await page.title();
    const finalHtml = await page.content();
    const loggedIn = finalHtml.includes('Sair') || finalHtml.includes('sair') || !finalHtml.includes('CNPJ');
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/rf-login-pg3.png', fullPage: true });
    
    const cookies = await context.cookies();
    const storage = await page.evaluate(() => ({
      ls: JSON.stringify(localStorage),
      ss: JSON.stringify(sessionStorage)
    }));
    
    fs.writeFileSync('opensquad/_opensquad/_browser_profile/receita-rf.json', 
      JSON.stringify({ cookies, storage }, null, 2));
    
    console.error('Final URL:', finalUrl);
    console.error('Logged in:', loggedIn);
    
    const result = { success: true, loggedIn, url: finalUrl, title: finalTitle };
    console.log(JSON.stringify(result));
    
  } catch (e) {
    console.log(JSON.stringify({ success: false, error: e.message }));
  } finally {
    if (browser) await browser.close();
  }
})();