/*
  aulas.js: comportamento das páginas de aula e da lista de aulas.
  versão 3 · 2026-10-21 (progresso na conta do aluno)

  1. Checklist da atividade (<ol class="checklist" id="...">): o que o aluno marca
     fica salvo no navegador dele, e a barra de progresso mostra quantos passos faltam.
     Se a página tem o login (assets/js/conta.js, versão 4) e o aluno entrou com o e-mail da
     faculdade, o checklist também vai para a conta dele (tabela disc_progresso do Supabase):
     ao entrar em outro computador, as marcações voltam. Navegador e conta se juntam: o que
     estiver marcado em qualquer um dos dois fica marcado.
  2. Lista de aulas (<ol class="log lista-aulas">): cada <li> tem as datas das turmas
     em data-a e data-b (formato AAAA-MM-DD). O script destaca a próxima aula e
     deixa mais apagadas as que já passaram e as futuras. Ninguém precisa atualizar à mão.
     Duas aulas com a mesma data (mesmo encontro) ficam as duas destacadas.
*/
(function () {

  // ---------- 1. checklist da atividade ----------

  function ler(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch (erro) {
      return [];
    }
  }

  function gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
      // sem armazenamento (aba anônima, por exemplo): o checklist funciona, só não fica salvo
    }
  }

  // a página dentro do site: "/seguranca-nuvem/aulas/aula-11.html" vira "aulas/aula-11.html"
  const pagina = location.pathname.split("/").filter(Boolean).slice(1).join("/") || "index.html";
  const checklists = [];

  function ligaChecklist(lista) {
    const chave = "aula:" + location.pathname + ":" + lista.id;
    const caixas = Array.from(lista.querySelectorAll('input[type="checkbox"]'));
    const progresso = document.querySelector('[data-progresso="' + lista.id + '"]');
    const marcadas = ler(chave);

    caixas.forEach(function (caixa, posicao) {
      caixa.checked = marcadas.indexOf(posicao) !== -1;
      caixa.addEventListener("change", function () {
        atualiza();
        if (window.CONTA && CONTA.salvarProgresso) CONTA.salvarProgresso(pagina, lista.id, feitas(), caixas.length);
      });
    });

    function feitas() {
      const saida = [];
      caixas.forEach(function (caixa, posicao) {
        if (caixa.checked) {
          saida.push(posicao);
        }
      });
      return saida;
    }

    function atualiza() {
      const marcadasAgora = feitas();
      gravar(chave, marcadasAgora);

      if (progresso) {
        const total = caixas.length;
        progresso.querySelector(".contagem").textContent = marcadasAgora.length + " de " + total;
        progresso.querySelector(".barra-progresso span").style.width = (marcadasAgora.length / total * 100) + "%";
      }
    }

    // junta o que veio da conta com o que está neste navegador; devolve true se faltava algo na conta
    function juntar(daConta) {
      (daConta || []).forEach(function (posicao) {
        if (caixas[posicao]) caixas[posicao].checked = true;
      });
      atualiza();
      return feitas().length !== (daConta || []).length;
    }

    atualiza();
    checklists.push({ id: lista.id, total: caixas.length, feitas: feitas, juntar: juntar });
  }

  document.querySelectorAll("ol.checklist[id]").forEach(ligaChecklist);

  // quando o aluno entra (ou já estava logado), busca o progresso da conta e junta com o daqui
  function sincronizar(usuario) {
    if (!usuario || !CONTA.daFaculdade() || !checklists.length) return;
    CONTA.carregarProgresso().then(function (salvo) {
      if (!salvo) return;
      checklists.forEach(function (c) {
        const daConta = salvo[pagina + "|" + c.id] || [];
        const mudou = c.juntar(daConta);
        // o que só estava neste navegador sobe para a conta
        if (mudou) CONTA.salvarProgresso(pagina, c.id, c.feitas(), c.total);
      });
    });
  }

  // o conta.js chega depois (com defer ou no fim da página): espera a página terminar de carregar
  window.addEventListener("load", function () {
    if (window.CONTA && CONTA.carregarProgresso && CONTA.aoMudar) CONTA.aoMudar(sincronizar);
  });


  // ---------- 2. lista de aulas: passada, próxima e futura ----------

  function fimDoDia(texto) {
    // "2026-10-13" vira 13/10/2026 às 23:59, no horário de quem está vendo
    const partes = texto.split("-");
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 23, 59, 59);
  }

  const hoje = new Date();
  let dataProxima = "";   // data da próxima aula (duas aulas no mesmo encontro ficam as duas destacadas)

  document.querySelectorAll(".lista-aulas > li[data-a]").forEach(function (aula) {
    // a aula só "passou" depois da data da última turma (B)
    const ultimaData = fimDoDia(aula.dataset.b || aula.dataset.a);

    if (ultimaData < hoje) {
      aula.classList.add("passada");
    } else if (!dataProxima || aula.dataset.a === dataProxima) {
      dataProxima = aula.dataset.a;
      aula.classList.add("andamento");
      const etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta verde";
      etiqueta.textContent = "próxima aula";
      const linha = aula.querySelector(".commit-linha");
      linha.insertBefore(etiqueta, linha.querySelector(".hash"));
    } else {
      aula.classList.add("futura");
    }
  });

})();
