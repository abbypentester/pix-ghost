import { kv } from '../utils/kv-fallback.js';
import { Resend } from 'resend';

// Inicializar Resend apenas se a chave estiver configurada
let resend = null;
if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')) {
    resend = new Resend(process.env.RESEND_API_KEY);
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Verificar se temos acesso ao método de verificação de aprovações
        if (!kv.checkWithdrawalApprovals) {
            return response.status(500).json({ 
                error: 'Google Sheets não configurado corretamente' 
            });
        }

        // Buscar saques aprovados na planilha
        const approvedWithdrawals = await kv.checkWithdrawalApprovals();
        
        if (approvedWithdrawals.length === 0) {
            return response.status(200).json({ 
                message: 'Nenhum saque pendente de aprovação encontrado',
                processed: 0
            });
        }

        const processedWithdrawals = [];
        const failedWithdrawals = [];

        for (const withdrawal of approvedWithdrawals) {
            try {
                // Aqui você pode integrar com a API da EFI para processar o PIX
                // Por enquanto, vamos simular o processamento
                const success = await processPixPayment(withdrawal);
                
                if (success) {
                    // Marcar como processado na planilha
                    await kv.markWithdrawalAsProcessed(withdrawal.transactionId, true);
                    
                    // Atualizar status da transação
                    await kv.hset(`transaction:${withdrawal.transactionId}`, {
                        status: 'completed',
                        processed_at: Date.now()
                    });
                    
                    processedWithdrawals.push(withdrawal);
                    
                    // Enviar e-mail de confirmação se configurado
                    if (resend) {
                        await sendConfirmationEmail(withdrawal);
                    }
                } else {
                    // Marcar como falhou na planilha
                    await kv.markWithdrawalAsProcessed(withdrawal.transactionId, false);
                    failedWithdrawals.push(withdrawal);
                }
            } catch (error) {
                console.error(`Erro ao processar saque ${withdrawal.transactionId}:`, error);
                failedWithdrawals.push(withdrawal);
                
                // Marcar como falhou na planilha
                await kv.markWithdrawalAsProcessed(withdrawal.transactionId, false);
            }
        }

        return response.status(200).json({
            message: 'Processamento de saques concluído',
            processed: processedWithdrawals.length,
            failed: failedWithdrawals.length,
            details: {
                processed: processedWithdrawals.map(w => w.transactionId),
                failed: failedWithdrawals.map(w => w.transactionId)
            }
        });

    } catch (error) {
        console.error('Erro ao processar saques aprovados:', error);
        return response.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
}

// Função para processar pagamento PIX (integrar com EFI)
async function processPixPayment(withdrawal) {
    try {
        // TODO: Integrar com a API da EFI para enviar PIX
        // Por enquanto, simular sucesso
        console.log(`Processando PIX para ${withdrawal.pixKey} no valor de R$ ${withdrawal.netAmount}`);
        
        // Simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simular sucesso (90% de chance)
        return Math.random() > 0.1;
    } catch (error) {
        console.error('Erro ao processar PIX:', error);
        return false;
    }
}

// Função para enviar e-mail de confirmação
async function sendConfirmationEmail(withdrawal) {
    try {
        if (!resend) return;
        
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.ADMIN_EMAIL || 'seu-email@exemplo.com',
            subject: 'Saque Processado com Sucesso',
            html: `
                <h1>Saque Processado</h1>
                <p><strong>ID da Transação:</strong> ${withdrawal.transactionId}</p>
                <p><strong>ID do Usuário:</strong> ${withdrawal.userId}</p>
                <p><strong>Chave PIX:</strong> ${withdrawal.pixKey}</p>
                <p><strong>Valor Enviado:</strong> R$ ${parseFloat(withdrawal.netAmount).toFixed(2)}</p>
                <p><strong>Taxa Cobrada:</strong> R$ ${parseFloat(withdrawal.fee).toFixed(2)}</p>
                <p><strong>Status:</strong> Processado com sucesso</p>
                <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            `,
        });
    } catch (error) {
        console.error('Erro ao enviar e-mail de confirmação:', error);
    }
}