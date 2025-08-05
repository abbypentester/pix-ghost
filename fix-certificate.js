const fs = require('fs');
const path = require('path');

// Função para verificar e corrigir o certificado
function fixCertificate() {
    const certPath = path.join(__dirname, '..', 'certificado.pem');
    
    console.log('🔍 Analisando certificado.pem...');
    
    try {
        const certContent = fs.readFileSync(certPath, 'utf8');
        
        // Verificar se contém certificado
        const hasCertificate = certContent.includes('-----BEGIN CERTIFICATE-----');
        
        // Verificar se contém chave privada
        const hasPrivateKey = certContent.includes('-----BEGIN PRIVATE KEY-----') || 
                             certContent.includes('-----BEGIN RSA PRIVATE KEY-----');
        
        console.log('📋 Status do certificado:');
        console.log(`   ✅ Certificado público: ${hasCertificate ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
        console.log(`   ${hasPrivateKey ? '✅' : '❌'} Chave privada: ${hasPrivateKey ? 'ENCONTRADA' : 'NÃO ENCONTRADA'}`);
        
        if (hasCertificate && hasPrivateKey) {
            console.log('\n🎉 CERTIFICADO COMPLETO! Pronto para usar com EFI.');
            return true;
        }
        
        if (hasCertificate && !hasPrivateKey) {
            console.log('\n⚠️  PROBLEMA: Certificado incompleto!');
            console.log('   O arquivo contém apenas o certificado público.');
            console.log('   A chave privada é necessária para a integração EFI.');
            
            console.log('\n🔧 SOLUÇÕES:');
            console.log('   1. Baixar o certificado .p12 completo do painel EFI');
            console.log('   2. Converter .p12 para .pem com chave privada:');
            console.log('      openssl pkcs12 -in certificado.p12 -out certificado.pem -nodes');
            console.log('   3. Ou usar o conversor oficial da EFI:');
            console.log('      https://github.com/efipay/p12-to-pem-converter');
            
            // Tentar criar um certificado de exemplo para teste
            createExampleCertificate();
            
            return false;
        }
        
        console.log('\n❌ ERRO: Certificado não encontrado ou inválido.');
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao ler certificado:', error.message);
        return false;
    }
}

// Criar certificado de exemplo para teste (apenas para desenvolvimento)
function createExampleCertificate() {
    const exampleCertPath = path.join(__dirname, 'certificado-exemplo.pem');
    
    const exampleCert = `-----BEGIN CERTIFICATE-----
${fs.readFileSync(path.join(__dirname, '..', 'certificado.pem'), 'utf8')
    .split('-----BEGIN CERTIFICATE-----')[1]
    .split('-----END CERTIFICATE-----')[0]}
-----END CERTIFICATE-----
-----BEGIN PRIVATE KEY-----
(CHAVE PRIVADA NECESSÁRIA AQUI)
-----END PRIVATE KEY-----`;
    
    try {
        fs.writeFileSync(exampleCertPath, exampleCert);
        console.log(`\n📝 Exemplo criado em: ${exampleCertPath}`);
        console.log('   (Substitua "(CHAVE PRIVADA NECESSÁRIA AQUI)" pela chave real)');
    } catch (error) {
        console.error('Erro ao criar exemplo:', error.message);
    }
}

// Função para testar a configuração EFI
function testEfiConfig() {
    console.log('\n🧪 Testando configuração EFI...');
    
    try {
        const efiConfig = require('./config/efi-config.js');
        console.log('✅ Configuração EFI carregada com sucesso');
        
        // Verificar se as variáveis de ambiente estão definidas
        const requiredEnvs = ['EFI_CLIENT_ID', 'EFI_CLIENT_SECRET', 'EFI_PIX_KEY'];
        const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
        
        if (missingEnvs.length > 0) {
            console.log('⚠️  Variáveis de ambiente faltando:');
            missingEnvs.forEach(env => console.log(`   - ${env}`));
        } else {
            console.log('✅ Todas as variáveis de ambiente estão definidas');
        }
        
    } catch (error) {
        console.error('❌ Erro na configuração EFI:', error.message);
    }
}

// Executar verificação
console.log('🚀 VERIFICADOR DE CERTIFICADO EFI\n');

const isValid = fixCertificate();
testEfiConfig();

if (!isValid) {
    console.log('\n📞 PRÓXIMOS PASSOS:');
    console.log('   1. Acesse o painel EFI Pay');
    console.log('   2. Baixe o certificado .p12 completo');
    console.log('   3. Converta para .pem com a chave privada');
    console.log('   4. Execute este script novamente');
    
    process.exit(1);
} else {
    console.log('\n🎯 PRONTO! Execute: node test-efi.js');
    process.exit(0);
}