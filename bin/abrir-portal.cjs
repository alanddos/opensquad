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
    
    let sessionData = null;
    if (fs.existsSync(SESSION_FILE)) {
      sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      await context.addCookies(sessionData.cookies || []);
      console.error('Sessao carregada');
    }
    
    console.error('=== ACESSANDO SIMPLES NACIONAL ===');
    await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: OUTPUT_DIR + '/01-portal.png', fullPage: true });
    console.error('Screenshot salvo: 01-portal.png');
    
    console.error('');
    console.error('=== INSTRUCOES ===');
    console.error('1. Se ainda nao estiver logado, faca login com:');
    console.error('   CNPJ: ' + CNPJ);
    console.error('   CPF: ' + CPF);
    console.error('   Codigo: ' + CODIGO);
    console.error('2. Clique em PGDAS-D (secao Calculo e Declaracao)');
    console.error('3. Selecione o CNPJ e periodo MARCO/2026');
    console.error('4. Declare o faturamento e gere o DAS');
    console.error('5. Quando terminar, volte aqui e digite PRONTO');
    console.error('');
    
    const result = {
      action: 'BROWSER_READY',
      message: 'Navegador aberto.complete o processo manualmente.',
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(OUTPUT_DIR + '/browser-status.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    
    await page.waitForTimeout(600000);
    
  } catch (e) {
    console.error('Erro:', e.message);
  }
})();