# Configuração do Google Sheets como Banco de Dados

Este guia explica como configurar o Google Sheets para substituir o Vercel KV como banco de dados do sistema PIX Ghost.

## Vantagens do Google Sheets

- ✅ **Interface visual** para gerenciar dados
- ✅ **Aprovação manual de saques** através de uma coluna na planilha
- ✅ **Gratuito** para uso básico
- ✅ **Fácil de usar** - não requer conhecimento técnico
- ✅ **Backup automático** pelo Google

## Passo 1: Criar um Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID** para usar depois

## Passo 2: Ativar a API do Google Sheets

1. No Google Cloud Console, vá para **APIs & Services > Library**
2. Procure por "Google Sheets API"
3. Clique em **Enable**

## Passo 3: Criar uma Service Account

1. Vá para **APIs & Services > Credentials**
2. Clique em **Create Credentials > Service Account**
3. Preencha os dados:
   - **Service account name**: `pix-ghost-sheets`
   - **Description**: `Service account para PIX Ghost acessar Google Sheets`
4. Clique em **Create and Continue**
5. Pule as permissões opcionais e clique em **Done**

## Passo 4: Gerar Chave da Service Account

1. Na lista de Service Accounts, clique na que você criou
2. Vá para a aba **Keys**
3. Clique em **Add Key > Create new key**
4. Selecione **JSON** e clique em **Create**
5. O arquivo JSON será baixado automaticamente
6. **Renomeie** o arquivo para `google-service-account.json`
7. **Mova** o arquivo para a pasta raiz do projeto

## Passo 5: Criar a Planilha do Google Sheets

1. Acesse o [Google Sheets](https://sheets.google.com/)
2. Crie uma nova planilha
3. **Renomeie** a planilha para "PIX Ghost Database"
4. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/[ID_DA_PLANILHA]/edit
   ```

## Passo 6: Compartilhar a Planilha

1. Na planilha, clique em **Compartilhar**
2. Adicione o **email da service account** (encontrado no arquivo JSON baixado)
3. Defina a permissão como **Editor**
4. Clique em **Enviar**

## Passo 7: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite o arquivo `.env.local` e configure:
   ```env
   # Configurações do Google Sheets
   GOOGLE_SHEETS_ID=seu_id_da_planilha_aqui
   GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json
   ```

## Estrutura das Planilhas

O sistema criará automaticamente 3 abas na planilha:

### 1. **usuarios**
- `userId`: ID único do usuário
- `balance`: Saldo atual
- `created_at`: Data de criação
- `updated_at`: Última atualização

### 2. **transacoes**
- `transactionId`: ID único da transação
- `userId`: ID do usuário
- `type`: Tipo (deposit/withdrawal)
- `amount`: Valor
- `paymentId`: ID do pagamento PIX
- `timestamp`: Data/hora
- `status`: Status da transação

### 3. **saques_pendentes** (PRINCIPAL PARA APROVAÇÃO)
- `transactionId`: ID da transação
- `userId`: ID do usuário
- `pixKey`: Chave PIX de destino
- `amount`: Valor bruto
- `netAmount`: Valor líquido (após taxa)
- `fee`: Taxa cobrada
- `timestamp`: Data/hora da solicitação
- `status`: Status atual
- **`admin_approval`**: **COLUNA PARA APROVAÇÃO** ⭐
- `admin_notes`: Observações do admin
- `processed_at`: Data/hora do processamento

## Como Aprovar Saques

### Método Manual (Recomendado)

1. Abra a planilha no Google Sheets
2. Vá para a aba **saques_pendentes**
3. Encontre o saque que deseja aprovar
4. Na coluna **admin_approval**, digite:
   - `APROVADO` ou `APROVADA` para aprovar
   - `RECUSADO` ou `RECUSADA` para recusar
5. Opcionalmente, adicione observações na coluna **admin_notes**

### Processamento Automático

Para processar os saques aprovados, faça uma requisição POST para:
```
POST /api/process-withdrawals
```

Ou configure um cron job para executar automaticamente.

## Testando a Configuração

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Verifique os logs para confirmar:
   ```
   📊 Usando Google Sheets como banco de dados
   ```

3. Faça um teste de depósito e saque para verificar se os dados aparecem na planilha

## Segurança

⚠️ **IMPORTANTE**: 
- **NUNCA** commite o arquivo `google-service-account.json` no Git
- Adicione `google-service-account.json` ao `.gitignore`
- Mantenha as credenciais seguras
- Use permissões mínimas necessárias

## Troubleshooting

### Erro: "Arquivo de service account não encontrado"
- Verifique se o arquivo `google-service-account.json` está na pasta raiz
- Confirme o caminho no `.env.local`

### Erro: "Permission denied"
- Verifique se a planilha foi compartilhada com a service account
- Confirme se a permissão é de "Editor"

### Erro: "Spreadsheet not found"
- Verifique se o `GOOGLE_SHEETS_ID` está correto
- Confirme se a planilha existe e está acessível

### Planilha não cria abas automaticamente
- Verifique se a API do Google Sheets está ativada
- Confirme as permissões da service account

## Migração do Vercel KV

Se você já tem dados no Vercel KV, será necessário migrar manualmente:

1. Exporte os dados do KV
2. Importe para as respectivas abas do Google Sheets
3. Ajuste o formato conforme necessário

## Monitoramento

- Monitore os logs do servidor para erros de conexão
- Verifique regularmente a aba **saques_pendentes** para novos saques
- Configure notificações no Google Sheets para novos dados (opcional)

---

**Pronto!** Agora você tem um sistema completo de gerenciamento PIX com aprovação manual através do Google Sheets! 🎉