import { kv } from '../../utils/kv-fallback.js';
import { Resend } from 'resend';

// Inicializar Resend apenas se a chave estiver configurada
let resend = null;
if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')) {
    resend = new Resend(process.env.RESEND_API_KEY);
}

// Webhook para processar saques aprovados (ideal para n8n)
export default async function handler(request, response) {
    // Aceitar GET e POST para flexibilidade com n8n
    if (request.method !== 'POST' && request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Verificar se temos acesso ao método de verificação de aprovações
        if (!kv.checkWithdrawalApprovals) {
            return response.status(500).json({ 
                error: 'Google Sheets não configurado corretamente',
                message: 'Configure GOOGLE_SHEETS_ID e GOOGLE_SERVICE_ACCOUNT_PATH'
            });
        }

        console.log('🔄 Iniciando processamento de saques aprovados...');

        // Buscar saques aprovados na planilha
        const approvedWithdrawals = await kv.checkWithdrawalApprovals();
        
        if (approvedWithdrawals.length === 0) {
            console.log('ℹ️ Nenhum saque pendente de aprovação encontrado');
            return response.status(200).json({ 
                success: true,
                message: 'Nenhum saque pendente de aprovação encontrado',
                processed: 0,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📋 Encontrados ${approvedWithdrawals.length} saques aprovados`);

        const processedWithdrawals = [];
        const failedWithdrawals = [];

        for (const withdrawal of approvedWithdrawals) {
            try {
                console.log(`💰 Processando saque ${withdrawal.transactionId}...`);
                
                // Simular processamento PIX (aqui você integraria com a EFI)
                const success = await simulatePixPayment(withdrawal);
                
                if (success) {
                    // Marcar como processado na planilha
                    await kv.markWithdrawalAsProcessed(withdrawal.transactionId, true);
                    
                    // Atualizar status da transação
                    await kv.hset(`transaction:${withdrawal.transactionId}`, {
                        status: 'completed',
                        processed_at: Date.now()
                    });
                    
                    processedWithdrawals.push({
                        transactionId: withdrawal.transactionId,
                        userId: withdrawal.userId,
                        amount: withdrawal.netAmount,
                        pixKey: withdrawal.pixKey,
                        status: 'completed'
                    });
                    
                    console.log(`✅ Saque ${withdrawal.transactionId} processado com sucesso`);
                    
                    // Enviar notificação por e-mail se configurado
                    if (resend) {
                        await sendSuccessNotification(withdrawal);
                    }
                } else {
                    // Marcar como falhou na planilha
                    await kv.markWithdrawalAsProcessed(withdrawal.transactionId, false);
                    
                    failedWithdrawals.push({
                        transactionId: withdrawal.transactionId,
                        userId: withdrawal.userId,
                        amount: withdrawal.netAmount,
                        pixKey: withdrawal.pixKey,
                        status: 'failed',
                        error: 'Falha no processamento PIX'
                    });
                    
                    console.log(`❌ Falha ao processar saque ${withdrawal.transactionId}`);
                }
            } catch (error) {
                console.error(`💥 Erro ao processar saque ${withdrawal.transactionId}:`, error);
                
                failedWithdrawals.push({
                    transactionId: withdrawal.transactionId,
                    userId: withdrawal.userId,
                    amount: withdrawal.netAmount,
                    pixKey: withdrawal.pixKey,
                    status: 'failed',
                    error: error.message
                });
                
                // Marcar como falhou na planilha
                try {
                    await kv.markWithdrawalAsProcessed(withdrawal.transactionId, false);
                } catch (markError) {
                    console.error('Erro ao marcar saque como falhou:', markError);
                }
            }
        }

        const result = {
            success: true,
            message: 'Processamento de saques concluído',
            summary: {
                total: approvedWithdrawals.length,
                processed: processedWithdrawals.length,
                failed: failedWithdrawals.length
            },
            details: {
                processed: processedWithdrawals,
                failed: failedWithdrawals
            },
            timestamp: new Date().toISOString()
        };

        console.log('📊 Resumo do processamento:', result.summary);

        // Enviar notificação de resumo se houver falhas
        if (failedWithdrawals.length > 0 && resend) {
            await sendFailureNotification(result.summary, failedWithdrawals);
        }

        return response.status(200).json(result);

    } catch (error) {
        console.error('💥 Erro crítico ao processar saques aprovados:', error);
        
        return response.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Função para simular processamento PIX (substituir pela integração real com EFI)
async function simulatePixPayment(withdrawal) {
    try {
        console.log(`🔄 Simulando PIX para ${withdrawal.pixKey} no valor de R$ ${withdrawal.netAmount}`);
        
        // Simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular sucesso (95% de chance para teste)
        const success = Math.random() > 0.05;
        
        if (success) {
            console.log(`✅ PIX simulado com sucesso para ${withdrawal.pixKey}`);
        } else {
            console.log(`❌ Falha simulada no PIX para ${withdrawal.pixKey}`);
        }
        
        return success;
    } catch (error) {
        console.error('💥 Erro na simulação PIX:', error);
        return false;
    }
}

// Função para enviar notificação de sucesso
async function sendSuccessNotification(withdrawal) {
    try {
        if (!resend) return;
        
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.ADMIN_EMAIL || 'admin@exemplo.com',
            subject: '✅ Saque Processado com Sucesso',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">✅ Saque Processado com Sucesso</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Detalhes da Transação</h3>
                        <p><strong>ID da Transação:</strong> ${withdrawal.transactionId}</p>
                        <p><strong>ID do Usuário:</strong> ${withdrawal.userId}</p>
                        <p><strong>Chave PIX:</strong> ${withdrawal.pixKey}</p>
                        <p><strong>Valor Enviado:</strong> R$ ${parseFloat(withdrawal.netAmount).toFixed(2)}</p>
                        <p><strong>Taxa Cobrada:</strong> R$ ${parseFloat(withdrawal.fee).toFixed(2)}</p>
                        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <p style="color: #28a745; font-weight: bold;">Status: Processado com sucesso ✅</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('📧 Erro ao enviar notificação de sucesso:', error);
    }
}

// Função para enviar notificação de falhas
async function sendFailureNotification(summary, failedWithdrawals) {
    try {
        if (!resend) return;
        
        const failureList = failedWithdrawals.map(w => 
            `<li>${w.transactionId} - ${w.pixKey} - R$ ${w.amount} - ${w.error}</li>`
        ).join('');
        
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.ADMIN_EMAIL || 'admin@exemplo.com',
            subject: '⚠️ Falhas no Processamento de Saques',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc3545;">⚠️ Relatório de Processamento de Saques</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Resumo</h3>
                        <p><strong>Total processados:</strong> ${summary.total}</p>
                        <p><strong>Sucessos:</strong> ${summary.processed}</p>
                        <p><strong>Falhas:</strong> ${summary.failed}</p>
                    </div>
                    
                    ${summary.failed > 0 ? `
                        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h3 style="color: #856404;">Saques com Falha</h3>
                            <ul style="color: #856404;">
                                ${failureList}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('📧 Erro ao enviar notificação de falhas:', error);
    }
}