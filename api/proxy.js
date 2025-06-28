const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Adiciona o cabeçalho CORS para permitir requisições de qualquer origem
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Se a requisição for um OPTIONS (preflight), apenas retorna com os cabeçalhos
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Pega a URL da API original da query string da nossa requisição
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'O parâmetro url é obrigatório.' });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        console.log('Fazendo requisição para:', decodedUrl);
        
        // Adicionando opções para ignorar erros SSL e definir um timeout
        const fetchOptions = {
            timeout: 10000, // 10 segundos de timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };
        
        const apiResponse = await fetch(decodedUrl, fetchOptions);
        console.log('Status da resposta:', apiResponse.status);
        
        if (!apiResponse.ok) {
            throw new Error(`API respondeu com status ${apiResponse.status}: ${apiResponse.statusText}`);
        }
        
        const data = await apiResponse.json();
        console.log('Resposta recebida com sucesso');
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro na requisição:', error);
        res.status(error.status || 500).json({ 
            error: 'Erro ao fazer a requisição para a API externa.', 
            details: error.message,
            url: decodeURIComponent(url)
        });
    }
};