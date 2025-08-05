# 🔄 Guia de Migração: Caos → EFI Pay

Este guia detalha as mudanças necessárias para migrar do sistema Caos Payment para EFI Pay.

## 📋 Resumo das Mudanças

### ✅ Arquivos Criados
- `api/generate-pix-efi.js` - Nova API para gerar PIX via EFI
- `api/verify-pix-efi.js` - Nova API para verificar status PIX
- `api/webhook/efi.js` - Webhook para notificações automáticas
- `config/efi-config.js` - Configurações da EFI
- `.env.example` - Exemplo de variáveis de ambiente
- `setup-efi.js` - Script de configuração automática
- `test-efi.js` - Script de teste da integração

### 🔧 Arquivos Modificados
- `package.json` - Adicionado SDK da EFI
- `script.js` - Atualizado para usar APIs da EFI

### 📁 Arquivos Mantidos (sem alteração)
- `api/add-balance.js` - Mantido (compatível)
- `api/get-balance.js` - Mantido (compatível)
- `api/request-withdrawal.js` - Mantido (compatível)
- `api/hello.js` - Mantido (compatível)
- `index.html` - Mantido (compatível)
- `style.css` - Mantido (compatível)

## 🔄 Comparação de APIs

### Geração de Pagamento

**ANTES (Caos):**
```javascript
// Via proxy
fetch('/api/proxy', {
    method: 'POST',
    body: JSON.stringify({
        url: `https://caospayment.shop/create_payment?amount=${amount}&user_id=${caosUserId}`
    })
});
```

**DEPOIS (EFI):**
```javascript
// Direto na API
fetch('/api/generate-pix-efi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        amount: amount,
        description: `Depósito PIX Ghost - Usuário: ${userId}`
    })
});
```

### Verificação de Pagamento

**ANTES (Caos):**
```javascript
// Via proxy
fetch(`/api/proxy?url=${encodeURIComponent(verifyUrl)}`);

// Resposta
{
    "status_pagamento": "CONCLUIDA",
    "external_id": "abc123"
}
```

**DEPOIS (EFI):**
```javascript
// Direto na API
fetch('/api/verify-pix-efi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txid: currentPaymentId })
});

// Resposta
{
    "paid": true,
    "status": "CONCLUIDA",
    "txid": "abc123",
    "amount": 10.50
}
```

## 🆕 Novas Funcionalidades

### 1. Webhook Automático
- **URL**: `/api/webhook/efi`
- **Função**: Recebe notificações da EFI quando um pagamento é confirmado
- **Benefício**: Confirmação instantânea sem necessidade de verificação manual

### 2. Melhor Tratamento de Erros
- Mensagens de erro mais específicas
- Logs detalhados para debug
- Validação de certificados

### 3. Configuração Simplificada
- Variáveis de ambiente centralizadas
- Script de configuração automática
- Arquivo de teste para validação

## 🔧 Configuração Necessária

### 1. Certificado EFI
```bash
# Se você tem um arquivo .p12, converta para .pem:
openssl pkcs12 -in certificado.p12 -out certificado.pem -nodes

# Coloque o certificado.pem na raiz do projeto
```

### 2. Variáveis de Ambiente
```env
EFI_CLIENT_ID=Client_Id_8897337f5626755b4e202c13412fe2629cdf8852
EFI_CLIENT_SECRET=Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747
EFI_CERTIFICATE_PATH=./certificado.pem
EFI_PIX_KEY=sua-chave-pix@email.com
EFI_WEBHOOK_URL=https://seu-dominio.vercel.app/api/webhook/efi
```

### 3. Webhook na EFI
1. Acesse o painel da EFI Pay
2. Vá em "Configurações" → "Webhooks"
3. Configure: `https://seu-dominio.vercel.app/api/webhook/efi`
4. Selecione eventos: `pix`

## 🧪 Testando a Migração

### 1. Teste Local
```bash
# Instalar dependências
npm install

# Configurar automaticamente
node setup-efi.js

# Testar integração
node test-efi.js
```

### 2. Teste no Vercel
1. Configure as variáveis de ambiente
2. Faça o deploy: `vercel --prod`
3. Teste a geração de PIX
4. Teste o webhook

## 🔒 Segurança

### Melhorias de Segurança
- ✅ Certificado TLS obrigatório
- ✅ Validação de webhooks
- ✅ Controle de duplicação
- ✅ Logs de auditoria
- ✅ Tratamento seguro de erros

### Dados Sensíveis
- ❌ **NUNCA** commite o certificado no Git
- ❌ **NUNCA** exponha as credenciais no código
- ✅ Use variáveis de ambiente
- ✅ Configure `.gitignore` adequadamente

## 📊 Monitoramento

### Logs Importantes
```javascript
// Geração de PIX
console.log('Criando cobrança PIX:', pixData);

// Webhook recebido
console.log('Webhook EFI recebido:', webhookData);

// Pagamento confirmado
console.log('PIX processado:', result);
```

### Métricas a Acompanhar
- Taxa de sucesso na geração de PIX
- Tempo de confirmação via webhook
- Erros de certificado/credenciais
- Volume de transações processadas

## 🚨 Possíveis Problemas

### 1. Certificado
```
Erro: "Certificado não encontrado"
Solução: Verificar caminho e permissões do certificado.pem
```

### 2. Credenciais
```
Erro: "Client ID/Secret inválido"
Solução: Confirmar credenciais no painel EFI
```

### 3. Chave PIX
```
Erro: "Chave PIX inválida"
Solução: Configurar chave PIX válida na EFI
```

### 4. Webhook
```
Erro: "Webhook não recebido"
Solução: Verificar URL e configuração no painel EFI
```

## 📞 Suporte

- [Documentação EFI](https://dev.efipay.com.br/)
- [Discord EFI](https://discord.gg/efipay)
- [GitHub Issues](https://github.com/efipay/sdk-node-apis-efi/issues)

## ✅ Checklist de Migração

- [ ] Certificado EFI configurado
- [ ] Credenciais de produção configuradas
- [ ] Chave PIX configurada
- [ ] Variáveis de ambiente definidas
- [ ] Dependências instaladas
- [ ] Teste local executado com sucesso
- [ ] Deploy no Vercel realizado
- [ ] Webhook configurado na EFI
- [ ] Teste de geração de PIX funcionando
- [ ] Teste de verificação funcionando
- [ ] Webhook recebendo notificações
- [ ] Sistema em produção

---

**🎉 Parabéns! Sua migração para EFI Pay está completa!**