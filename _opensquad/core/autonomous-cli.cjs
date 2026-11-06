#!/usr/bin/env node
const { AutonomousAgent } = require('./autonomous-agent.cjs');
const { AutonomousBrain } = require('./autonomous-brain.cjs');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';

  const agent = new AutonomousAgent({ headless: true });
  
  try {
    await agent.start();

    if (command === 'run') {
      const goal = args.slice(1).join(' ') || 'declarar IRPF 2024';
      const context = {};
      
      const brain = new AutonomousBrain(agent);
      brain.setGoal(goal, context);
      
      await agent.goTo('https://www.gov.br/receitafederal');
      await brain.run();
    } 
    else if (command === 'screenshot') {
      await agent.goTo(args[1] || 'https://www.gov.br/receitafederal');
      await agent.screenshot('init');
      const state = await agent.see();
      console.log(JSON.stringify(state, null, 2));
    }
    else if (command === 'go') {
      await agent.goTo(args[1]);
      const state = await agent.see();
      console.log(JSON.stringify(state, null, 2));
    }
    else if (command === 'click') {
      const result = await agent.click(args[1]);
      console.log(JSON.stringify(result));
    }
    else if (command === 'type') {
      const result = await agent.type(args[1], args.slice(2).join(' '));
      console.log(JSON.stringify(result));
    }
    else if (command === 'see') {
      const state = await agent.see();
      console.log(JSON.stringify(state, null, 2));
    }
    else if (command === 'html') {
      const html = await agent.page.content();
      console.log(html.substring(0, 5000));
    }
    else {
      console.log(`
🤖 Agente Autônomo - Comandos:

  run             Inicia o agente com objetivo padrão (declarar IRPF)
  go <url>       Navega para uma URL e mostra o estado
  see             Analisa a página atual
  click <sel>    Clica em um elemento
  type <sel> <texto>  Digita texto em um campo
  screenshot     Tira screenshot da página atual
  html            Mostra HTML da página
      `);
    }

  } finally {
    await agent.close();
  }
}

main().catch(console.error);