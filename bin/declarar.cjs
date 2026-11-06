const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CNPJ = '63815659000116';
const CPF = '02023220173';
const CODIGO = '908141580981';

const SESSION_FILE = path.join(__dirname, '..', '_opensquad', '_browser_profile', 'receita-rf.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'squads', 'contabilidade-mensal', 'output');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  let browser, context, page;
  
  try {
    console.error('=== ABRINDO NAVEGADOR ===');
    
    browser = await chromium.launch({ 
      headless: false,
      args: ['--start-maximized', '--disable-popup-blocking']
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
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    await page.screenshot({ path: OUTPUT_DIR + '/01-portal.png' });
    
    if (html.includes('authForm') && html.includes('txtCNPJ')) {
      console.error('=== FAZENDO LOGIN ===');
      await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCNPJ', CNPJ);
      await page.waitForTimeout(300);
      await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCPFResponsavel', CPF);
      await page.waitForTimeout(300);
      await page.fill('#ctl00_ContentPlaceHolder_authForm_txtCodigoAcesso', CODIGO);
      await page.waitForTimeout(300);
      
      await page.screenshot({ path: OUTPUT_DIR + '/02-login-preenchido.png' });
      
      console.error('=== AGUARDANDO LOGIN ===');
      await page.waitForFunction(() => {
        return !document.body.innerHTML.includes('authForm') || !document.body.innerHTML.includes('txtCNPJ');
      }, { timeout: 120000 });
      
      console.error('LOGADO!');
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: OUTPUT_DIR + '/03-logado.png' });
    
    console.error('=== ACESSANDO PGDAS-D ===');
    await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgdasd/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: OUTPUT_DIR + '/04-pgdas.png' });
    
    console.error('');
    console.error('===========================================');
    console.error('=== NAVEGADOR ABERTO - PGDAS-D ===');
    console.error('===========================================');
    console.error('');
    console.error('Agora faca manualmente:');
    console.error('1. Selecione CNPJ ' + CNPJ);
    console.error('2. Selecione periodo: MARCO/2026');
    console.error('3. Declare faturamento: R$ 0,00');
    console.error('4. Clique em Calcular');
    console.error('5. Clique em Gerar DAS');
    console.error('6. Baixe o PDF');
    console.error('');
    console.error('Quando terminar, volte aqui.');
    console.error('');
    
    const result = { action: 'PGDSABERTO', timestamp: new Date().toISOString() };
    fs.writeFileSync(OUTPUT_DIR + '/status.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    
  } catch (e) {
    console.error('Erro:', e.message);
    fs.writeFileSync(OUTPUT_DIR + '/erro.json', JSON.stringify({ erro: e.message }, null, 2));
  }
})();