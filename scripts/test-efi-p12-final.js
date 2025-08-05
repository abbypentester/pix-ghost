require('dotenv').config({ path: '.env.local' });
const EfiPay = require('sdk-node-apis-efi');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testando integração EFI com certificado .p12...');

const certificatePath = path.join(__dirname, 'certificado-efi-p12.pem');

const efiConfig = {
    client_id: process.env.EFI_CLIENT_ID,
    client_secret: process.env.EFI_CLIENT_SECRET,
    certificate: certificatePath,
    pemKey: certificatePath, // Para .p12, usar o mesmo arquivo
    sandbox: process.env.EFI_SANDBOX === 'true'
};

console.log('📋 Configuração EFI:');
console.log('   - Client ID:', efiConfig.client_id ? '✅ Configurado' : '❌ Não configurado');
console.log('   - Client Secret:', efiConfig.client_secret ? '✅ Configurado' : '❌ Não configurado');
console.log('   - Certificado (.p12):', efiConfig.certificate);
console.log('   - Sandbox:', efiConfig.sandbox);

// Verificar se o certificado existe
if (fs.existsSync(efiConfig.certificate)) {
    console.log('✅ Certificado .p12 encontrado');
    
    try {
        const efipay = new EfiPay(efiConfig);
        console.log('✅ SDK EFI instanciado com sucesso');
        
        // Teste de criação de cobrança PIX
        const pixCharge = {
            calendario: {
                expiracao: 3600
            },
            devedor: {
                cpf: '12345678909',
                nome: 'Teste PIX Ghost'
            },
            valor: {
                original: '1.00'
            },
            chave: process.env.EFI_PIX_KEY || 'sua-chave-pix-aqui',
            solicitacaoPagador: 'Teste de integração PIX Ghost'
        };
        
        console.log('\n💰 Testando criação de cobrança PIX...');
        efipay.pixCreateImmediateCharge([], pixCharge)
            .then((response) => {
                console.log('✅ Cobrança PIX criada com sucesso!');
                console.log('📄 Resposta:', JSON.stringify(response, null, 2));
                console.log('\n🎉 INTEGRAÇÃO EFI FUNCIONANDO PERFEITAMENTE!');
                console.log('\n📝 Próximos passos:');
                console.log('   1. Configure sua chave PIX no .env.local (EFI_PIX_KEY)');
                console.log('   2. Teste o sistema completo');
                console.log('   3. Configure o webhook se necessário');
            })
            .catch((error) => {
                console.error('❌ Erro ao criar cobrança PIX:', error.message);
                if (error.response) {
                    console.error('📄 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
                }
                
                // Verificar se é erro de certificado
                if (error.message.includes('certificate') || error.message.includes('pemKey')) {
                    console.log('\n🔍 Erro relacionado ao certificado:');
                    console.log('   - O arquivo .p12 pode precisar de senha');
                    console.log('   - Verifique se o certificado é válido');
                    console.log('   - Confirme se está usando o ambiente correto');
                } else {
                    console.log('\n🔍 Possíveis soluções:');
                    console.log('   - Verifique se a chave PIX está configurada corretamente');
                    console.log('   - Confirme se as credenciais estão corretas');
                    console.log('   - Verifique se está usando o ambiente correto (sandbox/produção)');
                }
            });
            
    } catch (error) {
        console.error('❌ Erro ao instanciar SDK EFI:', error.message);
        
        if (error.message.includes('certificate') || error.message.includes('PKCS')) {
            console.log('\n🔍 Erro de certificado detectado:');
            console.log('   - O arquivo .p12 pode precisar de uma senha');
            console.log('   - Tente configurar a senha no SDK se necessário');
            console.log('   - Verifique se o certificado não está corrompido');
        } else {
            console.log('\n🔍 Verifique:');
            console.log('   - Se as credenciais estão corretas no .env.local');
            console.log('   - Se o ambiente (sandbox/produção) está correto');
        }
    }
} else {
    console.error('❌ Certificado não encontrado:', efiConfig.certificate);
}