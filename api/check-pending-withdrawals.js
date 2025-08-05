import { kv } from '../utils/kv-fallback.js';

// Endpoint para verificar saques pendentes (apenas leitura)
export default async function handler(request, response) {
    if (request.method !== 'GET') {
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

        // Buscar saques aprovados na planilha
        const approvedWithdrawals = await kv.checkWithdrawalApprovals();
        
        return response.status(200).json({
            success: true,
            pendingApprovals: approvedWithdrawals.length,
            withdrawals: approvedWithdrawals.map(w => ({
                transactionId: w.transactionId,
                userId: w.userId,
                pixKey: w.pixKey,
                amount: w.amount,
                netAmount: w.netAmount,
                fee: w.fee,
                timestamp: w.timestamp,
                status: w.status,
                adminApproval: w.admin_approval
            }))
        });

    } catch (error) {
        console.error('Erro ao verificar saques pendentes:', error);
        return response.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
}