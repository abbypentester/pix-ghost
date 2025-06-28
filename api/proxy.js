const https = require('https');

module.exports = (req, res) => {
    // Configura os cabeçalhos CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde a requisições preflight OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url: encodedUrl } = req.query;
    console.log('Proxy: URL recebida (codificada):', encodedUrl);

    if (!encodedUrl) {
        console.log('Proxy: Erro - URL não fornecida.');
        return res.status(400).json({ error: 'O parâmetro url é obrigatório.' });
    }

    let targetUrl;
    try {
        targetUrl = decodeURIComponent(encodedUrl);
        console.log('Proxy: URL decodificada:', targetUrl);
    } catch (e) {
        console.log('Proxy: Erro ao decodificar URL.', e.message);
        return res.status(400).json({ error: 'URL malformada.' });
    }

    // Validação de segurança: permitir apenas o domínio caospayment.shop
    if (!targetUrl.startsWith('https://caospayment.shop/')) {
        console.log('Proxy: Acesso negado - domínio não permitido:', targetUrl);
        return res.status(403).json({ error: 'Acesso a este domínio não é permitido.' });
    }

    const options = {
        method: 'GET',
        headers: {
            'User-Agent': 'Vercel-Proxy/1.0',
            'Accept': 'application/json, text/plain, */*'
        },
        timeout: 20000, // 20 segundos
    };

    console.log('Proxy: Iniciando requisição para:', targetUrl);

    const proxyReq = https.get(targetUrl, options, (proxyRes) => {
        console.log(`Proxy: Resposta recebida da API externa com status: ${proxyRes.statusCode}`);
        
        // Encaminha os cabeçalhos da resposta da API externa para o cliente
        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        let body = '';
        proxyRes.on('data', (chunk) => {
            body += chunk;
        });

        proxyRes.on('end', () => {
            console.log('Proxy: Requisição finalizada. Corpo da resposta (primeiros 200 chars):', body.substring(0, 200));
            res.end(body);
        });
    });

    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        console.error('Proxy: Timeout na requisição para a API externa.');
        res.status(504).json({ error: 'A requisição para a API externa demorou muito para responder (timeout).' });
    });

    proxyReq.on('error', (error) => {
        console.error('Proxy: Erro na requisição para a API externa:', error);
        res.status(502).json({ 
            error: 'Erro ao se comunicar com a API externa.',
            details: error.message
        });
    });
};