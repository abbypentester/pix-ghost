const EfiPay = require('sdk-node-apis-efi');
const path = require('path');

console.log('🚀 Testando integração EFI com certificado extraído...');

// Configuração EFI
const options = {
    client_id: process.env.EFI_CLIENT_ID || 'Client_Id_YOUR_CLIENT_ID',
    client_secret: process.env.EFI_CLIENT_SECRET || 'Client_Secret_YOUR_CLIENT_SECRET',
    certificate: 'C:\\Users\\Usuario\\Downloads\\pix-ghost-main\\pix-ghost-main\\certificado-completo-efi.pem',
    pemKey: 'C:\\Users\\Usuario\\Downloads\\pix-ghost-main\\pix-ghost-main\\certificado-completo-efi.pem',
    sandbox: false
};

console.log('📋 Configuração EFI:');
console.log('- Client ID:', options.client_id.substring(0, 10) + '...');
console.log('- Certificate:', options.certificate);
console.log('- PemKey:', options.pemKey);
console.log('- Sandbox:', options.sandbox);

try {
    // Instanciar SDK
    console.log('\n🔧 Instanciando SDK EFI...');
    const efipay = new EfiPay(options);
    console.log('✅ SDK EFI instanciado com sucesso!');
    
    // Testar criação de cobrança PIX
    console.log('\n💰 Testando criação de cobrança PIX...');
    
    const body = {
        calendario: {
            expiracao: 3600
        },
        devedor: {
            cpf: '12345678909',
            nome: 'Francisco da Silva'
        },
        valor: {
            original: '123.45'
        },
        chave: process.env.EFI_PIX_KEY || 'sua-chave-pix-aqui',
        solicitacaoPagador: 'Cobrança de teste'
    };
    
    efipay.pixCreateImmediateCharge([], body)
        .then((resposta) => {
            console.log('\n🎉 Cobrança PIX criada com sucesso!');
            console.log('📄 Resposta:', JSON.stringify(resposta, null, 2));
            console.log('\n✅ CERTIFICADO CONFIGURADO CORRETAMENTE!');
            console.log('🔗 Próximos passos:');
            console.log('1. Configure suas credenciais EFI no .env.local');
            console.log('2. Configure sua chave PIX');
            console.log('3. Execute seus testes de integração');
        })
        .catch((error) => {
            console.log('\n❌ Erro ao criar cobrança PIX:');
            const errorMessage = error && error.message ? error.message : (error ? error.toString() : 'Erro desconhecido');
            console.log('📋 Detalhes:', errorMessage);
            
            if (errorMessage.includes('certificate')) {
                console.log('\n🔍 Possíveis soluções:');
                console.log('- Verifique se o certificado foi extraído corretamente');
                console.log('- Confirme se o arquivo .p12 é válido');
                console.log('- Verifique se a senha do .p12 está correta');
            } else if (errorMessage.includes('credentials') || errorMessage.includes('client')) {
                console.log('\n🔍 Configure suas credenciais EFI:');
                console.log('- EFI_CLIENT_ID no .env.local');
                console.log('- EFI_CLIENT_SECRET no .env.local');
                console.log('- EFI_PIX_KEY no .env.local');
            } else {
                console.log('\n✅ Certificado OK - Erro relacionado a credenciais/configuração');
            }
        });
        
} catch (error) {
    console.log('\n❌ Erro ao instanciar SDK EFI:');
    console.log('📋 Detalhes:', error.message);
    console.log('\n🔍 Verifique:');
    console.log('- Se o certificado foi extraído corretamente');
    console.log('- Se o arquivo .p12 é válido');
    console.log('- Se as dependências estão instaladas (npm install)');
}