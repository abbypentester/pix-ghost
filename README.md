# Sistema de Pagamentos e Saques

## Descrição
Este sistema permite que usuários realizem pagamentos via PIX e solicitem saques. O sistema utiliza a Caos como processadora de pagamentos e implementa taxas de 10% para saques.

## Funcionalidades
- Geração de pagamentos via PIX
- Verificação automática de pagamentos
- Solicitação de saques com taxa de 10%
- Registro de transações no banco de dados
- Notificação por email para solicitações de saque
- Histórico de transações para usuários

## Tecnologias Utilizadas
- HTML, CSS e JavaScript (Frontend)
- Vercel Serverless Functions (Backend)
- Vercel KV (Banco de Dados)
- Resend (Serviço de Email)

## Deploy na Vercel

### Pré-requisitos
1. Conta na Vercel
2. Conta no Resend para envio de emails
3. Configuração do Vercel KV

### Passos para Deploy

1. Faça login na sua conta Vercel
2. Importe este repositório
3. Configure as variáveis de ambiente diretamente na interface da Vercel:
   - Vá para Settings > Environment Variables
   - Adicione as seguintes variáveis:
     - `RESEND_API_KEY`: Sua chave de API do Resend
     - `ADMIN_EMAIL`: Email para receber notificações de saques

4. Configure o Vercel KV:
   - Na dashboard da Vercel, vá para Storage > KV
   - Crie uma nova instância do KV (ou use uma existente)
   - Conecte a instância ao seu projeto através da interface

5. Clique em Deploy

### Estrutura do Banco de Dados (Vercel KV)

O sistema utiliza as seguintes estruturas no KV:

- `user:{userId}`: Hash contendo o saldo do usuário
  - `balance`: Saldo atual

- `user:{userId}:transactions`: Lista de IDs de transações do usuário

- `transaction:{transactionId}`: Hash contendo detalhes da transação
  - `userId`: ID do usuário
  - `type`: Tipo da transação (deposit/withdrawal)
  - `amount`: Valor bruto da transação
  - `netAmount`: Valor líquido (após taxas)
  - `fee`: Valor da taxa
  - `timestamp`: Data e hora da transação
  - `status`: Status da transação
  - `pixKey`: Chave PIX (para saques)
  - `paymentId`: ID do pagamento (para depósitos)

## Manutenção

Os saques são processados manualmente. Quando um usuário solicita um saque:
1. Um email é enviado para o endereço configurado em `ADMIN_EMAIL`
2. O saldo do usuário é automaticamente debitado
3. O administrador deve processar o saque manualmente enviando o valor para a chave PIX informada