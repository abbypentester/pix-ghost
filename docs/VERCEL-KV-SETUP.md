# Configuração do Vercel KV para Banco de Dados Persistente

## Problema Atual

O sistema está usando fallback em memória porque as variáveis do Vercel KV não estão configuradas. Isso causa:

- ❌ Saldo zerado a cada reinicialização do servidor
- ❌ Perda de histórico de transações
- ❌ Dados não persistentes

## Solução: Configurar Vercel KV

### 1. Criar um Banco KV no Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá para a aba **Storage**
3. Clique em **Create Database**
4. Selecione **KV (Key-Value)**
5. Escolha um nome para o banco (ex: `pix-ghost-db`)
6. Selecione a região mais próxima
7. Clique em **Create**

### 2. Obter as Variáveis de Ambiente

Após criar o banco KV:

1. Clique no banco criado
2. Vá para a aba **Settings**
3. Copie as seguintes variáveis:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 3. Configurar no Projeto Vercel

1. Vá para o seu projeto no Vercel
2. Acesse **Settings** → **Environment Variables**
3. Adicione as variáveis:

```
KV_REST_API_URL=https://your-kv-url.vercel-storage.com
KV_REST_API_TOKEN=your-token-here
```

### 4. Conectar o Banco ao Projeto

1. No Vercel Dashboard, vá para o seu projeto
2. Acesse a aba **Storage**
3. Clique em **Connect Store**
4. Selecione o banco KV criado
5. Clique em **Connect**

### 5. Fazer Redeploy

Após configurar as variáveis:

1. Vá para a aba **Deployments**
2. Clique nos três pontos do último deployment
3. Selecione **Redeploy**

## Verificação

Após o redeploy, verifique os logs:

- ✅ Deve aparecer: "Usando Vercel KV para armazenamento"
- ❌ Se aparecer: "Variáveis do Vercel KV não configuradas, usando fallback em memória"

## Benefícios Após Configuração

- ✅ Saldo persistente entre reinicializações
- ✅ Histórico completo de transações
- ✅ Dados seguros e criptografados
- ✅ Backup automático
- ✅ Escalabilidade automática

## Custos

- **Plano Hobby**: 30.000 operações/mês grátis
- **Plano Pro**: 500.000 operações/mês incluídas
- Operações adicionais: $0.30 por 100.000 operações

## Troubleshooting

### Erro: "Failed to connect to KV"
- Verifique se as variáveis estão corretas
- Confirme que o banco está na mesma região do projeto
- Tente recriar as variáveis de ambiente

### Saldo ainda zerado
- Confirme que o redeploy foi feito após configurar as variáveis
- Verifique os logs do servidor para confirmar o uso do KV
- Teste com uma nova transação

## Migração de Dados

Se você tinha dados no sistema anterior (localStorage), eles serão perdidos. O novo sistema KV começará limpo.

---

**Importante**: Após configurar o Vercel KV, o sistema funcionará como um banco digital real, com dados persistentes e seguros.