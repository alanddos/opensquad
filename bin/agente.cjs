const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

const SESSION_FILE = 'opensquad/_opensquad/_browser_profile/receita-rf.json';
const OUTPUT_FILE = 'opensquad/squads/contabilidade-mensal/output/screenshot.png';

let browser, context, page;

async function rl(question) {
  const r = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => r.question(question, ans => { r.close(); resolve(ans); }));
}

async function abreNavegador() {
  browser = await chromium.launch({ headless: false });
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();
  
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      await context.addCookies(state.cookies);
      console.log('Sessao carregada');
    } catch (e) {}
  }
  
  await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=t&area=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: OUTPUT_FILE, fullPage: true });
}

async function tiraScreenshot() {
  await page.screenshot({ path: OUTPUT_FILE, fullPage: true });
  console.log('Screenshot salvo em: ' + OUTPUT_FILE);
}

async function navega(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('URL: ' + page.url());
  await page.screenshot({ path: OUTPUT_FILE, fullPage: true });
}

async function salvaSessao() {
  const cookies = await context.cookies();
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ cookies }, null, 2));
  console.log('Sessao salva!');
}

async function mostraOpcoes() {
  console.log(`
=== COMANDOS ===
- navegar <url>   : Ir para URL
- screenshot           : Tirar foto
- sessao               : Salvar sessao
- ajuda                : Mostrar comandos
- sair                 : Fechar navegador
`);
}

async function main() {
  console.log('=== AGENTE CONTABILIDADE ===');
  console.log('Abrindo navegador...');
  
  await abreNavegador();
  await mostraOpcoes();
  
  while (true) {
    const cmd = await rl('\n> ');
    
    if (cmd === 'sair') {
      await salvaSessao();
      await browser.close();
      break;
    }
    else if (cmd.startsWith('navegar ')) {
      const url = cmd.substring(8);
      await navega(url);
    }
    else if (cmd === 'screenshot') {
      await tiraScreenshot();
    }
    else if (cmd === 'sessao') {
      await salvaSessao();
    }
    else if (cmd === 'ajuda') {
      await mostraOpcoes();
    }
    else {
      console.log('Comando nao reconhecido. Digite "ajuda"');
    }
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });