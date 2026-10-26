/* ===================================================================
   atividades.js: as atividades que a professora publica pelo Placa-Mãe · versão 3 · 2026-10-19 (aviso "ainda não há atividade" some quando há alguma)
   (cópia comum às disciplinas)

   O Placa-Mãe escreve a lista em assets/data/atividades.json (e os anexos em assets/atividades/).
   Este arquivo só mostra:
     - na página inicial, um card para cada atividade dentro de [data-atividades];
       se a seção e o link do menu estão escondidos ([data-atividades-secao], [data-atividades-link],
       eles aparecem quando há pelo menos uma atividade; o aviso [data-atividades-vazio] some;
     - em atividade.html?a=<id>, a atividade inteira: instruções, link e anexo
       (imagem aparece na página; outro arquivo vira botão de baixar).
   Os textos entram com textContent: nada do que vem do arquivo vira HTML.
   =================================================================== */
(function () {
  const lista = document.querySelector("[data-atividades]");
  const pagina = document.querySelector("[data-atividade]");
  if (!lista && !pagina) return;

  // o caminho do arquivo de dados vem do atributo (cada página sabe onde está)
  const alvo = lista || pagina;
  const base = alvo.dataset.base || "";

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
      const card = el("a", "repo luz");
      card.href = base + "atividade.html?a=" + encodeURIComponent(a.id);
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
      if (lista) montarCards(atividades);
      if (pagina) montarPagina(atividades);
    });
})();
