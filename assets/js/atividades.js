/* ===================================================================
   atividades.js: as atividades que a professora publica pelo Placa-Mãe · versão 4 · 2026-11-06 (atividade com pasta própria só aparece depois de liberada)
   (cópia comum às disciplinas)

   O Placa-Mãe escreve a lista em assets/data/atividades.json (e os anexos em assets/atividades/).
   Este arquivo só mostra:
     - na página inicial, um card para cada atividade dentro de [data-atividades];
       se a seção e o link do menu estão escondidos ([data-atividades-secao], [data-atividades-link],
       eles aparecem quando há pelo menos uma atividade; o aviso [data-atividades-vazio] some;
     - em atividade.html?a=<id>, a atividade inteira: instruções, link e anexo
       (imagem aparece na página; outro arquivo vira botão de baixar);
     - em qualquer página, o que aponta para uma atividade com pasta própria (escape/, simulador/...)
       leva data-pasta="escape/" e começa escondido (style="display:none"); aparece quando o
       Placa-Mãe libera a atividade. Link no meio de uma frase leva também data-pasta-texto:
       sem a atividade no ar, vira texto comum.
   Os textos entram com textContent: nada do que vem do arquivo vira HTML.
   =================================================================== */
(function () {
  // a raiz do site vem do endereço deste arquivo (.../assets/js/atividades.js): vale em qualquer pasta
  const script = document.currentScript;
  const raiz = script ? script.src.replace(/assets\/js\/atividades\.js.*$/, "") : "";
  const lista = document.querySelector("[data-atividades]");
  const pagina = document.querySelector("[data-atividade]");
  const comPasta = document.querySelector("[data-pasta]");
  if (!lista && !pagina && !comPasta) return;

  // o caminho do arquivo de dados vem do atributo (cada página sabe onde está) ou da raiz
  const alvo = lista || pagina;
  const base = (alvo && alvo.dataset.base) || raiz;

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  // a primeira linha do texto, curta, para o card
  function resumo(texto) {
    const linha = (texto || "").split("\n").find(function (l) { return l.trim(); }) || "";
    return linha.length > 140 ? linha.slice(0, 137).trim() + "…" : linha;
  }

  function etiquetaValor(a) {
    return "vale " + a.valor + " · " + a.bimestre + " bimestre";
  }

  // ---------- página inicial: um card por atividade, antes dos que já existem ----------
  function montarCards(atividades) {
    if (atividades.length) {
      document.querySelectorAll("[data-atividades-secao], [data-atividades-link]").forEach(function (e) {
        e.style.display = "";
      });
      document.querySelectorAll("[data-atividades-vazio]").forEach(function (e) { e.hidden = true; });
    }
    const primeiro = lista.firstElementChild;
    atividades.forEach(function (a, i) {
      // atividade com pasta e card fixo na página: quem mostra o card é o mostrarPastas
      if (a.pasta && lista.querySelector('[data-pasta="' + a.pasta + '"]')) return;
      const card = el("a", "repo luz");
      card.href = base + (a.pasta || "atividade.html?a=" + encodeURIComponent(a.id));
      card.setAttribute("data-revela", "");
      card.classList.add("visivel");
      card.style.setProperty("--i", i);
      const nome = el("span", "repo-nome");
      nome.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><use href="#ic-repo"/></svg>';
      nome.appendChild(document.createTextNode("atividade"));
      card.appendChild(nome);
      card.appendChild(el("h4", "", a.titulo));
      card.appendChild(el("p", "", resumo(a.descricao)));
      const pe = el("span", "repo-pe");
      pe.appendChild(el("span", "etiqueta ouro", etiquetaValor(a)));
      card.appendChild(pe);
      lista.insertBefore(card, primeiro);
    });
  }

  // ---------- atividades com pasta própria: só aparecem depois de liberadas ----------
  function mostrarPastas(atividades) {
    const noAr = atividades.map(function (a) { return a.pasta; }).filter(Boolean);
    document.querySelectorAll("[data-pasta]").forEach(function (e) {
      const liberada = noAr.indexOf(e.dataset.pasta) >= 0;
      if (e.hasAttribute("data-pasta-texto")) {
        // link no meio de uma frase: sem a atividade no ar, fica só o texto
        if (!liberada) e.replaceWith(document.createTextNode(e.textContent));
      } else if (liberada) {
        e.style.display = "";
        e.classList.add("visivel");
      }
    });
  }

  // ---------- atividade.html: a atividade inteira ----------
  function montarPagina(atividades) {
    const id = new URLSearchParams(location.search).get("a");
    const a = atividades.find(function (x) { return x.id === id; });
    const titulo = document.getElementById("titulo-atividade");
    const corpo = document.getElementById("corpo-atividade");
    if (!a) {
      titulo.textContent = "Trilha rompida";
      document.getElementById("sub-atividade").textContent = "Essa atividade não está mais no site. Volte para a lista de atividades da disciplina.";
      return;
    }
    document.title = a.titulo + " · " + document.title;
    titulo.textContent = a.titulo;
    document.getElementById("migalha-atividade").textContent = a.titulo;
    document.getElementById("sub-atividade").textContent = "";
    document.getElementById("etiqueta-atividade").textContent = etiquetaValor(a);

    corpo.appendChild(el("h2", "", "O que fazer"));
    corpo.appendChild(el("div", "enunciado", a.descricao || ""));

    const botoes = el("div", "botoes-atividade");
    if (a.link) {
      const link = el("a", "botao", "Abrir a atividade ↗");
      link.href = a.link;
      link.target = "_blank";
      link.rel = "noopener";
      botoes.appendChild(link);
    }
    if (a.arquivo && !a.imagem) {
      const baixar = el("a", "botao contorno", "Baixar o arquivo (" + a.arquivo_nome + ")");
      baixar.href = base + a.arquivo;
      baixar.setAttribute("download", "");
      botoes.appendChild(baixar);
    }
    if (botoes.children.length) corpo.appendChild(botoes);

    if (a.arquivo && a.imagem) {
      const figura = el("figure", "imagem-atividade");
      const img = el("img");
      img.src = base + a.arquivo;
      img.alt = a.alt || "";
      img.loading = "lazy";
      figura.appendChild(img);
      corpo.appendChild(figura);
    }
    corpo.hidden = false;
  }

  fetch(base + "assets/data/atividades.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .catch(function () { return []; })
    .then(function (atividades) {
      mostrarPastas(atividades);
      if (lista) montarCards(atividades);
      if (pagina) montarPagina(atividades);
    });
})();
