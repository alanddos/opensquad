# User Preferences

language: pt-BR
name: Alan

## Copilot (criação de agentes) — REGRAS DO ALAN
- NUNCA usar scripts de fallback que gerem fases/arestas genéricas, nem injeção de fase/aresta por script.
- O sistema é MULTITENANT: nunca hardcodar dados de tenant/idioma (nem sempre é pt-BR).
- As fases do agente devem nascer do LLM com os dados REAIS do tenant.
- O runtime busca a fase "START" como ponto de entrada — primeira fase do plano sempre START.
- Criação NÃO envia histórico do diagnóstico (4B imita as perguntas e cola nas fases como literal).