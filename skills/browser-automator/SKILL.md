---
name: browser-automator
description: >
  Browser automation for government portals (Receita Federal, eSocial, etc).
  Access, login, navigate and extract data from web portals.
description_pt-BR: >
  Automação de browser para portais governamentais (Receita Federal, eSocial, etc).
  Acessar, fazer login, navegar e extrair dados de portais web.
type: mcp
version: "1.0.0"
mcp:
  server_name: playwright
  url: http://localhost:3100/mcp
categories: [automation, government, portals]
---

# Browser Automator

## When to use

Use this skill to:
- Access government portals (Receita Federal, eSocial, Simples Nacional)
- Login with credentials (CNPJ, CPF, codes)
- Navigate forms and submit declarations
- Download certificates and receipts

## Available operations

- **navigate** -- Go to a URL
- **fill_form** -- Fill input fields
- **click** -- Click buttons/links
- **wait** -- Wait for elements
- **screenshot** -- Capture page
- **extract** -- Extract data from page
- **download** -- Download files

## Credentials (stored in squad.memory)

Store credentials in the agent .md file:
```yaml
credentials:
  cnpj: "63815659000116"
  cpf: "02023220173"
  codigo_acesso: "908141580981"
```