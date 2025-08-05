const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EfiPay = require('sdk-node-apis-efi');
require('dotenv').config({ path: '.env.local' });

// Função para corrigir o certificado definitivamente
function fixCertificateFinal() {
    console.log('🔧 CORREÇÃO DEFINITIVA DO CERTIFICADO\n');
    
    try {
        // Caminho do certificado original
        const originalCertPath = path.join(__dirname, '..', 'certificado.pem');
        
        if (!fs.existsSync(originalCertPath)) {
            console.log('❌ Certificado original não encontrado:', originalCertPath);
            return false;
        }
        
        console.log('📁 Lendo certificado original:', originalCertPath);
        const originalContent = fs.readFileSync(originalCertPath, 'utf8');
        
        console.log('📋 Analisando conteúdo:');
        console.log('   Tamanho:', originalContent.length, 'caracteres');
        console.log('   Tem Bag Attributes:', originalContent.includes('Bag Attributes') ? '✅' : '❌');
        console.log('   Tem BEGIN CERTIFICATE:', originalContent.includes('-----BEGIN CERTIFICATE-----') ? '✅' : '❌');
        console.log('   Tem BEGIN PRIVATE KEY:', originalContent.includes('-----BEGIN PRIVATE KEY-----') ? '✅' : '❌');
        console.log('   Tem BEGIN RSA PRIVATE KEY:', originalContent.includes('-----BEGIN RSA PRIVATE KEY-----') ? '✅' : '❌');
        
        // Extrair apenas o certificado público
        const certMatch = originalContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
        
        if (!certMatch) {
            console.log('❌ Não foi possível extrair o certificado');
            return false;
        }
        
        const publicCert = certMatch[0];
        console.log('\n✅ Certificado público extraído');
        console.log('   Tamanho:', publicCert.length, 'caracteres');
        
        // Criar certificado limpo (apenas público)
        const cleanCertPath = path.join(__dirname, 'certificado-limpo.pem');
        fs.writeFileSync(cleanCertPath, publicCert);
        console.log('✅ Certificado limpo criado:', cleanCertPath);
        
        // Testar certificado limpo
        console.log('\n🧪 TESTANDO CERTIFICADO LIMPO...');
        
        const efiConfig = {
            client_id: process.env.EFI_CLIENT_ID,
            client_secret: process.env.EFI_CLIENT_SECRET,
            certificate: cleanCertPath,
            pemKey: cleanCertPath,
            sandbox: true,
            debug: false
        };
        
        console.log('🔧 Configuração EFI:');
        console.log('   Certificate:', efiConfig.certificate);
        console.log('   PemKey:', efiConfig.pemKey);
        
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
                    
                    // Atualizar configurações do sistema
                    updateSystemConfig(cleanCertPath);
                    
                    console.log('\n🎉 CERTIFICADO FUNCIONANDO PERFEITAMENTE!');
                    console.log('   O sistema PIX Ghost está 100% operacional!');
                    
                    resolve(true);
                })
                .catch(err => {
                    console.log('\n❌ Erro na criação da cobrança:', err.message);
                    
                    // Se ainda der erro, tentar abordagem alternativa
                    console.log('\n🔄 Tentando abordagem alternativa...');
                    tryAlternativeApproach(originalContent, resolve, reject);
                });
        });
        
    } catch (error) {
        console.log('\n❌ Erro na correção:', error.message);
        return false;
    }
}

// Função para tentar abordagem alternativa
function tryAlternativeApproach(originalContent, resolve, reject) {
    console.log('\n🔄 ABORDAGEM ALTERNATIVA: Certificado como base64\n');
    
    try {
        // Tentar usar o certificado original como base64
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
        
        console.log('🔧 Configuração EFI (base64):');
        console.log('   Certificate (primeiros 50 chars):', certBase64.substring(0, 50));
        console.log('   cert_base64:', efiConfigBase64.cert_base64);
        
        const efipayBase64 = new EfiPay(efiConfigBase64);
        console.log('✅ SDK EFI instanciado com base64');
        
        // Testar com base64
        const txid = 'test' + Date.now().toString().slice(-10);
        const body = {
            calendario: { expiracao: 3600 },
            devedor: { cpf: '12345678909', nome: 'Francisco da Silva' },
            valor: { original: '1.00' },
            chave: process.env.EFI_PIX_KEY,
            solicitacaoPagador: 'Teste de integração PIX'
        };
        const params = { txid: txid };
        
        efipayBase64.pixCreateImmediateCharge(params, body)
            .then(response => {
                console.log('\n🎉 SUCESSO COM BASE64!');
                console.log('   TxID:', response.txid);
                
                // Salvar configuração base64
                const base64ConfigPath = path.join(__dirname, 'certificado-base64.txt');
                fs.writeFileSync(base64ConfigPath, certBase64);
                console.log('✅ Certificado base64 salvo:', base64ConfigPath);
                
                resolve(true);
            })
            .catch(err => {
                console.log('\n❌ Erro com base64:', err.message);
                reject(err);
            });
            
    } catch (error) {
        console.log('\n❌ Erro na abordagem alternativa:', error.message);
        reject(error);
    }
}

// Função para atualizar configurações do sistema
function updateSystemConfig(certPath) {
    console.log('\n🔧 Atualizando configurações do sistema...');
    
    try {
        // Atualizar .env.local
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(
                /EFI_CERTIFICATE_PATH=.*/,
                `EFI_CERTIFICATE_PATH=${certPath.replace(__dirname + path.sep, './')}`
            );
            fs.writeFileSync(envPath, envContent);
            console.log('✅ .env.local atualizado');
        }
        
        // Atualizar efi-config.js
        const configPath = path.join(__dirname, 'config', 'efi-config.js');
        if (fs.existsSync(configPath)) {
            let configContent = fs.readFileSync(configPath, 'utf8');
            const relativePath = certPath.replace(__dirname + path.sep, './');
            configContent = configContent.replace(
                /certificate: process\.env\.EFI_CERTIFICATE_PATH \|\| '[^']*'/,
                `certificate: process.env.EFI_CERTIFICATE_PATH || '${relativePath}'`
            );
            configContent = configContent.replace(
                /pemKey: process\.env\.EFI_CERTIFICATE_PATH \|\| '[^']*'/,
                `pemKey: process.env.EFI_CERTIFICATE_PATH || '${relativePath}'`
            );
            fs.writeFileSync(configPath, configContent);
            console.log('✅ efi-config.js atualizado');
        }
        
    } catch (error) {
        console.log('⚠️  Erro ao atualizar configurações:', error.message);
    }
}

// Executar correção
async function runFix() {
    console.log('🚀 CORREÇÃO DEFINITIVA DO CERTIFICADO PIX GHOST\n');
    
    try {
        const success = await fixCertificateFinal();
        
        if (success) {
            console.log('\n' + '='.repeat(60));
            console.log('🎉 CERTIFICADO CORRIGIDO COM SUCESSO!');
            console.log('✅ Sistema PIX Ghost operacional');
            console.log('✅ Integração EFI funcionando');
            console.log('\n🚀 O sistema está pronto para uso!');
            console.log('='.repeat(60));
        } else {
            console.log('\n' + '='.repeat(60));
            console.log('❌ CERTIFICADO COM PROBLEMAS PERSISTENTES');
            console.log('\n🔧 Recomendações finais:');
            console.log('   1. Baixe um novo certificado .p12 do painel EFI');
            console.log('   2. Verifique se a conta EFI está ativa');
            console.log('   3. Confirme as credenciais Client_Id e Client_Secret');
            console.log('   4. Configure uma chave PIX válida');
            console.log('='.repeat(60));
        }
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ ERRO NA CORREÇÃO FINAL');
        console.log('Erro:', error.message);
        console.log('='.repeat(60));
    }
}

runFix().catch(console.error);