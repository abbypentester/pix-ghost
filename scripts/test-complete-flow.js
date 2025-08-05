// Script para testar o fluxo completo de PIX
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
    console.log('=== TESTE COMPLETO DO FLUXO PIX ===\n');
    
    try {
        // 1. Testar geração de PIX
        console.log('1. Testando geração de PIX...');
        const generateResponse = await fetch(`${BASE_URL}/api/generate-pix-efi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 10.00,
                description: 'Teste de depósito'
            })
        });
        
        if (!generateResponse.ok) {
            const errorText = await generateResponse.text();
            console.error('❌ Erro na geração:', errorText);
            return;
        }
        
        const generateData = await generateResponse.json();
        console.log('✅ PIX gerado com sucesso');
        console.log('   TXID:', generateData.txid);
        console.log('   Comprimento:', generateData.txid.length);
        console.log('   Válido:', /^[a-zA-Z0-9]{26,35}$/.test(generateData.txid));
        
        // 2. Aguardar um pouco
        console.log('\n2. Aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Testar verificação de PIX
        console.log('\n3. Testando verificação de PIX...');
        const verifyResponse = await fetch(`${BASE_URL}/api/verify-pix-efi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                txid: generateData.txid
            })
        });
        
        if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            console.error('❌ Erro na verificação:', errorText);
            
            // Tentar parsear como JSON para ver detalhes
            try {
                const errorJson = JSON.parse(errorText);
                console.log('   Detalhes do erro:', errorJson);
            } catch (e) {
                console.log('   Erro não é JSON válido');
            }
            return;
        }
        
        const verifyData = await verifyResponse.json();
        console.log('✅ Verificação realizada');
        console.log('   Status:', verifyData.status);
        console.log('   Pago:', verifyData.paid);
        console.log('   TXID retornado:', verifyData.txid);
        
        // 4. Testar consulta de saldo
        console.log('\n4. Testando consulta de saldo...');
        const testUserId = 'test-user-' + Date.now();
        const balanceResponse = await fetch(`${BASE_URL}/api/get-balance?userId=${testUserId}`);
        
        if (!balanceResponse.ok) {
            console.error('❌ Erro na consulta de saldo');
            return;
        }
        
        const balanceData = await balanceResponse.json();
        console.log('✅ Consulta de saldo realizada');
        console.log('   Saldo:', balanceData.balance);
        console.log('   Sistema de armazenamento:', balanceData.balance === 0 ? 'Memória (KV não configurado)' : 'KV configurado');
        
        // 5. Testar adição de saldo
        console.log('\n5. Testando adição de saldo...');
        const addBalanceResponse = await fetch(`${BASE_URL}/api/add-balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: testUserId,
                amount: 50.00,
                transactionType: 'deposit',
                paymentId: generateData.txid
            })
        });
        
        if (!addBalanceResponse.ok) {
            console.error('❌ Erro ao adicionar saldo');
            return;
        }
        
        const addBalanceData = await addBalanceResponse.json();
        console.log('✅ Saldo adicionado');
        console.log('   Novo saldo:', addBalanceData.newBalance);
        
        // 6. Verificar saldo novamente
        console.log('\n6. Verificando saldo após adição...');
        const newBalanceResponse = await fetch(`${BASE_URL}/api/get-balance?userId=${testUserId}&includeTransactions=true`);
        const newBalanceData = await newBalanceResponse.json();
        
        console.log('✅ Saldo verificado');
        console.log('   Saldo atual:', newBalanceData.balance);
        console.log('   Transações:', newBalanceData.transactions?.length || 0);
        
        console.log('\n=== RESUMO DO TESTE ===');
        console.log('✅ Geração de PIX: OK');
        console.log(verifyData.success ? '✅ Verificação de PIX: OK' : '❌ Verificação de PIX: ERRO');
        console.log('✅ Sistema de saldo: OK');
        console.log('✅ Persistência:', newBalanceData.balance > 0 ? 'OK' : 'Usando memória (configure KV)');
        
    } catch (error) {
        console.error('❌ Erro geral no teste:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Executar teste
testCompleteFlow();