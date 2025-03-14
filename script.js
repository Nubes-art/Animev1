// Configuração do Firebase
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_DOMINIO.firebaseapp.com",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_BUCKET.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SUA_APP_ID"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Identificação do jogador (simples, sem autenticação)
const userId = "teste_user"; 
const userRef = db.collection("jogadores").doc(userId);

// Variáveis do jogo
let afeto = 0;

// Carregar progresso salvo no Firebase
userRef.get().then((doc) => {
    if (doc.exists) {
        afeto = doc.data().afeto || 0;
        document.getElementById("afeto").innerText = afeto;
    } else {
        userRef.set({ afeto: 0 });
    }
});

// Sistema de clique
document.getElementById("clique").addEventListener("click", () => {
    afeto++;
    document.getElementById("afeto").innerText = afeto;

    // Salvar no Firebase
    userRef.update({ afeto: afeto });
});

// Loja de personagens
const personagens = [
    { nome: "Tsundere", preco: 10, bonus: 1 },
    { nome: "Yandere", preco: 50, bonus: 2 }
];

// Exibir loja
function atualizarLoja() {
    const lojaDiv = document.getElementById("loja");
    lojaDiv.innerHTML = "";

    personagens.forEach((p, index) => {
        const btn = document.createElement("button");
        btn.innerText = `${p.nome} - ${p.preco} 💖`;
        btn.onclick = () => comprarPersonagem(index);
        lojaDiv.appendChild(btn);
    });
}

atualizarLoja();

// Comprar personagem
function comprarPersonagem(index) {
    const p = personagens[index];
    
    if (afeto >= p.preco) {
        afeto -= p.preco;
        document.getElementById("afeto").innerText = afeto;
        userRef.update({ afeto: afeto });

        alert(`${p.nome} comprada! Você ganha +${p.bonus} afeto por clique.`);

        document.getElementById("clique").addEventListener("click", () => {
            afeto += p.bonus;
            document.getElementById("afeto").innerText = afeto;
            userRef.update({ afeto: afeto });
        });
    } else {
        alert("Afeto insuficiente!");
    }
}
