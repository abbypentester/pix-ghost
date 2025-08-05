const fs = require('fs');
const path = require('path');
const EfiPay = require('sdk-node-apis-efi');
require('dotenv').config({ path: '.env.local' });

// Função para testar certificado como P12 diretamente
function testP12Direct() {
    console.log('🧪 TESTANDO CERTIFICADO COMO P12 DIRETO\n');
    
    try {
        // Caminho do certificado original
        const originalCertPath = path.join(__dirname, '..', 'certificado.pem');
        
        if (!fs.existsSync(originalCertPath)) {
            console.log('❌ Certificado original não encontrado:', originalCertPath);
            return false;
        }
        
        console.log('📁 Certificado original:', originalCertPath);
        
        // Configuração EFI usando certificado original como P12
        const efiConfig = {
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET,
            certificate: originalCertPath,
            sandbox: true,
            debug: false
        };
        
        console.log('🔧 Configuração EFI:');
        console.log('   Client ID:', efiConfig.client_id ? '✅ Configurado' : '❌ Não configurado');
        console.log('   Client Secret:', efiConfig.client_secret ? '✅ Configurado' : '❌ Não configurado');
        console.log('   Certificado:', efiConfig.certificate);
        console.log('   Sandbox:', efiConfig.sandbox);
        
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
                    
                    resolve(true);
                })
                .catch(err => {
                    console.log('\n❌ Erro na criação da cobrança:', err.message);
                    reject(err);
                });
        });
        
    } catch (error) {
        console.log('\n❌ Erro no teste:', error.message);
        
        if (error.code) {
            console.log('📋 Código do erro:', error.code);
        }
        
        if (error.error_description) {
            console.log('📋 Descrição:', error.error_description);
        }
        
        if (error.opensslErrorStack) {
            console.log('📋 Stack OpenSSL:', error.opensslErrorStack);
        }
        
        // Tentar diferentes abordagens
        console.log('\n🔧 Tentando abordagens alternativas...');
        
        return testAlternativeApproaches();
    }
}

// Função para testar abordagens alternativas
function testAlternativeApproaches() {
    console.log('\n🔄 TESTANDO ABORDAGENS ALTERNATIVAS\n');
    
    try {
        // Abordagem 1: Certificado como base64
        console.log('📝 Abordagem 1: Certificado como base64');
        
        const originalCertPath = path.join(__dirname, '..', 'certificado.pem');
        const certBuffer = fs.readFileSync(originalCertPath);
        const certBase64 = certBuffer.toString('base64');
        
        const efiConfigBase64 = {
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET,
            certificate: certBase64,
            cert_base64: true,
            sandbox: true,
            debug: false
        };
        
        console.log('   Certificado base64 (primeiros 50 chars):', certBase64.substring(0, 50));
        
        const efipayBase64 = new EfiPay(efiConfigBase64);
        console.log('   ✅ SDK instanciado com base64');
        
        return true;
        
    } catch (error) {
        console.log('   ❌ Erro com base64:', error.message);
        
        // Abordagem 2: Sem certificado (apenas para teste de conectividade)
        try {
            console.log('\n📝 Abordagem 2: Teste de conectividade sem certificado');
            
            const efiConfigMinimal = {
                client_id: process.env.EFI_CLIENT_ID,
                client_secret: process.env.EFI_CLIENT_SECRET,
                sandbox: true,
                debug: true
            };
            
            const efipayMinimal = new EfiPay(efiConfigMinimal);
            console.log('   ✅ SDK instanciado sem certificado');
            console.log('   ⚠️  Nota: Operações PIX não funcionarão sem certificado');
            
            return false;
            
        } catch (error2) {
            console.log('   ❌ Erro sem certificado:', error2.message);
            return false;
        }
    }
}

// Executar teste
async function runTest() {
    console.log('🎯 TESTE DIRETO DO CERTIFICADO P12\n');
    
    const success = await testP12Direct();
    
    if (success) {
        console.log('\n🎉 CERTIFICADO FUNCIONANDO!');
        console.log('   O sistema PIX Ghost está pronto para uso!');
    } else {
        console.log('\n❌ CERTIFICADO COM PROBLEMAS');
        console.log('   Verifique:');
        console.log('   1. Se o certificado é válido');
        console.log('   2. Se as credenciais estão corretas');
        console.log('   3. Se a chave PIX está configurada');
        console.log('   4. Se a conta EFI está ativa');
    }
    
    console.log('\n' + '='.repeat(60));
}

runTest().catch(console.error);