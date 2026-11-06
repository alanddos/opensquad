const { chromium } = require('playwright');
const fs = require('fs');

const CNPJ = '63815659000116';
const CPF = '02023220173';
const CODIGO = '908141580981';

const SESSION_FILE = 'opensquad/_opensquad/_browser_profile/receita-rf.json';
const OUTPUT_FILE = 'opensquad/squads/contabilidade-mensal/output/session.json';

(async () => {
  let browser, context, page;
  
  try {
    console.error('=== ABRINDO NAVEGADOR ===');
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
    
    console.error('=== NAVEGANDO PARA SIMPLES NACIONAL ===');
    await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.error('=== PREENCHENDO DADOS ===');
    await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCNPJ', CNPJ);
    await page.waitForTimeout(300);
    await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCPFResponsavel', CPF);
    await page.waitForTimeout(300);
    await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCodigoAcesso', CODIGO);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/login-form.png', fullPage: true });
    
    console.error('=== AGUARDANDO CAPTCHA ===');
    console.error('Por favor, resolva o CAPTCHA e clique em CONTINUAR');
    console.error('Quando estiver logado, digite "continuar"');
    
    await page.waitForTimeout(30000);
    
    const finalUrl = page.url();
    const finalTitle = await page.title();
    const finalHtml = await page.content();
    const stillOnLogin = finalHtml.includes('authForm') && finalHtml.includes('txtCNPJ');
    
    if (stillOnLogin) {
      console.log(JSON.stringify({ action: 'WAIT', message: 'Aguardando resolucao do CAPTCHA...' }));
      await page.waitForTimeout(60000);
    }
    
    const finalUrl2 = page.url();
    const title2 = await page.title();
    const isLogged = !finalUrl2.includes('Login') || finalUrl2.includes('Area');
    
    if (isLogged) {
      const cookies = await context.cookies();
      const localStorage = await page.evaluate(() => JSON.stringify(localStorage));
      fs.writeFileSync(SESSION_FILE, JSON.stringify({ cookies, localStorage }, null, 2));
      console.error('Sessao salva!');
    }
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/after-login.png', fullPage: true });
    
    const result = {
      action: 'LOGGED_IN',
      success: isLogged,
      url: finalUrl2,
      title: title2
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    
  } catch (e) {
    console.log(JSON.stringify({ action: 'ERROR', error: e.message }));
  }
})();