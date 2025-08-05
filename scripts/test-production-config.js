#!/usr/bin/env node

/**
 * Script para testar configurações antes do deploy em produção
 * Execute: node test-production-config.js
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis do .env.local para teste
dotenv.config({ path: '.env.local' });

console.log('🧪 Testando configurações para produção...\n');

// Verificar variáveis essenciais
const requiredVars = {
    'EFI_CLIENT_ID': process.env.EFI_CLIENT_ID,
    'EFI_CLIENT_SECRET': process.env.EFI_CLIENT_SECRET,
    'EFI_PIX_KEY': process.env.EFI_PIX_KEY,
    'EFI_CERTIFICATE_PATH': process.env.EFI_CERTIFICATE_PATH
};

let hasErrors = false;

console.log('📋 Verificando variáveis de ambiente:');
for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.includes('seu_') || value.includes('xxx')) {
        console.log(`   ❌ ${key}: Não configurada ou usando valor padrão`);
        hasErrors = true;
    } else {
        console.log(`   ✅ ${key}: Configurada`);
    }
}

// Verificar certificado
console.log('\n🔐 Verificando certificado:');
const certPath = process.env.EFI_CERTIFICATE_PATH || './certificado-completo-efi.pem';
if (fs.existsSync(certPath)) {
    const stats = fs.statSync(certPath);
    console.log(`   ✅ Certificado encontrado: ${certPath}`);
    console.log(`   📊 Tamanho: ${stats.size} bytes`);
    
    // Verificar se é um certificado válido
    const certContent = fs.readFileSync(certPath, 'utf8');
    if (certContent.includes('-----BEGIN CERTIFICATE-----') || certContent.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('   ✅ Formato do certificado válido');
    } else {
        console.log('   ❌ Formato do certificado inválido');
        hasErrors = true;
    }
} else {
    console.log(`   ❌ Certificado não encontrado: ${certPath}`);
    hasErrors = true;
}

// Verificar arquivos necessários
console.log('\n📁 Verificando arquivos necessários:');
const requiredFiles = [
    'package.json',
    'server.js',
    'vercel.json',
    'index.html'
];

for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} não encontrado`);
        hasErrors = true;
    }
}

// Verificar estrutura da API
console.log('\n🔌 Verificando APIs:');
const apiFiles = [
    'api/generate-pix-efi.js',
    'api/verify-pix-efi.js',
    'api/webhook/efi.js'
];

for (const apiFile of apiFiles) {
    if (fs.existsSync(apiFile)) {
        console.log(`   ✅ ${apiFile}`);
    } else {
        console.log(`   ❌ ${apiFile} não encontrado`);
        hasErrors = true;
    }
}

// Validar chave PIX
console.log('\n🔑 Validando chave PIX:');
const pixKey = process.env.EFI_PIX_KEY;
if (pixKey) {
    // Verificar se é email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Verificar se é telefone
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    // Verificar se é CPF (11 dígitos)
    const cpfRegex = /^\d{11}$/;
    // Verificar se é CNPJ (14 dígitos)
    const cnpjRegex = /^\d{14}$/;
    
    if (emailRegex.test(pixKey)) {
        console.log('   ✅ Chave PIX é um email válido');
    } else if (phoneRegex.test(pixKey.replace(/\D/g, ''))) {
        console.log('   ✅ Chave PIX é um telefone válido');
    } else if (cpfRegex.test(pixKey.replace(/\D/g, ''))) {
        console.log('   ✅ Chave PIX é um CPF válido');
    } else if (cnpjRegex.test(pixKey.replace(/\D/g, ''))) {
        console.log('   ✅ Chave PIX é um CNPJ válido');
    } else {
        console.log('   ⚠️  Formato da chave PIX não reconhecido (pode ser uma chave aleatória)');
    }
} else {
    console.log('   ❌ Chave PIX não configurada');
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.log('❌ CONFIGURAÇÃO INCOMPLETA');
    console.log('\n📝 Para corrigir:');
    console.log('1. Configure todas as variáveis no .env.local');
    console.log('2. Certifique-se de que o certificado está presente');
    console.log('3. Execute este teste novamente');
    console.log('4. Quando tudo estiver ✅, configure as mesmas variáveis no painel do Vercel');
    process.exit(1);
} else {
    console.log('✅ CONFIGURAÇÃO COMPLETA!');
    console.log('\n🚀 Próximos passos para deploy:');
    console.log('1. Configure as mesmas variáveis no painel do Vercel');
    console.log('2. Faça o deploy via GitHub ou Vercel CLI');
    console.log('3. Configure o webhook na EFI Pay');
    console.log('\n📖 Consulte DEPLOY-VERCEL.md para instruções detalhadas');
}

console.log('\n💡 Dica: Em produção, as variáveis vêm do painel do Vercel, não do .env.local');
console.log('='.repeat(50));