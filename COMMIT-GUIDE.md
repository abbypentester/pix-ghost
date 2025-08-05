# 📝 Guia para Commit no Git

## 🚀 Projeto Organizado e Pronto para Commit

O projeto PIX Ghost foi organizado e está pronto para ser commitado no Git. Aqui estão as instruções:

## 📁 Estrutura Organizada

### ✅ **Arquivos Principais (Raiz)**
- `server.js` - Servidor principal
- `index.html` - Interface web
- `script.js` - JavaScript frontend
- `style.css` - Estilos CSS
- `package.json` - Dependências do projeto
- `vercel.json` - Configuração Vercel
- `.env.example` - Exemplo de variáveis de ambiente
- `.gitignore` - Arquivos ignorados pelo Git
- `README-PRINCIPAL.md` - Documentação principal
- `README.md` - README original

### 📚 **Documentação (docs/)**
- `GOOGLE-SHEETS-SETUP.md` - Configuração Google Sheets
- `README-EFI.md` - Configuração EFI Pay
- `DEPLOY-VERCEL.md` - Deploy no Vercel
- `SOLUCAO-PROBLEMAS.md` - Solução de problemas
- `N8N-INTEGRATION.md` - Integração N8N
- `TROUBLESHOOTING.md` - Troubleshooting
- `VERCEL-KV-SETUP.md` - Configuração Vercel KV

### 🔧 **Scripts de Desenvolvimento (scripts/)**
- `test-*.js` - Scripts de teste
- `setup-efi.js` - Configuração EFI
- `create-valid-cert.js` - Criação de certificados
- `extract-*.js` - Scripts de extração
- `fix-certificate*.js` - Correção de certificados
- `debug-*.js` - Scripts de debug

### 🛠️ **APIs e Utilitários**
- `api/` - Endpoints da API
- `utils/` - Utilitários (Google Sheets, KV fallback)
- `config/` - Configurações

## 🔒 **Arquivos Protegidos (.gitignore)**

Os seguintes tipos de arquivos são automaticamente ignorados:
- ✅ Certificados e chaves (*.pem, *.p12)
- ✅ Arquivos de ambiente (.env.local)
- ✅ Service accounts do Google
- ✅ node_modules/
- ✅ Logs e arquivos temporários
- ✅ Scripts de desenvolvimento
- ✅ Arquivos de backup

## 🔧 **Pré-requisitos**

### Instalar o Git
O Git não está instalado no seu sistema. Você precisa instalá-lo primeiro:

1. **Opção 1 - Git for Windows (Recomendado):**
   - Baixe em: https://git-scm.com/download/win
   - Execute o instalador e siga as instruções padrão
   - Reinicie o terminal após a instalação

2. **Opção 2 - GitHub Desktop (Interface Gráfica):**
   - Baixe em: https://desktop.github.com/
   - Mais fácil para iniciantes
   - Interface visual para commits

3. **Opção 3 - Via Chocolatey (se instalado):**
   ```powershell
   choco install git
   ```

### Verificar Instalação
Após instalar, abra um novo terminal e teste:
```bash
git --version
```

## 📋 **Comandos para Commit**

### 1. **Inicializar Repositório Git** (se necessário)
```bash
git init
```

### 2. **Adicionar Arquivos**
```bash
# Adicionar todos os arquivos (respeitando .gitignore)
git add .

# Ou adicionar arquivos específicos
git add README-PRINCIPAL.md
git add api/
git add utils/
git add docs/
git add index.html script.js style.css
git add server.js package.json vercel.json
git add .gitignore
```

### 3. **Fazer o Commit**
```bash
git commit -m "🚀 Initial commit: PIX Ghost - Sistema de pagamentos PIX anônimo

✨ Features:
- Sistema completo de pagamentos PIX
- Interface web responsiva
- APIs REST para integração
- Integração Google Sheets como banco
- Integração EFI Pay para pagamentos
- Sistema anônimo baseado em IDs
- Documentação completa

📁 Estrutura:
- Documentação organizada em docs/
- Scripts de desenvolvimento em scripts/
- APIs REST em api/
- Utilitários em utils/
- Configurações em config/

🔒 Segurança:
- .gitignore configurado
- Certificados e chaves protegidos
- Variáveis de ambiente seguras"
```

### 4. **Adicionar Remote** (se necessário)
```bash
git remote add origin <URL_DO_SEU_REPOSITORIO>
```

### 5. **Push para o Repositório**
```bash
git push -u origin main
```

## 🎯 **Próximos Passos Após o Commit**

1. **Configure as variáveis de ambiente** no seu ambiente de produção
2. **Siga a documentação** em `docs/` para configurar:
   - Google Sheets API
   - EFI Pay
   - Deploy no Vercel
3. **Teste o sistema** usando os scripts em `scripts/`

## ⚠️ **Importante**

- ✅ **NUNCA** commite arquivos `.env.local`
- ✅ **NUNCA** commite certificados (*.pem, *.p12)
- ✅ **NUNCA** commite service accounts do Google
- ✅ **SEMPRE** use `.env.example` como template
- ✅ **SEMPRE** documente mudanças importantes

## 🔍 **Verificar Antes do Commit**

```bash
# Ver status dos arquivos
git status

# Ver diferenças
git diff

# Ver arquivos que serão commitados
git diff --cached
```

---

**PIX Ghost** está pronto para produção! 🚀