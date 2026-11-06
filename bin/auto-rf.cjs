const { chromium } = require('playwright');
const fs = require('fs');

const CNPJ = '63815659000116';
const CPF = '02023220173';
const CODIGO = '908141580981';
const PERIODO = '03/2026';
const FATURAMENTO = '0';

const SESSION_FILE = 'opensquad/_opensquad/_browser_profile/receita-rf.json';
const OUTPUT_DIR = 'opensquad/squads/contabilidade-mensal/output';

(async () => {
  let browser, context, page;
  
  try {
    console.error('=== INICIANDO AUTOMACAO RECEITA FEDERAL ===');
    
    browser = await chromium.launch({ 
      headless: false,
      args: ['--start-maximized']
    });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    
    let sessionData = null;
    if (fs.existsSync(SESSION_FILE)) {
      sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      await context.addCookies(sessionData.cookies || []);
      console.error('Sessao carregada');
    }
    
    page = await context.newPage();
    
    console.error('=== ACESSANDO SIMPLES NACIONAL ===');
    await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.error('Titulo:', title);
    
    console.error('=== PROCURANDO PGDAS-D ===');
    
    const pgdasLink = await page.$('text=PGDAS-D');
    if (pgdasLink) {
      console.error('Clique em PGDAS-D encontrado');
      await pgdasLink.click();
      await page.waitForTimeout(3000);
    }
    
    console.error('=== PREENCHENDO DADOS ACesso ===');
    await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCNPJ', CNPJ);
    await page.waitForTimeout(500);
    await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCPFResponsavel', CPF);
    await page.waitForTimeout(500);
    await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCodigoAcesso', CODIGO);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: OUTPUT_DIR + '/step1-login.png', fullPage: true });
    
    console.error('=== CLICANDO CONTINUAR ===');
    const continuarBtn = await page.$('input[value="Continuar"]');
    if (continuarBtn) {
      await continuarBtn.click();
      await page.waitForTimeout(5000);
    }
    
    await page.screenshot({ path: OUTPUT_DIR + '/step2-after-login.png', fullPage: true });
    
    const currentUrl = page.url();
    console.error('URL atual:', currentUrl);
    
    const result = {
      action: 'AUTOMATION_COMPLETE',
      success: true,
      url: currentUrl,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(OUTPUT_DIR + '/automation-result.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    
  } catch (e) {
    console.error('Erro:', e.message);
    const result = { action: 'ERROR', error: e.message };
    fs.writeFileSync(OUTPUT_DIR + '/automation-result.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  }
})();