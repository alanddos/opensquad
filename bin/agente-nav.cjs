const { chromium } = require('playwright');
const fs = require('fs');

const ACTION = process.argv[2];
const TARGET_URL = process.argv[3];
const SESSION_FILE = 'opensquad/_opensquad/_browser_profile/receita-rf.json';

(async () => {
  let browser, context, page;
  
  try {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
    
    if (fs.existsSync(SESSION_FILE)) {
      try {
        const state = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
        await context.addCookies(state.cookies);
        console.error('Cookies carregados');
      } catch (e) {
        console.error('Sem sessao anterior');
      }
    }
    
    const url = TARGET_URL || 'https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1';
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.error('Pagina carregada');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'opensquad/squads/contabilidade-mensal/output/current.png', fullPage: true });
    
    const title = await page.title();
    const urlNow = page.url();
    
    console.error('Titulo:', title);
    console.error('URL:', urlNow);
    
    console.log(JSON.stringify({ action: 'OPENED', url: urlNow, title }));
    
  } catch (e) {
    console.error('Erro:', e.message);
    console.log(JSON.stringify({ action: 'ERROR', error: e.message }));
  }
})();