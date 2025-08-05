import EfiPay from 'sdk-node-apis-efi';
import fs from 'fs';
import path from 'path';

// Configuração da EFI
const efiConfig = {
    sandbox: false, // Produção
    client_id: process.env.EFI_CLIENT_ID || 'Client_Id_8897337f5626755b4e202c13412fe2629cdf8852',
    client_secret: process.env.EFI_CLIENT_SECRET || 'Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747',
    certificate: process.env.EFI_CERTIFICATE_PATH || './certificado-completo-efi.pem',
    cert_base64: false
};

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // Obter txid da query string ou body
    const txid = req.method === 'GET' ? req.query.txid : req.body.txid;
    const external_id = req.method === 'GET' ? req.query.external_id : req.body.external_id;
    
    // Usar txid ou external_id (para compatibilidade)
    const transactionId = txid || external_id;

    if (!transactionId) {
        return res.status(400).json({ error: 'txid ou external_id é obrigatório' });
    }

    try {
        // Verificar se o certificado existe
        const certPath = process.env.EFI_CERTIFICATE_PATH || path.resolve('./certificado-completo-efi.pem');
        if (!fs.existsSync(certPath)) {
            throw new Error(`Certificado não encontrado no caminho: ${certPath}. Verifique se o arquivo certificado-completo-efi.pem está configurado corretamente.`);
        }

        // Configurar EFI com o caminho correto do certificado
        const configWithCertPath = {
            ...efiConfig,
            certificate: certPath,
            pemKey: certPath // Necessário para certificados .pem
        };

        const efipay = new EfiPay(configWithCertPath);
        
        console.log('Verificando status da cobrança PIX:', transactionId);

        // Consultar cobrança PIX
        const response = await efipay.pixDetailCharge(
            { txid: transactionId }
        );

        console.log('Resposta da consulta EFI:', JSON.stringify(response, null, 2));

        // Verificar se o pagamento foi realizado
        const isPaid = response.status === 'CONCLUIDA';
        const amount = response.valor ? parseFloat(response.valor.original) : 0;

        // Retornar dados no formato esperado pelo frontend
        return res.status(200).json({
            success: true,
            paid: isPaid,
            status: response.status,
            txid: transactionId,
            external_id: transactionId, // Para compatibilidade
            amount: amount,
            valor: amount.toFixed(2),
            payment_date: response.pix && response.pix.length > 0 ? response.pix[0].horario : null,
            efi_response: response,
            // Dados adicionais para debug
            pix_details: response.pix || [],
            devedor: response.devedor || null
        });

    } catch (error) {
        console.error('Erro ao verificar cobrança PIX:', error);
        
        // Tratamento de erros específicos da EFI
        let errorMessage = 'Erro interno do servidor';
        let statusCode = 500;
        
        if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.response && error.response.data) {
            errorMessage = error.response.data.mensagem || error.response.data.error_description || errorMessage;
            
            // Se a cobrança não foi encontrada
            if (error.response.status === 404) {
                statusCode = 404;
                errorMessage = 'Cobrança não encontrada';
            }
        }

        return res.status(statusCode).json({
            success: false,
            paid: false,
            error: 'Erro ao verificar cobrança PIX',
            details: errorMessage,
            txid: transactionId,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}