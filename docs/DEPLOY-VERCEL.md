# 🚀 Deploy no Vercel - Configuração Completa

## ⚠️ Problema Comum: "Chave PIX não configurada" em Produção

Se você está recebendo o erro `"Chave PIX não configurada"` em produção, mas funciona localmente, o problema é que **as variáveis de ambiente não estão configuradas no painel do Vercel**.

## 📋 Passo a Passo para Deploy

### 1. Preparar o Projeto

1. Certifique-se de que o arquivo `vercel.json` existe na raiz do projeto
2. Verifique se todas as dependências estão no `package.json`
3. Teste localmente com `npm start`

### 2. Configurar Variáveis de Ambiente no Vercel

**IMPORTANTE**: Em produção, as variáveis NÃO vêm do arquivo `.env.local`. Elas devem ser configuradas no painel do Vercel.

#### No Painel do Vercel:

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione TODAS as variáveis abaixo:

```
NODE_ENV = production
EFI_CLIENT_ID = Client_Id_8897337f5626755b4e202c13412fe2629cdf8852
EFI_CLIENT_SECRET = Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747
EFI_PIX_KEY = sua-chave-pix@email.com
EFI_CERTIFICATE_PATH = ./certificado-completo-efi.pem
EFI_WEBHOOK_URL = https://seu-dominio.vercel.app/api/webhook/efi
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL = admin@seudominio.com
```

**⚠️ ATENÇÃO**: 
- Substitua `sua-chave-pix@email.com` pela sua chave PIX real
- Substitua `seu-dominio.vercel.app` pelo seu domínio real
- Use suas credenciais reais da EFI Pay

### 3. Configurar o Certificado

O certificado deve estar na raiz do projeto como `certificado-completo-efi.pem`.

**Verificar se o certificado está correto:**
```bash
# No seu computador, verifique se o arquivo existe
ls -la certificado-completo-efi.pem

# Deve mostrar o arquivo com tamanho > 0
```

### 4. Deploy

#### Opção A: Via GitHub (Recomendado)
1. Faça push do código para o GitHub
2. Conecte o repositório no Vercel
3. O deploy será automático

#### Opção B: Via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### 5. Verificar o Deploy

Após o deploy, acesse:
- `https://seu-dominio.vercel.app/` - Interface principal
- `https://seu-dominio.vercel.app/api/hello` - Teste da API

**Verificar logs:**
1. No painel do Vercel, vá em **Functions**
2. Clique em qualquer função para ver os logs
3. Procure pelas mensagens de status das variáveis

### 6. Configurar Webhook na EFI

1. Acesse o [painel da EFI Pay](https://sejaefi.com.br/)
2. Vá em **API** → **Webhooks**
3. Configure:
   - **URL**: `https://seu-dominio.vercel.app/api/webhook/efi`
   - **Eventos**: `pix`

## 🔍 Troubleshooting

### Erro: "Chave PIX não configurada"

**Causa**: A variável `EFI_PIX_KEY` não está configurada no Vercel.

**Solução**:
1. Vá no painel do Vercel → Settings → Environment Variables
2. Adicione `EFI_PIX_KEY` com sua chave PIX real
3. Faça um novo deploy

### Erro: "Certificado não encontrado"

**Causa**: O arquivo `certificado-completo-efi.pem` não está no projeto.

**Solução**:
1. Certifique-se de que o arquivo está na raiz do projeto
2. Faça commit e push do arquivo
3. Redeploy no Vercel

### Erro: "Client credentials inválidas"

**Causa**: `EFI_CLIENT_ID` ou `EFI_CLIENT_SECRET` incorretos.

**Solução**:
1. Verifique as credenciais no painel da EFI
2. Atualize no painel do Vercel
3. Redeploy

### Como Verificar se as Variáveis Estão Configuradas

Após o deploy, os logs do servidor mostrarão:

```
🌐 Executando em PRODUÇÃO
📋 Status das variáveis de ambiente:
   EFI_CLIENT_ID: ✅ Configurada
   EFI_CLIENT_SECRET: ✅ Configurada
   EFI_PIX_KEY: ✅ Configurada
   EFI_CERTIFICATE_PATH: ✅ Configurada
```

Se alguma mostrar `❌ Não configurada`, adicione no painel do Vercel.

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique os logs no painel do Vercel
2. Teste as credenciais localmente primeiro
3. Confirme que todas as variáveis estão no painel do Vercel
4. Verifique se o certificado está no projeto

## ✅ Checklist Final

- [ ] Arquivo `vercel.json` criado
- [ ] Todas as variáveis configuradas no painel do Vercel
- [ ] Certificado `certificado-completo-efi.pem` na raiz
- [ ] Webhook configurado na EFI
- [ ] Deploy realizado
- [ ] Logs verificados
- [ ] Teste de pagamento realizado

---

**Lembre-se**: Em produção, as variáveis vêm do painel do Vercel, NÃO do arquivo `.env.local`!