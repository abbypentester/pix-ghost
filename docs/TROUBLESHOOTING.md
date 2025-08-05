# 🔧 Guia de Solução de Problemas - PIX Ghost EFI

## ❌ Erro: "Foi enviado um certificado .pem porém não foi enviado o atributo pemKey corretamente"

### Causa
O arquivo `certificado.pem` atual contém apenas o **certificado público**, mas a EFI API requer tanto o certificado quanto a **chave privada** no mesmo arquivo.

### ✅ Soluções

#### Opção 1: Se você tem o arquivo .p12 original
```bash
# Converta o .p12 para .pem completo
openssl pkcs12 -in certificado.p12 -out certificado-completo.pem -nodes

# Substitua o arquivo atual
move certificado-completo.pem certificado.pem
```

#### Opção 2: Se você tem arquivos separados
```bash
# Combine certificado (.crt) e chave privada (.key)
cat certificado.crt chave-privada.key > certificado.pem
```

#### Opção 3: Baixar certificado completo da EFI
1. Acesse: https://sejaefi.com.br/
2. Faça login na sua conta
3. Vá em **API > Certificados**
4. Baixe o certificado no formato **.p12** ou **.pem completo**
5. Se baixar .p12, use a Opção 1 para converter

### 📝 Formato Correto do Certificado
O arquivo `certificado.pem` deve conter:

```
-----BEGIN CERTIFICATE-----
[conteúdo do certificado público]
-----END CERTIFICATE-----
-----BEGIN PRIVATE KEY-----
[conteúdo da chave privada]
-----END PRIVATE KEY-----
```

### 🧪 Verificar se o Certificado está Correto
```bash
node extract-key.js
```

### 🔄 Após Corrigir o Certificado
1. Execute o teste novamente:
   ```bash
   node test-efi.js
   ```

2. Se o teste passar, inicie o servidor:
   ```bash
   npm run dev
   ```

## 🚀 Outros Problemas Comuns

### Credenciais Inválidas
- Verifique `EFI_CLIENT_ID` e `EFI_CLIENT_SECRET` no arquivo `.env.local`
- Confirme se as credenciais são do ambiente correto (sandbox/produção)

### Chave PIX Inválida
- Verifique se `EFI_PIX_KEY` está configurada corretamente
- Deve ser um email, telefone ou CPF/CNPJ válido

### Webhook não Funciona
- Configure o webhook na EFI: `https://seudominio.com/api/webhook/efi`
- Certifique-se de que o domínio está acessível publicamente

### Problemas de Deploy
- Configure as variáveis de ambiente no Vercel
- Configure o Vercel KV para o banco de dados
- Faça upload do certificado para o Vercel (se necessário)

## 📞 Suporte
- Documentação EFI: https://dev.efipay.com.br/
- Issues do projeto: [GitHub Issues]