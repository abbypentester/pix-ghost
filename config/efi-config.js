// Configuração da EFI Pay
// IMPORTANTE: Em produção, use variáveis de ambiente para as credenciais

module.exports = {
    // PRODUÇÃO = false
    // HOMOLOGAÇÃO = true
    sandbox: false, // Altere para true para usar o ambiente de testes
    client_id: process.env.EFI_CLIENT_ID || 'Client_Id_8897337f5626755b4e202c13412fe2629cdf8852',
    client_secret: process.env.EFI_CLIENT_SECRET || 'Client_Secret_9352ff9fddccae8e7114502c23d1fca669a7a747',
    certificate: process.env.EFI_CERTIFICATE_PATH || './certificado-efi-v3.pem', // Caminho para o certificado
    pemKey: process.env.EFI_CERTIFICATE_PATH || './certificado-efi-v3.pem', // Mesmo valor que certificate
    cert_base64: false, // Indica se o certificado está em base64 ou não
    
    // URLs da API EFI
    baseUrl: {
        production: 'https://api.efipay.com.br',
        sandbox: 'https://sandbox.api.efipay.com.br'
    },
    
    // Configurações específicas do PIX
    pix: {
        // Tempo de expiração padrão para cobranças (em segundos)
        defaultExpiration: 3600, // 1 hora
        
        // Webhook URL (configure conforme seu domínio)
        webhookUrl: process.env.EFI_WEBHOOK_URL || 'https://seu-dominio.vercel.app/api/webhook/efi'
    }
};