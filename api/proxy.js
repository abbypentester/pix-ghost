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
    const { apiUrl } = req.query;

    if (!apiUrl) {
        return res.status(400).json({ error: 'O parâmetro apiUrl é obrigatório.' });
    }

    try {
        const apiResponse = await fetch(decodeURIComponent(apiUrl));
        const data = await apiResponse.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer a requisição para a API externa.', details: error.message });
    }
};