import fetch from 'node-fetch';

export default async (req, res) => {
    // Configura os cabeçalhos CORS para todas as respostas
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde a requisições preflight OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const urlParamIndex = req.url.indexOf('?url=');

    if (urlParamIndex === -1) {
        return res.status(400).json({ error: 'O parâmetro url é obrigatório e deve começar com ?url=.' });
    }

    const encodedUrl = req.url.substring(urlParamIndex + 5);

    if (!encodedUrl) {
        return res.status(400).json({ error: 'O parâmetro url está vazio.' });
    }

    let targetUrl;
    try {
        targetUrl = decodeURIComponent(encodedUrl);
    } catch (e) {
        return res.status(400).json({ error: 'URL malformada.' });
    }

    // Validação de segurança: permitir apenas o domínio caospayment.shop
    if (!targetUrl.startsWith('https://caospayment.shop/')) {
        return res.status(403).json({ error: 'Acesso a este domínio não é permitido.' });
    }

    try {
        console.log(`Proxying request to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Vercel-Proxy/1.0',
                'Accept': 'application/json, text/plain, */*'
            },
            timeout: 20000, // 20 segundos
        });

        // Encaminha o status e os cabeçalhos da resposta da API externa
        res.status(response.status);
        response.headers.forEach((value, name) => {
            // Evita sobrescrever cabeçalhos de controle do proxy
            if (!['content-encoding', 'transfer-encoding'].includes(name.toLowerCase())) {
                 res.setHeader(name, value);
            }
        });

        // Encaminha o corpo da resposta
        const body = await response.buffer(); // Usar buffer para lidar com qualquer tipo de conteúdo
        res.send(body);

    } catch (error) { 
        console.error('Proxy Error:', error);
        if (error.type === 'request-timeout') {
            return res.status(504).json({ error: 'Timeout na requisição para a API externa.' });
        }
        return res.status(502).json({ 
            error: 'Erro ao se comunicar com a API externa.',
            details: error.message
        });
    }
};