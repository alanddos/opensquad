const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Opening Simples Nacional...');
  await page.goto('https://www8.receita.fazenda.gov.br/SimplesNacional/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Fill CNPJ
  await page.fill('#txtCNPJ', '63815659000116');
  console.log('CNPJ filled');
  
  // Fill access code
  await page.fill('#txtCodAcesso', '908141580981');
  console.log('Code filled');
  
  // Click continue
  await page.click('#btnContinuar');
  console.log('Clicked continue');
  
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log('Title after:', title);
  
  await page.screenshot({ path: 'squads/contabilidade-mensal/output/rf-logged.png', fullPage: true });
  console.log('Screenshot saved');
  
  await browser.close();
  console.log('Done!');
})();