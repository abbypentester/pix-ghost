document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando a lousa...');
    // --- State Management ---
    const state = {
        isDrawing: false,
        currentTool: 'pencil',
        startX: 0,
        startY: 0,
        snapshot: null,
        history: [],
        redoHistory: [],
        selectedIconClass: null,
        activePanel: null
    };

    // --- DOM Elements ---
    const dom = {
        canvas: document.getElementById('whiteboard'),
        ctx: document.getElementById('whiteboard').getContext('2d'),
        toolbar: document.getElementById('toolbar'),
        colorPicker: document.getElementById('color-picker'),
        lineWidth: document.getElementById('line-width'),
        panels: document.querySelectorAll('.panel'),
        iconLibrary: document.getElementById('icon-library'),
        iconGrid: document.querySelector('#icon-library .icon-grid'),
        iconSearch: document.getElementById('icon-search'),
        iconCategories: document.querySelector('.icon-categories'),
        urlInputPanel: document.getElementById('url-input'),
        urlValue: document.getElementById('url-value'),
        insertUrlBtn: document.getElementById('insert-url-btn'),
        undoBtn: document.getElementById('undo-tool'),
        redoBtn: document.getElementById('redo-tool')
    };

    // --- Canvas Setup ---
    const setupCanvas = () => {
        const appContainer = document.getElementById('app-container');
        dom.canvas.width = appContainer.offsetWidth;
        dom.canvas.height = appContainer.offsetHeight - dom.toolbar.offsetHeight;
        saveState(); // Save initial blank state
    };

    // --- History (Undo/Redo) ---
    const saveState = () => {
        state.redoHistory = [];
        dom.redoBtn.disabled = true;
        if (state.history.length > 20) state.history.shift();
        state.history.push(dom.ctx.getImageData(0, 0, dom.canvas.width, dom.canvas.height));
        dom.undoBtn.disabled = false;
    };

    const undo = () => {
        if (state.history.length <= 1) return;
        state.redoHistory.push(state.history.pop());
        dom.redoBtn.disabled = false;
        dom.ctx.putImageData(state.history[state.history.length - 1], 0, 0);
        if (state.history.length <= 1) dom.undoBtn.disabled = true;
    };

    const redo = () => {
        if (state.redoHistory.length === 0) return;
        const nextState = state.redoHistory.pop();
        state.history.push(nextState);
        dom.ctx.putImageData(nextState, 0, 0);
        dom.undoBtn.disabled = false;
        if (state.redoHistory.length === 0) dom.redoBtn.disabled = true;
    };

    // --- Panels (Icon Library, URL Input) ---
    const togglePanel = (panelId) => {
        const targetPanel = document.getElementById(panelId);
        if (state.activePanel && state.activePanel !== targetPanel) {
            state.activePanel.classList.add('hidden');
        }
        if (targetPanel) {
            targetPanel.classList.toggle('hidden');
            state.activePanel = targetPanel.classList.contains('hidden') ? null : targetPanel;
        }
    };

    // --- Tool & Drawing Logic ---
    const getMousePos = (e) => {
        const rect = dom.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e) => {
        state.isDrawing = true;
        const pos = getMousePos(e);
        state.startX = pos.x;
        state.startY = pos.y;
        dom.ctx.beginPath();
        dom.ctx.lineWidth = dom.lineWidth.value;
        dom.ctx.strokeStyle = dom.colorPicker.value;
        dom.ctx.fillStyle = dom.colorPicker.value;
        state.snapshot = dom.ctx.getImageData(0, 0, dom.canvas.width, dom.canvas.height);
    };

    const stopDrawing = (e) => {
        if (!state.isDrawing) return;
        state.isDrawing = false;
        const pos = getMousePos(e);

        if (state.currentTool === 'text') {
            const text = prompt('Digite o texto:');
            if (text) {
                dom.ctx.font = `${dom.lineWidth.value * 5}px Roboto`;
                dom.ctx.fillText(text, pos.x, pos.y);
            }
        } else if (state.currentTool === 'icon' && state.selectedIconClass) {
            drawIcon(state.selectedIconClass, pos.x, pos.y);
            state.selectedIconClass = null; // Reset after drawing
        }
        saveState();
    };

    const drawing = (e) => {
        if (!state.isDrawing) return;
        dom.ctx.putImageData(state.snapshot, 0, 0);
        const pos = getMousePos(e);

        switch (state.currentTool) {
            case 'pencil':
                dom.ctx.lineTo(pos.x, pos.y);
                dom.ctx.stroke();
                break;
            case 'rectangle':
                dom.ctx.strokeRect(state.startX, state.startY, pos.x - state.startX, pos.y - state.startY);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(pos.x - state.startX, 2) + Math.pow(pos.y - state.startY, 2));
                dom.ctx.beginPath();
                dom.ctx.arc(state.startX, state.startY, radius, 0, 2 * Math.PI);
                dom.ctx.stroke();
                break;
            case 'arrow':
                drawArrow(state.startX, state.startY, pos.x, pos.y);
                break;
        }
    };

    const drawArrow = (fromx, fromy, tox, toy) => {
        const headlen = 10;
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        dom.ctx.moveTo(fromx, fromy);
        dom.ctx.lineTo(tox, toy);
        dom.ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        dom.ctx.moveTo(tox, toy);
        dom.ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        dom.ctx.stroke();
    };

    const drawIcon = (iconClass, x, y) => {
        const tempIcon = document.createElement('i');
        tempIcon.className = iconClass;
        document.body.appendChild(tempIcon);
        const style = window.getComputedStyle(tempIcon);
        const content = style.getPropertyValue('content').replace(/"/g, '');
        const fontFamily = style.getPropertyValue('font-family');
        dom.ctx.font = `40px ${fontFamily}`;
        dom.ctx.fillText(content, x, y);
        document.body.removeChild(tempIcon);
    };

    // --- Event Listeners ---
    const setupEventListeners = () => {
        window.addEventListener('resize', setupCanvas);

        dom.toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const tool = button.dataset.tool;
            const action = button.dataset.action;

            if (tool) {
                state.currentTool = tool;
                document.querySelectorAll('#toolbar button[data-tool]').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                if (state.activePanel) state.activePanel.classList.add('hidden');
                state.activePanel = null;
            }

            if (action) {
                switch (action) {
                    case 'clear':
                        if (confirm('Tem certeza que deseja limpar tudo?')) {
                            dom.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
                            saveState();
                        }
                        break;
                    case 'undo': undo(); break;
                    case 'redo': redo(); break;
                    case 'toggle-icons': togglePanel('icon-library'); break;
                    case 'toggle-url': togglePanel('url-input'); break;
                    case 'screenshot': takeScreenshot(); break;
                }
            }
        });

        dom.canvas.addEventListener('mousedown', startDrawing);
        dom.canvas.addEventListener('mouseup', stopDrawing);
        dom.canvas.addEventListener('mousemove', drawing);
        dom.canvas.addEventListener('mouseleave', () => { state.isDrawing = false; });

        dom.iconGrid.addEventListener('click', (e) => {
            if (e.target.tagName === 'I') {
                state.selectedIconClass = e.target.className;
                state.currentTool = 'icon';
                togglePanel('icon-library');
                alert('Ícone selecionado! Clique na lousa para posicioná-lo.');
            }
        });

        dom.insertUrlBtn.addEventListener('click', () => {
            const url = dom.urlValue.value;
            if (url) {
                dom.ctx.font = '16px Roboto';
                dom.ctx.fillStyle = '#0000EE';
                dom.ctx.fillText(url, 100, 100);
                saveState();
                togglePanel('url-input');
                dom.urlValue.value = '';
            }
        });

        document.querySelectorAll('.close-panel').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.panel').classList.add('hidden'));
        });

        // Icon filtering
        dom.iconSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            dom.iconGrid.querySelectorAll('i').forEach(icon => {
                const matches = icon.className.toLowerCase().includes(searchTerm);
                icon.style.display = matches ? '' : 'none';
            });
        });

        dom.iconCategories.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const category = e.target.dataset.category;
                dom.iconCategories.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                dom.iconGrid.querySelectorAll('i').forEach(icon => {
                    const matches = category === 'all' || icon.dataset.category === category;
                    icon.style.display = matches ? '' : 'none';
                });
            }
        });
    };

    const takeScreenshot = () => {
        const link = document.createElement('a');
        link.download = 'lousa-funil.png';
        link.href = dom.canvas.toDataURL('image/png');
        link.click();
    };

    // --- Initialization ---
    const init = () => {
        setupCanvas();
        setupEventListeners();
        document.querySelector('button[data-tool="pencil"]').classList.add('active');
        dom.undoBtn.disabled = true;
        dom.redoBtn.disabled = true;
    };

    init();
});