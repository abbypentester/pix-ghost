const fs = require('fs');
const path = require('path');

// Função para trocar para versão 3 do certificado
function switchToVersion3() {
    console.log('🔄 TROCANDO PARA CERTIFICADO VERSÃO 3\n');
    
    try {
        // Atualizar .env.local
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(
                /EFI_CERTIFICATE_PATH=.*/,
                'EFI_CERTIFICATE_PATH=./certificado-efi-v3.pem'
            );
            fs.writeFileSync(envPath, envContent);
            console.log('✅ .env.local atualizado para v3');
        }
        
        // Atualizar config EFI
        const configPath = path.join(__dirname, 'config', 'efi-config.js');
        if (fs.existsSync(configPath)) {
            let configContent = fs.readFileSync(configPath, 'utf8');
            configContent = configContent.replace(
                /certificate: process\.env\.EFI_CERTIFICATE_PATH \|\| '[^']*'/,
                "certificate: process.env.EFI_CERTIFICATE_PATH || './certificado-efi-v3.pem'"
            );
            configContent = configContent.replace(
                /pemKey: process\.env\.EFI_CERTIFICATE_PATH \|\| '[^']*'/,
                "pemKey: process.env.EFI_CERTIFICATE_PATH || './certificado-efi-v3.pem'"
            );
            fs.writeFileSync(configPath, configContent);
            console.log('✅ efi-config.js atualizado para v3');
        }
        
        // Atualizar test-efi.js
        const testPath = path.join(__dirname, 'test-efi.js');
        if (fs.existsSync(testPath)) {
            let testContent = fs.readFileSync(testPath, 'utf8');
            testContent = testContent.replace(
                /certificate: '[^']*'/,
                "certificate: './certificado-efi-v3.pem'"
            );
            testContent = testContent.replace(
                /pemKey: '[^']*'/,
                "pemKey: './certificado-efi-v3.pem'"
            );
            testContent = testContent.replace(
                /certificado-efi-v1\.pem/g,
                'certificado-efi-v3.pem'
            );
            fs.writeFileSync(testPath, testContent);
            console.log('✅ test-efi.js atualizado para v3');
        }
        
        // Verificar conteúdo da versão 3
        const v3Path = path.join(__dirname, 'certificado-efi-v3.pem');
        if (fs.existsSync(v3Path)) {
            const content = fs.readFileSync(v3Path, 'utf8');
            console.log('\n📋 Verificando certificado v3:');
            console.log('   Tamanho:', content.length, 'caracteres');
            console.log('   Tem certificado:', content.includes('-----BEGIN CERTIFICATE-----') ? '✅' : '❌');
            console.log('   Tem chave RSA:', content.includes('-----BEGIN RSA PRIVATE KEY-----') ? '✅' : '❌');
            
            // Mostrar primeiras linhas
            const lines = content.split('\n');
            console.log('\n📝 Primeiras linhas:');
            lines.slice(0, 5).forEach((line, i) => {
                console.log(`   ${i + 1}: ${line}`);
            });
        }
        
        console.log('\n🎯 Configuração atualizada para versão 3!');
        console.log('   Esta versão inclui chave RSA privada');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao trocar para v3:', error.message);
        return false;
    }
}

// Executar
const success = switchToVersion3();

if (success) {
    console.log('\n🚀 PRONTO! Execute: node test-efi.js');
} else {
    console.log('\n❌ Falha ao configurar v3');
}

console.log('\n' + '='.repeat(50));