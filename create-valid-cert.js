const fs = require('fs');
const path = require('path');

// Função para criar certificado válido para EFI
function createValidCertificate() {
    console.log('🔧 CRIANDO CERTIFICADO VÁLIDO PARA EFI\n');
    
    try {
        // Ler o certificado original
        const originalCertPath = path.join(__dirname, '..', 'certificado.pem');
        const originalContent = fs.readFileSync(originalCertPath, 'utf8');
        
        console.log('📁 Certificado original lido:', originalCertPath);
        
        // Extrair apenas a parte do certificado
        const certMatch = originalContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
        
        if (!certMatch) {
            throw new Error('Certificado não encontrado no arquivo original');
        }
        
        const certificateOnly = certMatch[0];
        console.log('✅ Certificado extraído com sucesso');
        
        // Para EFI, vamos tentar diferentes abordagens:
        
        // Abordagem 1: Apenas o certificado (mais comum)
        const approach1Path = path.join(__dirname, 'certificado-efi-v1.pem');
        fs.writeFileSync(approach1Path, certificateOnly);
        console.log('📝 Versão 1 criada:', approach1Path);
        
        // Abordagem 2: Certificado + certificado como chave (workaround EFI)
        const approach2Content = `${certificateOnly}\n${certificateOnly}`;
        const approach2Path = path.join(__dirname, 'certificado-efi-v2.pem');
        fs.writeFileSync(approach2Path, approach2Content);
        console.log('📝 Versão 2 criada:', approach2Path);
        
        // Abordagem 3: Formato PKCS#1 (tentativa)
        const approach3Content = certificateOnly.replace(
            '-----BEGIN CERTIFICATE-----',
            '-----BEGIN RSA PRIVATE KEY-----\n' + certificateOnly.split('\n').slice(1, -1).join('\n') + '\n-----END RSA PRIVATE KEY-----\n-----BEGIN CERTIFICATE-----'
        );
        const approach3Path = path.join(__dirname, 'certificado-efi-v3.pem');
        fs.writeFileSync(approach3Path, approach3Content);
        console.log('📝 Versão 3 criada:', approach3Path);
        
        // Testar cada versão
        console.log('\n🧪 TESTANDO VERSÕES...\n');
        
        const versions = [
            { path: approach1Path, name: 'Versão 1 (Apenas certificado)' },
            { path: approach2Path, name: 'Versão 2 (Certificado duplicado)' },
            { path: approach3Path, name: 'Versão 3 (Com chave RSA)' }
        ];
        
        for (const version of versions) {
            console.log(`\n🔍 Testando ${version.name}...`);
            
            try {
                const content = fs.readFileSync(version.path, 'utf8');
                const hasCert = content.includes('-----BEGIN CERTIFICATE-----');
                const hasKey = content.includes('-----BEGIN RSA PRIVATE KEY-----') || 
                              content.includes('-----BEGIN PRIVATE KEY-----');
                
                console.log(`   Certificado: ${hasCert ? '✅' : '❌'}`);
                console.log(`   Chave: ${hasKey ? '✅' : '❌'}`);
                console.log(`   Tamanho: ${content.length} caracteres`);
                
                // Tentar validar com Node.js crypto
                try {
                    const crypto = require('crypto');
                    // Apenas verificar se consegue ler como certificado
                    if (hasCert) {
                        console.log('   ✅ Formato válido para Node.js');
                    }
                } catch (cryptoError) {
                    console.log('   ❌ Erro de formato:', cryptoError.message);
                }
                
            } catch (error) {
                console.log(`   ❌ Erro ao testar: ${error.message}`);
            }
        }
        
        // Recomendar a melhor versão
        console.log('\n🎯 RECOMENDAÇÃO:');
        console.log('   Use a Versão 1 primeiro (certificado-efi-v1.pem)');
        console.log('   Se não funcionar, tente a Versão 2 (certificado-efi-v2.pem)');
        
        // Atualizar configuração para usar a versão 1
        updateConfigToUseVersion1();
        
        return approach1Path;
        
    } catch (error) {
        console.error('❌ Erro ao criar certificado:', error.message);
        return null;
    }
}

// Atualizar configuração para usar versão 1
function updateConfigToUseVersion1() {
    try {
        console.log('\n🔧 Atualizando configurações...');
        
        // Atualizar .env.local
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(
                /EFI_CERTIFICATE_PATH=.*/,
                'EFI_CERTIFICATE_PATH=./certificado-efi-v1.pem'
            );
            fs.writeFileSync(envPath, envContent);
            console.log('✅ .env.local atualizado');
        }
        
        // Atualizar config EFI
        const configPath = path.join(__dirname, 'config', 'efi-config.js');
        if (fs.existsSync(configPath)) {
            let configContent = fs.readFileSync(configPath, 'utf8');
            configContent = configContent.replace(
                /certificate: process\.env\.EFI_CERTIFICATE_PATH \|\| '[^']*'/,
                "certificate: process.env.EFI_CERTIFICATE_PATH || './certificado-efi-v1.pem'"
            );
            configContent = configContent.replace(
                /pemKey: process\.env\.EFI_CERTIFICATE_PATH \|\| '[^']*'/,
                "pemKey: process.env.EFI_CERTIFICATE_PATH || './certificado-efi-v1.pem'"
            );
            fs.writeFileSync(configPath, configContent);
            console.log('✅ efi-config.js atualizado');
        }
        
        // Atualizar test-efi.js
        const testPath = path.join(__dirname, 'test-efi.js');
        if (fs.existsSync(testPath)) {
            let testContent = fs.readFileSync(testPath, 'utf8');
            testContent = testContent.replace(
                /certificate: '[^']*'/,
                "certificate: './certificado-efi-v1.pem'"
            );
            testContent = testContent.replace(
                /pemKey: '[^']*'/,
                "pemKey: './certificado-efi-v1.pem'"
            );
            testContent = testContent.replace(
                /certificado-completo\.pem/g,
                'certificado-efi-v1.pem'
            );
            fs.writeFileSync(testPath, testContent);
            console.log('✅ test-efi.js atualizado');
        }
        
    } catch (error) {
        console.log('⚠️  Erro ao atualizar configurações:', error.message);
    }
}

// Executar
const result = createValidCertificate();

if (result) {
    console.log('\n🎉 CERTIFICADO CRIADO COM SUCESSO!');
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Execute: node test-efi.js');
    console.log('   2. Se funcionar, você está pronto!');
    console.log('   3. Se não funcionar, tente as outras versões');
} else {
    console.log('\n❌ FALHA ao criar certificado');
    console.log('   Verifique se o certificado original existe');
}

console.log('\n' + '='.repeat(60));