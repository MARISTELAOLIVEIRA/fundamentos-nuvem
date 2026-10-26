/*
  classifica.js: desafio "Classifique!" das aulas (versão 1 · 2026-10-26).
  Cada item da lista tem a resposta certa em data-resposta e a explicação em data-explica;
  as opções vêm de data-opcoes no bloco (ex.: "iaas:IaaS,paas:PaaS,saas:SaaS").
  Cada acerto na primeira tentativa vale 10 XP. No fim aparece a insígnia, conforme o placar.

  Uso:
    <div class="classifica" data-opcoes="iaas:IaaS,paas:PaaS,saas:SaaS">
      <p class="classifica-placar" aria-live="polite"></p>
      <ol class="classifica-itens">
        <li data-resposta="iaas" data-explica="...">Amazon EC2</li>
      </ol>
      <button type="button" class="botao contorno classifica-reiniciar">Jogar de novo</button>
    </div>
*/
(function () {

  const XP_POR_ACERTO = 10;

  function insignia(acertos, total) {
    if (acertos === total) return "🏆 Insígnia Arquiteta da Nuvem: acertou tudo de primeira!";
    if (acertos >= total * 0.7) return "⭐ Insígnia Nuvem à Vista: quase lá. Releia as explicações dos que errou.";
    return "🌱 Insígnia Primeira Nuvem: volte aos conceitos e jogue de novo.";
  }

  function montar(bloco, original) {
    const opcoes = bloco.dataset.opcoes.split(",").map(function (par) {
      const [valor, rotulo] = par.split(":");
      return { valor: valor, rotulo: rotulo };
    });
    const itens = Array.from(bloco.querySelectorAll(".classifica-itens > li"));
    const placar = bloco.querySelector(".classifica-placar");
    let respondidos = 0;
    let acertos = 0;

    function atualizarPlacar() {
      let texto = `${respondidos} de ${itens.length} respondidos · ${acertos * XP_POR_ACERTO} XP`;
      if (respondidos === itens.length) texto += ` · ${insignia(acertos, itens.length)}`;
      placar.textContent = texto;
    }

    itens.forEach(function (item) {
      const nome = item.textContent.trim();
      item.textContent = "";
      const titulo = document.createElement("span");
      titulo.className = "classifica-nome";
      titulo.textContent = nome;
      const botoes = document.createElement("span");
      botoes.className = "classifica-botoes";
      botoes.setAttribute("role", "group");
      botoes.setAttribute("aria-label", `Classifique: ${nome}`);
      const retorno = document.createElement("span");
      retorno.className = "classifica-retorno";
      retorno.setAttribute("aria-live", "polite");
      let tentou = false;

      opcoes.forEach(function (opcao) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = opcao.rotulo;
        botao.addEventListener("click", function () {
          if (item.classList.contains("certo")) return;
          const certo = opcao.valor === item.dataset.resposta;
          // só a primeira tentativa conta para o placar
          if (!tentou) {
            tentou = true;
            respondidos += 1;
            if (certo) acertos += 1;
          }
          botao.classList.add(certo ? "acertou" : "errou");
          if (certo) {
            item.classList.add("certo");
            retorno.textContent = `✔ Isso! ${item.dataset.explica}`;
          } else {
            retorno.textContent = "✘ Ainda não. Pense em quem cuida do sistema operacional e tente de novo.";
          }
          atualizarPlacar();
        });
        botoes.appendChild(botao);
      });

      item.append(titulo, botoes, retorno);
    });

    // "Jogar de novo": volta o bloco ao HTML do começo e monta outra vez
    bloco.querySelector(".classifica-reiniciar").addEventListener("click", function () {
      bloco.innerHTML = original;
      montar(bloco, original);
    });

    atualizarPlacar();
  }

  document.querySelectorAll(".classifica").forEach(function (bloco) {
    montar(bloco, bloco.innerHTML);
  });
})();
