// script.js
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega o catálogo de personagens e conquistas
    const catalogo = await carregarCatalogo();
    if (!catalogo) {
        console.error("Erro ao carregar o catálogo. Verifique o arquivo catalogo.json.");
        return;
    }

    // Inicializa o estado do jogo
    const estado = {
        afeto: 0,
        bonusPorClique: 1,
        afetoPassivo: 0,
        personagensComprados: [],
        conquistasDesbloqueadas: [],
        animeSelecionado: 'naruto',
        intervaloPassivo: null
    };

    // Carrega o progresso salvo (se existir)
    await carregarProgresso(estado);

    // Inicializa a interface do jogo
    inicializarInterface(catalogo, estado);

    // Configura os listeners de eventos
    configurarEventos(catalogo, estado);
});

// Função para carregar o catálogo de personagens e conquistas
async function carregarCatalogo() {
    try {
        const response = await fetch('catalogo.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar o catálogo: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Função para carregar o progresso salvo (Firebase ou localStorage)
async function carregarProgresso(estado) {
    try {
        if (!window.firebaseDB) {
            console.log("Firebase não está disponível. Usando estado inicial.");
            return;
        }

        const doc = await window.firebaseDB.getDocument("jogadores", "user_animeclicker");
        if (doc.exists()) {
            const data = doc.data();
            estado.afeto = data.afeto || 0;
            estado.bonusPorClique = data.bonusPorClique || 1;
            estado.afetoPassivo = data.afetoPassivo || 0;
            estado.personagensComprados = data.personagensComprados || [];
            estado.conquistasDesbloqueadas = data.conquistasDesbloqueadas || [];

            if (estado.afetoPassivo > 0) {
                iniciarPassivo(estado);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar progresso:", error);
    }
}

// Função para salvar o progresso (Firebase ou localStorage)
async function salvarProgresso(estado) {
    try {
        if (!window.firebaseDB) {
            console.log("Firebase não está disponível. Não foi possível salvar o progresso.");
            return;
        }

        await window.firebaseDB.updateDocument("jogadores", "user_animeclicker", {
            afeto: estado.afeto,
            bonusPorClique: estado.bonusPorClique,
            afetoPassivo: estado.afetoPassivo,
            personagensComprados: estado.personagensComprados,
            conquistasDesbloqueadas: estado.conquistasDesbloqueadas
        });
    } catch (error) {
        console.error("Erro ao salvar progresso no Firebase:", error);
    }
}

// Função para inicializar a interface do jogo
function inicializarInterface(catalogo, estado) {
    atualizarDisplayAfeto(estado);
    // Mover a atualização da loja para quando ela for aberta
    // atualizarLoja(catalogo, estado);
}

// Função para configurar os listeners de eventos
function configurarEventos(catalogo, estado) {
    // Clique principal
    document.getElementById('clique').addEventListener('click', () => {
        estado.afeto += estado.bonusPorClique;
        atualizarDisplayAfeto(estado);
        salvarProgresso(estado);
        verificarConquistas(catalogo, estado);
        
        // Adicionar efeito visual ao clicar
        const button = document.getElementById('clique');
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 100);
    });

    // CORREÇÃO: Adicionar evento para abrir a loja
    document.getElementById('open-shop').addEventListener('click', () => {
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('shop-screen').classList.remove('hidden');
        atualizarLoja(catalogo, estado); // Atualizar a loja quando abrir
    });

    // Navegação na loja
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            estado.animeSelecionado = btn.dataset.anime;
            atualizarLoja(catalogo, estado);
        });
    });

    // Botão de voltar da loja
    document.getElementById('back-from-shop').addEventListener('click', () => {
        document.getElementById('shop-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
    });
}

// Função para atualizar o display de afeto
function atualizarDisplayAfeto(estado) {
    document.getElementById('afeto').textContent = estado.afeto;
    document.getElementById('bonus').textContent = estado.bonusPorClique;
    document.getElementById('passive').textContent = estado.afetoPassivo;
}

// Função para atualizar a loja
function atualizarLoja(catalogo, estado) {
    const shopContent = document.getElementById('shop-content');
    shopContent.innerHTML = '';

    // Verificar se o anime selecionado existe no catálogo
    if (!catalogo.personagens[estado.animeSelecionado]) {
        shopContent.innerHTML = '<p>Categoria não encontrada!</p>';
        return;
    }

    catalogo.personagens[estado.animeSelecionado].forEach(personagem => {
        const comprado = estado.personagensComprados.includes(personagem.id);
        const item = document.createElement('div');
        item.className = `shop-item ${estado.afeto >= personagem.preco && !comprado ? 'affordable' : ''}`;
        item.innerHTML = `
            <div class="shop-item-image">${personagem.emoji}</div>
            <div class="shop-item-info">
                <p class="shop-item-name">${personagem.nome}</p>
                <p class="shop-item-description">${personagem.descricao}</p>
                <p class="shop-item-price">Preço: ${personagem.preco}💖</p>
                ${comprado ? '<span style="color:green">✓ Adquirida</span>' : ''}
            </div>
        `;

        if (!comprado && estado.afeto >= personagem.preco) {
            item.classList.add('clickable');
            item.onclick = () => comprarPersonagem(personagem, catalogo, estado);
        }

        shopContent.appendChild(item);
    });
}

// Função para comprar personagens
async function comprarPersonagem(personagem, catalogo, estado) {
    if (estado.afeto >= personagem.preco && !estado.personagensComprados.includes(personagem.id)) {
        estado.afeto -= personagem.preco;
        estado.bonusPorClique += personagem.bonusClique;
        estado.afetoPassivo += personagem.bonusPassivo;
        estado.personagensComprados.push(personagem.id);

        if (personagem.bonusPassivo > 0 && !estado.intervaloPassivo) {
            iniciarPassivo(estado);
        }

        mostrarNotificacao('success', `${personagem.nome} adquirida! (+${personagem.bonusClique}/clique)`);
        atualizarDisplayAfeto(estado);
        atualizarLoja(catalogo, estado);
        salvarProgresso(estado);
        verificarConquistas(catalogo, estado);
    }
}

// Função para iniciar o sistema passivo
function iniciarPassivo(estado) {
    if (estado.intervaloPassivo) clearInterval(estado.intervaloPassivo);

    estado.intervaloPassivo = setInterval(() => {
        estado.afeto += estado.afetoPassivo;
        atualizarDisplayAfeto(estado);
        salvarProgresso(estado);
    }, 1000);
}

// Função para verificar conquistas
function verificarConquistas(catalogo, estado) {
    catalogo.conquistas.forEach(conquista => {
        if (!estado.conquistasDesbloqueadas.includes(conquista.id)) {
            // Corrigir a condição de verificação para usar o estado atual
            const condicaoFn = new Function('estado', `return ${conquista.condicao}`);
            try {
                if (condicaoFn(estado)) {
                    estado.conquistasDesbloqueadas.push(conquista.id);
                    mostrarConquista(conquista);
                    salvarProgresso(estado);
                }
            } catch (error) {
                console.error(`Erro ao verificar conquista ${conquista.id}:`, error);
            }
        }
    });
}

// Função para mostrar notificações
function mostrarNotificacao(tipo, mensagem) {
    const popup = document.createElement('div');
    popup.className = `notification ${tipo}`;
    popup.textContent = mensagem;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 3000);
}

// Função para mostrar conquistas
function mostrarConquista(conquista) {
    const popup = document.getElementById('achievement-popup');
    popup.querySelector('#achievement-title').textContent = conquista.nome;
    popup.querySelector('#achievement-message').textContent = conquista.descricao;
    popup.classList.remove('hidden');

    setTimeout(() => {
        popup.classList.add('hidden');
    }, 5000);
}
