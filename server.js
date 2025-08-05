import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
// Em produção (Vercel), as variáveis vêm do painel
// Em desenvolvimento local, sempre carregar .env.local
if (!process.env.VERCEL) {
  dotenv.config({ path: '.env.local' });
}

// Verificar se estamos em produção e mostrar status das variáveis
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Executando em PRODUÇÃO');
  console.log('📋 Status das variáveis de ambiente:');
  console.log('   EFI_CLIENT_ID:', process.env.EFI_CLIENT_ID ? '✅ Configurada' : '❌ Não configurada');
  console.log('   EFI_CLIENT_SECRET:', process.env.EFI_CLIENT_SECRET ? '✅ Configurada' : '❌ Não configurada');
  console.log('   EFI_PIX_KEY:', process.env.EFI_PIX_KEY ? '✅ Configurada' : '❌ Não configurada');
  console.log('   EFI_CERTIFICATE_PATH:', process.env.EFI_CERTIFICATE_PATH ? '✅ Configurada' : '❌ Não configurada');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Importar e configurar as APIs
import generatePixEfi from './api/generate-pix-efi.js';
import verifyPixEfi from './api/verify-pix-efi.js';
import addBalance from './api/add-balance.js';
import getBalance from './api/get-balance.js';
import requestWithdrawal from './api/request-withdrawal.js';
import hello from './api/hello.js';
import proxy from './api/proxy.js';
import webhookEfi from './api/webhook/efi.js';

// Rotas da API
app.post('/api/generate-pix-efi', generatePixEfi.default || generatePixEfi);
app.post('/api/verify-pix-efi', verifyPixEfi.default || verifyPixEfi);
app.post('/api/add-balance', addBalance.default || addBalance);
app.get('/api/get-balance', getBalance.default || getBalance);
app.post('/api/request-withdrawal', requestWithdrawal.default || requestWithdrawal);
app.get('/api/hello', hello.default || hello);
app.all('/api/proxy', proxy.default || proxy);
app.post('/api/webhook/efi', webhookEfi.default || webhookEfi);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Verificar se o certificado existe
const certPath = process.env.EFI_CERTIFICATE_PATH;
if (certPath && fs.existsSync(certPath)) {
  console.log('✅ Certificado EFI encontrado:', certPath);
} else {
  console.log('⚠️  Certificado EFI não encontrado. Configure EFI_CERTIFICATE_PATH no .env.local');
}

// Verificar configurações essenciais
const requiredEnvs = ['EFI_CLIENT_ID', 'EFI_CLIENT_SECRET', 'EFI_PIX_KEY'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env] || process.env[env].includes('seu_'));

if (missingEnvs.length > 0) {
  console.log('⚠️  Configurações pendentes no .env.local:');
  missingEnvs.forEach(env => console.log(`   - ${env}`));
  console.log('\n📝 Configure essas variáveis para usar a funcionalidade PIX completa.');
}

app.listen(PORT, () => {
  console.log(`\n🚀 GhostPIX rodando em http://localhost:${PORT}`);
  console.log('\n📋 Status da aplicação:');
  console.log('   ✅ Servidor web ativo');
  console.log('   ✅ APIs configuradas');
  console.log('   ✅ Interface web disponível');
  
  if (missingEnvs.length === 0) {
    console.log('   ✅ Configuração EFI completa');
    console.log('\n🎉 Aplicação pronta para produção!');
  } else {
    console.log('   ⚠️  Configure as credenciais EFI para funcionalidade completa');
  }
  
  console.log('\n🌐 Acesse: http://localhost:' + PORT);
});

export default app;