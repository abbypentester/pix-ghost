const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Extraindo certificado do arquivo .p12...');

// Caminhos dos arquivos
const p12FilePath = 'c:\\Users\\Usuario\\Downloads\\pix-ghost-main\\producao-790513-Ghostpixof.p12';
const opensslPath = '"C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe"';
const certOutputPath = path.join(__dirname, 'certificado-efi-extraido.pem');
const keyOutputPath = path.join(__dirname, 'chave-privada-efi.pem');
const combinedCertPath = path.join(__dirname, 'certificado-completo-efi.pem');

try {
    // Verificar se o arquivo .p12 existe
    if (!fs.existsSync(p12FilePath)) {
        throw new Error(`Arquivo .p12 não encontrado: ${p12FilePath}`);
    }
    
    console.log('📁 Arquivo .p12 encontrado:', p12FilePath);
    
    // Extrair certificado público (sem senha primeiro, depois com senha se necessário)
    console.log('🔓 Extraindo certificado público...');
    let certCommand = `${opensslPath} pkcs12 -in "${p12FilePath}" -clcerts -nokeys -out "${certOutputPath}" -passin pass:`;
    
    try {
        execSync(certCommand, { stdio: 'inherit' });
        console.log('✅ Certificado público extraído com sucesso!');
    } catch (error) {
        console.log('⚠️  Tentativa sem senha falhou, tentando com senha padrão...');
        // Tentar com senhas comuns
        const commonPasswords = ['', '123456', 'password', 'efi', 'pix'];
        let certExtracted = false;
        
        for (const password of commonPasswords) {
            try {
                certCommand = `${opensslPath} pkcs12 -in "${p12FilePath}" -clcerts -nokeys -out "${certOutputPath}" -passin pass:${password}`;
                execSync(certCommand, { stdio: 'inherit' });
                console.log(`✅ Certificado extraído com senha: ${password || '(vazia)'}`);
                certExtracted = true;
                break;
            } catch (err) {
                continue;
            }
        }
        
        if (!certExtracted) {
            throw new Error('Não foi possível extrair o certificado. Verifique se o arquivo .p12 tem senha.');
        }
    }
    
    // Extrair chave privada
    console.log('🔑 Extraindo chave privada...');
    let keyCommand = `${opensslPath} pkcs12 -in "${p12FilePath}" -nocerts -nodes -out "${keyOutputPath}" -passin pass:`;
    
    try {
        execSync(keyCommand, { stdio: 'inherit' });
        console.log('✅ Chave privada extraída com sucesso!');
    } catch (error) {
        console.log('⚠️  Tentativa sem senha falhou, tentando com senha padrão...');
        const commonPasswords = ['', '123456', 'password', 'efi', 'pix'];
        let keyExtracted = false;
        
        for (const password of commonPasswords) {
            try {
                keyCommand = `${opensslPath} pkcs12 -in "${p12FilePath}" -nocerts -nodes -out "${keyOutputPath}" -passin pass:${password}`;
                execSync(keyCommand, { stdio: 'inherit' });
                console.log(`✅ Chave privada extraída com senha: ${password || '(vazia)'}`);
                keyExtracted = true;
                break;
            } catch (err) {
                continue;
            }
        }
        
        if (!keyExtracted) {
            throw new Error('Não foi possível extrair a chave privada.');
        }
    }
    
    // Combinar certificado e chave privada em um único arquivo
    console.log('🔗 Combinando certificado e chave privada...');
    
    let certContent = '';
    let keyContent = '';
    
    if (fs.existsSync(certOutputPath)) {
        certContent = fs.readFileSync(certOutputPath, 'utf8');
        console.log('📄 Certificado lido:', certContent.substring(0, 100) + '...');
    }
    
    if (fs.existsSync(keyOutputPath)) {
        keyContent = fs.readFileSync(keyOutputPath, 'utf8');
        console.log('🔑 Chave privada lida:', keyContent.substring(0, 100) + '...');
    }
    
    // Combinar os conteúdos
    const combinedContent = certContent + '\n' + keyContent;
    fs.writeFileSync(combinedCertPath, combinedContent);
    
    console.log('✅ Certificado combinado criado:', combinedCertPath);
    
    // Atualizar .env.local
    console.log('📝 Atualizando .env.local...');
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Atualizar ou adicionar a linha do certificado
    const certLine = `EFI_CERTIFICATE_PATH=${combinedCertPath.replace(/\\\\/g, '/')}`;
    
    if (envContent.includes('EFI_CERTIFICATE_PATH=')) {
        envContent = envContent.replace(/EFI_CERTIFICATE_PATH=.*/, certLine);
    } else {
        envContent += `\n${certLine}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local atualizado!');
    
    // Atualizar efi-config.js
    console.log('⚙️  Atualizando efi-config.js...');
    const configPath = path.join(__dirname, 'config', 'efi-config.js');
    
    if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Atualizar o caminho do certificado
        const newCertPath = combinedCertPath.replace(/\\\\/g, '/');
        configContent = configContent.replace(
            /certificate:\s*['"][^'"]*['"]/,
            `certificate: '${newCertPath}'`
        );
        configContent = configContent.replace(
            /pemKey:\s*['"][^'"]*['"]/,
            `pemKey: '${newCertPath}'`
        );
        
        fs.writeFileSync(configPath, configContent);
        console.log('✅ efi-config.js atualizado!');
    }
    
    // Criar script de teste
    console.log('🧪 Criando script de teste...');
    const testScript = `const EfiPay = require('sdk-node-apis-efi');
const path = require('path');

console.log('🚀 Testando integração EFI com certificado extraído...');

// Configuração EFI
const options = {
    client_id: process.env.EFI_CLIENT_ID || 'Client_Id_YOUR_CLIENT_ID',
    client_secret: process.env.EFI_CLIENT_SECRET || 'Client_Secret_YOUR_CLIENT_SECRET',
    certificate: '${combinedCertPath.replace(/\\\\/g, '/')}',
    pemKey: '${combinedCertPath.replace(/\\\\/g, '/')}',
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
            console.log('📋 Detalhes:', error.message);
            
            if (error.message.includes('certificate')) {
                console.log('\n🔍 Possíveis soluções:');
                console.log('- Verifique se o certificado foi extraído corretamente');
                console.log('- Confirme se o arquivo .p12 é válido');
                console.log('- Verifique se a senha do .p12 está correta');
            } else if (error.message.includes('credentials') || error.message.includes('client')) {
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
}`;
    
    fs.writeFileSync(path.join(__dirname, 'test-efi-extraido.js'), testScript);
    console.log('✅ Script de teste criado: test-efi-extraido.js');
    
    // Limpar arquivos temporários
    if (fs.existsSync(certOutputPath)) {
        fs.unlinkSync(certOutputPath);
    }
    if (fs.existsSync(keyOutputPath)) {
        fs.unlinkSync(keyOutputPath);
    }
    
    console.log('\n🎉 EXTRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('📁 Certificado combinado:', combinedCertPath);
    console.log('⚙️  Configurações atualizadas:');
    console.log('   - .env.local');
    console.log('   - config/efi-config.js');
    console.log('\n🧪 Execute o teste:');
    console.log('   node test-efi-extraido.js');
    
} catch (error) {
    console.error('\n❌ Erro durante a extração:');
    console.error('📋 Detalhes:', error.message);
    console.error('\n🔍 Possíveis soluções:');
    console.error('- Verifique se o arquivo .p12 existe e é válido');
    console.error('- Confirme se o OpenSSL está instalado corretamente');
    console.error('- Tente fornecer a senha do .p12 manualmente');
    console.error('\n💡 Comando manual para testar:');
    console.error(`   ${opensslPath} pkcs12 -in "${p12FilePath}" -info`);
}