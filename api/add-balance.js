import { kv } from '@vercel/kv';

// Função para gerar um ID único para a transação
function generateTransactionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, amount, transactionType, paymentId } = request.body;

  if (!userId || !amount) {
    return response.status(400).json({ error: 'User ID and amount are required' });
  }

  try {
    // Gerar um ID único para a transação
    const transactionId = generateTransactionId();
    
    // Registrar a transação no banco de dados
    await kv.hset(`transaction:${transactionId}`, {
      userId,
      type: transactionType || 'deposit',
      amount,
      paymentId: paymentId || null,
      timestamp: Date.now(),
      status: 'completed'
    });
    
    // Adicionar a transação à lista de transações do usuário
    await kv.lpush(`user:${userId}:transactions`, transactionId);
    
    // HINCRBY atomically increments the value of a hash field by the given number.
    const newBalance = await kv.hincrby(`user:${userId}`, 'balance', amount);
    
    return response.status(200).json({ 
      success: true, 
      newBalance,
      transactionId
    });
  } catch (error) {
    console.error('Error updating balance in Vercel KV:', error);
    return response.status(500).json({ 
      error: 'Failed to update balance.',
      details: error.message 
    });
  }
}