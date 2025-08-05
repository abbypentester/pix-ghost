# PIX Ghost - Integração com EFI Pay

Sistema de pagamentos PIX anônimo integrado com a EFI Pay (antiga Gerencianet).

## 🚀 Funcionalidades

- ✅ Geração de QR Codes PIX via EFI Pay
- ✅ Verificação automática de pagamentos
- ✅ Webhook para confirmação instantânea
- ✅ Sistema de carteira anônima
- ✅ Histórico de transações
- ✅ Solicitações de saque por email
- ✅ Interface responsiva e moderna

## 📋 Pré-requisitos

### 1. Credenciais EFI Pay
- Client ID de produção
- Client Secret de produção
- Certificado `.pem` ou `.p12`
- Chave PIX configurada na EFI

### 2. Serviços Externos
- Conta Vercel (para deploy)
- Vercel KV (banco de dados)
- Resend (para emails de saque)

## 🔧 Configuração

### 1. Certificado EFI

Coloque o arquivo `certificado.pem` na raiz do projeto. Se você tem um arquivo `.p12`, converta para `.pem`:

```bash
# Converter .p12 para .pem
openssl pkcs12 -in certificado.p12 -out certificado.pem -nodes
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env.local` baseado no `.env.example`:

```env
# EFI Pay - Suas credenciais de produção
EFI_CLIENT_ID=Client_Id_8897337f5626755b4e202c13412fe2629cdf8852
EFI_CLIENT_SECRET=Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747
EFI_CERTIFICATE_PATH=./certificado.pem
EFI_PIX_KEY=sua-chave-pix@email.com
EFI_WEBHOOK_URL=https://seu-dominio.vercel.app/api/webhook/efi

# Resend para emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=admin@seudominio.com

# Ambiente
NODE_ENV=production
```

### 3. Instalação de Dependências

```bash
npm install
```

## 🚀 Deploy no Vercel

### 1. Configurar Vercel KV

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em "Storage" → "Create Database" → "KV"
3. Conecte o banco ao seu projeto

### 2. Configurar Variáveis de Ambiente

No Vercel Dashboard, vá em "Settings" → "Environment Variables" e adicione:

```
EFI_CLIENT_ID=Client_Id_8897337f5626755b4e202c13412fe2629cdf8852
EFI_CLIENT_SECRET=Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747
EFI_CERTIFICATE_PATH=./certificado.pem
EFI_PIX_KEY=sua-chave-pix@email.com
EFI_WEBHOOK_URL=https://seu-dominio.vercel.app/api/webhook/efi
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=admin@seudominio.com
NODE_ENV=production
```

### 3. Upload do Certificado

Coloque o arquivo `certificado.pem` na raiz do projeto antes do deploy.

### 4. Deploy

```bash
vercel --prod
```

## 🔗 Configuração do Webhook EFI

1. Acesse o painel da EFI Pay
2. Vá em "Configurações" → "Webhooks"
3. Configure a URL: `https://seu-dominio.vercel.app/api/webhook/efi`
4. Selecione os eventos: `pix`

## 📊 Estrutura do Banco de Dados (Vercel KV)

```
user:{userId}                    # Saldo do usuário (float)
user:{userId}:transactions       # Lista de IDs de transações (list)
transaction:{transactionId}      # Dados da transação (hash)
webhook_processed:{txid}         # Controle de webhooks processados (hash)
```

## 🔄 Fluxo de Funcionamento

1. **Geração de Pagamento**:
   - Frontend chama `/api/generate-pix-efi`
   - API cria cobrança PIX na EFI
   - Retorna QR Code e código copia-e-cola

2. **Verificação Manual**:
   - Frontend chama `/api/verify-pix-efi`
   - API consulta status na EFI
   - Se pago, adiciona saldo automaticamente

3. **Webhook Automático**:
   - EFI envia notificação para `/api/webhook/efi`
   - Sistema adiciona saldo automaticamente
   - Evita duplicação de processamento

4. **Consulta de Saldo**:
   - Frontend chama `/api/get-balance`
   - Retorna saldo e histórico de transações

5. **Solicitação de Saque**:
   - Frontend chama `/api/request-withdrawal`
   - Envia email para admin via Resend
   - Debita saldo automaticamente

## 🛡️ Segurança

- ✅ Certificado TLS obrigatório para EFI
- ✅ Validação de webhooks
- ✅ Controle de duplicação de transações
- ✅ Sistema anônimo (sem dados pessoais)
- ✅ CORS configurado
- ✅ Tratamento de erros robusto

## 🔧 APIs Disponíveis

### POST `/api/generate-pix-efi`
Gera uma nova cobrança PIX

```json
{
  "amount": 10.50,
  "description": "Depósito PIX Ghost"
}
```

### POST `/api/verify-pix-efi`
Verifica status de uma cobrança

```json
{
  "txid": "abc123def456"
}
```

### POST `/api/webhook/efi`
Recebe notificações da EFI (configurado automaticamente)

### GET `/api/get-balance?userId=xxx`
Consulta saldo e histórico

### POST `/api/add-balance`
Adiciona saldo manualmente (uso interno)

### POST `/api/request-withdrawal`
Solicita saque por email

## 🐛 Troubleshooting

### Erro: "Certificado não encontrado"
- Verifique se o arquivo `certificado.pem` está na raiz
- Confirme as permissões do arquivo
- Teste a conversão do .p12 para .pem

### Erro: "Client ID/Secret inválido"
- Verifique as credenciais no painel EFI
- Confirme se são credenciais de produção
- Verifique as variáveis de ambiente

### Webhook não funciona
- Confirme a URL no painel EFI
- Verifique se o domínio está acessível
- Teste manualmente a URL do webhook

### QR Code não aparece
- Verifique os logs do Vercel
- Confirme a chave PIX configurada
- Teste a API diretamente

## 📞 Suporte

- [Documentação EFI Pay](https://dev.efipay.com.br/)
- [Discord EFI](https://discord.gg/efipay)
- [Suporte Vercel](https://vercel.com/support)

## 📝 Changelog

### v2.0.0 - Integração EFI
- ✅ Substituição completa da API Caos pela EFI Pay
- ✅ Implementação de webhook automático
- ✅ Melhor tratamento de erros
- ✅ Suporte a certificados .pem e .p12
- ✅ Configuração simplificada via variáveis de ambiente

---

**Desenvolvido com ❤️ para transações PIX anônimas e seguras**