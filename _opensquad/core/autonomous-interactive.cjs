#!/usr/bin/env node
const { AutonomousAgent } = require('./autonomous-agent.cjs');

const readline = require('readline');

class InteractiveAgent {
  constructor() {
    this.agent = new AutonomousAgent({ headless: false });
  }

  async start() {
    await this.agent.start();
    await this.agent.goTo('https://www.gov.br/receitafederal/pt-br');
    await this.loop();
  }

  async loop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ask = () => {
      rl.question('> ', async (cmd) => {
        const parts = cmd.trim().split(' ');
        const action = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (action) {
          case 'see':
          case 's':
            const state = await this.agent.see();
            console.log(`\n📄 ${state.title}`);
            console.log(`🔗 ${state.url}\n`);
            console.log(`👁️  ${state.interactive.length} elementos interativos:\n`);
            state.interactive.slice(0, 20).forEach((el, i) => {
              console.log(`  ${i + 1}. [${el.tag}] ${el.text.substring(0, 60)}`);
            });
            if (state.interactive.length > 20) {
              console.log(`  ... e mais ${state.interactive.length - 20}`);
            }
            break;

          case 'go':
            if (args[0]) {
              await this.agent.goTo(args[0]);
            }
            break;

          case 'click':
          case 'c':
            const idx = parseInt(args[0]) - 1;
            const state = await this.agent.see();
            if (idx >= 0 && idx < state.interactive.length) {
              const el = state.interactive[idx];
              const selector = el.id ? `#${el.id}` : el.text;
              console.log(`👆 Clicando: ${selector}`);
              await this.agent.click(selector);
            } else if (args[0]) {
              await this.agent.click(args.join(' '));
            }
            break;

          case 'type':
          case 't':
            if (args.length >= 2) {
              const sepIndex = args.indexOf('--');
              if (sepIndex > 0) {
                const field = args.slice(0, sepIndex).join(' ');
                const value = args.slice(sepIndex + 1).join(' ');
                await this.agent.type(field, value);
              }
            }
            break;

          case 'wait':
            await this.agent.wait(parseInt(args[0]) || 2);
            break;

          case 'screenshot':
          case 'shot':
            await this.agent.screenshot('manual-' + Date.now());
            break;

          case 'html':
            const html = await this.agent.page.content();
            console.log(html.substring(0, 10000));
            break;

          case 'find':
          case 'f':
            const text = args.join(' ');
            const found = await this.agent.page.getByText(text, { exact: false });
            console.log(`🔍 Encontrado: ${found}`);
            break;

          case 'goto':
            if (args[0]) {
              await this.agent.goTo(args[0]);
            }
            break;

          case 'irpf':
          case 'ir':
            await this.agent.goTo('https://www.gov.br/pt-br/servicos/declarar-imposto-de-renda-pessoa-fisica');
            break;

          case 'ecac':
            await this.agent.goTo('https://www.gov.br/receitafederal/pt-br/canais_atendimento/atendimento-virtual');
            break;

          case 'help':
          case 'h':
            console.log(`
🤖 Comandos:

  see/s          - Ver elementos da página atual
  go <url>      - Navegar para URL
  goto          - Mesmo que go
  click <n>     - Clicar no elemento N (1, 2, 3...)
  click <sel>    - Clicar no seletor CSS
  type <campo> <texto> -- <valor>
  wait <s>      - Esperar segundos
  screenshot    - Tirar screenshot
  html          - Ver HTML da página
  find <texto>  - Encontrar elemento por texto
  irpf          - Ir para declaração IR
  ecac          - Ir para e-CAC
  quit/q        - Sair
  help/h       - Ajuda
            `);
            break;

          case 'quit':
          case 'q':
            rl.close();
            await this.agent.close();
            return;

          default:
            console.log(`❓ Comando inválido: ${action}`);
            console.log(`Digite 'help' para ver os comandos disponíveis`);
        }

        ask();
      });
    };

    ask();
  }
}

new InteractiveAgent().start().catch(e => {
  console.error(e);
  process.exit(1);
});