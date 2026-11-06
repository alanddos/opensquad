#!/usr/bin/env node
const { AutonomousAgent } = require('./autonomous-agent.cjs');
const readline = require('readline');

class AutonomousRunner {
  constructor() {
    this.agent = new AutonomousAgent({ headless: false });
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║          🤖 AGENTE AUTÔNOMO - DECLARA IRPF               ║
╠═══════════════════════════════════════════════════════════╣
║  O agente vai navegar e tomar decisões. Quando precisar   ║
║  de sua ajuda, vai te pedir. Para sair, digite 'sair'.    ║
╚═══════════════════════════════════════════════════════════╝
    `);
    
    await this.agent.start();
    await this.agent.goTo('https://www.gov.br/receitafederal/pt-br');
    
    await this.run();
  }

  async run() {
    let step = 0;
    const maxSteps = 50;
    let paused = false;
    let pauseReason = '';

    while (step < maxSteps && !paused) {
      step++;
      console.log(`\n📍 Passo ${step}/${maxSteps}`);

      const page = await this.agent.see();
      
      console.log(`📄 ${page.title}`);
      console.log(`🔗 ${page.url.substring(0, 80)}`);

      const decision = this.decide(page);

      if (!decision.action) {
        console.log(`\n🤔 Não sei o que fazer nesta página.`);
        console.log(`Elementos disponíveis:`);
        page.interactive.slice(0, 10).forEach((el, i) => {
          console.log(`  ${i + 1}. ${el.text.substring(0, 50)}`);
        });

        await this.promptUser('O que fazer? (número ou instrução)');
        continue;
      }

      if (decision.action === 'pause') {
        paused = true;
        pauseReason = decision.reason;
        console.log(`\n⏸️  PRECISO DE AJUDA: ${decision.reason}`);
        
        const answer = await this.promptUser('Resposta: ');
        
        if (decision.reason === 'captcha') {
          console.log(`⏳ Ok, continuando quando resolver o captcha...`);
        }
        continue;
      }

      console.log(`💭 ${decision.reason}`);

      if (decision.action === 'click') {
        await this.agent.click(decision.selector);
      } else if (decision.action === 'type') {
        await this.agent.type(decision.selector, decision.value);
      } else if (decision.action === 'goto') {
        await this.agent.goTo(decision.url);
      }

      await this.agent.wait(2);
    }

    if (paused) {
      console.log(`\n⏸️  Agente pausado: ${pauseReason}`);
    } else {
      console.log(`\n⚠️  Máximo de passos atingido`);
    }

    await this.agent.screenshot('final');
    await this.agent.close();
  }

  decide(page) {
    const url = page.url.toLowerCase();
    const text = page.text.toLowerCase();
    const interactive = page.interactive;

    if (text.includes('cpf') && text.includes('senha') && !url.includes('login')) {
      return {
        action: 'type',
        selector: '#cpf',
        value: 'SEU_CPF',
        reason: 'Página de login detectada'
      };
    }

    if (text.includes('login') || text.includes('acessar') || text.includes('entrar')) {
      const btn = interactive.find(el => 
        el.text.toLowerCase().includes('login') ||
        el.text.toLowerCase().includes('acessar') ||
        el.text.toLowerCase().includes('entrar')
      );
      if (btn) {
        return {
          action: 'click',
          selector: btn.id ? `#${btn.id}` : btn.text,
          reason: 'Botão de login encontrado'
        };
      }
    }

    if (text.includes('captcha') || text.includes('não sou robô') || text.includes('robot')) {
      return {
        action: 'pause',
        reason: 'CAPTCHA detectado - resolva e digite "continuar"'
      };
    }

    if (url.includes('irpf') || text.includes('imposto de renda')) {
      const btn = interactive.find(el => 
        el.text.toLowerCase().includes('declarar') ||
        el.text.toLowerCase().includes('iniciar') ||
        el.text.toLowerCase().includes('nova declaração')
      );
      if (btn) {
        return {
          action: 'click',
          selector: btn.id ? `#${btn.id}` : btn.text,
          reason: 'Iniciar declaração IRPF'
        };
      }
    }

    if (!url.includes('/irpf/') && (text.includes('imposto') || text.includes('renda'))) {
      const link = interactive.find(el => 
        el.text.toLowerCase().includes('imposto de renda') ||
        el.text.toLowerCase().includes('meu imposto')
      );
      if (link && link.href) {
        return {
          action: 'goto',
          url: link.href,
          reason: 'Navegar para declaração IR'
        };
      }
    }

    return { action: null };
  }

  promptUser(question) {
    return new Promise(resolve => {
      this.rl.question(question, resolve);
    });
  }
}

new AutonomousRunner().start().catch(e => {
  console.error(e);
  process.exit(1);
});