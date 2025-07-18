// Configuração da API
const API_BASE_URL = 'https://backend-marcelo-alves-sistema.onrender.com';

// Estado global da aplicação
let authToken = localStorage.getItem('admin_token');
let currentUser = null;
let imoveisData = [];
let contatosData = [];

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Verificar se já está logado
    if (authToken) {
        verifyToken();
    } else {
        showLoginScreen();
    }
    
    // Configurar formulários
    setupForms();
    
    // Configurar máscara de CPF
    setupCPFMask();
}

// Autenticação
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    
    // Carregar dados iniciais
    loadDashboardData();
    loadImoveis();
}

async function verifyToken() {
    if (!authToken) {
        showLoginScreen();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.usuario;
            document.getElementById('user-name').textContent = currentUser.nome || currentUser.cpf;
            showAdminPanel();
        } else {
            // Token inválido
            localStorage.removeItem('admin_token');
            authToken = null;
            showLoginScreen();
        }
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        showLoginScreen();
    }
}

async function login(cpf, senha) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf, senha })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.usuario;
            localStorage.setItem('admin_token', authToken);
            
            document.getElementById('user-name').textContent = currentUser.nome || currentUser.cpf;
            showAdminPanel();
            
            hideError();
        } else {
            showError(data.error || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
        showLoading(false);
    }
}

async function logout() {
    try {
        if (authToken) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
    } catch (error) {
        console.error('Erro no logout:', error);
    } finally {
        localStorage.removeItem('admin_token');
        authToken = null;
        currentUser = null;
        showLoginScreen();
    }
}

// Configurar formulários
function setupForms() {
    // Formulário de login
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
        const senha = document.getElementById('senha').value;
        
        if (!cpf || !senha) {
            showError('CPF e senha são obrigatórios');
            return;
        }
        
        login(cpf, senha);
    });
    
    // Formulário de imóvel
    document.getElementById('imovel-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveImovel();
    });
}

// Máscara de CPF
function setupCPFMask() {
    const cpfInput = document.getElementById('cpf');
    
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });
}

// Toggle password visibility
function togglePassword() {
    const senhaInput = document.getElementById('senha');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        senhaInput.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

// Navegação entre seções
function showSection(sectionName) {
    // Remover active de todos os botões e seções
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    
    // Ativar botão e seção selecionados
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Carregar dados específicos da seção
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'imoveis':
            loadImoveis();
            break;
        case 'contatos':
            loadContatos();
            break;
    }
}

// Dashboard
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/imoveis`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const imoveis = await response.json();
            updateDashboardStats(imoveis);
            updateRecentActivity(imoveis);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function updateDashboardStats(imoveis) {
    const totalImoveis = imoveis.length;
    const imoveisDisponiveis = imoveis.filter(i => i.status === 'disponivel' && i.habilitado).length;
    const imoveisVenda = imoveis.filter(i => i.finalidade === 'venda' && i.status === 'disponivel').length;
    const imoveisAluguel = imoveis.filter(i => i.finalidade === 'aluguel' && i.status === 'disponivel').length;
    
    document.getElementById('total-imoveis').textContent = totalImoveis;
    document.getElementById('imoveis-disponiveis').textContent = imoveisDisponiveis;
    document.getElementById('imoveis-venda').textContent = imoveisVenda;
    document.getElementById('imoveis-aluguel').textContent = imoveisAluguel;
}

function updateRecentActivity(imoveis) {
    const recentImoveis = imoveis
        .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))
        .slice(0, 5);
    
    const activityList = document.getElementById('recent-activity-list');
    
    if (recentImoveis.length === 0) {
        activityList.innerHTML = '<p class="no-activity">Nenhuma atividade recente</p>';
        return;
    }
    
    activityList.innerHTML = recentImoveis.map(imovel => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-plus"></i>
            </div>
            <div class="activity-text">
                <strong>Novo imóvel adicionado:</strong> ${imovel.titulo}
            </div>
            <div class="activity-time">
                ${formatDate(imovel.dataCriacao)}
            </div>
        </div>
    `).join('');
}

// Imóveis
async function loadImoveis() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/admin/imoveis`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            imoveisData = await response.json();
            renderImoveisTable(imoveisData);
        } else {
            showError('Erro ao carregar imóveis');
        }
    } catch (error) {
        console.error('Erro ao carregar imóveis:', error);
        showError('Erro de conexão');
    } finally {
        showLoading(false);
    }
}

function renderImoveisTable(imoveis) {
    const tbody = document.querySelector('#imoveis-table tbody');
    const noData = document.getElementById('no-imoveis');
    
    if (imoveis.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }
    
    noData.style.display = 'none';
    
    tbody.innerHTML = imoveis.map(imovel => `
        <tr>
            <td>${imovel.id}</td>
            <td>${imovel.titulo}</td>
            <td>${formatTipo(imovel.tipo)}</td>
            <td>${formatFinalidade(imovel.finalidade)}</td>
            <td>${formatPreco(imovel.preco, imovel.finalidade)}</td>
            <td>
                <span class="status-badge status-${imovel.status}">
                    ${formatStatus(imovel.status)}
                </span>
            </td>
            <td>
                <span class="status-badge ${imovel.habilitado ? 'status-disponivel' : 'status-vendido'}">
                    ${imovel.habilitado ? 'Sim' : 'Não'}
                </span>
            </td>
            <td class="actions-cell">
                <button class="btn-warning" onclick="editImovel(${imovel.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-success" onclick="toggleImovelStatus(${imovel.id})">
                    <i class="fas fa-toggle-${imovel.habilitado ? 'on' : 'off'}"></i>
                </button>
                <button class="btn-danger" onclick="deleteImovel(${imovel.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterImoveis() {
    const statusFilter = document.getElementById('filter-status').value;
    const tipoFilter = document.getElementById('filter-tipo').value;
    const habilitadoFilter = document.getElementById('filter-habilitado').value;
    const searchTerm = document.getElementById('search-imoveis').value.toLowerCase();
    
    let filteredImoveis = [...imoveisData];
    
    if (statusFilter) {
        filteredImoveis = filteredImoveis.filter(i => i.status === statusFilter);
    }
    
    if (tipoFilter) {
        filteredImoveis = filteredImoveis.filter(i => i.tipo === tipoFilter);
    }
    
    if (habilitadoFilter) {
        const habilitado = habilitadoFilter === 'true';
        filteredImoveis = filteredImoveis.filter(i => i.habilitado === habilitado);
    }
    
    if (searchTerm) {
        filteredImoveis = filteredImoveis.filter(i => 
            i.titulo.toLowerCase().includes(searchTerm) ||
            i.endereco.toLowerCase().includes(searchTerm) ||
            i.descricao.toLowerCase().includes(searchTerm)
        );
    }
    
    renderImoveisTable(filteredImoveis);
}

// Modal de Imóvel
function showAddImovelModal() {
    document.getElementById('modal-title').textContent = 'Novo Imóvel';
    document.getElementById('imovel-form').reset();
    document.getElementById('imovel-id').value = '';
    document.getElementById('imovel-modal').style.display = 'flex';
}

function editImovel(id) {
    const imovel = imoveisData.find(i => i.id === id);
    if (!imovel) return;
    
    document.getElementById('modal-title').textContent = 'Editar Imóvel';
    document.getElementById('imovel-id').value = imovel.id;
    document.getElementById('imovel-titulo').value = imovel.titulo;
    document.getElementById('imovel-tipo').value = imovel.tipo;
    document.getElementById('imovel-finalidade').value = imovel.finalidade;
    document.getElementById('imovel-preco').value = imovel.preco;
    document.getElementById('imovel-quartos').value = imovel.quartos || '';
    document.getElementById('imovel-banheiros').value = imovel.banheiros || '';
    document.getElementById('imovel-area').value = imovel.area || '';
    document.getElementById('imovel-endereco').value = imovel.endereco || '';
    document.getElementById('imovel-descricao').value = imovel.descricao || '';
    document.getElementById('imovel-fotos').value = (imovel.fotos || []).join('\n');
    document.getElementById('imovel-status').value = imovel.status;
    document.getElementById('imovel-habilitado').checked = imovel.habilitado;
    
    document.getElementById('imovel-modal').style.display = 'flex';
}

function closeImovelModal() {
    document.getElementById('imovel-modal').style.display = 'none';
}

async function saveImovel() {
    try {
        showLoading(true);
        
        const formData = new FormData(document.getElementById('imovel-form'));
        const imovelId = document.getElementById('imovel-id').value;
        
        const dadosImovel = {
            titulo: formData.get('titulo'),
            tipo: formData.get('tipo'),
            finalidade: formData.get('finalidade'),
            preco: parseFloat(formData.get('preco')),
            quartos: parseInt(formData.get('quartos')) || 0,
            banheiros: parseInt(formData.get('banheiros')) || 0,
            area: parseFloat(formData.get('area')) || 0,
            endereco: formData.get('endereco'),
            descricao: formData.get('descricao'),
            fotos: formData.get('fotos').split('\n').filter(url => url.trim()),
            status: formData.get('status'),
            habilitado: formData.get('habilitado') === 'on'
        };
        
        const url = imovelId ? 
            `${API_BASE_URL}/admin/imoveis/${imovelId}` : 
            `${API_BASE_URL}/admin/imoveis`;
        
        const method = imovelId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(dadosImovel)
        });
        
        if (response.ok) {
            closeImovelModal();
            loadImoveis();
            showSuccess(imovelId ? 'Imóvel atualizado com sucesso!' : 'Imóvel criado com sucesso!');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao salvar imóvel');
        }
    } catch (error) {
        console.error('Erro ao salvar imóvel:', error);
        showError('Erro de conexão');
    } finally {
        showLoading(false);
    }
}

async function toggleImovelStatus(id) {
    const imovel = imoveisData.find(i => i.id === id);
    if (!imovel) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/imoveis/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                habilitado: !imovel.habilitado
            })
        });
        
        if (response.ok) {
            loadImoveis();
            showSuccess(`Imóvel ${!imovel.habilitado ? 'habilitado' : 'desabilitado'} com sucesso!`);
        } else {
            showError('Erro ao alterar status do imóvel');
        }
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showError('Erro de conexão');
    }
}

async function deleteImovel(id) {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/imoveis/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            loadImoveis();
            showSuccess('Imóvel excluído com sucesso!');
        } else {
            showError('Erro ao excluir imóvel');
        }
    } catch (error) {
        console.error('Erro ao excluir imóvel:', error);
        showError('Erro de conexão');
    }
}

// Contatos
async function loadContatos() {
    try {
        // Simulação de dados de contato (implementar quando tiver endpoint)
        contatosData = [
            {
                id: 1,
                nome: 'João Silva',
                email: 'joao@email.com',
                telefone: '(11) 99999-9999',
                assunto: 'compra',
                mensagem: 'Tenho interesse em comprar um apartamento.',
                dataRecebimento: new Date().toISOString()
            }
        ];
        
        renderContatosTable(contatosData);
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
    }
}

function renderContatosTable(contatos) {
    const tbody = document.querySelector('#contatos-table tbody');
    const noData = document.getElementById('no-contatos');
    
    if (contatos.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }
    
    noData.style.display = 'none';
    
    tbody.innerHTML = contatos.map(contato => `
        <tr>
            <td>${formatDate(contato.dataRecebimento)}</td>
            <td>${contato.nome}</td>
            <td>${contato.email}</td>
            <td>${contato.telefone || '-'}</td>
            <td>${formatAssunto(contato.assunto)}</td>
            <td class="actions-cell">
                <button class="btn-primary" onclick="viewContato(${contato.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewContato(id) {
    const contato = contatosData.find(c => c.id === id);
    if (!contato) return;
    
    document.getElementById('contato-details').innerHTML = `
        <div class="contato-info">
            <h4>Informações do Contato</h4>
            <p><strong>Nome:</strong> ${contato.nome}</p>
            <p><strong>Email:</strong> ${contato.email}</p>
            <p><strong>Telefone:</strong> ${contato.telefone || 'Não informado'}</p>
            <p><strong>Assunto:</strong> ${formatAssunto(contato.assunto)}</p>
            <p><strong>Data:</strong> ${formatDate(contato.dataRecebimento)}</p>
            
            <h4>Mensagem</h4>
            <div class="mensagem-box">
                ${contato.mensagem}
            </div>
            
            <div class="contato-actions">
                <a href="mailto:${contato.email}" class="btn-primary">
                    <i class="fas fa-envelope"></i>
                    Responder por Email
                </a>
                ${contato.telefone ? `
                    <a href="https://wa.me/55${contato.telefone.replace(/\D/g, '')}" target="_blank" class="btn-success">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </a>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('contato-modal').style.display = 'flex';
}

function closeContatoModal() {
    document.getElementById('contato-modal').style.display = 'none';
}

// Utilitários de formatação
function formatPreco(preco, finalidade) {
    const precoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
    }).format(preco);
    
    return finalidade === 'aluguel' ? `${precoFormatado}/mês` : precoFormatado;
}

function formatTipo(tipo) {
    const tipos = {
        'casa': 'Casa',
        'apartamento': 'Apartamento',
        'terreno': 'Terreno',
        'comercial': 'Comercial'
    };
    return tipos[tipo] || tipo;
}

function formatFinalidade(finalidade) {
    return finalidade === 'venda' ? 'Venda' : 'Aluguel';
}

function formatStatus(status) {
    const statuses = {
        'disponivel': 'Disponível',
        'alugado': 'Alugado',
        'vendido': 'Vendido'
    };
    return statuses[status] || status;
}

function formatAssunto(assunto) {
    const assuntos = {
        'compra': 'Interesse em Compra',
        'venda': 'Quero Vender',
        'aluguel': 'Interesse em Aluguel',
        'avaliacao': 'Avaliação de Imóvel',
        'outros': 'Outros'
    };
    return assuntos[assunto] || assunto;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Utilitários de UI
function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function hideError() {
    document.getElementById('login-error').style.display = 'none';
}

function showSuccess(message) {
    // Criar notificação de sucesso temporária
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Fechar modais ao clicar fora
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Adicionar animações CSS
const animations = `
<style>
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.mensagem-box {
    background: var(--light-gray);
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    line-height: 1.6;
}

.contato-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
}

.contato-actions a {
    text-decoration: none;
}

.no-activity {
    text-align: center;
    color: var(--text-light);
    font-style: italic;
    padding: 2rem;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', animations);

