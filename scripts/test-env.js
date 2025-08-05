import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

console.log('=== Teste de Variáveis de Ambiente ===');
console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
console.log('GOOGLE_SERVICE_ACCOUNT_PATH:', process.env.GOOGLE_SERVICE_ACCOUNT_PATH);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Verificar se o arquivo JSON existe
import fs from 'fs';
import path from 'path';

const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
if (jsonPath) {
  const fullPath = path.resolve(jsonPath);
  console.log('Caminho completo do JSON:', fullPath);
  console.log('Arquivo existe:', fs.existsSync(fullPath));
} else {
  console.log('GOOGLE_SERVICE_ACCOUNT_PATH não definido');
}

// Testar a verificação do kv-fallback
const hasGoogleSheetsConfig = process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
console.log('hasGoogleSheetsConfig:', hasGoogleSheetsConfig);