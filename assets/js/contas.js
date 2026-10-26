/*
  contas.js: a calculadora "Comprar ou alugar?" das aulas (versão 1 · 2026-10-26).
  Divide o preço do servidor pelos meses de uso (a vida útil), soma os custos de todo mês e compara
  com a conta mensal da nuvem. Recalcula a cada número digitado.

  Uso:
    <form class="calc-custo">
      <input type="number" data-papel="preco">     preço do servidor, pago à vista
      <input type="number" data-papel="anos">      vida útil, em anos
      <input type="number" data-papel="mensal">    um ou mais custos de todo mês (energia, manutenção...)
      <input type="number" data-papel="nuvem">     a estimativa mensal na nuvem
      <output class="calc-resultado" aria-live="polite"></output>
    </form>
*/
(function () {

  const reais = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function numero(campo) {
    const valor = parseFloat(String(campo.value).replace(",", "."));
    return Number.isFinite(valor) && valor >= 0 ? valor : 0;
  }

  function calcular(form) {
    const preco = numero(form.querySelector('[data-papel="preco"]'));
    const anos = numero(form.querySelector('[data-papel="anos"]'));
    const nuvem = numero(form.querySelector('[data-papel="nuvem"]'));
    const mensais = Array.from(form.querySelectorAll('[data-papel="mensal"]')).reduce((soma, campo) => soma + numero(campo), 0);
    const saida = form.querySelector(".calc-resultado");

    if (anos === 0) {
      saida.textContent = "Digite a vida útil do servidor, em anos, para fazer a conta.";
      return;
    }
    const parcela = preco / (anos * 12);
    const proprio = parcela + mensais;
    const diferenca = proprio - nuvem;
    let conclusao;
    if (Math.abs(diferenca) < 0.01) {
      conclusao = "Empate: os dois custam o mesmo por mês.";
    } else if (diferenca > 0) {
      conclusao = `A nuvem sai ${reais(diferenca)} mais barata por mês (${reais(diferenca * 12)} por ano).`;
    } else {
      conclusao = `O servidor próprio sai ${reais(-diferenca)} mais barato por mês (${reais(-diferenca * 12)} por ano).`;
    }
    saida.innerHTML = "";
    const linhas = [
      `Servidor dividido pelos meses de uso: ${reais(parcela)} por mês.`,
      `Servidor próprio, com os custos de todo mês: ${reais(proprio)} por mês.`,
      `Nuvem: ${reais(nuvem)} por mês.`,
      conclusao,
    ];
    linhas.forEach(function (texto, i) {
      const p = document.createElement("p");
      p.textContent = texto;
      if (i === linhas.length - 1) p.className = "calc-conclusao";
      saida.appendChild(p);
    });
  }

  document.querySelectorAll(".calc-custo").forEach(function (form) {
    form.addEventListener("input", function () { calcular(form); });
    form.addEventListener("submit", function (evento) { evento.preventDefault(); });
    calcular(form);
  });
})();
