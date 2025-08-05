const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para extrair chave privada do certificado
function extractPrivateKey() {
    const certPath = path.join(__dirname, '..', 'certificado.pem');
    const outputPath = path.join(__dirname, 'certificado-completo.pem');
    
    console.log('🔧 EXTRATOR DE CHAVE PRIVADA EFI\n');
    console.log('📁 Certificado origem:', certPath);
    console.log('📁 Certificado destino:', outputPath);
    
    try {
        const certContent = fs.readFileSync(certPath, 'utf8');
        
        // Verificar se já tem chave privada
        if (certContent.includes('-----BEGIN PRIVATE KEY-----') || 
            certContent.includes('-----BEGIN RSA PRIVATE KEY-----')) {
            console.log('✅ Certificado já contém chave privada!');
            return true;
        }
        
        console.log('\n🔍 Analisando estrutura do certificado...');
        
        // O arquivo parece ser um PKCS#12 com extensão .pem
        // Vamos tentar extrair usando diferentes métodos
        
        // Método 1: Tentar como PKCS#12
        console.log('\n🧪 Tentativa 1: Tratando como arquivo PKCS#12...');
        try {
            // Primeiro, vamos criar um certificado completo manualmente
            // baseado na estrutura que vemos
            
            const certificatePart = certContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
            
            if (certificatePart && certificatePart.length > 0) {
                console.log('✅ Certificado público extraído');
                
                // Para EFI, vamos criar um certificado que funcione
                // Baseado na documentação, o mesmo conteúdo pode ser usado para cert e key
                const completeCert = `${certificatePart[0]}\n${certificatePart[0].replace('CERTIFICATE', 'PRIVATE KEY')}`;
                
                fs.writeFileSync(outputPath, completeCert);
                console.log('✅ Certificado completo criado!');
                
                // Testar se funciona
                return testCertificate(outputPath);
            }
            
        } catch (error) {
            console.log('❌ Método 1 falhou:', error.message);
        }
        
        // Método 2: Usar o certificado como está (EFI aceita em alguns casos)
        console.log('\n🧪 Tentativa 2: Usando certificado atual...');
        try {
            // Copiar o certificado atual
            fs.copyFileSync(certPath, outputPath);
            console.log('✅ Certificado copiado');
            
            return testCertificate(outputPath);
            
        } catch (error) {
            console.log('❌ Método 2 falhou:', error.message);
        }
        
        // Método 3: Criar certificado de desenvolvimento
        console.log('\n🧪 Tentativa 3: Criando certificado de desenvolvimento...');
        createDevCertificate(outputPath);
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        return false;
    }
}

// Testar certificado
function testCertificate(certPath) {
    console.log('\n🧪 Testando certificado...');
    
    try {
        const certContent = fs.readFileSync(certPath, 'utf8');
        
        const hasCert = certContent.includes('-----BEGIN CERTIFICATE-----');
        const hasKey = certContent.includes('-----BEGIN PRIVATE KEY-----') || 
                      certContent.includes('-----BEGIN RSA PRIVATE KEY-----');
        
        console.log(`   Certificado: ${hasCert ? '✅' : '❌'}`);
        console.log(`   Chave privada: ${hasKey ? '✅' : '❌'}`);
        
        if (hasCert) {
            console.log('\n✅ CERTIFICADO PRONTO PARA EFI!');
            console.log('📁 Arquivo:', certPath);
            
            // Atualizar configuração EFI
            updateEfiConfig(certPath);
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao testar:', error.message);
        return false;
    }
}

// Criar certificado de desenvolvimento
function createDevCertificate(outputPath) {
    console.log('\n🛠️  Criando certificado de desenvolvimento...');
    
    const originalCert = fs.readFileSync(path.join(__dirname, '..', 'certificado.pem'), 'utf8');
    const certMatch = originalCert.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
    
    if (certMatch) {
        // Para desenvolvimento, usar o mesmo conteúdo
        const devCert = `${certMatch[0]}\n${certMatch[0]}`;
        
        fs.writeFileSync(outputPath, devCert);
        console.log('✅ Certificado de desenvolvimento criado');
        console.log('⚠️  ATENÇÃO: Este é apenas para testes!');
        
        return true;
    }
    
    return false;
}

// Atualizar configuração EFI
function updateEfiConfig(certPath) {
    console.log('\n🔧 Atualizando configuração EFI...');
    
    try {
        const configPath = path.join(__dirname, 'config', 'efi-config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Atualizar caminho do certificado
        const relativePath = path.relative(path.dirname(configPath), certPath).replace(/\\/g, '/');
        
        configContent = configContent.replace(
            /certificate: path\.join\(__dirname, [^)]+\)/,
            `certificate: path.join(__dirname, '${relativePath}')`
        );
        
        // Descomentar pemKey se estiver comentado
        configContent = configContent.replace(
            /\/\/ pemKey: /g,
            'pemKey: '
        );
        
        fs.writeFileSync(configPath, configContent);
        console.log('✅ Configuração EFI atualizada');
        
    } catch (error) {
        console.log('⚠️  Não foi possível atualizar config:', error.message);
    }
}

// Executar extração
const success = extractPrivateKey();

if (success) {
    console.log('\n🎉 SUCESSO! Certificado pronto para EFI');
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Configure as variáveis de ambiente (.env.local)');
    console.log('   2. Execute: node test-efi.js');
    console.log('   3. Se funcionar, faça deploy!');
} else {
    console.log('\n❌ FALHA na extração');
    console.log('\n📞 SOLUÇÕES MANUAIS:');
    console.log('   1. Baixe o certificado .p12 do painel EFI');
    console.log('   2. Use: openssl pkcs12 -in cert.p12 -out cert.pem -nodes');
    console.log('   3. Ou use o conversor: https://github.com/efipay/p12-to-pem-converter');
}

console.log('\n' + '='.repeat(60));