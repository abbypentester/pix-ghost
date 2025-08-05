import dotenv from 'dotenv';
import { kv } from './utils/kv-fallback.js';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function testGoogleSheets() {
    console.log('🧪 Testando integração com Google Sheets...');
    console.log('=' .repeat(50));

    try {
        // Teste 1: Verificar configuração
        console.log('\n1. Verificando configuração...');
        const hasConfig = process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
        
        if (!hasConfig) {
            console.log('❌ Configuração incompleta!');
            console.log('   Configure GOOGLE_SHEETS_ID e GOOGLE_SERVICE_ACCOUNT_PATH no .env.local');
            return;
        }
        
        console.log('✅ Configuração encontrada');
        console.log(`   Planilha ID: ${process.env.GOOGLE_SHEETS_ID}`);
        console.log(`   Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_PATH}`);

        // Teste 2: Criar usuário de teste
        console.log('\n2. Criando usuário de teste...');
        const testUserId = `test_user_${Date.now()}`;
        const testBalance = 100.50;
        
        await kv.hset(`user:${testUserId}`, {
            balance: testBalance,
            created_at: new Date().toISOString()
        });
        
        console.log(`✅ Usuário criado: ${testUserId}`);
        console.log(`   Saldo inicial: R$ ${testBalance}`);

        // Teste 3: Verificar se o usuário foi salvo
        console.log('\n3. Verificando dados do usuário...');
        const savedBalance = await kv.hget(`user:${testUserId}`, 'balance');
        
        if (savedBalance) {
            console.log(`✅ Saldo recuperado: R$ ${savedBalance}`);
        } else {
            console.log('❌ Erro ao recuperar saldo');
            return;
        }

        // Teste 4: Criar transação de teste
        console.log('\n4. Criando transação de teste...');
        const testTransactionId = `test_tx_${Date.now()}`;
        
        await kv.hset(`transaction:${testTransactionId}`, {
            userId: testUserId,
            type: 'deposit',
            amount: 50.25,
            paymentId: 'test_pix_123',
            timestamp: Date.now(),
            status: 'completed'
        });
        
        console.log(`✅ Transação criada: ${testTransactionId}`);

        // Teste 5: Atualizar saldo
        console.log('\n5. Atualizando saldo...');
        const newBalance = await kv.hincrby(`user:${testUserId}`, 'balance', 25.75);
        console.log(`✅ Novo saldo: R$ ${newBalance}`);

        // Teste 6: Criar solicitação de saque (se método disponível)
        if (kv.addWithdrawalRequest) {
            console.log('\n6. Criando solicitação de saque...');
            const withdrawalId = `test_withdrawal_${Date.now()}`;
            
            await kv.addWithdrawalRequest(withdrawalId, {
                userId: testUserId,
                pixKey: 'test@email.com',
                amount: 100,
                netAmount: 90,
                fee: 10,
                timestamp: Date.now()
            });
            
            console.log(`✅ Solicitação de saque criada: ${withdrawalId}`);
            console.log('   Verifique a aba "saques_pendentes" na planilha');
            console.log('   Para aprovar, digite "APROVADO" na coluna admin_approval');
        }

        // Teste 7: Verificar aprovações (se método disponível)
        if (kv.checkWithdrawalApprovals) {
            console.log('\n7. Verificando aprovações pendentes...');
            const approvals = await kv.checkWithdrawalApprovals();
            console.log(`✅ Aprovações encontradas: ${approvals.length}`);
            
            if (approvals.length > 0) {
                console.log('   Saques aprovados:');
                approvals.forEach(approval => {
                    console.log(`   - ${approval.transactionId}: R$ ${approval.netAmount}`);
                });
            }
        }

        console.log('\n' + '=' .repeat(50));
        console.log('🎉 Teste concluído com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Abra sua planilha do Google Sheets');
        console.log('2. Verifique se os dados de teste aparecem nas abas');
        console.log('3. Teste a aprovação manual de saques');
        console.log('4. Execute /api/process-withdrawals para processar aprovações');
        
    } catch (error) {
        console.error('\n❌ Erro durante o teste:', error);
        console.log('\n🔧 Possíveis soluções:');
        console.log('1. Verifique se o arquivo google-service-account.json existe');
        console.log('2. Confirme se a planilha foi compartilhada com a service account');
        console.log('3. Verifique se a API do Google Sheets está ativada');
        console.log('4. Confirme se o GOOGLE_SHEETS_ID está correto');
    }
}

// Executar teste
testGoogleSheets();