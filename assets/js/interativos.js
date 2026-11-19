/*
  interativos.js: peças interativas das aulas de Fundamentos de Computação em Nuvem.
  versão 1 · 2026-11-19 (aulas com conteúdo próprio, sem depender da AWS Academy)

  1. Verdade ou mito (.vf): cada <li data-v="v" ou "f" data-explica="..."> ganha dois botões.
     <div class="vf"><p class="vf-placar" aria-live="polite"></p><ol class="vf-itens"><li data-v="f" data-explica="...">A nuvem fica no céu.</li></ol></div>
  2. Cartas que viram (.cartas > button.carta): frente e verso; clique (ou Enter) vira a carta.
     <div class="cartas"><button type="button" class="carta"><span class="frente">Termo</span><span class="verso">Explicação</span></button></div>
  3. Abas das nuvens (.abas-nuvem): cada filho <section data-aba="AWS"> vira uma aba.
  4. Escolha rápida (.escolha): uma pergunta, opções em <li data-certa> e explicação em data-explica.
     <div class="escolha" data-explica="..."><p class="escolha-pergunta">...</p><ul><li data-certa>Certa</li><li>Errada</li></ul></div>
  5. Termômetro de conta (.termometro): range de horas ligadas × preço por hora = conta do mês.
     <div class="termometro" data-preco="0.25" data-moeda="US$"> (data-modo="promo": máquinas no fim de semana)<input type="range" min="0" max="720" value="720"><output></output></div>
*/
(function () {

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  // ---------- 1. verdade ou mito ----------
  document.querySelectorAll(".vf").forEach(function (bloco) {
    var itens = Array.prototype.slice.call(bloco.querySelectorAll(".vf-itens > li"));
    var placar = bloco.querySelector(".vf-placar");
    var feitos = 0, acertos = 0;
    function atualizar() {
      if (!placar) return;
      var t = feitos + " de " + itens.length + " respondidos · " + acertos + " de primeira";
      if (feitos === itens.length) {
        t += acertos === itens.length ? " · 🏆 Detector de mitos calibrado!" : acertos >= itens.length * 0.7 ? " · ⭐ Quase lá: releia as explicações." : " · 🌱 Sem crise: leia as explicações e jogue de novo.";
      }
      placar.textContent = t;
    }
    itens.forEach(function (li) {
      var frase = li.textContent.trim();
      li.textContent = "";
      li.appendChild(el("span", "vf-frase", frase));
      var bts = el("span", "vf-botoes");
      bts.setAttribute("role", "group");
      bts.setAttribute("aria-label", "Verdade ou mito: " + frase);
      var ret = el("span", "vf-retorno");
      ret.setAttribute("aria-live", "polite");
      var tentou = false, resolvido = false;
      [["v", "Verdade"], ["f", "Mito"]].forEach(function (op) {
        var b = el("button", "", op[1]);
        b.type = "button";
        b.addEventListener("click", function () {
          if (resolvido) return;
          var certo = op[0] === li.dataset.v;
          if (certo) {
            resolvido = true;
            b.classList.add("acertou");
            li.classList.add("certo");
            if (!tentou) acertos++;
            feitos++;
            ret.textContent = (tentou ? "Isso! " : "Acertou de primeira! ") + (li.dataset.explica || "");
            bts.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
            atualizar();
          } else {
            tentou = true;
            b.classList.add("errou");
            b.disabled = true;
            ret.textContent = "Hmm, quase. Pense de novo e tente o outro botão.";
          }
        });
        bts.appendChild(b);
      });
      li.appendChild(bts);
      li.appendChild(ret);
    });
    atualizar();
  });

  // ---------- 2. cartas que viram ----------
  document.querySelectorAll(".cartas .carta").forEach(function (c) {
    c.setAttribute("aria-pressed", "false");
    c.addEventListener("click", function () {
      var virada = c.classList.toggle("virada");
      c.setAttribute("aria-pressed", virada ? "true" : "false");
    });
  });

  // ---------- 3. abas das nuvens ----------
  document.querySelectorAll(".abas-nuvem").forEach(function (bloco, n) {
    var paineis = Array.prototype.slice.call(bloco.querySelectorAll(":scope > section[data-aba]"));
    if (!paineis.length) return;
    var lista = el("div", "abas-lista");
    lista.setAttribute("role", "tablist");
    var botoes = paineis.map(function (p, i) {
      var id = "aba-" + n + "-" + i;
      p.id = id + "-painel";
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", id);
      p.tabIndex = 0;
      var b = el("button", "aba aba-" + (p.dataset.cor || "x"), p.dataset.aba);
      b.type = "button";
      b.id = id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", p.id);
      b.addEventListener("click", function () { mostrar(i); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          var j = (i + (e.key === "ArrowRight" ? 1 : -1) + paineis.length) % paineis.length;
          mostrar(j);
          botoes[j].focus();
        }
      });
      lista.appendChild(b);
      return b;
    });
    function mostrar(i) {
      paineis.forEach(function (p, k) { p.hidden = k !== i; });
      botoes.forEach(function (b, k) {
        b.setAttribute("aria-selected", k === i ? "true" : "false");
        b.tabIndex = k === i ? 0 : -1;
      });
    }
    bloco.insertBefore(lista, paineis[0]);
    mostrar(0);
  });

  // ---------- 4. escolha rápida ----------
  document.querySelectorAll(".escolha").forEach(function (bloco) {
    var ops = Array.prototype.slice.call(bloco.querySelectorAll("ul > li"));
    var ret = el("p", "escolha-retorno");
    ret.setAttribute("aria-live", "polite");
    var ul = bloco.querySelector("ul");
    ul.className = "escolha-opcoes";
    var tentou = false;
    ops.forEach(function (li) {
      var txt = li.textContent.trim();
      var certa = li.hasAttribute("data-certa");
      li.textContent = "";
      var b = el("button", "", txt);
      b.type = "button";
      b.addEventListener("click", function () {
        if (certa) {
          b.classList.add("acertou");
          ops.forEach(function (o) { o.querySelector("button").disabled = true; });
          ret.textContent = (tentou ? "Agora sim! " : "Na mosca! ") + (bloco.dataset.explica || "");
        } else {
          tentou = true;
          b.classList.add("errou");
          b.disabled = true;
          ret.textContent = li.dataset.dica || "Não foi essa. Respira, relê a pergunta e tenta outra.";
        }
      });
      li.appendChild(b);
    });
    bloco.appendChild(ret);
  });

  // ---------- 5. termômetro da conta ----------
  document.querySelectorAll(".termometro").forEach(function (bloco) {
    var r = bloco.querySelector("input[type=range]");
    var out = bloco.querySelector("output");
    var preco = parseFloat(bloco.dataset.preco || "0.1");
    var moeda = bloco.dataset.moeda || "US$";
    function conta() {
      var h = Number(r.value);
      if (bloco.dataset.modo === "promo") {
        var custo = (h * preco).toFixed(2).replace(".", ",");
        var f = h === 0 ? "Nenhuma máquina: a loja nem abre. 😅"
          : h < 10 ? "Não aguenta: a previsão é de uns 1.000 acessos por minuto, e o site cai no meio da divulgação."
          : h <= 12 ? "Na medida: aguenta o pico com uma folguinha. É isso que a escala automática faz sozinha."
          : "Aguenta, mas sobra máquina parada, e máquina parada também cobra.";
        out.textContent = h + " máquina(s) aguentam uns " + (h * 100) + " acessos por minuto. Custo do fim de semana: " + moeda + " " + custo + ". " + f;
        r.setAttribute("aria-valuetext", h + " máquinas");
        return;
      }
      var v = h * preco;
      var frase = h >= 700 ? "Ligada direto, dia e noite. É o pior cenário para o bolso."
        : h >= 300 ? "Ligada em horário comercial: já economiza um bom tanto."
        : h > 0 ? "Ligada só quando precisa. É assim que a nuvem fica barata."
        : "Desligada: conta zero de máquina (o disco guardado ainda cobra).";
      out.textContent = h + " horas no mês × " + moeda + " " + preco.toFixed(2).replace(".", ",") + " por hora = " + moeda + " " + v.toFixed(2).replace(".", ",") + ". " + frase;
      r.setAttribute("aria-valuetext", h + " horas");
    }
    r.addEventListener("input", conta);
    conta();
  });

})();
