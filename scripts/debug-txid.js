// Script para debugar o problema do txid

// Função para gerar um txid único (26-35 caracteres alfanuméricos)
function generateTxId() {
    // Gerar uma string aleatória de 32 caracteres usando timestamp e valores aleatórios
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    
    // Combinar e garantir que tenha pelo menos 26 caracteres
    let txid = `${timestamp}${random1}${random2}`.replace(/[^a-zA-Z0-9]/g, '');
    
    // Garantir que tenha entre 26-35 caracteres
    if (txid.length < 26) {
        // Adicionar mais caracteres aleatórios se necessário
        const extraRandom = Math.random().toString(36).substring(2);
        txid += extraRandom.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    // Limitar a 35 caracteres
    return txid.substring(0, 35);
}

console.log('=== DEBUG TXID ===');
console.log('Testando geração de txid...');

// Gerar 5 txids para teste
for (let i = 1; i <= 5; i++) {
    const txid = generateTxId();
    console.log(`TXID ${i}: ${txid} (${txid.length} caracteres)`);
    
    // Validar se está no formato correto
    const isValid = /^[a-zA-Z0-9]{26,35}$/.test(txid);
    console.log(`  Válido: ${isValid ? '✅' : '❌'}`);
    
    if (!isValid) {
        console.log(`  Erro: TXID inválido - ${txid}`);
    }
}

console.log('\n=== ANÁLISE DO PROBLEMA ===');
console.log('Problema identificado nos logs:');
console.log('1. TXID gerado: mdyocew9su3ntr68w7bcx6xfub (29 caracteres)');
console.log('2. TXID verificado: mdyocew9su3ntr68w7bcx6xfub9uxd (33 caracteres)');
console.log('3. Erro: "Nenhuma cobrança encontrada para o txid informado"');
console.log('\nO problema parece ser que o txid está sendo modificado entre a geração e a verificação!');
console.log('\nPossíveis causas:');
console.log('- Truncamento no frontend');
console.log('- Modificação durante o armazenamento');
console.log('- Problema na transmissão dos dados');

console.log('\n=== VERIFICAÇÃO DO SISTEMA DE SALDO ===');
console.log('O sistema está usando fallback em memória porque:');
console.log('- Variáveis do Vercel KV não estão configuradas');
console.log('- Isso significa que o saldo é perdido quando o servidor reinicia');
console.log('- Para produção, é necessário configurar KV_REST_API_URL e KV_REST_API_TOKEN no Vercel');