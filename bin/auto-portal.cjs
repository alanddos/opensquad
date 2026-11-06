const { chromium } = require('playwright');
const fs = require('fs');

const CNPJ = '63815659000116';
const CPF = '02023220173';
const CODIGO = '908141580981';

const SESSION_FILE = 'opensquad/_opensquad/_browser_profile/receita-rf.json';
const OUTPUT_DIR = 'opensquad/squads/contabilidade-mensal/output';

(async () => {
  let browser, context, page;
  
  try {
    console.error('=== ABRINDO NAVEGADOR ===');
    
    browser = await chromium.launch({ 
      headless: false,
      args: ['--start-maximized']
    });
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    page = await context.newPage();
    
    if (fs.existsSync(SESSION_FILE)) {
      const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      await context.addCookies(sessionData.cookies || []);
      console.error('Sessao carregada');
    }
    
    console.error('=== ACESSANDO SIMPLES NACIONAL ===');
    await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    const html = await page.content();
    console.error('Pagina carregada. HTML tem authForm?', html.includes('authForm'));
    
    if (html.includes('authForm')) {
      console.error('=== FAZENDO LOGIN ===');
      await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCNPJ', CNPJ);
      await page.waitForTimeout(500);
      await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCPFResponsavel', CPF);
      await page.waitForTimeout(500);
      await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCodigoAcesso', CODIGO);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: OUTPUT_DIR + '/login-preenchido.png', fullPage: true });
      console.error('Clique em CONTINUAR e resolva o CAPTCHA');
      console.error('Quando logado, digite PRONTO');
    } else {
      console.error('JA ESTA LOGADO!');
      console.error('Clique em PGDAS-D e digite PRONTO');
    }
    
    process.stdin.once('data', async () => {
      console.error('=== CONTINUANDO AUTOMACAO ===');
      await page.waitForTimeout(2000);
      
      console.error('=== PROCURANDO PGDAS-D ===');
      const pgdasLink = await page.getByText('PGDAS-D').first();
      await Promise.all([
        page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
        pgdasLink.click()
      ]);
      
      await page.waitForTimeout(5000);
      await page.screenshot({ path: OUTPUT_DIR + '/pgdas-aberto.png', fullPage: true });
      
      console.error('=== PRONTO PARA DECLARAR ===');
      console.error('Agora voce esta no PGDAS-D.');
      console.error('1. Selecione CNPJ ' + CNPJ);
      console.error('2. Selecione periodo: MARCO/2026');
      console.error('3. Declare faturamento');
      console.error('4. Gere DAS');
      console.error('5. Baixe o PDF');
      console.error('6. Digite PRONTO quando terminar');
      
      const result = { action: 'IN_PGDAS', timestamp: new Date().toISOString() };
      fs.writeFileSync(OUTPUT_DIR + '/status.json', JSON.stringify(result, null, 2));
    });
    
  } catch (e) {
    console.error('Erro:', e.message);
  }
})();