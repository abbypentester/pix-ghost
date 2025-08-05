const EfiPay = require('sdk-node-apis-efi');
const fs = require('fs');
const path = require('path');

// Configuração da EFI
const certificatePath = path.resolve('./certificado-completo-efi.pem');
const certificateContent = fs.readFileSync(certificatePath, 'utf8');

// Extrair certificado e chave privada do arquivo PEM
const certMatch = certificateContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
const keyMatch = certificateContent.match(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/);

if (!certMatch || !keyMatch) {
    console.error('❌ Erro: Não foi possível extrair certificado ou chave privada do arquivo PEM');
    process.exit(1);
}

const options = {
    client_id: 'Client_Id_8897337f5626755b4e202c13412fe2629cdf8852',
    client_secret: 'Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747',
    certificate: certMatch[0],
    pemKey: keyMatch[0],
    sandbox: false
};

console.log('=== TESTE DE CONEXÃO EFI ===\n');

// Verificar se o arquivo do certificado existe
if (!fs.existsSync(certificatePath)) {
    console.error('❌ Arquivo do certificado não encontrado:', certificatePath);
    process.exit(1);
}

console.log('✅ Certificado extraído com sucesso');
console.log('📁 Arquivo original:', certificatePath);
console.log('🔑 Certificado extraído:', certMatch[0].substring(0, 50) + '...');
console.log('🗝️  Chave privada extraída:', keyMatch[0].substring(0, 50) + '...');

// Inicializar EFI
const efipay = new EfiPay(options);

async function testEfiConnection() {
    try {
        console.log('\n🔍 Testando conexão com EFI...');
        
        // Teste 1: Listar cobranças PIX recentes
        console.log('\n1. Listando cobranças PIX recentes...');
        const params = {
            inicio: '2024-01-01T00:00:00Z',
            fim: new Date().toISOString()
        };
        
        const response = await efipay.pixListCharges(params);
        console.log('✅ Conexão com EFI estabelecida com sucesso!');
        console.log('📊 Total de cobranças encontradas:', response.parametros?.paginacao?.quantidadeTotalDeItens || 0);
        
        if (response.cobs && response.cobs.length > 0) {
            console.log('\n📋 Últimas 3 cobranças:');
            response.cobs.slice(0, 3).forEach((cob, index) => {
                console.log(`${index + 1}. TXID: ${cob.txid}`);
                console.log(`   Status: ${cob.status}`);
                console.log(`   Valor: R$ ${cob.valor?.original || 'N/A'}`);
                console.log(`   Criada em: ${cob.calendario?.criacao || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('ℹ️  Nenhuma cobrança encontrada no período');
        }
        
        // Teste 2: Verificar uma cobrança específica (se existir)
        if (response.cobs && response.cobs.length > 0) {
            const firstTxid = response.cobs[0].txid;
            console.log(`\n2. Testando verificação da cobrança: ${firstTxid}`);
            
            try {
                const chargeDetail = await efipay.pixDetailCharge({ txid: firstTxid });
                console.log('✅ Verificação de cobrança funcionando!');
                console.log('📄 Status:', chargeDetail.status);
                console.log('💰 Valor:', chargeDetail.valor?.original || 'N/A');
            } catch (detailError) {
                console.log('❌ Erro ao verificar cobrança específica:', detailError.message);
            }
        }
        
        console.log('\n🎉 Teste de conexão EFI concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na conexão com EFI:');
        console.error('Erro completo:', error);
        console.error('Código:', error.code || 'N/A');
        console.error('Mensagem:', error.message || 'N/A');
        console.error('Detalhes:', error.error_description || 'N/A');
        console.error('Nome:', error.name || 'N/A');
        console.error('Stack:', error.stack || 'N/A');
        
        if (error.code === 'ENOTFOUND') {
            console.log('\n💡 Possível problema de conectividade com a internet');
        } else if (error.code === 401) {
            console.log('\n💡 Possível problema com as credenciais (Client ID/Secret)');
        } else if (error.code === 403) {
            console.log('\n💡 Possível problema com o certificado ou permissões');
        }
    }
}

// Executar teste
testEfiConnection();