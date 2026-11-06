const { chromium } = require('playwright');
const fs = require('fs');

const SESSION_FILE = 'opensquad/_opensquad/_browser_profile/receita-rf.json';
const OUTPUT_FILE = process.argv[2] || 'opensquad/squads/contabilidade-mensal/output/status.json';

const CNPJ = '63815659000116';
const CPF = '02023220173';
const CODIGO = '908141580981';

const PORTAL_URL = 'https://www8.receita.fazenda.gov.br/SimplesNacional/';

(async () => {
  let browser, context, page;
  
  try {
    console.error('Launching browser...');
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
    
    if (fs.existsSync(SESSION_FILE)) {
      const state = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      await context.addCookies(state.cookies);
      console.error('Cookie loaded, navigating...');
      await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 30000 });
    } else {
      console.error('No session, fresh login...');
      await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 30000 });
    }
    
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const url = page.url();
    const hasLogin = url.includes('Login') || url.includes('Acesso');
    
    console.error(`Title: ${title}, Logged: ${!hasLogin}`);
    
    if (hasLogin) {
      console.error('Filling CNPJ...');
      await page.fill('#ContentPlaceHolder1_txtCNPJ', CNPJ);
      await page.waitForTimeout(500);
      
      console.error('Filling CPF...');
      await page.fill('#ContentPlaceHolder1_txtCPFResponsavel', CPF);
      await page.waitForTimeout(500);
      
      console.error('Filling Código...');
      await page.fill('#ContentPlaceHolder1_txtCodigoAcesso', CODIGO);
      await page.waitForTimeout(500);
      
      console.error('Clicking login...');
      await page.click('#ContentPlaceHolder1_btnEntrar');
      await page.waitForTimeout(3000);
    }
    
    const finalUrl = page.url();
    const finalTitle = await page.title();
    const isLogged = !finalUrl.includes('Login') && !finalUrl.includes('Acesso');
    
    if (isLogged) {
      const cookies = await context.cookies();
      fs.writeFileSync(SESSION_FILE, JSON.stringify({ cookies }, null, 2));
      console.error('Session saved!');
    }
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/rf-login.png', fullPage: true });
    console.error('Screenshot saved!');
    
    const result = {
      success: true,
      logged: isLogged,
      title: finalTitle,
      url: finalUrl,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    
  } catch (e) {
    const error = { success: false, error: e.message };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(error, null, 2));
    console.log(JSON.stringify(error));
  } finally {
    if (browser) await browser.close();
  }
})();