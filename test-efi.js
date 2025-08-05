/**
 * Script de teste para verificar a integração EFI
 * Execute: node test-efi.js
 */

const EfiPay = require('sdk-node-apis-efi');
const fs = require('fs');
const path = require('path');

// Configuração de teste
const efiConfig = {
    sandbox: false, // Produção
    client_id: 'Client_Id_8897337f5626755b4e202c13412fe2629cdf8852',
    client_secret: 'Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747',
    certificate: './certificado-efi-v3.pem',
    pemKey: './certificado-efi-v3.pem', // Mesmo valor que certificate
    cert_base64: false
};

async function testEfiIntegration() {
    console.log('🧪 Testando integração EFI Pay...');
    
    try {
        // Verificar se o certificado existe
        const certPath = path.resolve('./certificado-efi-v3.pem');
        if (!fs.existsSync(certPath)) {
            throw new Error('❌ Certificado não encontrado: ' + certPath);
        }
        console.log('✅ Certificado encontrado');
        
        // Instanciar EFI
        const efipay = new EfiPay(efiConfig);
        console.log('✅ SDK EFI instanciado');
        
        // Gerar txid único
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        const txid = `${timestamp}${random}`.substring(0, 35);
        
        console.log('📝 Testando criação de cobrança PIX...');
        console.log('TxID:', txid);
        
        // Dados da cobrança de teste
        const pixData = {
            calendario: {
                expiracao: 3600 // 1 hora
            },
            devedor: {
                nome: 'Teste PIX Ghost',
                cpf: '00000000000'
            },
            valor: {
                original: '1.00' // R$ 1,00 para teste
            },
            chave: 'sua-chave-pix@email.com', // CONFIGURE SUA CHAVE PIX AQUI
            solicitacaoPagador: 'Teste de integração PIX Ghost'
        };
        
        // Criar cobrança PIX
        const response = await efipay.pixCreateImmediateCharge(
            { txid },
            pixData
        );
        
        console.log('✅ Cobrança PIX criada com sucesso!');
        console.log('📋 Resposta:', JSON.stringify(response, null, 2));
        
        // Gerar QR Code
        console.log('🔄 Gerando QR Code...');
        const qrCodeResponse = await efipay.pixGenerateQRCode(
            { id: response.loc.id }
        );
        
        console.log('✅ QR Code gerado!');
        console.log('📱 Tamanho do QR Code:', qrCodeResponse.imagemQrcode.length, 'caracteres');
        console.log('💰 PIX Copia e Cola:', qrCodeResponse.qrcode.substring(0, 50) + '...');
        
        // Testar consulta da cobrança
        console.log('🔍 Testando consulta da cobrança...');
        const consultaResponse = await efipay.pixDetailCharge({ txid });
        
        console.log('✅ Consulta realizada com sucesso!');
        console.log('📊 Status:', consultaResponse.status);
        console.log('💵 Valor:', consultaResponse.valor.original);
        
        console.log('\n🎉 Todos os testes passaram!');
        console.log('✅ Integração EFI está funcionando corretamente');
        console.log('\n📋 Próximos passos:');
        console.log('1. Configure sua chave PIX no arquivo de configuração');
        console.log('2. Configure o webhook na EFI');
        console.log('3. Faça o deploy no Vercel');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message || error);
        console.error('📋 Detalhes do erro:', JSON.stringify(error, null, 2));
        
        if (error.response && error.response.data) {
            console.error('📡 Resposta da API:', JSON.stringify(error.response.data, null, 2));
        }
        
        console.log('\n🔧 Possíveis soluções:');
        console.log('1. Verifique se o certificado está correto');
        console.log('2. Confirme as credenciais Client_Id e Client_Secret');
        console.log('3. Configure uma chave PIX válida');
        console.log('4. Verifique se a conta EFI está ativa');
        console.log('5. Verifique se está usando o ambiente correto (sandbox/produção)');
        
        process.exit(1);
    }
}

// Executar teste
testEfiIntegration();