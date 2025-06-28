import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, includeTransactions } = request.query;

  if (!userId) {
    return response.status(400).json({ error: 'User ID is required' });
  }

  try {
    // HGET returns the value associated with a field in the hash stored at a key.
    const balance = await kv.hget(`user:${userId}`, 'balance');
    const finalBalance = balance || 0;
    
    // Resposta básica com o saldo
    const responseData = { balance: finalBalance };
    
    // Se solicitado, incluir o histórico de transações
    if (includeTransactions === 'true') {
      // Obter os IDs das últimas 10 transações
      const transactionIds = await kv.lrange(`user:${userId}:transactions`, 0, 9);
      
      if (transactionIds && transactionIds.length > 0) {
        const transactions = [];
        
        // Buscar os detalhes de cada transação
        for (const id of transactionIds) {
          const transaction = await kv.hgetall(`transaction:${id}`);
          if (transaction) {
            // Formatar a data para exibição
            if (transaction.timestamp) {
              transaction.formattedDate = new Date(parseInt(transaction.timestamp)).toLocaleString('pt-BR');
            }
            transactions.push(transaction);
          }
        }
        
        responseData.transactions = transactions;
      } else {
        responseData.transactions = [];
      }
    }
    
    return response.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching data from Vercel KV:', error);
    // Return the actual error message in the response for debugging purposes
    // In a real production environment, you might want to return a more generic error
    return response.status(500).json({ 
      error: 'Failed to fetch balance.',
      details: error.message, // Sending back the error message
    });
  }
}