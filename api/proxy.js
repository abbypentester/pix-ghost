const fetch = require('node-fetch');
const https = require('https');
const http = require('http');

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
    console.log('URL original recebida:', url);

    if (!url) {
        return res.status(400).json({ error: 'O parâmetro url é obrigatório.' });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        console.log('Fazendo requisição para:', decodedUrl);
        
        // Verificar se a URL é válida para a API Caos
        if (!decodedUrl.startsWith('https://caospayment.shop/') && !decodedUrl.startsWith('http://caospayment.shop/')) {
            console.error('URL inválida:', decodedUrl);
            console.log('Tentando corrigir a URL para o domínio correto...');
            
            try {
                // Extrair o caminho e os parâmetros da URL
                const urlObj = new URL(decodedUrl);
                const path = urlObj.pathname;
                const params = urlObj.search;
                
                // Construir a nova URL com o domínio correto usando HTTPS
                const correctedUrl = `https://caospayment.shop${path}${params}`;
                console.log('URL corrigida:', correctedUrl);
                
                // Verificar se a URL corrigida é válida
                new URL(correctedUrl); // Isso lançará um erro se a URL for inválida
                
                // Atualizar a URL decodificada
                decodedUrl = correctedUrl;
            } catch (urlError) {
                console.error('Erro ao corrigir URL:', urlError.message);
                
                // Tentar uma abordagem mais simples
                if (decodedUrl.includes('/create_payment')) {
                    const match = decodedUrl.match(/user_id=([^&]+)&valor=([^&]+)/);
                    if (match) {
                        const userId = match[1];
                        const valor = match[2];
                        const correctedUrl = `https://caospayment.shop/create_payment?user_id=${userId}&valor=${valor}`;
                        console.log('URL reconstruída manualmente:', correctedUrl);
                        decodedUrl = correctedUrl;
                    }
                } else if (decodedUrl.includes('/verify_payment')) {
                    const match = decodedUrl.match(/payment_id=([^&]+)/);
                    if (match) {
                        const paymentId = match[1];
                        const correctedUrl = `https://caospayment.shop/verify_payment?payment_id=${paymentId}`;
                        console.log('URL reconstruída manualmente:', correctedUrl);
                        decodedUrl = correctedUrl;
                    }
                }
            }
        }
        
        console.log('Iniciando requisição para URL completa:', decodedUrl);
        
        // Usar o módulo fetch para fazer a requisição
        console.log('Usando fetch para fazer a requisição para:', decodedUrl);
        
        try {
            const fetchResponse = await fetch(decodedUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json'
                },
                timeout: 15000 // Aumentando o timeout para 15 segundos
            });
            
            console.log('Status da resposta fetch:', fetchResponse.status);
            
            if (!fetchResponse.ok) {
                console.error(`API respondeu com erro ${fetchResponse.status}. URL: ${decodedUrl}`);
                throw new Error(`API respondeu com status ${fetchResponse.status}. Verifique se a URL está correta.`);
            }
            
            const responseText = await fetchResponse.text();
            console.log('Resposta completa recebida. Tamanho:', responseText.length);
            console.log('Primeiros 200 caracteres da resposta:', responseText.substring(0, 200));
            
            try {
                const data = JSON.parse(responseText);
                console.log('Resposta JSON parseada com sucesso. Campos:', Object.keys(data).join(', '));
                console.log('Resposta recebida com sucesso:', JSON.stringify(data).substring(0, 200) + '...');
                res.status(200).json(data);
                return;
            } catch (parseError) {
                console.error('Erro ao fazer parse da resposta:', parseError.message);
                console.error('Resposta recebida (primeiros 500 caracteres):', responseText.substring(0, 500));
                throw new Error(`Erro ao fazer parse da resposta JSON: ${parseError.message}`);
            }
        } catch (fetchError) {
            console.error('Erro na requisição fetch:', fetchError.message);
            throw fetchError;
        }
    } catch (error) {
        console.error('Erro na requisição:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Tentar obter mais informações sobre o erro
        let errorDetails = {
            message: error.message,
            stack: error.stack,
            url: decodedUrl
        };
        
        // Se for um erro de rede, tentar obter mais informações
        if (error.name === 'FetchError') {
            errorDetails.type = error.type;
            errorDetails.code = error.code;
        }
        
        console.error('Detalhes do erro:', JSON.stringify(errorDetails));
        
        // Tentar fazer uma requisição direta para a URL para verificar se é acessível
        try {
            console.log('Tentando fazer uma requisição direta para verificar a URL:', decodedUrl);
            const testResponse = await fetch(decodedUrl, { method: 'HEAD', timeout: 5000 });
            console.log('Resultado do teste de acessibilidade:', testResponse.status);
            errorDetails.urlTestStatus = testResponse.status;
        } catch (testError) {
            console.error('Erro no teste de acessibilidade da URL:', testError.message);
            errorDetails.urlTestError = testError.message;
        }
        
        res.status(error.status || 500).json({ 
            error: 'Erro ao fazer a requisição para a API externa.', 
            details: error.message,
            errorInfo: errorDetails,
            url: decodedUrl
        });
    }
};