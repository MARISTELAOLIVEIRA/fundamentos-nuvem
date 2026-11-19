/*
  quiz.js: Quiz de revisão de Fundamentos de Computação em Nuvem (quiz.html?b=1 para o 1º bimestre, ?b=2 para o 2º).
  versão 1 · 2026-11-19 (login da faculdade e registro do resultado para a professora, conta.js)
  Como no PyQuiz: o aluno entra com o e-mail da faculdade e digita o nome para liberar, responde com explicação a cada pergunta
  e, no fim, vê o resultado com nome e data (pode imprimir ou tirar print). As perguntas saem
  dos conceitos das aulas. O melhor resultado fica no navegador (localStorage "nuvem-quiz-b1"/"-b2").
*/
(function () {
  var BANCO = {
    1: {
      titulo: "Quiz do 1º bimestre",
      sub: "Aulas 2 a 7: modelos de serviço e de implantação, custos, infraestrutura e responsabilidade compartilhada.",
      perguntas: [
        { p: "Criar uma máquina virtual em minutos, pelo site do provedor, sem falar com ninguém, é qual característica essencial da nuvem?", c: "Autoatendimento sob demanda",
          e: ["Amplo acesso pela rede", "Recursos compartilhados", "Serviço medido"],
          x: "O NIST lista cinco características essenciais. No autoatendimento sob demanda, você mesmo pede o recurso, na hora em que precisa (aula 2)." },
        { p: "O Ateliê usa o Microsoft 365 para e-mail e planilhas, sem instalar nem manter nada. Isso é:", c: "SaaS",
          e: ["IaaS", "PaaS", "Nuvem privada"],
          x: "No SaaS você usa o software pronto e o provedor cuida de tudo, do servidor ao programa. No IaaS você recebe a máquina; no PaaS, a plataforma para rodar o seu código (aula 2)." },
        { p: "Uma empresa mantém um sistema no próprio prédio e o resto na nuvem pública, conversando entre si. Que modelo de implantação é esse?", c: "Híbrida",
          e: ["Pública", "Privada", "Multinuvem"],
          x: "Na híbrida, parte fica no data center da empresa e parte na nuvem pública. Multinuvem é usar mais de um provedor de nuvem pública ao mesmo tempo (aula 3)." },
        { p: "Qual é a diferença entre escalabilidade e elasticidade?", c: "Escalabilidade é poder crescer; elasticidade é crescer e diminuir sozinho, conforme o movimento.",
          e: ["São a mesma coisa com nomes diferentes.", "Elasticidade é trocar por uma máquina maior; escalabilidade é desligar máquinas.", "Escalabilidade só existe no data center próprio."],
          x: "Escalar vertical é trocar por uma máquina maior; horizontal é pôr mais máquinas iguais. A elasticidade faz isso automaticamente, para cima e para baixo (aula 3)." },
        { p: "O software que permite rodar várias máquinas virtuais num só servidor físico é o:", c: "Hipervisor",
          e: ["Balanceador de carga", "Gateway de internet", "Sistema de backup"],
          x: "A virtualização divide um servidor em várias máquinas virtuais, e quem faz essa divisão é o hipervisor. É ela que permite à nuvem alugar pedaços de servidores (aula 4)." },
        { p: "Comprar um servidor, um nobreak e um ar-condicionado para a sala de servidores é um gasto de:", c: "CapEx",
          e: ["OpEx", "TCO", "SLA"],
          x: "CapEx é comprar um bem que dura anos, antes de usar. OpEx é pagar conforme usa, todo mês. A nuvem troca CapEx por OpEx (aula 5)." },
        { p: "Para comparar de forma justa o servidor próprio com a nuvem, o que se usa?", c: "O custo total de propriedade (TCO) dos dois lados.",
          e: ["Só o preço de compra do servidor.", "Só a conta mensal da nuvem.", "O preço do servidor mais caro do mercado."],
          x: "O TCO soma compra, espaço, energia, pessoas, manutenção, tempo fora do ar e a troca do equipamento. A comparação honesta é TCO contra TCO (aula 5)." },
        { p: "Na calculadora de preços, qual destes itens NÃO muda o valor da estimativa?", c: "A cor do logotipo da empresa.",
          e: ["A região escolhida.", "O tempo que a máquina fica ligada.", "A quantidade de dados que os clientes baixam."],
          x: "A estimativa depende da região, do tamanho da máquina, do tempo de uso, do armazenamento, da saída de dados e do jeito de pagar (aula 6)." },
        { p: "Uma zona de disponibilidade é:", c: "Um ou mais data centers separados dentro de uma região, com energia e rede próprias.",
          e: ["Outro nome para região.", "Um ponto de presença que guarda cópias do site perto do cliente.", "O país onde fica a sede do provedor."],
          x: "Cada região tem várias zonas de disponibilidade isoladas entre si. Usar mais de uma zona mantém o serviço no ar se uma delas falhar (aula 7)." },
        { p: "Os dados dos clientes do Ateliê vazaram porque a senha da conta era fraca. De quem é a responsabilidade?", c: "Da empresa: a segurança na nuvem (senhas, acessos, dados) é do cliente.",
          e: ["Do provedor, sempre.", "De ninguém: vazamento na nuvem é inevitável.", "Do fabricante do computador da dona."],
          x: "Na responsabilidade compartilhada, o provedor cuida da segurança da nuvem (prédio, servidores, rede). O cliente cuida da segurança na nuvem: contas, senhas, permissões e dados (aula 7)." }
      ]
    },
    2: {
      titulo: "Quiz do 2º bimestre",
      sub: "Aulas 9 a 15: redes, computação, armazenamento, bancos, segurança, arquitetura e escalabilidade.",
      perguntas: [
        { p: "No Ateliê, onde deve ficar o banco de dados com os pedidos?", c: "Numa sub-rede privada, sem acesso direto pela internet.",
          e: ["Numa sub-rede pública, para ficar mais rápido.", "No notebook da dona.", "Fora da rede virtual, aberto para todos."],
          x: "O que precisa ser visto por todos (o site) fica na sub-rede pública; o banco fica na privada e só conversa com a aplicação (aula 9)." },
        { p: "As fotos dos doces carregam devagar para quem está longe. Que serviço ajuda?", c: "Uma rede de entrega de conteúdo (CDN).",
          e: ["Um banco de dados maior.", "Uma senha mais forte.", "Mais uma sub-rede privada."],
          x: "A CDN guarda cópias do conteúdo em pontos de presença perto do cliente, e o site carrega mais rápido (aula 9)." },
        { p: "Enviar um e-mail de confirmação a cada pedido, rodando o código só quando ele é chamado, combina com:", c: "Uma função sem servidor (serverless).",
          e: ["Uma máquina virtual ligada o mês inteiro.", "Um servidor físico na loja.", "Um armazenamento de arquivos."],
          x: "Na função sem servidor, o código roda só quando é chamado e você paga só pelas execuções. Para tarefas curtas e esporádicas, é a opção mais barata (aula 10)." },
        { p: "O sistema antigo de estoque só roda em Windows e precisa de controle do sistema operacional. Qual escolha faz mais sentido?", c: "Uma máquina virtual.",
          e: ["Uma função sem servidor.", "Um SaaS de e-mail.", "Uma CDN."],
          x: "A máquina virtual dá controle do sistema operacional, ideal para sistemas antigos. Contêineres e funções servem melhor a aplicações novas (aula 10)." },
        { p: "As fotos do site e os backups combinam com qual tipo de armazenamento?", c: "Objetos (como Amazon S3 ou Blob Storage do Azure).",
          e: ["Blocos, como o disco de uma máquina virtual.", "Arquivos compartilhados de rede.", "A memória RAM do servidor."],
          x: "Armazenamento de objetos guarda arquivos inteiros, com endereço próprio, quase sem limite e barato. Blocos são o disco da máquina; arquivos são as pastas compartilhadas da equipe (aula 11)." },
        { p: "O cadastro de clientes e pedidos, com tudo bem amarrado, combina melhor com:", c: "Um banco relacional.",
          e: ["Um banco não relacional.", "Uma planilha no e-mail.", "Uma CDN."],
          x: "Dados com estrutura fixa e relações entre si combinam com banco relacional. O carrinho, que muda a cada clique, combina com um não relacional (aula 12)." },
        { p: "O que a empresa ganha com um banco de dados gerenciado?", c: "O provedor cuida da instalação, das atualizações e do backup.",
          e: ["O banco fica de graça para sempre.", "Ninguém mais precisa cuidar dos acessos.", "O banco deixa de precisar de rede."],
          x: "No banco gerenciado, o trabalho pesado fica com o provedor. Quem acessa o quê continua sendo responsabilidade da empresa (aula 12)." },
        { p: "A atendente do Ateliê só precisa ver os pedidos. Pelo princípio do menor privilégio, ela deve:", c: "Ter só a permissão de ver os pedidos, e nada além disso.",
          e: ["Usar o login da dona, que já tem tudo.", "Ter acesso de administrador, para não travar.", "Ficar sem nenhum acesso."],
          x: "Menor privilégio é dar a cada pessoa só o que ela precisa para trabalhar. Cada um com o seu login, e MFA nas contas mais poderosas (aula 13)." },
        { p: "No diagrama da arquitetura, o que garante que a loja continue no ar se uma zona de disponibilidade cair?", c: "Ter a aplicação e o banco em mais de uma zona de disponibilidade.",
          e: ["Usar uma máquina maior numa zona só.", "Desenhar o diagrama com mais cores.", "Guardar a senha num arquivo no servidor."],
          x: "A confiabilidade, um dos pilares do Well-Architected, pede que nenhuma peça seja ponto único de falha (aula 14)." },
        { p: "Na promoção de Páscoa, os acessos vão aumentar dez vezes. O que resolve sem pagar o pico o ano inteiro?", c: "Balanceador de carga com escalabilidade automática.",
          e: ["Comprar dez servidores e deixá-los ligados.", "Tirar o site do ar no dia da promoção.", "Trocar a senha da conta."],
          x: "O balanceador divide os acessos entre as máquinas, e a escalabilidade automática liga mais máquinas no pico e desliga depois. Um alarme avisa antes de o cliente reclamar (aula 15)." }
      ]
    }
  };

  var raiz = document.getElementById("quiz");
  if (!raiz) return;
  var b = new URLSearchParams(location.search).get("b") === "2" ? 2 : 1;
  var Q = BANCO[b];
  var CHAVE = "nuvem-quiz-b" + b;
  document.getElementById("quiz-titulo").textContent = Q.titulo;
  document.getElementById("quiz-sub").textContent = Q.sub;
  document.title = Q.titulo + " · Fundamentos de Computação em Nuvem · Stela";
  var outro = document.getElementById("quiz-outro");
  if (outro) {
    outro.href = "quiz.html?b=" + (b === 1 ? 2 : 1);
    outro.textContent = b === 1 ? "Ir para o quiz do 2º bimestre" : "Ir para o quiz do 1º bimestre";
  }

  var estado;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  function embaralhar(v) {
    var a = v.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function melhor() {
    try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (erro) { return null; }
  }

  function pergunta() {
    var q = estado.ordem[estado.i];
    raiz.innerHTML = "";
    var prog = el("div", "quiz-progresso");
    prog.setAttribute("role", "progressbar");
    prog.setAttribute("aria-label", "Progresso do quiz");
    prog.setAttribute("aria-valuemin", "0");
    prog.setAttribute("aria-valuemax", String(estado.ordem.length));
    prog.setAttribute("aria-valuenow", String(estado.i));
    var s = el("span");
    s.style.setProperty("--p", (estado.i / estado.ordem.length * 100) + "%");
    prog.appendChild(s);
    raiz.appendChild(prog);

    var card = el("div", "cartao rodada");
    card.appendChild(el("span", "contador", "Pergunta " + (estado.i + 1) + " de " + estado.ordem.length + " · " + estado.acertos + " acerto(s)"));
    var h = el("h2", "", q.p);
    h.tabIndex = -1;
    card.appendChild(h);
    var ul = el("ul", "opcoes");
    embaralhar([q.c].concat(q.e)).forEach(function (op) {
      var li = el("li");
      var bt = el("button", "", op);
      bt.type = "button";
      bt.addEventListener("click", function () { responder(op, q, ul, card); });
      li.appendChild(bt);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    raiz.appendChild(card);
    h.focus();
  }

  function responder(op, q, ul, card) {
    var certo = op === q.c;
    if (certo) estado.acertos++;
    estado.respostas.push({ p: q.p, certo: certo, c: q.c });
    ul.querySelectorAll("button").forEach(function (bt) {
      bt.disabled = true;
      if (bt.textContent === q.c) bt.classList.add("certa");
      else if (bt.textContent === op) bt.classList.add("errada");
    });
    var c = el("div", "consequencia");
    c.setAttribute("role", "status");
    c.appendChild(el("p", "", certo ? "Acertou!" : "Não foi dessa vez. A resposta certa: " + q.c));
    c.appendChild(el("p", "", q.x));
    card.appendChild(c);
    var prox = el("button", "botao", estado.i + 1 < estado.ordem.length ? "Próxima pergunta" : "Ver o resultado");
    prox.type = "button";
    prox.addEventListener("click", function () {
      estado.i++;
      if (estado.i < estado.ordem.length) pergunta(); else fim();
    });
    var bts = el("div", "botoes");
    bts.appendChild(prox);
    card.appendChild(bts);
    prox.focus();
  }

  function fim() {
    var total = estado.ordem.length;
    var antes = melhor();
    if (!antes || estado.acertos > antes.acertos) {
      try {
        localStorage.setItem(CHAVE, JSON.stringify({ nome: estado.nome, acertos: estado.acertos, total: total, quando: new Date().toISOString() }));
      } catch (erro) {}
    }
    raiz.innerHTML = "";
    var cert = el("div", "certificado");
    cert.appendChild(el("span", "olho", Q.titulo + " · Fundamentos de Computação em Nuvem"));
    var h = el("h2", "", estado.nome);
    h.tabIndex = -1;
    cert.appendChild(h);
    cert.appendChild(el("p", "nota", estado.acertos + " de " + total));
    var msg = estado.acertos === total ? "Gabaritou! Os conceitos estão firmes."
      : estado.acertos >= 7 ? "Muito bem! Revise as perguntas que errou e está pronto."
      : "Bom começo. Releia as aulas das perguntas que errou e tente de novo.";
    cert.appendChild(el("p", "", msg));
    cert.appendChild(el("p", "contador", new Date().toLocaleString("pt-BR")));
    var aviso = el("p", "ativ-aviso");
    aviso.setAttribute("role", "status");
    aviso.hidden = true;
    cert.appendChild(aviso);
    raiz.appendChild(cert);
    registrar(aviso);

    var rev = el("div", "cartao");
    rev.appendChild(el("h3", "", "Revisão"));
    var ol = el("ol", "revisao");
    estado.respostas.forEach(function (r) {
      var li = el("li", "", (r.certo ? "✓ " : "✗ ") + r.p);
      if (!r.certo) li.appendChild(el("span", "", "Certa: " + r.c));
      ol.appendChild(li);
    });
    rev.appendChild(ol);
    var bts = el("div", "botoes");
    var de = el("button", "botao", "Fazer de novo");
    de.type = "button";
    de.addEventListener("click", function () { iniciar(estado.nome); });
    var imp = el("button", "botao contorno", "Imprimir ou salvar em PDF");
    imp.type = "button";
    imp.addEventListener("click", function () { window.print(); });
    bts.appendChild(de);
    bts.appendChild(imp);
    rev.appendChild(bts);
    raiz.appendChild(rev);
    h.focus();
  }

  // ---------- registro para a professora (assets/js/conta.js) ----------
  // Com o login da faculdade, o resultado vai para o Placa-Mãe; o código de verificação aparece no resultado.
  function registrar(aviso) {
    if (!window.CONTA) return;
    aviso.hidden = false;
    aviso.textContent = "Soldando os componentes... registrando o resultado para a professora.";
    CONTA.registrarTentativa({
      atividade: "quiz-revisao-b" + b,
      titulo: Q.titulo + " · Fundamentos de Computação em Nuvem",
      acertos: estado.acertos,
      total: estado.ordem.length,
      duracao_seg: (Date.now() - estado.inicio) / 1000,
      detalhes: { nome_digitado: estado.nome }
    }).then(function (registro) {
      aviso.textContent = "";
      if (registro) {
        aviso.appendChild(document.createTextNode("Compilou de primeira! Resultado registrado para a professora. Código de verificação: "));
        aviso.appendChild(el("strong", "", registro.codigo));
        aviso.appendChild(document.createTextNode(". Salve o resultado e envie no Moodle."));
      } else {
        aviso.appendChild(document.createTextNode("Resultado não registrado. Para valer como atividade, entre com o e-mail da faculdade. "));
        var de = el("button", "botao contorno", "Registrar agora");
        de.type = "button";
        de.addEventListener("click", function () { registrar(aviso); });
        aviso.appendChild(de);
      }
    });
  }

  function iniciar(nome) {
    estado = { nome: nome, i: 0, acertos: 0, respostas: [], ordem: embaralhar(Q.perguntas), inicio: Date.now() };
    pergunta();
  }

  var form = document.getElementById("form-nome");
  var erro = document.getElementById("erro-nome");
  var m = melhor();
  if (m) {
    form.elements.nome.value = m.nome || "";
    document.getElementById("melhor").textContent = "Seu melhor resultado neste navegador: " + m.acertos + " de " + m.total + ".";
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = form.elements.nome.value.trim().replace(/\s+/g, " ");
    if (nome.split(" ").length < 2) {
      erro.textContent = "Digite seu nome completo (nome e sobrenome) para liberar o quiz.";
      form.elements.nome.setAttribute("aria-invalid", "true");
      form.elements.nome.focus();
      return;
    }
    erro.textContent = "";
    form.elements.nome.removeAttribute("aria-invalid");
    document.getElementById("abertura-quiz").hidden = true;
    // nome com a primeira letra maiúscula (conta.js); sem ele, fica como foi digitado
    iniciar(window.CONTA ? CONTA.formatarNome(nome) : nome);
  });

  // com o login, o nome da conta já entra no formulário
  if (window.CONTA) {
    CONTA.aoMudar(function () {
      if (CONTA.daFaculdade() && !form.elements.nome.value.trim()) form.elements.nome.value = CONTA.nome();
    });
  }
})();
