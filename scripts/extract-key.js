const fs = require('fs');
const path = require('path');

console.log('🔑 Verificando certificado EFI...');

const certPath = './certificado.pem';

if (!fs.existsSync(certPath)) {
    console.log('❌ Certificado não encontrado!');
    process.exit(1);
}

const certContent = fs.readFileSync(certPath, 'utf8');

console.log('📋 Conteúdo do certificado:');
console.log('- Tem certificado:', certContent.includes('-----BEGIN CERTIFICATE-----'));
console.log('- Tem chave privada:', certContent.includes('-----BEGIN PRIVATE KEY-----') || certContent.includes('-----BEGIN RSA PRIVATE KEY-----'));

if (!certContent.includes('-----BEGIN PRIVATE KEY-----') && !certContent.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('\n❌ PROBLEMA IDENTIFICADO:');
    console.log('O arquivo certificado.pem contém apenas o certificado público.');
    console.log('Para usar com a EFI, você precisa de um arquivo que contenha TANTO o certificado quanto a chave privada.');
    
    console.log('\n🔧 SOLUÇÕES:');
    console.log('1. Se você tem o arquivo .p12 original:');
    console.log('   openssl pkcs12 -in certificado.p12 -out certificado-completo.pem -nodes');
    
    console.log('\n2. Se você tem arquivos separados (.crt e .key):');
    console.log('   cat certificado.crt chave-privada.key > certificado-completo.pem');
    
    console.log('\n3. Baixe novamente o certificado completo do painel EFI');
    console.log('   - Acesse: https://sejaefi.com.br/');
    console.log('   - Vá em API > Certificados');
    console.log('   - Baixe o certificado no formato .p12 ou .pem completo');
    
    console.log('\n📝 O arquivo correto deve conter:');
    console.log('   -----BEGIN CERTIFICATE-----');
    console.log('   [certificado público]');
    console.log('   -----END CERTIFICATE-----');
    console.log('   -----BEGIN PRIVATE KEY-----');
    console.log('   [chave privada]');
    console.log('   -----END PRIVATE KEY-----');
} else {
    console.log('✅ Certificado completo encontrado!');
}