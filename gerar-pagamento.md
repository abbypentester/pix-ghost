🔗 Endpoint: GET /create_payment

📥 Parâmetros:
user_id (int) – ID do usuário no Telegram
valor (float) – Valor do pagamento (mínimo: R$1.06)

📌 Exemplo de requisição:
Bash


curl -X GET "https://caospayment.shop/create_payment?user_id=6563398267&valor=10.50"

📦 Exemplo de resposta:
JSON


{
  "calendario": {
    "criacao": "2025-06-03T21:23:23.816Z",
    "expiracao": 3600
  },
  "txid": "e31b6bdfecd44c5d988...",
  "revisao": 0,
  "status": "ATIVA",
  "valor": {
    "original": "1.06"
  },
  "devedor": {
    "cpf": "00000000272",
    "nome": "Francisco da Silva"
  },
  "solicitacaoPagador": "Intermediações de pagamentos.",
  "loc": {
    "id": 14,
    "location": "qrcodespix.sejaefi.com.br/v2/...",
    "tipoCob": "cob",
    "criacao": "2025-06-03T21:23:23.825Z"
  },
  "location": "qrcodespix.sejaefi.com.br/v2/...",
  "pixCopiaECola": "00020101021226830014BR.GOV.BCB.PIX2561qrcodespix.sejaefi.com.br/...",
  "qrcode_base64": "iVBORw0KGgoAAAANSUhEUgA...",
  "external_id": "a7844b527c3d4c78a386...",
  "amount": 1.06,
  "taxa": 1.05,
  "valor_liquido": 0.01
}