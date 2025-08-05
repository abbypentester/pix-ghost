# 🚀 PIX Ghost - Sistema de Pagamentos PIX Anônimo

## 📋 Descrição

PIX Ghost é um sistema completo de pagamentos PIX que funciona como um banco digital anônimo, permitindo depósitos e saques via PIX de forma segura e privada.

## ✨ Características Principais

- 💰 **Depósitos PIX**: Adicione saldo via PIX instantaneamente
- 💸 **Saques PIX**: Retire saldo para qualquer chave PIX
- 🔒 **Anonimato**: Sistema baseado em IDs únicos, sem dados pessoais
- 📊 **Google Sheets**: Banco de dados gratuito e confiável
- 🌐 **Interface Web**: Dashboard completo para gerenciamento
- 🔗 **APIs REST**: Integração fácil com outros sistemas

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Banco de Dados**: Google Sheets API
- **Pagamentos**: EFI Pay (Gerencianet)
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Deploy**: Vercel (recomendado)

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd pix-ghost-main
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
# EFI Pay (Gerencianet)
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_PIX_KEY=sua_chave_pix
EFI_CERTIFICATE_PATH=./certificado-completo-efi.pem
EFI_SANDBOX=false

# Google Sheets
GOOGLE_SHEETS_ID=id_da_sua_planilha
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json
```

### 4. Configure o Google Sheets
Siga o guia detalhado em `GOOGLE-SHEETS-SETUP.md`

### 5. Configure o EFI Pay
Siga o guia detalhado em `README-EFI.md`

### 6. Execute o projeto
```bash
npm start
```

Acesse: http://localhost:3000

## 📚 Documentação

- 📊 [Configuração Google Sheets](docs/GOOGLE-SHEETS-SETUP.md)
- 💳 [Configuração EFI Pay](docs/README-EFI.md)
- 🚀 [Deploy Vercel](docs/DEPLOY-VERCEL.md)
- 🔧 [Solução de Problemas](docs/SOLUCAO-PROBLEMAS.md)
- 🤖 [Integração N8N](docs/N8N-INTEGRATION.md)
- 🗄️ [Configuração Vercel KV](docs/VERCEL-KV-SETUP.md)

## 🔗 APIs Disponíveis

### Adicionar Saldo
```http
POST /api/add-balance
Content-Type: application/json

{
  "userId": "user123",
  "amount": 100.00
}
```

### Consultar Saldo
```http
GET /api/get-balance?userId=user123
```

### Solicitar Saque
```http
POST /api/request-withdrawal
Content-Type: application/json

{
  "userId": "user123",
  "amount": 50.00,
  "pixKey": "usuario@email.com"
}
```

### Gerar PIX para Depósito
```http
POST /api/generate-pix-efi
Content-Type: application/json

{
  "amount": 100.00,
  "userId": "user123"
}
```

## 🏗️ Estrutura do Projeto

```
pix-ghost-main/
├── api/                    # Endpoints da API
│   ├── add-balance.js     # Adicionar saldo
│   ├── get-balance.js     # Consultar saldo
│   ├── generate-pix-efi.js # Gerar PIX
│   ├── request-withdrawal.js # Solicitar saque
│   └── webhook/           # Webhooks EFI
├── config/                # Configurações
├── docs/                  # Documentação
│   ├── GOOGLE-SHEETS-SETUP.md
│   ├── README-EFI.md
│   ├── DEPLOY-VERCEL.md
│   └── ...
├── scripts/               # Scripts de desenvolvimento
│   ├── test-*.js         # Scripts de teste
│   ├── setup-efi.js      # Configuração EFI
│   └── ...
├── utils/                 # Utilitários
│   ├── google-sheets.js   # Integração Google Sheets
│   └── kv-fallback.js     # Fallback de banco
├── index.html            # Interface web
├── script.js             # JavaScript frontend
├── style.css             # Estilos
├── server.js             # Servidor principal
├── .gitignore            # Arquivos ignorados pelo Git
└── README-PRINCIPAL.md   # Este arquivo
```

## 🔒 Segurança

- ✅ Certificados EFI Pay validados
- ✅ Variáveis de ambiente protegidas
- ✅ Validação de dados de entrada
- ✅ Logs de auditoria completos
- ✅ Sistema anônimo (sem dados pessoais)

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Faça o deploy

Veja `DEPLOY-VERCEL.md` para instruções detalhadas.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🆘 Suporte

Se encontrar problemas:
1. Consulte `SOLUCAO-PROBLEMAS.md`
2. Verifique `TROUBLESHOOTING.md`
3. Abra uma issue no repositório

---

**PIX Ghost** - Sistema de pagamentos PIX anônimo e seguro 🚀