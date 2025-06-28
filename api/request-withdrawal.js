import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Função para gerar um ID único para a transação
function generateTransactionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userId, pixKey } = request.body;

        if (!userId || !pixKey) {
            return response.status(400).json({ error: 'ID do usuário e Chave PIX são obrigatórios.' });
        }

        // Obter o saldo atual do usuário usando hget (hash get) conforme implementado em get-balance.js
        const balance = await kv.hget(`user:${userId}`, 'balance') || 0;
        
        // Converter para número se for string
        const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;

        if (balanceNum <= 0) {
            return response.status(400).json({ error: 'Saldo insuficiente para saque.' });
        }

        const fee = 0.10; // 10% de taxa para saques (conforme solicitado)
        const withdrawableBalance = balanceNum * (1 - fee);
        const feeAmount = balanceNum * fee;

        // Gerar um ID único para a transação
        const transactionId = generateTransactionId();
        
        // Enviar e-mail de notificação para você
        await resend.emails.send({
            from: 'onboarding@resend.dev', // Use um domínio verificado no Resend
            to: process.env.ADMIN_EMAIL || 'seu-email@exemplo.com', // Usar variável de ambiente para o email
            subject: 'Nova Solicitação de Saque',
            html: `
                <h1>Nova Solicitação de Saque</h1>
                <p><strong>ID da Transação:</strong> ${transactionId}</p>
                <p><strong>ID do Usuário:</strong> ${userId}</p>
                <p><strong>Chave PIX:</strong> ${pixKey}</p>
                <p><strong>Saldo Bruto no Momento da Solicitação:</strong> R$ ${balanceNum.toFixed(2)}</p>
                <p><strong>Taxa (10%):</strong> R$ ${feeAmount.toFixed(2)}</p>
                <p><strong>Valor a ser Enviado (Líquido):</strong> R$ ${withdrawableBalance.toFixed(2)}</p>
                <p>Por favor, processe o saque manualmente.</p>
            `,
        });

        // Registrar a transação no banco de dados
        await kv.hset(`transaction:${transactionId}`, {
            userId,
            type: 'withdrawal',
            amount: -balanceNum,
            netAmount: -withdrawableBalance,
            fee: feeAmount,
            pixKey,
            timestamp: Date.now(),
            status: 'pending' // Será processado manualmente
        });
        
        // Adicionar a transação à lista de transações do usuário
        await kv.lpush(`user:${userId}:transactions`, transactionId);
        
        // Debitar o saldo do usuário automaticamente
        await kv.hincrby(`user:${userId}`, 'balance', -balanceNum);
        
        return response.status(200).json({ 
            message: 'Sua solicitação de saque foi recebida! O valor será enviado para sua chave PIX em até 24 horas.',
            transactionId
        });

    } catch (error) {
        console.error('Erro ao processar solicitação de saque:', error);
        return response.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
}