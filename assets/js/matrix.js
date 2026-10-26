/*
  matrix.js: chuva de 0 e 1 na cor neon do site atrás da abertura (o mesmo efeito do PyQuiz).
  versão 3 · 2026-10-07 (a cor vem do --neon do CSS; com --neon-2, as colunas alternam as duas cores)

  Uso: <canvas class="chuva-matrix" aria-hidden="true"></canvas> dentro da seção da abertura.
  Para quando a pessoa aperta "Pausar animações" (ou pede menos movimento no sistema).
*/
(function () {

  const tela = document.querySelector(".chuva-matrix");
  if (!tela) return;

  const contexto = tela.getContext("2d");
  const raiz = document.documentElement;
  const TAMANHO = 16;          // tamanho de cada 0 ou 1, em pixels
  const QUADROS_POR_SEGUNDO = 20;

  let gotas = [];
  let cor = "#39ff14";
  let cor2 = cor;
  let rodando = false;
  let ultimo = 0;

  function pausado() {
    return raiz.classList.contains("pausado");
  }

  function atualizaCor() {
    // a cor vem do --neon do neon.css (no site de JavaScript, amarelo); verde se não tiver
    const estilo = getComputedStyle(raiz);
    cor = estilo.getPropertyValue("--neon").trim() || "#39ff14";
    // segunda cor (no Python, o amarelo da outra cobrinha); sem ela, uma cor só
    cor2 = estilo.getPropertyValue("--neon-2").trim() || cor;
  }

  function ajustaTamanho() {
    const caixa = tela.parentElement.getBoundingClientRect();
    tela.width = Math.round(caixa.width);
    tela.height = Math.round(caixa.height);
    const colunas = Math.floor(tela.width / TAMANHO);
    // cada coluna começa numa altura diferente, para a chuva não cair "em fila"
    gotas = Array.from({ length: colunas }, function () {
      return Math.floor(Math.random() * tela.height / TAMANHO);
    });
  }

  function desenha(agora) {
    if (!rodando) return;
    requestAnimationFrame(desenha);
    if (agora - ultimo < 1000 / QUADROS_POR_SEGUNDO) return;
    ultimo = agora;

    // apaga um pouco do quadro anterior, deixando o rastro (e o fundo transparente)
    contexto.globalCompositeOperation = "destination-out";
    contexto.fillStyle = "rgba(0, 0, 0, 0.09)";
    contexto.fillRect(0, 0, tela.width, tela.height);
    contexto.globalCompositeOperation = "source-over";

    contexto.font = TAMANHO + "px 'Atkinson Hyperlegible Mono', monospace";

    gotas.forEach(function (linha, coluna) {
      // uma coluna em cada três na segunda cor
      contexto.fillStyle = coluna % 3 === 0 ? cor2 : cor;
      const digito = Math.random() > 0.5 ? "1" : "0";
      contexto.fillText(digito, coluna * TAMANHO, linha * TAMANHO);
      // quando a gota passa do fim, às vezes volta para o topo
      if (linha * TAMANHO > tela.height && Math.random() > 0.975) {
        gotas[coluna] = 0;
      } else {
        gotas[coluna] = linha + 1;
      }
    });
  }

  function liga() {
    if (rodando || pausado()) return;
    rodando = true;
    requestAnimationFrame(desenha);
  }

  function desliga() {
    rodando = false;
    contexto.clearRect(0, 0, tela.width, tela.height);
  }

  atualizaCor();
  ajustaTamanho();
  liga();

  document.addEventListener("placa:movimento", function (evento) {
    if (evento.detail.pausado) {
      desliga();
    } else {
      liga();
    }
  });

  document.addEventListener("placa:tema", atualizaCor);

  let espera;
  window.addEventListener("resize", function () {
    clearTimeout(espera);
    espera = setTimeout(ajustaTamanho, 200);
  });

})();
