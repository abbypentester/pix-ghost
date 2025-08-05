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

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { amount, description } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Valor inválido' });
    }

    // Verificar se a chave PIX está configurada
    if (!process.env.EFI_PIX_KEY) {
        return res.status(500).json({ 
            error: 'Chave PIX não configurada', 
            details: 'Configure EFI_PIX_KEY no arquivo .env.local com uma chave PIX válida da sua conta EFI' 
        });
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
        
        // Gerar txid único
        const txid = generateTxId();
        
        // Dados da cobrança PIX
        const pixData = {
            calendario: {
                expiracao: 3600 // 1 hora
            },
            valor: {
                original: parseFloat(amount).toFixed(2)
            },
            chave: process.env.EFI_PIX_KEY, // Chave PIX obrigatória - configure no .env.local
            solicitacaoPagador: description || `Depósito PIX Ghost - Usuário: ${req.body.userId || 'anônimo'}`
        };

        console.log('Criando cobrança PIX com dados:', JSON.stringify(pixData, null, 2));

        // Criar cobrança PIX imediata
        const response = await efipay.pixCreateImmediateCharge(
            { txid },
            pixData
        );

        console.log('Resposta da EFI:', JSON.stringify(response, null, 2));

        // Gerar QR Code
        const qrCodeResponse = await efipay.pixGenerateQRCode(
            { id: response.loc.id }
        );

        console.log('QR Code gerado:', qrCodeResponse);

        // Retornar dados no formato esperado pelo frontend
        return res.status(200).json({
            success: true,
            txid: txid,
            external_id: txid, // Para compatibilidade com o código existente
            qrcode_base64: qrCodeResponse.imagemQrcode,
            pixCopiaECola: qrCodeResponse.qrcode,
            valor: parseFloat(amount).toFixed(2),
            status: 'ATIVA',
            location_id: response.loc.id,
            efi_response: response
        });

    } catch (error) {
        console.error('Erro ao gerar cobrança PIX:', error);
        
        // Tratamento de erros específicos da EFI
        let errorMessage = 'Erro interno do servidor';
        
        if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.response && error.response.data) {
            errorMessage = error.response.data.mensagem || error.response.data.error_description || errorMessage;
        }

        return res.status(500).json({
            error: 'Erro ao gerar cobrança PIX',
            details: errorMessage,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}