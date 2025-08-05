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
    function initializeUserId() {
        let currentId = localStorage.getItem('userId');
        
        // Verifica se o ID é nulo, indefinido ou uma string vazia.
        if (!currentId || currentId.trim() === '') {
            console.log('Nenhum ID de carteira válido encontrado. Gerando um novo.');
            currentId = generateUUID();
            localStorage.setItem('userId', currentId);
        } else {
            console.log('ID da carteira carregado do localStorage:', currentId);
        }
        
        // Garante que ambos os campos de input sejam preenchidos com o ID válido.
        userIdInput.value = currentId;
        balanceUserIdInput.value = currentId;
        userId = currentId; // Atualiza a variável de estado global
    }

    initializeUserId(); // Chama a função de inicialização
    
    // Atualizar o userId no localStorage quando o usuário alterar o valor no input
    userIdInput.addEventListener('change', function() {
        if (this.value && this.value.trim() !== '') {
            userId = this.value.trim();
            localStorage.setItem('userId', userId);
            balanceUserIdInput.value = userId; // Atualizar também o campo de consulta de saldo
            console.log('ID da carteira atualizado:', userId);
        }
    });
    
    // Sincronizar o balanceUserIdInput com o userIdInput
    balanceUserIdInput.addEventListener('change', function() {
        if (this.value && this.value.trim() !== '') {
            userId = this.value.trim();
            localStorage.setItem('userId', userId);
            userIdInput.value = userId; // Atualizar também o campo de geração de pagamento
            console.log('ID da carteira atualizado a partir do campo de consulta:', userId);
        }
    });
    
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
            // Fazer requisição para gerar PIX usando EFI
            const response = await fetch('/api/generate-pix-efi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    description: `Depósito PIX Ghost - Usuário: ${userId}`
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Resposta de erro completa:', errorText);
                throw new Error(`Erro na rede: ${response.statusText}. Detalhes: ${errorText.substring(0, 100)}...`);
            }
            
            const data = await response.json();
            if (data.qrcode_base64 && data.pixCopiaECola) {
                // Check if qrcode_base64 already contains the data URL prefix
                if (data.qrcode_base64.startsWith('data:image/png;base64,')) {
                    qrCodeImg.src = data.qrcode_base64;
                } else {
                    qrCodeImg.src = `data:image/png;base64,${data.qrcode_base64}`;
                }
                pixCopiaECola.value = data.pixCopiaECola;
                currentPaymentId = data.txid;
                
                // Debug do TXID recebido
                console.log('=== DEBUG FRONTEND - TXID RECEBIDO ===');
                console.log('TXID recebido da API:', data.txid);
                console.log('Comprimento:', data.txid.length);
                console.log('currentPaymentId definido como:', currentPaymentId);
                
                paymentInfoBox.classList.remove('hidden');
                paymentStatus.textContent = 'Aguardando pagamento. Clique em "Verificar Status" após pagar.';
                paymentStatus.style.color = 'var(--accent-color)';

            } else {
                throw new Error('Resposta da API de pagamento inválida.');
            }
        } catch (error) {
            console.error('Erro ao gerar pagamento:', error);
            // Exibir mensagem de erro mais detalhada para o usuário
            paymentStatus.textContent = `Erro ao gerar pagamento: ${error.message}`;
            paymentStatus.style.color = 'var(--error-color)';
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
            // Garantir que temos o userId atual
            const currentUserId = userIdInput.value || userId;
            
            // Debug do TXID antes de enviar
            console.log('=== DEBUG FRONTEND - VERIFICAÇÃO ===');
            console.log('TXID a ser enviado:', currentPaymentId);
            console.log('Comprimento:', currentPaymentId ? currentPaymentId.length : 'null');
            
            // Verificar pagamento usando EFI
            const response = await fetch('/api/verify-pix-efi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    txid: currentPaymentId
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Resposta de erro completa na verificação:', errorText);
                throw new Error(`Erro na rede: ${response.statusText}. Detalhes: ${errorText.substring(0, 100)}...`);
            }
            
            const data = await response.json();
            if (data.paid === true || data.status === 'CONCLUIDA') {
                paymentStatus.innerHTML = '<strong>Status: PAGAMENTO CONFIRMADO ✓</strong><br>Adicionando saldo à sua carteira...';
                paymentStatus.style.color = 'var(--success-color)';
                
                // O valor vem da resposta da verificação, garantindo que estamos usando o valor correto.
                const confirmedAmount = parseFloat(data.valor);
                
                // Usar o userId atual para adicionar o saldo
                await addBalance(currentUserId, confirmedAmount, currentPaymentId);

            } else {
                paymentStatus.innerHTML = `<strong>Status: ${data.status || 'PENDENTE'}</strong><br>Aguardando pagamento de forma anônima...`;
                paymentStatus.style.color = 'orange';
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
            // Exibir mensagem de erro mais detalhada para o usuário
            paymentStatus.innerHTML = `<strong>Erro ao verificar pagamento:</strong><br>${error.message}`;
            paymentStatus.style.color = 'var(--error-color)';
            alert(`Erro ao verificar pagamento: ${error.message}`);
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verificar Status';
        }
    });

    async function addBalance(userId, amount, paymentId) {
        try {
            // O valor recebido da API de verificação já é o valor bruto.
            // A API add-balance cuidará do cálculo da taxa.
            const response = await fetch('/api/add-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    amount: amount, // Enviando o valor bruto
                    transactionType: 'deposit',
                    paymentId: paymentId
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

            if (balance > 0) { // Show withdrawal area if there is any balance to apply fees on
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
        // Implementação mais robusta do UUID v4 com timestamp para garantir unicidade
        const timestamp = Date.now().toString(36);
        const randomPart = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
        // Combinar timestamp com UUID para garantir unicidade absoluta
        return `${timestamp}-${randomPart}`;
    }

    // --- Mobile Menu Logic ---
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navToggle.checked = false;
            }
        });
    });

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    otherItem.querySelector('.faq-answer').style.padding = '0 2rem';
                }
            });

            // Toggle the clicked item
            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = null;
                answer.style.padding = '0 2rem';
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                answer.style.padding = '0 2rem 1.5rem 2rem';
            }
        });
    });
});