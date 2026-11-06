const { AutonomousAgent } = require('./autonomous-agent.cjs');

class AutonomousBrain {
  constructor(agent) {
    this.agent = agent;
    this.goal = null;
    this.context = {};
    this.decisions = [];
    this.maxSteps = 50;
  }

  setGoal(goal, context = {}) {
    this.goal = goal;
    this.context = context;
    console.log(`\n🎯 GOAL: ${goal}\n`);
  }

  async think(pageState) {
    const url = pageState.url.toLowerCase();
    const title = pageState.title.toLowerCase();
    const text = pageState.text.toLowerCase();
    const interactive = pageState.interactive || [];
    const forms = pageState.forms || [];

    const decision = { reasoning: '', action: null, target: null };

    if (this.goal.includes('irpf') || this.goal.includes('declaração') || this.goal.includes('imposto')) {
      if (url.includes('receita.fazenda.gov.br') || url.includes('gov.br')) {
        if (!url.includes('/irpf/') && !url.includes('declara')) {
          const loginBtn = interactive.find(el => 
            el.text.toLowerCase().includes('login') || 
            el.text.toLowerCase().includes('acessar') ||
            el.text.toLowerCase().includes('entrar')
          );
          if (loginBtn) {
            decision.reasoning = 'Encontrou botão de login';
            decision.action = 'click';
            decision.target = this.getSelectorFromElement(loginBtn);
          }
        }
        
        if (text.includes('cpf') && text.includes('senha')) {
          decision.reasoning = 'Na página de login, preciso inserir CPF e senha';
          decision.action = 'type';
          decision.target = '#cpf'; // vai precisar ajustar
          decision.value = this.context.cpf || '';
        }
      }
    }

    if (text.includes('captcha') || text.includes('não sou robô')) {
      decision.reasoning = 'CAPTCHA detectado - preciso pausar e pedir ajuda ao usuário';
      decision.action = 'pause';
      decision.target = 'captcha';
    }

    if (!decision.action && interactive.length > 0) {
      const primaryBtn = interactive.find(el => 
        el.text.toLowerCase().includes('continuar') ||
        el.text.toLowerCase().includes('enviar') ||
        el.text.toLowerCase().includes('confirmar') ||
        el.text.toLowerCase().includes('declarar')
      );
      if (primaryBtn) {
        decision.reasoning = 'Ação principal detectada';
        decision.action = 'click';
        decision.target = this.getSelectorFromElement(primaryBtn);
      }
    }

    return decision;
  }

  getSelectorFromElement(el) {
    if (el.id) return `#${el.id}`;
    if (el.classes) {
      const classList = el.classes.split(' ').filter(c => c);
      if (classList.length) return `button.${classList.join('.')}`;
    }
    return el.text || 'button';
  }

  async run() {
    console.log('🧠 Starting autonomous brain...\n');
    
    for (let step = 0; step < this.maxSteps; step++) {
      console.log(`\n--- Step ${step + 1}/${this.maxSteps} ---`);
      
      const pageState = await this.agent.see();
      
      console.log(`📄 ${pageState.title}`);
      console.log(`🔗 ${pageState.url}`);
      console.log(`👁️  Interactive elements: ${pageState.interactive.length}`);
      
      const decision = await this.think(pageState);
      
      if (!decision.action) {
        console.log('🤔 Não sei o que fazer agora');
        continue;
      }

      if (decision.action === 'pause') {
        console.log('⏸️ AGENTE PAUSADO - precisa de ajuda humana');
        return { paused: true, reason: decision.target };
      }

      console.log(`💭 ${decision.reasoning}`);
      
      let result;
      switch (decision.action) {
        case 'click':
          result = await this.agent.click(decision.target);
          break;
        case 'type':
          result = await this.agent.type(decision.target, decision.value);
          break;
        case 'select':
          result = await this.agent.select(decision.target, decision.value);
          break;
        default:
          console.log(`❓ Unknown action: ${decision.action}`);
      }

      if (result?.success === false) {
        console.log(`❌ Action failed, retrying...`);
      }

      await this.agent.wait(1);
    }

    console.log('⚠️ Max steps reached');
    return { done: false, reason: 'max_steps' };
  }
}

module.exports = { AutonomousBrain };