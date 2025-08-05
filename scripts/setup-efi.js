#!/usr/bin/env node

/**
 * Script de configuração para integração EFI Pay
 * Execute: node setup-efi.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('🚀 Configuração PIX Ghost - Integração EFI Pay\n');
    
    // Verificar se o certificado existe
    const certPath = path.join(__dirname, 'certificado.pem');
    if (!fs.existsSync(certPath)) {
        console.log('❌ Certificado não encontrado!');
        console.log('📋 Coloque o arquivo certificado.pem na raiz do projeto.');
        console.log('💡 Se você tem um arquivo .p12, converta com:');
        console.log('   openssl pkcs12 -in certificado.p12 -out certificado.pem -nodes\n');
        
        const continueSetup = await question('Deseja continuar mesmo assim? (s/N): ');
        if (continueSetup.toLowerCase() !== 's') {
            console.log('⏹️  Configuração cancelada.');
            rl.close();
            return;
        }
    } else {
        console.log('✅ Certificado encontrado: certificado.pem');
    }
    
    console.log('\n📝 Configurando variáveis de ambiente...');
    
    // Coletar informações
    const clientId = await question('Client ID EFI: ') || 'Client_Id_8897337f5626755b4e202c13412fe2629cdf8852';
    const clientSecret = await question('Client Secret EFI: ') || 'Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747';
    const pixKey = await question('Sua chave PIX (email/telefone/CPF): ');
    const domain = await question('Seu domínio Vercel (ex: meusite.vercel.app): ');
    const resendKey = await question('Chave API Resend (opcional): ');
    const adminEmail = await question('Email do admin (para saques): ');
    
    // Criar arquivo .env.local
    const envContent = `# Configurações EFI Pay
EFI_CLIENT_ID=${clientId}
EFI_CLIENT_SECRET=${clientSecret}
EFI_CERTIFICATE_PATH=./certificado.pem
EFI_PIX_KEY=${pixKey}
EFI_WEBHOOK_URL=https://${domain}/api/webhook/efi

# Configurações Resend
RESEND_API_KEY=${resendKey}
ADMIN_EMAIL=${adminEmail}

# Ambiente
NODE_ENV=production
`;
    
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Arquivo .env.local criado!');
    
    // Verificar package.json
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (!packageJson.dependencies['sdk-node-apis-efi']) {
            console.log('\n📦 Instalando SDK da EFI...');
            const { exec } = require('child_process');
            exec('npm install sdk-node-apis-efi', (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ Erro ao instalar SDK:', error.message);
                } else {
                    console.log('✅ SDK da EFI instalado!');
                }
            });
        } else {
            console.log('✅ SDK da EFI já está instalado');
        }
    }
    
    console.log('\n🎉 Configuração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verifique o arquivo .env.local');
    console.log('2. Configure o webhook na EFI: https://' + domain + '/api/webhook/efi');
    console.log('3. Configure o Vercel KV no dashboard');
    console.log('4. Faça o deploy: vercel --prod');
    console.log('\n📖 Leia o README-EFI.md para mais detalhes.');
    
    rl.close();
}

main().catch(console.error);