// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Variables
  let afeto = 0;
  let bonusPorClique = 1;
  const userId = "teste_user";
  
  // Load saved progress
  try {
    const doc = await window.firebaseDB.getDocument("jogadores", userId);
    if (doc.exists()) {
      afeto = doc.data().afeto || 0;
      updateAfeto();
    } else {
      await window.firebaseDB.setDocument("jogadores", userId, { afeto: 0 });
    }
  } catch (error) {
    console.error("Error loading progress:", error);
    alert("Erro ao carregar progresso: " + error.message);
  }

  // Click system
  document.getElementById("clique").addEventListener("click", async () => {
    afeto += bonusPorClique;
    updateAfeto();
    
    try {
      await window.firebaseDB.updateDocument("jogadores", userId, { afeto: afeto });
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Erro ao salvar progresso: " + error.message);
    }
  });

  function updateAfeto() {
    document.getElementById("afeto").innerText = afeto;
  }

  // Characters shop
  const personagens = [
    { nome: "Tsundere", preco: 10, bonus: 1 },
    { nome: "Yandere", preco: 50, bonus: 2 }
  ];

  // Display shop
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

  // Buy character
  async function comprarPersonagem(index) {
    const p = personagens[index];

    if (afeto >= p.preco) {
      afeto -= p.preco;
      updateAfeto();
      
      try {
        await window.firebaseDB.updateDocument("jogadores", userId, { afeto: afeto });
        
        // Add bonus to total click bonus
        bonusPorClique += p.bonus;

        alert(`${p.nome} comprada! Bônus total: +${bonusPorClique - 1} por clique.`);
      } catch (error) {
        console.error("Error buying character:", error);
        alert("Erro ao comprar personagem: " + error.message);
      }
    } else {
      alert("Afeto insuficiente!");
    }
  }
});
