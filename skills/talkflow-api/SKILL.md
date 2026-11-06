---
name: talkflow-api
description: "Interagir com o TalkFlow (sistema de atendimento da AgilSystem) via API — criar templates WhatsApp, enviar mensagens, gerenciar campanhas"
version: "1.0.0"
scripts:
  - name: "talkflow-api"
    description: "Interagir com a API do TalkFlow"
    command: "python3 skills/talkflow-api/scripts/talkflow_api.py"
    arguments:
      - name: "--action"
        description: "Ação: login, upload-image, create-template, list-templates, send-test, list-connections"
        required: true
      - name: "--username"
        description: "Username para login"
        required: false
      - name: "--password"
        description: "Senha para login"
        required: false
      - name: "--token"
        description: "JWT token (alternativa a login)"
        required: false
      - name: "--tenant"
        description: "Tenant ID (default: empresa_1)"
        required: false
      - name: "--phone-id"
        description: "Phone number ID do WABA"
        required: false
      - name: "--file"
        description: "Caminho do arquivo de imagem para upload"
        required: false
      - name: "--template"
        description: "Caminho do arquivo JSON do template ou nome do template"
        required: false
      - name: "--to"
        description: "Número de destino para teste"
        required: false
      - name: "--base-url"
        description: "URL base da API (default: https://api.agilsystem.com.br)"
        required: false
---

# TalkFlow API Skill

Interage com o sistema TalkFlow da AgilSystem via REST API.

## Ações disponíveis

### login
Obter JWT token para autenticação.
```bash
python3 skills/talkflow-api/scripts/talkflow_api.py --action login --username "Equipe Comercial" --password "xxx"
```

### upload-image
Upload de imagem header para templates WhatsApp.
```bash
python3 skills/talkflow-api/scripts/talkflow_api.py --action upload-image --token "JWT" --tenant "empresa_1" --file "path/to/image.jpg"
```

### create-template
Criar template WhatsApp no formato Meta API.
```bash
python3 skills/talkflow-api/scripts/talkflow_api.py --action create-template --token "JWT" --tenant "empresa_1" --phone-id "1033051686557792" --template "path/to/template.json"
```

### list-templates
Listar todos os templates do tenant.
```bash
python3 skills/talkflow-api/scripts/talkflow_api.py --action list-templates --token "JWT" --tenant "empresa_1" --phone-id "1033051686557792"
```

### send-test
Enviar mensagem de teste com template.
```bash
python3 skills/talkflow-api/scripts/talkflow_api.py --action send-test --token "JWT" --tenant "empresa_1" --phone-id "1033051686557792" --template "nome_do_template" --to "5567999999999"
```

### list-connections
Listar conexões WhatsApp do tenant.
```bash
python3 skills/talkflow-api/scripts/talkflow_api.py --action list-connections --token "JWT" --tenant "empresa_1"
```

## Configuração padrão

- Base URL: https://api.agilsystem.com.br
- Tenant: empresa_1
- Phone ID: 1033051686557792
