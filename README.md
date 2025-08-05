# Sistema de Pagamentos e Saques PIX

## Descrição
Este sistema permite que usuários realizem pagamentos via PIX e solicitem saques com aprovação manual. O sistema utiliza a EFI Pay como processadora de pagamentos e implementa taxas de 10% para saques.

## ✨ Funcionalidades
- 💰 Geração de pagamentos via PIX (EFI Pay)
- 🔍 Verificação automática de pagamentos
- 💸 Solicitação de saques com taxa de 10%
- 📊 **Google Sheets como banco de dados**
- ✅ **Aprovação manual de saques via planilha**
- 🤖 **Automação com n8n para processamento**
- 📧 Notificação por email para solicitações de saque
- 📈 Histórico completo de transações
- 🔄 Webhooks para integração externa

## 🛠️ Tecnologias Utilizadas
- **Frontend:** HTML, CSS e JavaScript
- **Backend:** Vercel Serverless Functions
- **Banco de Dados:** Google Sheets (principal) + Vercel KV (fallback)
- **Processamento PIX:** EFI Pay
- **Email:** Resend
- **Automação:** n8n (opcional)
- **Autenticação:** Google Service Account

## 🚀 Deploy na Vercel

### 📋 Pré-requisitos
1. Conta na Vercel
2. Conta no Resend para envio de emails
3. **Conta no Google Cloud (para Google Sheets)** ⭐
4. Conta na EFI Pay (para processamento PIX)
5. Vercel KV (opcional, como fallback)

### 🔧 Opções de Configuração

#### Opção 1: Google Sheets (Recomendado) ⭐

1. **Configure o Google Sheets:**
   - Siga o guia completo em `GOOGLE-SHEETS-SETUP.md`
   - Crie Service Account no Google Cloud
   - Configure permissões da planilha

2. **Configure as variáveis de ambiente:**
   ```env
   # Google Sheets (Principal)
   GOOGLE_SHEETS_ID=sua_planilha_id
   GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json
   
   # EFI Pay
   EFI_CLIENT_ID=seu_client_id
   EFI_CLIENT_SECRET=seu_client_secret
   EFI_CERTIFICATE_PATH=./certificado-efi.p12
   EFI_SANDBOX=true
   
   # Email
   RESEND_API_KEY=sua_chave_resend
   ADMIN_EMAIL=admin@exemplo.com
   ```

#### Opção 2: Vercel KV (Fallback)

1. **Configure o Vercel KV:**
   - Dashboard Vercel > Storage > KV
   - Crie nova instância
   - Conecte ao projeto

2. **Configure as variáveis:**
   ```env
   # Vercel KV (Fallback)
   KV_REST_API_URL=sua_url_kv
   KV_REST_API_TOKEN=seu_token_kv
   
   # Outras configurações...
   ```

### 📦 Passos para Deploy

1. **Prepare os arquivos:**
   ```bash
   # Clone o repositório
   git clone seu-repositorio
   cd pix-ghost
   
   # Instale dependências
   npm install
   ```

2. **Configure certificados:**
   - Adicione `certificado-efi.p12` na raiz
   - Adicione `google-service-account.json` na raiz
   - **NÃO** commite estes arquivos!

3. **Deploy na Vercel:**
   - Importe o repositório
   - Configure variáveis de ambiente
   - Faça upload dos certificados via interface
   - Deploy automático

4. **Teste a integração:**
   ```bash
   # Teste Google Sheets
   node test-google-sheets.js
   
   # Teste EFI
   node test-efi-connection.cjs
   ```

## 📊 Estrutura do Banco de Dados

### Google Sheets (Principal)

O sistema utiliza 3 abas na planilha:

#### Aba: `usuarios`
| Coluna | Descrição | Exemplo |
|--------|-----------|----------|
| A | user_id | user_123 |
| B | balance | 150.50 |
| C | created_at | 2024-01-15 10:30:00 |
| D | updated_at | 2024-01-15 15:45:00 |

#### Aba: `transacoes`
| Coluna | Descrição | Exemplo |
|--------|-----------|----------|
| A | transaction_id | txn_1234567890 |
| B | user_id | user_123 |
| C | type | deposit/withdrawal |
| D | amount | 100.00 |
| E | net_amount | 95.00 |
| F | fee | 5.00 |
| G | status | completed |
| H | created_at | 2024-01-15 10:30:00 |
| I | pix_key | usuario@email.com |
| J | payment_id | pix_123456 |

#### Aba: `saques_pendentes` ⭐
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

### Vercel KV (Fallback)

Estrutura compatível para fallback:
- `user:{userId}`: Hash com saldo do usuário
- `user:{userId}:transactions`: Lista de transações
- `transaction:{transactionId}`: Detalhes da transação

## 🔄 Fluxo de Saques

### Método 1: Aprovação Manual na Planilha ⭐
1. 📝 Usuário solicita saque
2. 📊 Sistema registra na aba `saques_pendentes`
3. 📧 Email enviado para administrador
4. ✅ Administrador altera coluna "aprovado" para "SIM"
5. 🤖 n8n processa automaticamente (opcional)
6. 💸 PIX enviado e status atualizado

### Método 2: Processamento Manual
1. 📝 Usuário solicita saque
2. 📧 Email enviado para administrador
3. 💰 Saldo debitado automaticamente
4. 👨‍💼 Administrador processa PIX manualmente

## 🤖 Automação com n8n

Para automatizar completamente o processo:

1. **Configure n8n** (veja `N8N-INTEGRATION.md`)
2. **Importe workflows** fornecidos
3. **Configure webhooks** para monitoramento
4. **Ative processamento automático**

### Endpoints para n8n:
- `POST /api/webhook/process-approved-withdrawals`
- `GET /api/check-pending-withdrawals`

## 📚 Documentação Adicional

- 📊 **[Configuração Google Sheets](GOOGLE-SHEETS-SETUP.md)**
- 🤖 **[Integração n8n](N8N-INTEGRATION.md)**
- 🔧 **[Configuração Vercel KV](VERCEL-KV-SETUP.md)**
- 🛠️ **[Solução de Problemas](SOLUCAO-PROBLEMAS.md)**

## 🧪 Testes

```bash
# Teste Google Sheets
node test-google-sheets.js

# Teste EFI Pay
node test-efi-connection.cjs

# Teste endpoints
curl -X POST https://seu-dominio.com/api/webhook/process-approved-withdrawals
```

## 🔒 Segurança

- ✅ Service Account com permissões mínimas
- ✅ Certificados EFI protegidos
- ✅ Variáveis de ambiente seguras
- ✅ Logs detalhados para auditoria
- ✅ Validação de dados em todas as operações

## 📞 Suporte

Para dúvidas ou problemas:
1. 📖 Consulte a documentação específica
2. 🔍 Verifique os logs do sistema
3. 🧪 Execute os testes fornecidos
4. 📧 Entre em contato com suporte técnico