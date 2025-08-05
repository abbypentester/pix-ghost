import { kv } from '../../utils/kv-fallback.js';
import crypto from 'crypto';

// Função para gerar ID único de transação
function generateTransactionId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// Função para adicionar saldo automaticamente
async function addBalanceAutomatically(userId, amount, txid) {
    try {
        const transactionId = generateTransactionId();
        const timestamp = new Date().toISOString();
        
        // Dados da transação
        const transactionData = {
            id: transactionId,
            userId: userId,
            amount: parseFloat(amount),
            type: 'deposit',
            paymentId: txid,
            timestamp: timestamp,
            status: 'completed',
            method: 'pix_efi',
            webhook: true
        };
        
        // Salvar transação
        await kv.set(`transaction:${transactionId}`, transactionData);
        
        // Adicionar à lista de transações do usuário
        await kv.lpush(`user:${userId}:transactions`, transactionId);
        
        // Incrementar saldo do usuário atomicamente
        const newBalance = await kv.incrbyfloat(`user:${userId}`, parseFloat(amount));
        
        console.log(`Saldo adicionado automaticamente via webhook: Usuário ${userId}, Valor: ${amount}, Novo saldo: ${newBalance}`);
        
        return {
            success: true,
            transactionId,
            newBalance,
            amount: parseFloat(amount)
        };
        
    } catch (error) {
        console.error('Erro ao adicionar saldo automaticamente:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-hub-signature-256');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const webhookData = req.body;
        
        console.log('Webhook EFI recebido:', JSON.stringify(webhookData, null, 2));
        
        // Verificar se é uma notificação de PIX
        if (!webhookData.pix || !Array.isArray(webhookData.pix) || webhookData.pix.length === 0) {
            console.log('Webhook não contém dados de PIX válidos');
            return res.status(200).json({ message: 'Webhook processado - sem dados PIX' });
        }
        
        // Processar cada PIX recebido
        for (const pixData of webhookData.pix) {
            try {
                const { txid, valor, horario } = pixData;
                
                if (!txid || !valor) {
                    console.log('Dados PIX incompletos:', pixData);
                    continue;
                }
                
                console.log(`Processando PIX: txid=${txid}, valor=${valor}`);
                
                // Verificar se já processamos esta transação
                const existingTransaction = await kv.get(`webhook_processed:${txid}`);
                if (existingTransaction) {
                    console.log(`Transação ${txid} já foi processada anteriormente`);
                    continue;
                }
                
                // Marcar como processada
                await kv.set(`webhook_processed:${txid}`, {
                    processed_at: new Date().toISOString(),
                    valor: valor,
                    horario: horario
                }, { ex: 86400 * 7 }); // Expira em 7 dias
                
                // Buscar todas as transações pendentes para encontrar o usuário
                // Como o sistema é anônimo, precisamos encontrar qual usuário fez esta cobrança
                const allKeys = await kv.keys('transaction:*');
                let targetUserId = null;
                
                for (const key of allKeys) {
                    const transaction = await kv.get(key);
                    if (transaction && transaction.paymentId === txid && transaction.status === 'pending') {
                        targetUserId = transaction.userId;
                        break;
                    }
                }
                
                if (!targetUserId) {
                    // Se não encontramos uma transação pendente, criar um usuário genérico
                    // Isso pode acontecer se o webhook chegar antes da transação ser criada
                    targetUserId = `webhook_user_${Date.now()}`;
                    console.log(`Criando usuário genérico para PIX órfão: ${targetUserId}`);
                }
                
                // Adicionar saldo automaticamente
                const result = await addBalanceAutomatically(targetUserId, valor, txid);
                
                console.log(`PIX processado com sucesso: ${JSON.stringify(result)}`);
                
            } catch (pixError) {
                console.error('Erro ao processar PIX individual:', pixError);
                // Continuar processando outros PIX mesmo se um falhar
            }
        }
        
        return res.status(200).json({ 
            message: 'Webhook processado com sucesso',
            processed_pix: webhookData.pix.length
        });
        
    } catch (error) {
        console.error('Erro ao processar webhook EFI:', error);
        
        return res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}