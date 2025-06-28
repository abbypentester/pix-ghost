document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const userIdInput = document.getElementById('userId');
    const amountInput = document.getElementById('amount');
    const feeSummary = document.getElementById('fee-summary');
    const generateBtn = document.getElementById('generateBtn');
    
    // Adicionar título à página para reforçar privacidade
    document.title = 'Gateway de Pagamento PIX Privado';
    
    const paymentInfoDiv = document.getElementById('payment-info');
    const qrCodeImg = document.getElementById('qrCodeImg');
    const pixCopiaECola = document.getElementById('pixCopiaECola');
    const copyPixBtn = document.getElementById('copyPixBtn');
    const sharePixBtn = document.getElementById('sharePixBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const paymentStatus = document.getElementById('payment-status');

    const balanceUserIdInput = document.getElementById('balanceUserId');
    const checkBalanceBtn = document.getElementById('checkBalanceBtn');
    const balanceDisplay = document.getElementById('balance-display');
    const balanceInfoText = document.querySelector('.balance-info-text');
    const withdrawalArea = document.getElementById('withdrawal-area');
    const pixKeyInput = document.getElementById('pixKey');
    const requestWithdrawalBtn = document.getElementById('requestWithdrawalBtn');
    const withdrawalStatus = document.getElementById('withdrawal-status');

    // --- Constantes e Variáveis de Estado ---
    const WITHDRAWAL_FEE = 0.10; // 10% taxa para saques
    let currentPaymentId = null;
    let userId = localStorage.getItem('userId');
    
    // Configurar cálculo de taxa em tempo real
    amountInput.addEventListener('input', updateFeeSummary);
    
    function updateFeeSummary() {
        const amount = parseFloat(amountInput.value);
        if (!amount || isNaN(amount) || amount <= 0) {
            feeSummary.classList.add('hidden');
            return;
        }
        
        const fee = amount * WITHDRAWAL_FEE;
        const netAmount = amount - fee;
        
        feeSummary.innerHTML = `
            <div class="balance-summary">
                <div class="balance-item">
                    <span>Valor bruto:</span>
                    <strong>R$ ${amount.toFixed(2)}</strong>
                </div>
                <div class="balance-item">
                    <span>Taxa (10%):</span>
                    <strong style="color: var(--error-color);">- R$ ${fee.toFixed(2)}</strong>
                </div>
                <div class="balance-item total">
                    <span>Valor líquido:</span>
                    <strong style="color: var(--success-color);">R$ ${netAmount.toFixed(2)}</strong>
                </div>
            </div>
            <p class="privacy-note">Transação 100% anônima e privada, sem rastreamento.</p>
        `;
        feeSummary.classList.remove('hidden');
    }

    // --- Inicialização ---
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('userId', userId);
    }
    userIdInput.value = userId;
    
    // Adicionar evento para selecionar o ID do usuário ao clicar
    userIdInput.addEventListener('click', function() {
        this.select();
        try {
            // Tenta copiar automaticamente para a área de transferência
            navigator.clipboard.writeText(this.value)
                .then(() => {
                    // Feedback visual temporário
                    const originalBg = this.style.backgroundColor;
                    this.style.backgroundColor = '#d1fae5';
                    setTimeout(() => {
                        this.style.backgroundColor = originalBg;
                    }, 500);
                })
                .catch(err => {
                    // Se falhar, pelo menos seleciona o texto para o usuário copiar manualmente
                    console.log('Clipboard API não disponível, texto selecionado para cópia manual');
                });
        } catch (err) {
            // Apenas seleciona o texto para o usuário copiar manualmente
            console.log('Erro ao tentar copiar: ' + err);
        }
    });

    // --- GERADOR PIX ---
    const paymentInfoBox = document.getElementById('payment-info');
    
    // Adicionar funcionalidade ao botão de compartilhamento
    sharePixBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'Pagamento PIX',
                text: 'Use este código PIX para fazer o pagamento:',
                url: window.location.href
            })
            .then(() => console.log('Compartilhado com sucesso'))
            .catch((error) => console.log('Erro ao compartilhar', error));
        } else {
            alert('Seu navegador não suporta a função de compartilhamento. Por favor, copie o código manualmente.');
        }
    });

    generateBtn.addEventListener('click', async () => {
        const amount = amountInput.value;
        if (!amount || isNaN(amount) || amount <= 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Gerando...';

        try {
            const response = await fetch(`/api/proxy?url=${encodeURIComponent(`https://caospayment.shop/create_payment?value=${amount}`)}`);
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            
            const data = await response.json();
            if (data.qr_code_base64 && data.pix_copy) {
                qrCodeImg.src = `data:image/png;base64,${data.qr_code_base64}`;
                pixCopiaECola.value = data.pix_copy;
                currentPaymentId = data.payment_id;
                paymentInfoBox.classList.remove('hidden');
                paymentStatus.textContent = '';
            } else {
                throw new Error('Resposta da API de pagamento inválida.');
            }
        } catch (error) {
            console.error('Erro ao gerar pagamento:', error);
            alert(`Erro ao gerar pagamento: ${error.message}`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Gerar QR Code PIX';
        }
    });

    copyPixBtn.addEventListener('click', () => {
        pixCopiaECola.select();
        try {
            // Tenta usar a API moderna de clipboard
            navigator.clipboard.writeText(pixCopiaECola.value)
                .then(() => {
                    copyPixBtn.innerHTML = '✓ Copiado!';
                    copyPixBtn.style.backgroundColor = 'var(--success-color)';
                    setTimeout(() => {
                        copyPixBtn.innerHTML = '📋 Copiar Código PIX';
                        copyPixBtn.style.backgroundColor = 'var(--accent-color)';
                    }, 2000);
                })
                .catch(err => {
                    // Fallback para o método antigo
                    document.execCommand('copy');
                    copyPixBtn.innerHTML = '✓ Copiado!';
                    copyPixBtn.style.backgroundColor = 'var(--success-color)';
                    setTimeout(() => {
                        copyPixBtn.innerHTML = 'Copiar Código PIX';
                        copyPixBtn.style.backgroundColor = 'var(--accent-color)';
                    }, 2000);
                });
        } catch (err) {
            // Fallback para navegadores que não suportam a API clipboard
            document.execCommand('copy');
            copyPixBtn.innerHTML = '✓ Copiado!';
            copyPixBtn.style.backgroundColor = 'var(--success-color)';
            setTimeout(() => {
                copyPixBtn.innerHTML = '📋 Copiar Código PIX';
                copyPixBtn.style.backgroundColor = 'var(--accent-color)';
            }, 2000);
        }
    });

    verifyBtn.addEventListener('click', async () => {
        if (!currentPaymentId) {
            alert('Nenhum pagamento para verificar.');
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verificando...';
        paymentStatus.textContent = 'Verificando pagamento de forma anônima e privada...';
        paymentStatus.style.color = 'var(--accent-color)';

        try {
            const response = await fetch(`/api/proxy?url=${encodeURIComponent(`https://caospayment.shop/verify_payment?payment_id=${currentPaymentId}`)}`);
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            
            const data = await response.json();
            if (data.status === 'CONCLUIDA') {
                paymentStatus.innerHTML = '<strong>Status: PAGAMENTO CONFIRMADO ✓</strong><br>Sua transação foi processada com total privacidade.';
                paymentStatus.style.color = 'var(--success-color)';
                const amount = parseFloat(amountInput.value);
                await addBalance(userId, amount);
            } else {
                paymentStatus.innerHTML = `<strong>Status: ${data.status}</strong><br>Aguardando pagamento de forma anônima...`;
                paymentStatus.style.color = 'orange';
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
            alert(`Erro ao verificar pagamento: ${error.message}`);
            paymentStatus.textContent = 'Erro ao verificar.';
            paymentStatus.style.color = 'var(--error-color)';
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verificar Status';
        }
    });

    async function addBalance(userId, amount) {
        try {
            // Calcular o valor líquido e a taxa
            const fee = amount * WITHDRAWAL_FEE;
            const netAmount = amount - fee;
            
            // Adicionar o saldo líquido ao usuário
            const response = await fetch('/api/add-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    amount: netAmount,
                    transactionType: 'deposit',
                    paymentId: currentPaymentId
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao adicionar saldo');
            }
            
            console.log('Saldo adicionado com sucesso');
            paymentStatus.innerHTML = '<strong>Pagamento confirmado e saldo adicionado!</strong><br>Seu saldo foi atualizado com total privacidade. Você já pode consultar seu novo saldo de forma anônima.';
        } catch (error) {
            console.error('Erro ao adicionar saldo:', error);
            alert(`Erro ao atualizar saldo: ${error.message}`);
        }
    }

    // --- CONSULTA E SAQUE ---

    checkBalanceBtn.addEventListener('click', async () => {
        const userIdToQuery = balanceUserIdInput.value;
        if (!userIdToQuery) {
            alert('Por favor, insira seu ID da Carteira.');
            return;
        }

        checkBalanceBtn.disabled = true;
        checkBalanceBtn.textContent = 'Consultando...';

        try {
            // Incluir histórico de transações na consulta
            const response = await fetch(`/api/get-balance?userId=${userIdToQuery}&includeTransactions=true`);
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            
            const data = await response.json();
            const balance = data.balance || 0;
            const fee = WITHDRAWAL_FEE; // 10% de taxa
            const withdrawableBalance = balance * (1 - fee);
            const feeAmount = balance * fee;
            const transactions = data.transactions || [];

            // Construir o HTML para o resumo do saldo
            let balanceHtml = `
                <div class="balance-summary">
                    <div class="balance-item">
                        <span>Saldo Bruto:</span>
                        <strong style="color: var(--primary-color);">R$ ${balance.toFixed(2)}</strong>
                    </div>
                    <div class="balance-item">
                        <span>Taxa (10%):</span>
                        <strong style="color: var(--error-color);">- R$ ${feeAmount.toFixed(2)}</strong>
                    </div>
                    <div class="balance-item total">
                        <span>Saldo para Saque:</span>
                        <strong style="color: var(--success-color);">R$ ${withdrawableBalance.toFixed(2)}</strong>
                    </div>
                </div>
                <p class="privacy-note">🔒 Suas transações são 100% anônimas. Nenhum dado pessoal é armazenado.</p>
            `;
            
            // Adicionar histórico de transações se houver transações
            if (transactions.length > 0) {
                balanceHtml += `
                    <div class="transactions-history">
                        <h3>Histórico de Transações</h3>
                        <div class="transactions-list">
                `;
                
                transactions.forEach(transaction => {
                    const amount = parseFloat(transaction.amount);
                    const isDeposit = amount > 0 || transaction.type === 'deposit';
                    const amountColor = isDeposit ? 'var(--success-color)' : 'var(--error-color)';
                    const amountPrefix = isDeposit ? '+' : '';
                    const transactionType = isDeposit ? 'Depósito' : 'Saque';
                    
                    balanceHtml += `
                        <div class="transaction-item">
                            <div class="transaction-info">
                                <span class="transaction-type">${transactionType}</span>
                                <span class="transaction-date">${transaction.formattedDate || 'Data não disponível'}</span>
                            </div>
                            <span class="transaction-amount" style="color: ${amountColor}">${amountPrefix}R$ ${Math.abs(amount).toFixed(2)}</span>
                        </div>
                    `;
                });
                
                balanceHtml += `
                        </div>
                    </div>
                `;
            }
            
            balanceInfoText.innerHTML = balanceHtml;
            balanceDisplay.classList.remove('hidden');

            if (withdrawableBalance > 0) {
                withdrawalArea.classList.remove('hidden');
            } else {
                withdrawalArea.classList.add('hidden');
            }
            withdrawalStatus.textContent = '';

        } catch (error) {
            console.error('Erro ao consultar saldo:', error);
            alert(`Erro ao consultar saldo: ${error.message}`);
            balanceInfoText.textContent = 'Erro ao consultar saldo.';
        } finally {
            checkBalanceBtn.disabled = false;
            checkBalanceBtn.textContent = 'Consultar Saldo';
        }
    });

    requestWithdrawalBtn.addEventListener('click', async () => {
        const pixKey = pixKeyInput.value;
        const userIdToWithdraw = balanceUserIdInput.value;

        if (!pixKey) {
            alert('Por favor, insira sua chave PIX para o saque.');
            return;
        }

        requestWithdrawalBtn.disabled = true;
        requestWithdrawalBtn.textContent = 'Processando...';

        try {
            const response = await fetch('/api/request-withdrawal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userIdToWithdraw, pixKey }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao solicitar saque');
            }

            const result = await response.json();
            withdrawalStatus.innerHTML = `<strong>${result.message}</strong><br>Sua solicitação foi registrada com total privacidade. Você receberá o valor em até 24 horas de forma discreta.`;
            withdrawalStatus.style.color = 'var(--success-color)';
            withdrawalStatus.classList.remove('hidden');
            withdrawalArea.classList.add('hidden'); // Oculta a área após a solicitação

        } catch (error) {
            console.error('Erro na solicitação de saque:', error);
            withdrawalStatus.textContent = `Erro: ${error.message}`;
            withdrawalStatus.style.color = 'var(--error-color)';
        } finally {
            requestWithdrawalBtn.disabled = false;
            requestWithdrawalBtn.textContent = 'Solicitar Saque';
        }
    });

    function generateUUID() {
        // Implementação mais robusta do UUID v4
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
});