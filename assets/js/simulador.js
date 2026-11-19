/*
  simulador.js: Simulador Ateliê Doce Byte na nuvem (Fundamentos de Computação em Nuvem, aulas 2 a 15).
  Caso fictício, criado para a disciplina. versão 1 · 2026-11-19
  Seis decisões; cada escolha mexe em três indicadores (custo, site no ar e segurança, de 0 a 100).
  Mesmo motor do Simulador Crise na Equipe (Lab I). Com o login da faculdade, o resultado vai para a professora (conta.js).
  O último resultado fica no navegador (localStorage "nuvem-simulador").
*/
(function () {
  var CHAVE = "nuvem-simulador";
  var NOMES = { custo: "Custo sob controle", disponibilidade: "Site no ar", seguranca: "Segurança" };
  var RODADAS = [
    {
      titulo: "Como usar a nuvem",
      situacao: "A dona do Ateliê quer o site da loja e os pedidos na nuvem, mas não tem ninguém para cuidar de sistema operacional nem de atualizações.",
      tipo: "Modelos de serviço · aula 2",
      opcoes: [
        { txt: "Uma máquina virtual (IaaS), e o sobrinho instala e atualiza tudo.", boa: false, ef: { custo: -5, disponibilidade: 0, seguranca: -10 },
          cons: "Funciona, mas as atualizações atrasam e uma falha de segurança fica aberta por semanas. No IaaS, o sistema operacional é problema seu." },
        { txt: "Uma plataforma gerenciada (PaaS) para o site, e o provedor cuida do sistema por baixo.", boa: true, ef: { custo: 5, disponibilidade: 10, seguranca: 10 },
          cons: "O sobrinho só publica o site. Sistema operacional, atualizações e parte da escala ficam com o provedor." },
        { txt: "Deixar tudo no servidor dos fundos da loja e só fazer backup na nuvem.", boa: false, ef: { custo: 0, disponibilidade: -15, seguranca: -5 },
          cons: "No Dia das Mães o site cai de novo. Backup ajuda a recuperar, mas não deixa o site no ar." }
      ]
    },
    {
      titulo: "Onde fica a nuvem",
      situacao: "Um amigo da dona diz que é mais barato guardar tudo nos Estados Unidos. Os dados dos clientes (nome, endereço e telefone) vão junto.",
      tipo: "Regiões e LGPD · aulas 3 e 7",
      opcoes: [
        { txt: "Região de São Paulo (Brazil South no Azure, sa-east-1 na AWS), perto dos clientes.", boa: true, ef: { custo: -5, disponibilidade: 10, seguranca: 10 },
          cons: "Custa um pouco mais, mas o site responde rápido para Brasília e fica mais simples cumprir a LGPD." },
        { txt: "A região mais barata, nos Estados Unidos, sem pensar mais nisso.", boa: false, ef: { custo: 10, disponibilidade: -5, seguranca: -10 },
          cons: "A conta cai, mas o site fica mais lento e a empresa passa a transferir dados pessoais para fora do país sem ter avaliado a LGPD." },
        { txt: "Uma região diferente para cada serviço, para testar.", boa: false, ef: { custo: -10, disponibilidade: -5, seguranca: -5 },
          cons: "Os serviços passam a conversar de longe, a transferência de dados entre regiões entra na conta e ninguém sabe onde está cada coisa." }
      ]
    },
    {
      titulo: "A rede",
      situacao: "O site precisa ser visto por todo mundo. O banco de dados com os pedidos, não.",
      tipo: "Redes · aula 9",
      opcoes: [
        { txt: "Site na sub-rede pública e banco na sub-rede privada, sem acesso pela internet.", boa: true, ef: { custo: 0, disponibilidade: 5, seguranca: 15 },
          cons: "O cliente vê a loja, e o banco só conversa com a aplicação. Um ataque vindo da internet não chega direto aos pedidos." },
        { txt: "Tudo na sub-rede pública: é mais fácil de configurar.", boa: false, ef: { custo: 0, disponibilidade: 0, seguranca: -20 },
          cons: "Em poucos dias, robôs da internet começam a tentar senhas no banco de dados. Basta uma senha fraca para os pedidos vazarem." },
        { txt: "Tudo na sub-rede privada, até o site.", boa: false, ef: { custo: 0, disponibilidade: -20, seguranca: 5 },
          cons: "Seguro, mas ninguém consegue abrir a loja. Sem rota para a internet, o site não aparece para os clientes." }
      ]
    },
    {
      titulo: "As fotos e os backups",
      situacao: "São 50 GB de fotos dos doces e os backups diários, que hoje ficam num HD externo que a dona leva para casa.",
      tipo: "Armazenamento · aula 11",
      opcoes: [
        { txt: "Armazenamento de objetos, com os backups antigos numa classe mais barata.", boa: true, ef: { custo: 10, disponibilidade: 5, seguranca: 10 },
          cons: "As fotos ficam com endereço próprio para o site, e os backups antigos custam centavos. O HD externo se aposenta." },
        { txt: "Aumentar o disco da máquina virtual e guardar tudo lá dentro.", boa: false, ef: { custo: -10, disponibilidade: -5, seguranca: -5 },
          cons: "Disco de máquina é caro por GB. E se a máquina tiver problema, as fotos e os backups vão junto." },
        { txt: "Continuar com o HD externo: sempre funcionou.", boa: false, ef: { custo: 5, disponibilidade: -10, seguranca: -15 },
          cons: "Até o dia em que o HD cai no chão do carro. Backup num lugar só não é backup." }
      ]
    },
    {
      titulo: "Quem pode fazer o quê",
      situacao: "Hoje a dona, o sobrinho que fez o site e a atendente usam o mesmo login na conta da nuvem.",
      tipo: "Identidade e segurança · aula 13",
      opcoes: [
        { txt: "Um login para cada pessoa, só com as permissões de que precisa, e MFA para todos.", boa: true, ef: { custo: 0, disponibilidade: 5, seguranca: 20 },
          cons: "A atendente vê só os pedidos, o sobrinho mexe só no site, e a conta da dona tem MFA. Menor privilégio na prática." },
        { txt: "Manter o login único e trocar a senha todo mês.", boa: false, ef: { custo: 0, disponibilidade: 0, seguranca: -15 },
          cons: "Trocar a senha não resolve: todo mundo continua podendo apagar tudo, e ninguém sabe quem fez o quê." },
        { txt: "Dar acesso de administrador para os três, cada um com o seu login.", boa: false, ef: { custo: -5, disponibilidade: -5, seguranca: -10 },
          cons: "Melhorou o registro de quem fez o quê, mas a atendente apaga sem querer um recurso do site. Administrador para quem não precisa é risco." }
      ]
    },
    {
      titulo: "A promoção de Páscoa",
      situacao: "Uma influenciadora vai divulgar a loja. A previsão é de dez vezes mais acessos que num dia comum, só por um fim de semana.",
      tipo: "Escalabilidade e custos · aulas 5 e 15",
      opcoes: [
        { txt: "Balanceador de carga, escalabilidade automática e um alerta de orçamento.", boa: true, ef: { custo: 10, disponibilidade: 15, seguranca: 5 },
          cons: "No pico, a nuvem liga mais máquinas; na segunda, desliga. O alerta avisa se a conta passar do combinado. Isso é elasticidade." },
        { txt: "Ligar dez máquinas grandes e deixá-las ligadas o ano todo, por garantia.", boa: false, ef: { custo: -20, disponibilidade: 10, seguranca: 0 },
          cons: "O site aguenta, mas a conta de março vem dez vezes maior, e continua assim. Na nuvem, o que fica ligado é cobrado." },
        { txt: "Não fazer nada: se cair, cai.", boa: false, ef: { custo: 5, disponibilidade: -20, seguranca: 0 },
          cons: "O site sai do ar às 10 horas de sábado, no auge da divulgação. Os clientes vão comprar na concorrência." }
      ]
    }
  ];

  var raiz = document.getElementById("simulador");
  if (!raiz) return;
  var estado;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  function limitar(v) {
    return Math.max(0, Math.min(100, v));
  }

  function painel() {
    var p = el("div", "painel-ind");
    p.setAttribute("aria-label", "Indicadores");
    Object.keys(NOMES).forEach(function (k) {
      var v = estado.ind[k];
      var c = el("div", "indicador" + (v < 35 ? " baixo" : ""));
      var r = el("div", "rotulo-ind");
      r.appendChild(el("span", "", NOMES[k]));
      r.appendChild(el("strong", "", String(v)));
      var t = el("div", "trilho");
      t.setAttribute("role", "progressbar");
      t.setAttribute("aria-label", NOMES[k]);
      t.setAttribute("aria-valuemin", "0");
      t.setAttribute("aria-valuemax", "100");
      t.setAttribute("aria-valuenow", String(v));
      var s = el("span");
      s.style.setProperty("--v", v + "%");
      t.appendChild(s);
      c.appendChild(r);
      c.appendChild(t);
      p.appendChild(c);
    });
    return p;
  }

  function efeitos(ef) {
    var d = el("p", "efeitos");
    Object.keys(NOMES).forEach(function (k, i) {
      if (i) d.appendChild(document.createTextNode(" · "));
      var v = ef[k];
      var s = el("span", v > 0 ? "mais" : v < 0 ? "menos" : "", NOMES[k] + " " + (v > 0 ? "+" : "") + v);
      d.appendChild(s);
    });
    return d;
  }

  function rodada() {
    var r = RODADAS[estado.i];
    raiz.innerHTML = "";
    raiz.appendChild(painel());
    var card = el("div", "cartao rodada");
    card.appendChild(el("span", "contador", "Decisão " + (estado.i + 1) + " de " + RODADAS.length + " · " + r.tipo));
    var h = el("h2", "", r.titulo);
    h.tabIndex = -1;
    card.appendChild(h);
    card.appendChild(el("p", "situacao", r.situacao));
    card.appendChild(el("p", "", "O que você faz?"));
    var ul = el("ul", "opcoes");
    // as opções aparecem em ordem sorteada, para a melhor não ficar sempre no mesmo lugar
    var ordem = r.opcoes.map(function (o, j) { return j; });
    for (var k = ordem.length - 1; k > 0; k--) { var s = Math.floor(Math.random() * (k + 1)); var tmp = ordem[k]; ordem[k] = ordem[s]; ordem[s] = tmp; }
    ordem.forEach(function (j) {
      var o = r.opcoes[j];
      var li = el("li");
      var b = el("button", "", o.txt);
      b.type = "button";
      b.addEventListener("click", function () { escolher(j, ul, card); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    raiz.appendChild(card);
    h.focus();
  }

  function escolher(j, ul, card) {
    var r = RODADAS[estado.i];
    var o = r.opcoes[j];
    ul.querySelectorAll("button").forEach(function (b) {
      b.disabled = true;
      if (b.textContent === o.txt) b.classList.add("escolhida");
    });
    Object.keys(o.ef).forEach(function (k) { estado.ind[k] = limitar(estado.ind[k] + o.ef[k]); });
    estado.escolhas.push({ rodada: r.titulo, boa: o.boa, txt: o.txt });
    var c = el("div", "consequencia");
    c.setAttribute("role", "status");
    c.appendChild(el("p", "", o.cons));
    c.appendChild(efeitos(o.ef));
    c.appendChild(el("p", "contador", o.boa ? "Decisão de arquiteta(o) de nuvem ✓" : "Dá para fazer melhor: releia a aula indicada."));
    card.appendChild(c);
    var prox = el("button", "botao", estado.i + 1 < RODADAS.length ? "Próxima decisão" : "Ver o resultado");
    prox.type = "button";
    prox.addEventListener("click", function () {
      estado.i++;
      if (estado.i < RODADAS.length) rodada(); else fim();
    });
    var bt = el("div", "botoes");
    bt.appendChild(prox);
    card.appendChild(bt);
    var painelAntigo = raiz.querySelector(".painel-ind");
    raiz.replaceChild(painel(), painelAntigo);
    prox.focus();
  }

  function fim() {
    var acertos = estado.escolhas.filter(function (e) { return e.boa; }).length;
    var total = estado.ind.custo + estado.ind.disponibilidade + estado.ind.seguranca;
    var msg = total >= 210 ? "O Ateliê está na nuvem: conta sob controle, site no ar no Dia das Mães e dados protegidos. Trabalho de arquiteta(o)!"
      : total >= 150 ? "A loja foi para a nuvem, mas com arranhões. Veja em quais decisões os indicadores caíram e o que daria para fazer diferente."
      : "A mudança foi difícil. Releia as consequências e as aulas indicadas, e jogue de novo testando outros caminhos.";
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ ind: estado.ind, escolhas: estado.escolhas, quando: new Date().toISOString() }));
    } catch (erro) {}

    raiz.innerHTML = "";
    raiz.appendChild(painel());
    var card = el("div", "cartao resultado-final");
    card.appendChild(el("span", "olho", "resultado"));
    var h = el("h2", "", "O Ateliê na nuvem");
    h.tabIndex = -1;
    card.appendChild(h);
    card.appendChild(el("p", "", msg));
    card.appendChild(el("p", "", "Decisões de arquiteta(o) de nuvem: " + acertos + " de " + RODADAS.length + "."));
    card.appendChild(el("p", "contador", new Date().toLocaleString("pt-BR")));
    var aviso = el("p", "ativ-aviso");
    aviso.setAttribute("role", "status");
    aviso.hidden = true;
    card.appendChild(aviso);
    var ol = el("ol", "revisao");
    estado.escolhas.forEach(function (e) {
      var li = el("li", "", (e.boa ? "✓ " : "✗ ") + e.rodada);
      li.appendChild(el("span", "", e.txt));
      ol.appendChild(li);
    });
    card.appendChild(ol);
    card.appendChild(el("h3", "", "Para a sua análise da simulação"));
    var perg = el("ol");
    ["Em qual decisão você mudaria a sua escolha? Por quê?",
     "Qual indicador foi mais difícil de manter alto: custo, site no ar ou segurança? O que isso mostra sobre as escolhas na nuvem?",
     "Qual destas decisões entra no diagrama do Ateliê (Trabalho da Unidade 2)?"].forEach(function (t) {
      perg.appendChild(el("li", "", t));
    });
    card.appendChild(perg);
    var bt = el("div", "botoes");
    var de = el("button", "botao", "Jogar de novo");
    de.type = "button";
    de.addEventListener("click", iniciar);
    var imp = el("button", "botao contorno", "Imprimir ou salvar em PDF");
    imp.type = "button";
    imp.addEventListener("click", function () { window.print(); });
    bt.appendChild(de);
    bt.appendChild(imp);
    card.appendChild(bt);
    raiz.appendChild(card);
    registrar(aviso, acertos);
    h.focus();
  }

  // ---------- registro para a professora (assets/js/conta.js) ----------
  function registrar(aviso, acertos) {
    if (!window.CONTA) return;
    aviso.hidden = false;
    aviso.textContent = "Soldando os componentes... registrando o resultado para a professora.";
    CONTA.registrarTentativa({
      atividade: "simulador-atelie",
      titulo: "Simulador Ateliê Doce Byte na nuvem · Fundamentos de Computação em Nuvem",
      acertos: acertos,
      total: RODADAS.length,
      duracao_seg: (Date.now() - estado.inicio) / 1000,
      detalhes: { indicadores: estado.ind }
    }).then(function (registro) {
      aviso.textContent = "";
      if (registro) {
        aviso.appendChild(document.createTextNode("Compilou de primeira! Resultado registrado para a professora. Código de verificação: "));
        aviso.appendChild(el("strong", "", registro.codigo));
        aviso.appendChild(document.createTextNode(". Salve o resultado e envie no Moodle."));
      } else {
        aviso.appendChild(document.createTextNode("Resultado não registrado. Para valer como atividade, entre com o e-mail da faculdade (botão Entrar, no topo). "));
        var de = el("button", "botao contorno", "Registrar agora");
        de.type = "button";
        de.addEventListener("click", function () { registrar(aviso, acertos); });
        aviso.appendChild(de);
      }
    });
  }

  function iniciar() {
    estado = { i: 0, ind: { custo: 50, disponibilidade: 50, seguranca: 50 }, escolhas: [], inicio: Date.now() };
    rodada();
  }

  document.getElementById("comecar-sim").addEventListener("click", function () {
    document.getElementById("abertura-sim").hidden = true;
    iniciar();
  });
})();
