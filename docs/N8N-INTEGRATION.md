# Integração com n8n - Automação de Saques PIX

Este documento explica como configurar workflows no n8n para automatizar o processamento de saques PIX usando o Google Sheets como banco de dados.

## 📋 Visão Geral

O sistema permite:
- ✅ Registro automático de saques no Google Sheets
- ✅ Aprovação manual via planilha (coluna "aprovado")
- ✅ Processamento automático via n8n
- ✅ Notificações por e-mail
- ✅ Logs detalhados de todas as operações

## 🔧 Configuração Inicial

### 1. Pré-requisitos

- ✅ Google Sheets configurado (veja `GOOGLE-SHEETS-SETUP.md`)
- ✅ n8n instalado e configurado
- ✅ Variáveis de ambiente configuradas
- ✅ Sistema PIX Ghost funcionando

### 2. Estrutura da Planilha

A aba `saques_pendentes` deve ter as seguintes colunas:

| Coluna | Descrição | Exemplo |
|--------|-----------|----------|
| A | transaction_id | txn_1234567890 |
| B | user_id | user_123 |
| C | pix_key | usuario@email.com |
| D | gross_amount | 100.00 |
| E | fee | 5.00 |
| F | net_amount | 95.00 |
| G | created_at | 2024-01-15 10:30:00 |
| H | **aprovado** | **SIM/NAO** |
| I | processed | false |
| J | processed_at | |
| K | success | |

## 🤖 Workflows n8n

### Workflow 1: Monitoramento e Processamento Automático

#### Nós Necessários:

1. **Cron Trigger** (Execução periódica)
   - Configuração: A cada 5 minutos
   - Expressão cron: `*/5 * * * *`

2. **HTTP Request** (Chamar webhook)
   - URL: `https://seu-dominio.com/api/webhook/process-approved-withdrawals`
   - Método: POST
   - Headers: `Content-Type: application/json`

3. **IF Node** (Verificar se há saques processados)
   - Condição: `{{ $json.summary.processed > 0 }}`

4. **Email Node** (Notificação de sucesso)
   - Para: Administrador
   - Assunto: "✅ Saques processados automaticamente"
   - Corpo: Detalhes dos saques processados

#### Configuração JSON do Workflow:

```json
{
  "name": "Processamento Automático de Saques PIX",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://seu-dominio.com/api/webhook/process-approved-withdrawals",
        "options": {
          "response": {
            "response": {
              "responseFormat": "json"
            }
          }
        }
      },
      "name": "Processar Saques",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "leftValue": "={{ $json.summary.processed }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "name": "Há Saques Processados?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Cron Trigger": {
      "main": [
        [
          {
            "node": "Processar Saques",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Processar Saques": {
      "main": [
        [
          {
            "node": "Há Saques Processados?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Workflow 2: Notificação de Novos Saques Pendentes

#### Nós Necessários:

1. **Google Sheets Trigger**
   - Planilha: Sua planilha de saques
   - Aba: `saques_pendentes`
   - Evento: "On Row Added"

2. **Email Node** (Notificar administrador)
   - Para: Administrador
   - Assunto: "🔔 Novo saque pendente de aprovação"
   - Corpo: Detalhes do saque

## 📱 Endpoints Disponíveis

### 1. Webhook de Processamento
```
POST /api/webhook/process-approved-withdrawals
GET /api/webhook/process-approved-withdrawals
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Processamento de saques concluído",
  "summary": {
    "total": 3,
    "processed": 2,
    "failed": 1
  },
  "details": {
    "processed": [...],
    "failed": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Verificação de Saques Pendentes
```
GET /api/check-pending-withdrawals
```

**Resposta:**
```json
{
  "success": true,
  "pendingWithdrawals": [
    {
      "transactionId": "txn_1234567890",
      "userId": "user_123",
      "pixKey": "usuario@email.com",
      "netAmount": "95.00",
      "createdAt": "2024-01-15 10:30:00",
      "approved": "SIM"
    }
  ],
  "count": 1
}
```

## 🔄 Fluxo Completo

### 1. Solicitação de Saque
```
Usuário solicita saque → API registra no Google Sheets → Status: Pendente
```

### 2. Aprovação Manual
```
Administrador acessa planilha → Altera coluna "aprovado" para "SIM" ou "NAO"
```

### 3. Processamento Automático (n8n)
```
Cron trigger (5 min) → Webhook verifica aprovações → Processa PIX → Atualiza planilha
```

### 4. Notificações
```
E-mail de confirmação → Logs detalhados → Status atualizado na planilha
```

## ⚙️ Configurações Avançadas

### Personalizar Frequência de Processamento

No nó **Cron Trigger**, ajuste a expressão:
- A cada minuto: `* * * * *`
- A cada 10 minutos: `*/10 * * * *`
- A cada hora: `0 * * * *`
- Apenas em horário comercial: `*/5 9-18 * * 1-5`

### Adicionar Validações Extras

Use nós **IF** para:
- Verificar valor mínimo/máximo
- Validar formato da chave PIX
- Verificar saldo disponível
- Aplicar regras de negócio específicas

### Integração com Slack/Discord

Adicione nós de notificação para:
- Alertas em tempo real
- Relatórios diários
- Notificações de erro

## 🛡️ Segurança

### Autenticação
- Configure autenticação básica ou API key nos webhooks
- Use HTTPS em produção
- Limite acesso por IP se necessário

### Logs e Monitoramento
- Monitore execuções do n8n
- Configure alertas para falhas
- Mantenha logs de auditoria

### Backup
- Exporte workflows regularmente
- Mantenha backup da planilha
- Configure redundância se necessário

## 🔧 Troubleshooting

### Problemas Comuns

1. **Webhook não responde**
   - Verifique se o servidor está rodando
   - Confirme a URL do webhook
   - Teste manualmente com Postman

2. **Google Sheets não atualiza**
   - Verifique credenciais da Service Account
   - Confirme permissões da planilha
   - Teste conexão com `test-google-sheets.js`

3. **n8n não executa**
   - Verifique se o workflow está ativo
   - Confirme configuração do cron
   - Analise logs de execução

### Logs Úteis

```bash
# Verificar logs do servidor
tail -f logs/server.log

# Testar conexão Google Sheets
node test-google-sheets.js

# Testar webhook manualmente
curl -X POST https://seu-dominio.com/api/webhook/process-approved-withdrawals
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Teste os endpoints manualmente
3. Confirme configurações do Google Sheets
4. Analise execuções do n8n

---

**Próximos Passos:**
1. Configure o Google Sheets (veja `GOOGLE-SHEETS-SETUP.md`)
2. Importe os workflows no n8n
3. Teste o fluxo completo
4. Configure monitoramento e alertas