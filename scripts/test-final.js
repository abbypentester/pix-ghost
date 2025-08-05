const fs = require('fs');
const path = require('path');
const EfiPay = require('sdk-node-apis-efi');
require('dotenv').config({ path: '.env.local' });

// Função para teste final com certificado original
function testFinal() {
    console.log('🎯 TESTE FINAL - CERTIFICADO ORIGINAL COM PEMKEY\n');
    
    try {
        // Caminho do certificado original
        const originalCertPath = path.join(__dirname, '..', 'certificado.pem');
        
        if (!fs.existsSync(originalCertPath)) {
            console.log('❌ Certificado original não encontrado:', originalCertPath);
            return false;
        }
        
        console.log('📁 Certificado original:', originalCertPath);
        
        // Configuração EFI com pemKey igual ao certificate
        const efiConfig = {
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET,
            certificate: originalCertPath,
            pemKey: originalCertPath, // MESMO VALOR!
            sandbox: true,
            debug: false
        };
        
        console.log('🔧 Configuração EFI:');
        console.log('   Client ID:', efiConfig.client_id ? '✅ Configurado' : '❌ Não configurado');
        console.log('   Client Secret:', efiConfig.client_secret ? '✅ Configurado' : '❌ Não configurado');
        console.log('   Certificate:', efiConfig.certificate);
        console.log('   PemKey:', efiConfig.pemKey);
        console.log('   Sandbox:', efiConfig.sandbox);
        console.log('   ✅ Certificate e PemKey são iguais!');
        
        // Instanciar SDK
        console.log('\n🚀 Instanciando SDK EFI...');
        const efipay = new EfiPay(efiConfig);
        console.log('✅ SDK EFI instanciado com sucesso');
        
        // Testar criação de cobrança PIX
        console.log('\n📝 Testando criação de cobrança PIX...');
        
        const txid = 'test' + Date.now().toString().slice(-10);
        console.log('TxID:', txid);
        
        const body = {
            calendario: {
                expiracao: 3600
            },
            devedor: {
                cpf: '12345678909',
                nome: 'Francisco da Silva'
            },
            valor: {
                original: '1.00'
            },
            chave: process.env.EFI_PIX_KEY,
            solicitacaoPagador: 'Teste de integração PIX'
        };
        
        const params = {
            txid: txid
        };
        
        // Fazer a requisição
        return new Promise((resolve, reject) => {
            efipay.pixCreateImmediateCharge(params, body)
                .then(response => {
                    console.log('\n🎉 SUCESSO! Cobrança PIX criada:');
                    console.log('   TxID:', response.txid);
                    console.log('   Status:', response.status);
                    console.log('   Valor:', response.valor?.original);
                    
                    if (response.loc && response.loc.qrcode) {
                        console.log('   QR Code:', response.loc.qrcode.substring(0, 50) + '...');
                    }
                    
                    console.log('\n🎉 CERTIFICADO FUNCIONANDO PERFEITAMENTE!');
                    console.log('   O sistema PIX Ghost está 100% operacional!');
                    
                    resolve(true);
                })
                .catch(err => {
                    console.log('\n❌ Erro na criação da cobrança:', err.message);
                    
                    if (err.code) {
                        console.log('📋 Código do erro:', err.code);
                    }
                    
                    if (err.error_description) {
                        console.log('📋 Descrição:', err.error_description);
                    }
                    
                    // Verificar se é erro de certificado
                    if (err.message.includes('pemKey')) {
                        console.log('\n🔧 PROBLEMA IDENTIFICADO: pemKey');
                        console.log('   O certificado precisa conter a chave privada');
                        console.log('   Baixe o certificado .p12 completo do painel EFI');
                    } else if (err.message.includes('DECODER')) {
                        console.log('\n🔧 PROBLEMA IDENTIFICADO: Formato do certificado');
                        console.log('   O certificado pode estar corrompido ou em formato incorreto');
                    } else if (err.message.includes('unauthorized')) {
                        console.log('\n🔧 PROBLEMA IDENTIFICADO: Credenciais');
                        console.log('   Verifique Client_Id e Client_Secret');
                    }
                    
                    reject(err);
                });
        });
        
    } catch (error) {
        console.log('\n❌ Erro no teste:', error.message);
        return false;
    }
}

// Executar teste
async function runTest() {
    console.log('🚀 TESTE FINAL DO SISTEMA PIX GHOST\n');
    
    try {
        const success = await testFinal();
        
        if (success) {
            console.log('\n' + '='.repeat(60));
            console.log('🎉 SISTEMA PIX GHOST FUNCIONANDO!');
            console.log('✅ Certificado configurado corretamente');
            console.log('✅ SDK EFI operacional');
            console.log('✅ Criação de cobranças PIX funcionando');
            console.log('\n🚀 O sistema está pronto para produção!');
            console.log('='.repeat(60));
        } else {
            console.log('\n' + '='.repeat(60));
            console.log('❌ SISTEMA COM PROBLEMAS');
            console.log('\n🔧 Próximos passos:');
            console.log('   1. Baixe o certificado .p12 completo do painel EFI');
            console.log('   2. Converta para .pem com chave privada incluída');
            console.log('   3. Verifique as credenciais Client_Id e Client_Secret');
            console.log('   4. Configure uma chave PIX válida');
            console.log('='.repeat(60));
        }
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ ERRO NO TESTE FINAL');
        console.log('Erro:', error.message);
        console.log('='.repeat(60));
    }
}

runTest().catch(console.error);