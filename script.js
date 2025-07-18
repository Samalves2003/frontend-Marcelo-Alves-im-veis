// Configuração da API
const API_BASE_URL = 'https://marcelo-alves-imoveis-h8lghn1al-samuels-projects-f143a1ab.vercel.app/api';


// Estado global da aplicação
let imoveisData = [];
let paginaAtual = 1;
let totalPaginas = 1;
let itensPorPagina = 9;
let filtrosAtivos = {
    tipo: '',
    finalidade: '',
    bairro: '',
    ordem: 'recente'
};

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Configurar navegação suave
    setupSmoothScrolling();
    
    // Configurar tabs de busca
    setupSearchTabs();
    
    // Configurar formulário de contato
    setupContactForm();
    
    // Carregar imóveis
    carregarImoveis();
    
    // Configurar scroll do header
    setupHeaderScroll();
}

// Navegação suave
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Configurar tabs de busca
function setupSearchTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active de todos os botões
            tabBtns.forEach(b => b.classList.remove('active'));
            // Adiciona active ao botão clicado
            this.classList.add('active');
            
            // Atualiza placeholder do preço baseado no tipo
            const tipo = this.dataset.type;
            updatePricePlaceholders(tipo);
            
            // Aplica o filtro automaticamente
            aplicarFiltroFinalidade(tipo);
        });
    });
}

function updatePricePlaceholders(tipo) {
    const precoMin = document.getElementById('preco-min');
    const precoMax = document.getElementById('preco-max');
    
    // Limpa as opções existentes
    precoMin.innerHTML = '<option value="">Preço Mín.</option>';
    precoMax.innerHTML = '<option value="">Preço Máx.</option>';
    
    if (tipo === 'alugar') {
        // Valores para aluguel
        const valoresAluguel = [
            { value: '500', text: 'R$ 500' },
            { value: '1000', text: 'R$ 1.000' },
            { value: '1500', text: 'R$ 1.500' },
            { value: '2000', text: 'R$ 2.000' },
            { value: '3000', text: 'R$ 3.000' },
            { value: '5000', text: 'R$ 5.000' }
        ];
        
        valoresAluguel.forEach(valor => {
            precoMin.innerHTML += `<option value="${valor.value}">${valor.text}</option>`;
            precoMax.innerHTML += `<option value="${valor.value}">${valor.text}</option>`;
        });
    } else {
        // Valores para compra
        const valoresCompra = [
            { value: '100000', text: 'R$ 100.000' },
            { value: '200000', text: 'R$ 200.000' },
            { value: '300000', text: 'R$ 300.000' },
            { value: '500000', text: 'R$ 500.000' },
            { value: '800000', text: 'R$ 800.000' },
            { value: '1000000', text: 'R$ 1.000.000' }
        ];
        
        valoresCompra.forEach(valor => {
            precoMin.innerHTML += `<option value="${valor.value}">${valor.text}</option>`;
            precoMax.innerHTML += `<option value="${valor.value}">${valor.text}</option>`;
        });
    }
}

// Configurar scroll do header
function setupHeaderScroll() {
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Aplicar filtro de finalidade automaticamente
function aplicarFiltroFinalidade(tipo) {
    // Converter tipo do botão para finalidade do imóvel
    const finalidade = tipo === 'comprar' ? 'venda' : 'aluguel';
    
    // Atualizar o filtro de finalidade no select
    const filtroFinalidade = document.getElementById('filtro-finalidade');
    if (filtroFinalidade) {
        filtroFinalidade.value = finalidade;
    }
    
    // Atualizar filtros ativos
    filtrosAtivos.finalidade = finalidade;
    
    // Aplicar filtros
    filtrarImoveis();
    
    // Scroll suave para a seção de imóveis
    const imoveisSection = document.getElementById('imoveis');
    if (imoveisSection) {
        imoveisSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Buscar imóveis
function buscarImoveis() {
    const tipoImovel = document.getElementById('tipo-imovel').value;
    const localizacao = document.getElementById('localizacao').value;
    const precoMin = document.getElementById('preco-min').value;
    const precoMax = document.getElementById('preco-max').value;
    const finalidade = document.querySelector('.tab-btn.active').dataset.type;
    
    // Atualizar filtros
    filtrosAtivos = {
        tipo: tipoImovel,
        finalidade: finalidade === 'comprar' ? 'venda' : 'aluguel',
        localizacao: localizacao,
        precoMin: precoMin,
        precoMax: precoMax,
        ordem: 'recente'
    };
    
    // Aplicar filtros
    filtrarImoveis();
    
    // Scroll para a seção de imóveis
    document.getElementById('imoveis').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Carregar imóveis do servidor
async function carregarImoveis(pagina = 1) {
    const loading = document.getElementById('loading');
    const listaImoveis = document.getElementById('lista-imoveis');
    const semResultados = document.getElementById('sem-resultados');
    const paginacao = document.getElementById('paginacao');
    
    try {
        loading.style.display = 'block';
        semResultados.style.display = 'none';
        paginacao.style.display = 'none';
        
        console.log(`Carregando página ${pagina} com ${itensPorPagina} itens por página`); // Debug
        
        // Buscar dados da API real com paginação
        const response = await fetch(`${API_BASE_URL}/imoveis?page=${pagina}&limit=${itensPorPagina}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos da API:', data); // Debug
        
        // Atualizar estado global
        imoveisData = data.imoveis;
        paginaAtual = data.pagination.currentPage;
        totalPaginas = data.pagination.totalPages;
        
        loading.style.display = 'none';
        renderizarImoveis(imoveisData);
        renderizarPaginacao(data.pagination);
        carregarBairros(); // Carregar opções de bairro
        
    } catch (error) {
        console.error('Erro ao carregar imóveis:', error);
        loading.style.display = 'none';
        
        // Fallback para dados mock em caso de erro
        console.log('Usando dados mock como fallback...');
        imoveisData = await getImoveisMock();
        renderizarImoveis(imoveisData);
        carregarBairros(); // Carregar opções de bairro mesmo com mock
    }
}

// Dados mock para demonstração
async function getImoveisMock() {
    return [
        {
            id: 1,
            titulo: 'Casa 3 quartos no Jardim Atlântico',
            tipo: 'casa',
            finalidade: 'venda',
            preco: 450000,
            descricao: 'Linda casa com 3 quartos, 2 banheiros, sala ampla, cozinha planejada e quintal. Localizada em bairro residencial tranquilo.',
            quartos: 3,
            banheiros: 2,
            area: 120,
            endereco: 'Jardim Atlântico, São Paulo/SP',
            bairro: 'Jardim Atlântico',
            fotos: [
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            status: 'disponivel',
            habilitado: true,
            dataPublicacao: '2024-01-15'
        },
        {
            id: 2,
            titulo: 'Apartamento 2 quartos Centro',
            tipo: 'apartamento',
            finalidade: 'aluguel',
            preco: 1800,
            descricao: 'Apartamento moderno com 2 quartos, 1 banheiro, sala integrada com cozinha. Próximo ao metrô e comércio.',
            quartos: 2,
            banheiros: 1,
            area: 65,
            endereco: 'Centro, São Paulo/SP',
            bairro: 'Centro',
            fotos: [
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            status: 'disponivel',
            habilitado: true,
            dataPublicacao: '2024-01-10'
        },
        {
            id: 3,
            titulo: 'Casa de luxo 4 quartos',
            tipo: 'casa',
            finalidade: 'venda',
            preco: 850000,
            descricao: 'Casa de alto padrão com 4 quartos sendo 2 suítes, piscina, churrasqueira e garagem para 3 carros.',
            quartos: 4,
            banheiros: 3,
            area: 250,
            endereco: 'Alphaville, Barueri/SP',
            bairro: 'Alphaville',
            fotos: [
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            status: 'disponivel',
            habilitado: true,
            dataPublicacao: '2024-01-12'
        },
        {
            id: 4,
            titulo: 'Terreno 300m² Zona Sul',
            tipo: 'terreno',
            finalidade: 'venda',
            preco: 280000,
            descricao: 'Terreno plano de 300m² em rua asfaltada, com toda infraestrutura. Ideal para construção residencial.',
            quartos: 0,
            banheiros: 0,
            area: 300,
            endereco: 'Vila Mariana, São Paulo/SP',
            bairro: 'Vila Mariana',
            fotos: [
                'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            status: 'disponivel',
            habilitado: true,
            dataPublicacao: '2024-01-08'
        },
        {
            id: 5,
            titulo: 'Loja comercial 80m²',
            tipo: 'comercial',
            finalidade: 'aluguel',
            preco: 3500,
            descricao: 'Loja comercial em ponto movimentado, com vitrine ampla, banheiro e depósito. Ideal para diversos ramos.',
            quartos: 0,
            banheiros: 1,
            area: 80,
            endereco: 'Rua Augusta, São Paulo/SP',
            bairro: 'Consolação',
            fotos: [
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            status: 'disponivel',
            habilitado: true,
            dataPublicacao: '2024-01-14'
        }
    ];
}

// Filtrar imóveis
function filtrarImoveis() {
    // Atualizar filtros ativos com os valores atuais dos selects
    filtrosAtivos.tipo = document.getElementById('filtro-tipo').value;
    filtrosAtivos.finalidade = document.getElementById('filtro-finalidade').value;
    filtrosAtivos.bairro = document.getElementById('filtro-bairro').value;
    filtrosAtivos.ordem = document.getElementById('filtro-ordem').value;
    
    let imoveisFiltrados = [...imoveisData];
    
    // Filtrar por tipo
    if (filtrosAtivos.tipo) {
        imoveisFiltrados = imoveisFiltrados.filter(imovel => 
            imovel.tipo === filtrosAtivos.tipo
        );
    }
    
    // Filtrar por finalidade
    if (filtrosAtivos.finalidade) {
        imoveisFiltrados = imoveisFiltrados.filter(imovel => 
            imovel.finalidade === filtrosAtivos.finalidade
        );
    }
    
    // Filtrar por bairro
    if (filtrosAtivos.bairro) {
        imoveisFiltrados = imoveisFiltrados.filter(imovel => 
            imovel.bairro === filtrosAtivos.bairro
        );
    }
    
    // Filtrar por localização
    if (filtrosAtivos.localizacao) {
        imoveisFiltrados = imoveisFiltrados.filter(imovel => 
            imovel.endereco.toLowerCase().includes(filtrosAtivos.localizacao.toLowerCase())
        );
    }
    
    // Filtrar por preço mínimo
    if (filtrosAtivos.precoMin) {
        imoveisFiltrados = imoveisFiltrados.filter(imovel => 
            imovel.preco >= parseInt(filtrosAtivos.precoMin)
        );
    }
    
    // Filtrar por preço máximo
    if (filtrosAtivos.precoMax) {
        imoveisFiltrados = imoveisFiltrados.filter(imovel => 
            imovel.preco <= parseInt(filtrosAtivos.precoMax)
        );
    }
    
    // Ordenar
    switch (filtrosAtivos.ordem) {
        case 'preco-menor':
            imoveisFiltrados.sort((a, b) => a.preco - b.preco);
            break;
        case 'preco-maior':
            imoveisFiltrados.sort((a, b) => b.preco - a.preco);
            break;
        case 'recente':
        default:
            // Ordenar por data de criação ou ID (mais recente primeiro)
            imoveisFiltrados.sort((a, b) => {
                if (a.dataPublicacao && b.dataPublicacao) {
                    return new Date(b.dataPublicacao) - new Date(a.dataPublicacao);
                }
                return b.id - a.id; // Fallback para ID
            });
            break;
    }
    
    renderizarImoveis(imoveisFiltrados);
}

// Atualizar filtros da interface
function atualizarFiltros() {
    filtrosAtivos.tipo = document.getElementById('filtro-tipo').value;
    filtrosAtivos.finalidade = document.getElementById('filtro-finalidade').value;
    filtrosAtivos.bairro = document.getElementById('filtro-bairro').value;
    filtrosAtivos.ordem = document.getElementById('filtro-ordem').value;
    
    filtrarImoveis();
}

// Carregar opções de bairro dinamicamente
function carregarBairros() {
    const selectBairro = document.getElementById('filtro-bairro');
    
    // Obter bairros únicos dos imóveis
    const bairros = [...new Set(imoveisData.map(imovel => imovel.bairro).filter(bairro => bairro))];
    bairros.sort(); // Ordenar alfabeticamente
    
    // Limpar opções existentes (exceto a primeira)
    selectBairro.innerHTML = '<option value="">Todos os Bairros</option>';
    
    // Adicionar opções de bairro
    bairros.forEach(bairro => {
        const option = document.createElement('option');
        option.value = bairro;
        option.textContent = bairro;
        selectBairro.appendChild(option);
    });
}

// Renderizar imóveis na tela
function renderizarImoveis(imoveis) {
    const listaImoveis = document.getElementById('lista-imoveis');
    const semResultados = document.getElementById('sem-resultados');
    
    if (imoveis.length === 0) {
        listaImoveis.innerHTML = '';
        semResultados.style.display = 'block';
        return;
    }
    
    semResultados.style.display = 'none';
    
    listaImoveis.innerHTML = imoveis.map(imovel => `
        <div class="imovel-card" onclick="abrirDetalhes(${imovel.id})">
            <div class="imovel-image">
                <img src="${imovel.fotos[0]}" alt="${imovel.titulo}" loading="lazy">
                <div class="imovel-badge">${imovel.finalidade === 'venda' ? 'Venda' : 'Aluguel'}</div>
            </div>
            <div class="imovel-info">
                <div class="imovel-preco">
                    ${formatarPreco(imovel.preco, imovel.finalidade)}
                </div>
                <h3 class="imovel-titulo">${imovel.titulo}</h3>
                <div class="imovel-tipo">${formatarTipo(imovel.tipo)} • ${imovel.bairro ? imovel.bairro + ' • ' : ''}${imovel.endereco}</div>
                <p class="imovel-descricao">${imovel.descricao}</p>
                ${imovel.tipo !== 'terreno' && imovel.tipo !== 'comercial' ? `
                    <div class="imovel-detalhes">
                        <span><i class="fas fa-bed"></i> ${imovel.quartos} quartos</span>
                        <span><i class="fas fa-bath"></i> ${imovel.banheiros} banheiros</span>
                        <span><i class="fas fa-ruler-combined"></i> ${imovel.area}m²</span>
                    </div>
                ` : `
                    <div class="imovel-detalhes">
                        <span><i class="fas fa-ruler-combined"></i> ${imovel.area}m²</span>
                    </div>
                `}
                <div class="imovel-actions">
                    <button class="btn-detalhes" onclick="event.stopPropagation(); abrirDetalhes(${imovel.id})">
                        Ver Detalhes
                    </button>
                    <button class="btn-whatsapp" onclick="event.stopPropagation(); contatarWhatsApp(${imovel.id})">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Formatar preço
function formatarPreco(preco, finalidade) {
    const precoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
    }).format(preco);
    
    return finalidade === 'aluguel' ? `${precoFormatado}/mês` : precoFormatado;
}

// Formatar tipo de imóvel
function formatarTipo(tipo) {
    const tipos = {
        'casa': 'Casa',
        'apartamento': 'Apartamento',
        'terreno': 'Terreno',
        'comercial': 'Comercial'
    };
    return tipos[tipo] || tipo;
}

// Abrir detalhes do imóvel
function abrirDetalhes(imovelId) {
    const imovel = imoveisData.find(i => i.id === imovelId);
    if (!imovel) return;
    
    const modal = document.getElementById('modal-imovel');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="modal-imovel-content">
            <div class="modal-imovel-gallery">
                <div class="main-image">
                    <img src="${imovel.fotos[0]}" alt="${imovel.titulo}" id="main-image">
                </div>
                ${imovel.fotos.length > 1 ? `
                    <div class="thumbnail-images">
                        ${imovel.fotos.map((foto, index) => `
                            <img src="${foto}" alt="Foto ${index + 1}" 
                                 onclick="trocarImagemPrincipal('${foto}')"
                                 class="thumbnail ${index === 0 ? 'active' : ''}">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-imovel-info">
                <div class="modal-header">
                    <h2>${imovel.titulo}</h2>
                    <div class="modal-preco">${formatarPreco(imovel.preco, imovel.finalidade)}</div>
                </div>
                
                <div class="modal-badges">
                    <span class="badge badge-tipo">${formatarTipo(imovel.tipo)}</span>
                    <span class="badge badge-finalidade">${imovel.finalidade === 'venda' ? 'Venda' : 'Aluguel'}</span>
                </div>
                
                <div class="modal-endereco">
                    <i class="fas fa-map-marker-alt"></i>
                    ${imovel.endereco}
                </div>
                
                <div class="modal-detalhes">
                    ${imovel.tipo !== 'terreno' && imovel.tipo !== 'comercial' ? `
                        <div class="detalhe-item">
                            <i class="fas fa-bed"></i>
                            <span>${imovel.quartos} Quartos</span>
                        </div>
                        <div class="detalhe-item">
                            <i class="fas fa-bath"></i>
                            <span>${imovel.banheiros} Banheiros</span>
                        </div>
                    ` : ''}
                    <div class="detalhe-item">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${imovel.area}m²</span>
                    </div>
                </div>
                
                <div class="modal-descricao">
                    <h3>Descrição</h3>
                    <p>${imovel.descricao}</p>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-interesse" onclick="demonstrarInteresse(${imovel.id})">
                        <i class="fas fa-heart"></i>
                        Tenho Interesse
                    </button>
                    <button class="btn-whatsapp-modal" onclick="contatarWhatsApp(${imovel.id})">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </button>
                    <button class="btn-compartilhar" onclick="compartilharImovel(${imovel.id})">
                        <i class="fas fa-share"></i>
                        Compartilhar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modal-imovel');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Trocar imagem principal no modal
function trocarImagemPrincipal(novaImagem) {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    mainImage.src = novaImagem;
    
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.src === novaImagem) {
            thumb.classList.add('active');
        }
    });
}

// Contatar via WhatsApp
function contatarWhatsApp(imovelId) {
    const imovel = imoveisData.find(i => i.id === imovelId);
    if (!imovel) return;
    
    const telefone = '5511999999999'; // Número do WhatsApp
    const mensagem = `Olá! Tenho interesse no imóvel: ${imovel.titulo} - ${formatarPreco(imovel.preco, imovel.finalidade)}`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
}

// Demonstrar interesse
function demonstrarInteresse(imovelId) {
    const imovel = imoveisData.find(i => i.id === imovelId);
    if (!imovel) return;
    
    // Scroll para o formulário de contato
    fecharModal();
    document.getElementById('contato').scrollIntoView({ behavior: 'smooth' });
    
    // Preencher o assunto do formulário
    const assuntoSelect = document.getElementById('assunto');
    assuntoSelect.value = imovel.finalidade === 'venda' ? 'compra' : 'aluguel';
    
    // Preencher a mensagem
    const mensagemTextarea = document.getElementById('mensagem');
    mensagemTextarea.value = `Tenho interesse no imóvel: ${imovel.titulo} - ${formatarPreco(imovel.preco, imovel.finalidade)}`;
}

// Compartilhar imóvel
function compartilharImovel(imovelId) {
    const imovel = imoveisData.find(i => i.id === imovelId);
    if (!imovel) return;
    
    if (navigator.share) {
        navigator.share({
            title: imovel.titulo,
            text: `${imovel.titulo} - ${formatarPreco(imovel.preco, imovel.finalidade)}`,
            url: window.location.href
        });
    } else {
        // Fallback para navegadores que não suportam Web Share API
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copiado para a área de transferência!');
        });
    }
}

// Configurar formulário de contato
function setupContactForm() {
    const form = document.getElementById('form-contato');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData);
        
        // Simular envio do formulário
        enviarFormularioContato(dados);
    });
}

// Enviar formulário de contato
async function enviarFormularioContato(dados) {
    const btnEnviar = document.querySelector('.btn-enviar');
    const textoOriginal = btnEnviar.innerHTML;
    
    try {
        // Mostrar loading
        btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btnEnviar.disabled = true;
        
        console.log('Enviando contato para API:', dados); // Debug
        console.log('URL da API:', `${API_BASE_URL}/contato`); // Debug
        
        // Envio real para a API
        const response = await fetch(`${API_BASE_URL}/contato`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: dados.nome,
                email: dados.email,
                telefone: dados.telefone || '',
                assunto: dados.assunto,
                mensagem: dados.mensagem
            })
        });
        
        console.log('Resposta da API:', response.status, response.statusText); // Debug
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Dados da resposta:', responseData); // Debug
            
            // Sucesso
            btnEnviar.innerHTML = '<i class="fas fa-check"></i> Enviado!';
            btnEnviar.style.background = '#28a745';
            
            // Limpar formulário
            document.getElementById('form-contato').reset();
            
            // Mostrar mensagem de sucesso
            alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        } else {
            const errorData = await response.text();
            console.error('Erro na API:', errorData); // Debug
            throw new Error('Erro na resposta do servidor');
        }
        
        // Restaurar botão após 3 segundos
        setTimeout(() => {
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.style.background = '';
            btnEnviar.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        
        // Erro
        btnEnviar.innerHTML = '<i class="fas fa-times"></i> Erro ao enviar';
        btnEnviar.style.background = '#dc3545';
        
        alert('Erro ao enviar mensagem. Tente novamente.');
        
        // Restaurar botão após 3 segundos
        setTimeout(() => {
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.style.background = '';
            btnEnviar.disabled = false;
        }, 3000);
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-imovel');
    if (e.target === modal) {
        fecharModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharModal();
    }
});

// Adicionar estilos CSS para o modal via JavaScript
const modalStyles = `
<style>
.modal-imovel-content {
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.modal-imovel-gallery .main-image img {
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 10px;
    margin-bottom: 1rem;
}

.thumbnail-images {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
}

.thumbnail {
    width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: 5px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.thumbnail.active,
.thumbnail:hover {
    opacity: 1;
    border: 2px solid var(--primary-color);
}

.modal-header {
    margin-bottom: 1rem;
}

.modal-header h2 {
    font-size: 1.8rem;
    color: var(--secondary-color);
    margin-bottom: 0.5rem;
}

.modal-preco {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary-color);
}

.modal-badges {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.badge {
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
}

.badge-tipo {
    background: var(--light-gold);
    color: var(--secondary-color);
}

.badge-finalidade {
    background: var(--primary-color);
    color: var(--white);
}

.modal-endereco {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-light);
    margin-bottom: 1.5rem;
}

.modal-endereco i {
    color: var(--primary-color);
}

.modal-detalhes {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.detalhe-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-light);
}

.detalhe-item i {
    color: var(--primary-color);
}

.modal-descricao h3 {
    color: var(--secondary-color);
    margin-bottom: 0.5rem;
}

.modal-descricao p {
    color: var(--text-light);
    line-height: 1.6;
    margin-bottom: 2rem;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.modal-actions button {
    flex: 1;
    min-width: 120px;
    padding: 0.8rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.modal-actions button:hover {
    transform: translateY(-2px);
}

.btn-interesse {
    background: var(--primary-color);
    color: var(--white);
}

.btn-whatsapp-modal {
    background: #25D366;
    color: var(--white);
}

.btn-compartilhar {
    background: var(--secondary-color);
    color: var(--white);
}

@media (max-width: 768px) {
    .modal-imovel-content {
        grid-template-columns: 1fr;
        padding: 1rem;
    }
    
    .modal-actions {
        flex-direction: column;
    }
    
    .modal-actions button {
        flex: none;
    }
}
</style>
`;

// Adicionar estilos ao head
document.head.insertAdjacentHTML('beforeend', modalStyles);



// Funções de Paginação
function renderizarPaginacao(pagination) {
    const paginacaoDiv = document.getElementById('paginacao');
    const numerosDiv = document.getElementById('numeros-pagina');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    
    // Mostrar paginação apenas se houver mais de uma página
    if (pagination.totalPages <= 1) {
        paginacaoDiv.style.display = 'none';
        return;
    }
    
    paginacaoDiv.style.display = 'flex';
    
    // Configurar botões anterior/próximo
    btnAnterior.disabled = !pagination.hasPrevPage;
    btnProximo.disabled = !pagination.hasNextPage;
    
    // Limpar números de página
    numerosDiv.innerHTML = '';
    
    // Calcular quais páginas mostrar
    const maxPaginas = 5; // Máximo de números de página a mostrar
    let inicio = Math.max(1, pagination.currentPage - Math.floor(maxPaginas / 2));
    let fim = Math.min(pagination.totalPages, inicio + maxPaginas - 1);
    
    // Ajustar início se necessário
    if (fim - inicio + 1 < maxPaginas) {
        inicio = Math.max(1, fim - maxPaginas + 1);
    }
    
    // Adicionar primeira página se necessário
    if (inicio > 1) {
        adicionarNumeroPagina(1, pagination.currentPage);
        if (inicio > 2) {
            numerosDiv.insertAdjacentHTML('beforeend', '<span class="numero-pagina-ellipsis">...</span>');
        }
    }
    
    // Adicionar páginas do intervalo
    for (let i = inicio; i <= fim; i++) {
        adicionarNumeroPagina(i, pagination.currentPage);
    }
    
    // Adicionar última página se necessário
    if (fim < pagination.totalPages) {
        if (fim < pagination.totalPages - 1) {
            numerosDiv.insertAdjacentHTML('beforeend', '<span class="numero-pagina-ellipsis">...</span>');
        }
        adicionarNumeroPagina(pagination.totalPages, pagination.currentPage);
    }
}

function adicionarNumeroPagina(numero, paginaAtual) {
    const numerosDiv = document.getElementById('numeros-pagina');
    const isAtivo = numero === paginaAtual;
    
    const numeroElement = document.createElement('div');
    numeroElement.className = `numero-pagina ${isAtivo ? 'ativo' : ''}`;
    numeroElement.textContent = numero;
    numeroElement.onclick = () => irParaPagina(numero);
    
    numerosDiv.appendChild(numeroElement);
}

function irParaPagina(pagina) {
    if (pagina < 1 || pagina > totalPaginas || pagina === paginaAtual) {
        return;
    }
    
    console.log(`Navegando para página ${pagina}`); // Debug
    
    // Scroll para o topo da seção de imóveis
    const imoveisSection = document.getElementById('imoveis');
    if (imoveisSection) {
        imoveisSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Carregar nova página
    carregarImoveis(pagina);
}

// Adicionar estilos para ellipsis
const ellipsisStyles = `
<style>
.numero-pagina-ellipsis {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-weight: 500;
}
</style>
`;

// Adicionar estilos ao head se ainda não existir
if (!document.querySelector('style[data-ellipsis]')) {
    const style = document.createElement('style');
    style.setAttribute('data-ellipsis', 'true');
    style.textContent = `
.numero-pagina-ellipsis {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-weight: 500;
}
`;
    document.head.appendChild(style);
}

