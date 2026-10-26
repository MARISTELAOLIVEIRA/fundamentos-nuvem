/*
  portal.js: o simulador do portal de nuvem (versão 1 · 2026-10-26).
  Imita o fluxo do portal do Azure (grupo de recursos, máquina virtual, custos) para os alunos treinarem
  sem conta e sem cartão. Nada é criado na nuvem: os recursos simulados ficam só no navegador (localStorage).
  Cópia comum a Fundamentos de Computação em Nuvem (fundamentos-nuvem/simulador/, a original) e Segurança em
  Nuvem (seguranca-nuvem/portal/). Mudou aqui? Copie para lá. Os textos não citam número de aula: cada
  disciplina tem a sua numeração.

  É uma atividade que vale nota: a área do simulador só abre com o login da faculdade (data-exige-login, conta.js).
  As missões cumpridas vão para a conta do aluno (disc_progresso, página "simulador/", lista "missoes-portal";
  cada número guardado é missão × 10 + erros) e, quando as três terminam, o resultado é registrado em
  disc_tentativas como a atividade "simulador-portal" (acertos = XP, total = 300), com o código de verificação.
  A disciplina vem do conta.js (data-disciplina), então cada site registra na sua.

  As missões do Ateliê Doce Byte ficam em MISSOES. Cada uma vale 100 XP; cada tentativa que não cumpre
  a missão tira 10 XP, até o mínimo de 50. A conferência acontece quando o recurso é criado ou excluído.
*/
(function () {

  // os sites ficam no mesmo endereço: a chave leva a disciplina, para o progresso de uma não aparecer na outra
  const DISCIPLINA = (window.CONTA && CONTA.disciplina) || location.pathname.split("/").filter(Boolean)[0] || "local";
  const CHAVE = `simulador-portal-${DISCIPLINA}-v1`;
  const ATIVIDADE = "simulador-portal";
  const PAGINA = "simulador/";
  const LISTA = "missoes-portal";

  // ---------- os dados do portal ----------
  const REGIOES = ["Brazil South", "Brazil Southeast", "East US", "West Europe"];
  const IMAGENS = ["Ubuntu Server 24.04 LTS", "Windows Server 2022 Datacenter"];
  const TAMANHOS = [
    { id: "Standard_B1s", vcpu: 1, memoria: 1, custo: "$" },
    { id: "Standard_B2s", vcpu: 2, memoria: 4, custo: "$$" },
    { id: "Standard_D4s_v5", vcpu: 4, memoria: 16, custo: "$$$$" },
  ];
  const DISCOS = ["SSD Premium", "SSD Standard", "HDD Standard"];
  const PORTAS = [
    { id: "80", nome: "HTTP (80)" },
    { id: "443", nome: "HTTPS (443)" },
    { id: "22", nome: "SSH (22)" },
    { id: "3389", nome: "RDP (3389)" },
  ];

  const SERVICOS = [
    { id: "grupos", nome: "Grupos de recursos", icone: "🗂" },
    { id: "vms", nome: "Máquinas virtuais", icone: "🖥" },
    { id: "todos", nome: "Todos os recursos", icone: "▦" },
    { id: "custos", nome: "Gerenciamento de Custos", icone: "💲" },
    { id: "criar", nome: "Criar um recurso", icone: "＋" },
  ];

  // ---------- as missões ----------
  const MISSOES = [
    {
      id: 1,
      titulo: "Criar o grupo de recursos do Ateliê",
      pedido: "Crie o grupo de recursos rg-atelie na região Brazil South. É a \"pasta\" onde vão ficar todos os recursos da loja.",
    },
    {
      id: 2,
      titulo: "Criar a máquina virtual do site",
      pedido: "Crie a VM vm-atelie-site no grupo rg-atelie, em Brazil South, com Ubuntu Server, tamanho Standard_B2s, disco SSD Standard, chave SSH e só as portas HTTP e HTTPS abertas para a internet.",
    },
    {
      id: 3,
      titulo: "Terminou, desligou",
      pedido: "Crie uma VM de testes, vm-atelie-teste (Standard_B1s, no grupo rg-atelie). Depois pare a máquina, confira em Gerenciamento de Custos que ela não cobra mais computação e exclua. A vm-atelie-site tem que continuar no ar.",
    },
  ];

  // ---------- estado ----------
  function estadoInicial() {
    return { grupos: [], vms: [], missoes: { 1: { feita: false, erros: 0 }, 2: { feita: false, erros: 0 }, 3: { feita: false, erros: 0 } }, testeParada: false, inicio: Date.now(), registrado: null };
  }

  function carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (salvo && salvo.missoes) return salvo;
    } catch (erro) { /* sem localStorage: começa do zero */ }
    return estadoInicial();
  }

  let estado = carregar();

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (erro) { /* navegador sem armazenamento */ }
  }

  // ---------- ajudantes ----------
  const tela = document.getElementById("sim-tela");
  const notificacao = document.getElementById("sim-notificacao");
  const menu = document.getElementById("sim-menu");
  const hamburguer = document.querySelector(".sim-hamburguer");
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const opcoes = (lista, escolhida) => lista.map((v) => `<option${v === escolhida ? " selected" : ""}>${esc(v)}</option>`).join("");
  const tamanho = (id) => TAMANHOS.find((t) => t.id === id);

  function avisar(texto) {
    notificacao.textContent = texto;
    notificacao.hidden = false;
    clearTimeout(avisar.relogio);
    avisar.relogio = setTimeout(() => { notificacao.hidden = true; }, 5000);
  }

  function xpDaMissao(m) {
    const s = estado.missoes[m.id];
    return s.feita ? Math.max(50, 100 - s.erros * 10) : 0;
  }

  function dica(texto) {
    const caixa = document.getElementById("sim-dica");
    caixa.innerHTML = texto;
    caixa.hidden = !texto;
  }

  function errouMissao(id, motivos) {
    estado.missoes[id].erros += 1;
    salvar();
    dica(`<strong>Ainda não cumpre a missão ${id}.</strong><ul>${motivos.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`);
  }

  function cumpriuMissao(id) {
    if (estado.missoes[id].feita) return;
    estado.missoes[id].feita = true;
    salvar();
    const m = MISSOES.find((x) => x.id === id);
    dica(`<strong>✔ Missão ${id} cumprida: ${esc(m.titulo)}.</strong> +${xpDaMissao(m)} XP.`);
    guardarNaConta();
    if (logado() && MISSOES.every((x) => estado.missoes[x.id].feita)) registrarResultado();
  }

  // ---------- na conta do aluno (conta.js) ----------
  const logado = () => Boolean(window.CONTA && CONTA.daFaculdade());

  function guardarNaConta() {
    if (!logado()) return;
    const marcadas = MISSOES.filter((m) => estado.missoes[m.id].feita).map((m) => m.id * 10 + Math.min(9, estado.missoes[m.id].erros));
    CONTA.salvarProgresso(PAGINA, LISTA, marcadas, MISSOES.length);
  }

  // traz da conta as missões já cumpridas em outro computador
  async function trazerDaConta() {
    if (!logado()) return;
    const salvo = await CONTA.carregarProgresso();
    const marcadas = salvo && salvo[PAGINA + "|" + LISTA];
    if (!marcadas) return;
    marcadas.forEach((codigo) => {
      const id = Math.floor(codigo / 10);
      if (estado.missoes[id] && !estado.missoes[id].feita) estado.missoes[id] = { feita: true, erros: codigo % 10 };
    });
    salvar();
    desenharMissoes();
  }

  async function registrarResultado() {
    if (estado.registrado || !window.CONTA) return;
    const xp = MISSOES.reduce((soma, m) => soma + xpDaMissao(m), 0);
    const registro = await CONTA.registrarTentativa({
      atividade: ATIVIDADE,
      titulo: "Simulador do portal de nuvem: missões da Unidade 1",
      acertos: xp,
      total: MISSOES.length * 100,
      duracao_seg: (Date.now() - (estado.inicio || Date.now())) / 1000,
      detalhes: { missoes: estado.missoes },
    });
    if (registro) {
      estado.registrado = registro.codigo;
      salvar();
      desenharMissoes();
      dica(`<strong>🏆 As três missões estão cumpridas: ${xp} XP.</strong> Resultado registrado para a professora. Código de verificação: <strong>${esc(registro.codigo)}</strong>.`);
    } else {
      dica("<strong>As três missões estão cumpridas</strong>, mas não deu para registrar o resultado agora. Confira o login (botão Entrar, no topo) e recarregue a página.");
    }
  }

  function desenharMissoes() {
    const lista = document.getElementById("sim-lista-missoes");
    lista.innerHTML = MISSOES.map((m) => {
      const s = estado.missoes[m.id];
      return `<li class="${s.feita ? "feita" : ""}"><strong>${s.feita ? "✔" : "○"} ${esc(m.titulo)}</strong><span>${esc(m.pedido)}</span>${s.feita ? `<span class="sim-xp">+${xpDaMissao(m)} XP</span>` : ""}</li>`;
    }).join("");
    const total = MISSOES.reduce((soma, m) => soma + xpDaMissao(m), 0);
    const feitas = MISSOES.filter((m) => estado.missoes[m.id].feita).length;
    let texto = `${feitas} de ${MISSOES.length} missões · ${total} XP`;
    if (feitas === MISSOES.length) {
      texto += total >= 270 ? " · 🏆 Insígnia Administradora da Nuvem" : " · ⭐ Insígnia Portal Desbravado";
      if (estado.registrado) texto += ` · registrado (código ${estado.registrado})`;
    }
    document.getElementById("sim-placar").textContent = texto;
  }

  // ---------- as telas ----------
  function cabecalho(titulo, migalhas) {
    const trilha = (migalhas || []).map((m) => `<button type="button" class="sim-link" data-ir="${m[0]}">${esc(m[1])}</button> ›`).join(" ");
    const caminho = trilha ? `<p class="sim-migalhas">${trilha} <span>${esc(titulo)}</span></p>` : "";
    return `${caminho}<h2 class="sim-titulo">${esc(titulo)}</h2>`;
  }

  const TELAS = {
    inicio() {
      return `${cabecalho("Página inicial")}
        <h3 class="sim-sub">Serviços</h3>
        <div class="sim-servicos">${SERVICOS.map((s) => `<button type="button" data-ir="${s.id}"><span aria-hidden="true">${s.icone}</span>${esc(s.nome)}</button>`).join("")}</div>
        <h3 class="sim-sub">Recursos recentes</h3>
        ${tabelaRecursos()}`;
    },

    criar() {
      return `${cabecalho("Criar um recurso", [["inicio", "Página inicial"]])}
        <div class="sim-servicos">
          <button type="button" data-ir="criar-grupo"><span aria-hidden="true">🗂</span>Grupo de recursos</button>
          <button type="button" data-ir="criar-vm"><span aria-hidden="true">🖥</span>Máquina virtual</button>
          <button type="button" data-acao="indisponivel"><span aria-hidden="true">🗄</span>Conta de armazenamento</button>
          <button type="button" data-acao="indisponivel"><span aria-hidden="true">🛢</span>Banco de dados</button>
        </div>`;
    },

    grupos() {
      const linhas = estado.grupos.map((g) => `<tr><td>${esc(g.nome)}</td><td>Assinatura de estudo</td><td>${esc(g.regiao)}</td></tr>`).join("");
      return `${cabecalho("Grupos de recursos", [["inicio", "Página inicial"]])}
        <div class="sim-barra-acoes"><button type="button" class="sim-botao primario" data-ir="criar-grupo">＋ Criar</button></div>
        ${linhas ? `<div class="sim-tabela"><table><thead><tr><th>Nome</th><th>Assinatura</th><th>Localização</th></tr></thead><tbody>${linhas}</tbody></table></div>` : `<p class="sim-vazio">Nenhum grupo de recursos para exibir.</p>`}`;
    },

    "criar-grupo"() {
      return `${cabecalho("Criar um grupo de recursos", [["inicio", "Página inicial"], ["grupos", "Grupos de recursos"]])}
        <form class="sim-form" data-form="grupo" novalidate>
          <fieldset><legend>Detalhes do projeto</legend>
            <label>Assinatura <select disabled><option>Assinatura de estudo</option></select></label>
            <label><span>Grupo de recursos <span class="sim-obrig">*</span></span><input name="nome" autocomplete="off" required></label>
          </fieldset>
          <fieldset><legend>Detalhes do recurso</legend>
            <label><span>Região <span class="sim-obrig">*</span></span><select name="regiao">${opcoes(REGIOES, "East US")}</select></label>
          </fieldset>
          <p class="sim-erro" data-erro hidden></p>
          <div class="sim-barra-acoes"><button type="submit" class="sim-botao primario">Revisar + criar</button><button type="button" class="sim-botao" data-ir="grupos">Cancelar</button></div>
        </form>`;
    },

    vms() {
      const linhas = estado.vms.map((v) => `<tr><td><button type="button" class="sim-link" data-vm="${esc(v.nome)}">${esc(v.nome)}</button></td><td>${esc(v.grupo)}</td><td>${esc(v.regiao)}</td><td>${esc(v.tamanho)}</td><td>${esc(v.estado)}</td></tr>`).join("");
      return `${cabecalho("Máquinas virtuais", [["inicio", "Página inicial"]])}
        <div class="sim-barra-acoes"><button type="button" class="sim-botao primario" data-ir="criar-vm">＋ Criar</button></div>
        ${linhas ? `<div class="sim-tabela"><table><thead><tr><th>Nome</th><th>Grupo de recursos</th><th>Localização</th><th>Tamanho</th><th>Status</th></tr></thead><tbody>${linhas}</tbody></table></div>` : `<p class="sim-vazio">Nenhuma máquina virtual para exibir.</p>`}`;
    },

    "criar-vm"() {
      if (!estado.grupos.length) {
        return `${cabecalho("Criar uma máquina virtual", [["inicio", "Página inicial"], ["vms", "Máquinas virtuais"]])}
          <p class="sim-erro">Toda máquina virtual fica dentro de um grupo de recursos, e você ainda não tem nenhum.</p>
          <div class="sim-barra-acoes"><button type="button" class="sim-botao primario" data-ir="criar-grupo">Criar um grupo de recursos</button></div>`;
      }
      const grupos = estado.grupos.map((g) => g.nome);
      return `${cabecalho("Criar uma máquina virtual", [["inicio", "Página inicial"], ["vms", "Máquinas virtuais"]])}
        <form class="sim-form" data-form="vm" novalidate>
          <div class="sim-abas" role="tablist">
            <button type="button" role="tab" aria-selected="true" data-aba="basico">Básico</button>
            <button type="button" role="tab" aria-selected="false" data-aba="discos">Discos</button>
            <button type="button" role="tab" aria-selected="false" data-aba="rede">Rede</button>
            <button type="button" role="tab" aria-selected="false" data-aba="revisar">Revisar + criar</button>
          </div>

          <div class="sim-painel" data-painel="basico">
            <fieldset><legend>Detalhes do projeto</legend>
              <label>Assinatura <select disabled><option>Assinatura de estudo</option></select></label>
              <label><span>Grupo de recursos <span class="sim-obrig">*</span></span><select name="grupo">${opcoes(grupos)}</select></label>
            </fieldset>
            <fieldset><legend>Detalhes da instância</legend>
              <label><span>Nome da máquina virtual <span class="sim-obrig">*</span></span><input name="nome" autocomplete="off" required></label>
              <label><span>Região <span class="sim-obrig">*</span></span><select name="regiao">${opcoes(REGIOES, "East US")}</select></label>
              <label><span>Imagem <span class="sim-obrig">*</span></span><select name="imagem">${opcoes(IMAGENS, IMAGENS[1])}</select></label>
              <label><span>Tamanho <span class="sim-obrig">*</span></span><select name="tamanho">${TAMANHOS.map((t) => `<option value="${t.id}"${t.id === "Standard_D4s_v5" ? " selected" : ""}>${t.id} · ${t.vcpu} vCPU, ${t.memoria} GiB de memória · custo ${t.custo}</option>`).join("")}</select></label>
            </fieldset>
            <fieldset><legend>Conta de administrador</legend>
              <div class="sim-radios" role="radiogroup" aria-label="Tipo de autenticação">
                <label><input type="radio" name="autenticacao" value="Chave pública SSH"> Chave pública SSH</label>
                <label><input type="radio" name="autenticacao" value="Senha" checked> Senha</label>
              </div>
              <label><span>Nome de usuário <span class="sim-obrig">*</span></span><input name="usuario" value="azureuser" autocomplete="off"></label>
              <p class="sim-nota" data-nota-senha>No simulador, não se digita senha. No portal de verdade, prefira a chave SSH; se usar senha, que seja forte e só sua.</p>
            </fieldset>
            <fieldset><legend>Regras de porta de entrada</legend>
              <div class="sim-radios" role="radiogroup" aria-label="Portas de entrada públicas">
                <label><input type="radio" name="publicas" value="nenhuma"> Nenhum</label>
                <label><input type="radio" name="publicas" value="selecionadas" checked> Permitir portas selecionadas</label>
              </div>
              <div class="sim-portas" data-portas>
                <span>Selecionar portas de entrada</span>
                ${PORTAS.map((p) => `<label><input type="checkbox" name="porta" value="${p.id}"${p.id === "3389" ? " checked" : ""}> ${p.nome}</label>`).join("")}
              </div>
            </fieldset>
          </div>

          <div class="sim-painel" data-painel="discos" hidden>
            <fieldset><legend>Disco do SO</legend>
              <label>Tipo de disco do SO <select name="disco">${opcoes(DISCOS, "SSD Premium")}</select></label>
              <p class="sim-nota">O disco continua existindo (e cobrando) enquanto não for excluído, mesmo com a máquina parada.</p>
            </fieldset>
          </div>

          <div class="sim-painel" data-painel="rede" hidden>
            <fieldset><legend>Interface de rede</legend>
              <label>Rede virtual <select disabled><option>(novo) vnet-atelie</option></select></label>
              <label>Sub-rede <select disabled><option>(novo) default (10.0.0.0/24)</option></select></label>
              <label>IP público <select disabled><option>(novo) ip-publico</option></select></label>
              <p class="sim-nota">As portas de entrada escolhidas na aba Básico viram regras do grupo de segurança de rede.</p>
            </fieldset>
          </div>

          <div class="sim-painel" data-painel="revisar" hidden><div data-revisao></div></div>

          <p class="sim-erro" data-erro hidden></p>
          <div class="sim-barra-acoes">
            <button type="button" class="sim-botao primario" data-acao="revisar">Revisar + criar</button>
            <button type="submit" class="sim-botao primario" data-criar hidden>Criar</button>
            <button type="button" class="sim-botao" data-ir="vms">Cancelar</button>
          </div>
        </form>`;
    },

    todos() {
      return `${cabecalho("Todos os recursos", [["inicio", "Página inicial"]])}${tabelaRecursos()}`;
    },

    custos() {
      const linhas = estado.vms.map((v) => {
        const t = tamanho(v.tamanho);
        const ligada = v.estado === "Em execução";
        return `<tr><td>${esc(v.nome)}</td><td>${esc(v.estado)}</td><td>${ligada ? t.custo : "nada (parada)"}</td><td>disco ${esc(v.disco)}: cobra</td></tr>`;
      }).join("");
      return `${cabecalho("Gerenciamento de Custos", [["inicio", "Página inicial"]])}
        <p class="sim-nota">Custos simulados, em níveis ($ a $$$$). O preço de verdade, em dinheiro, você vê nas calculadoras de preço da AWS e do Azure.</p>
        ${linhas ? `<div class="sim-tabela"><table><thead><tr><th>Recurso</th><th>Status</th><th>Computação por hora</th><th>Armazenamento</th></tr></thead><tbody>${linhas}</tbody></table></div>` : `<p class="sim-vazio">Nenhum recurso gerando custo.</p>`}
        <p class="sim-nota">Máquina <strong>parada (desalocada)</strong> não cobra computação, mas o disco continua cobrando até ser excluído.</p>`;
    },

    vm(nome) {
      const v = estado.vms.find((x) => x.nome === nome);
      if (!v) return TELAS.vms();
      const t = tamanho(v.tamanho);
      const ligada = v.estado === "Em execução";
      return `${cabecalho(v.nome, [["inicio", "Página inicial"], ["vms", "Máquinas virtuais"]])}
        <div class="sim-barra-acoes">
          <button type="button" class="sim-botao" data-acao="iniciar" data-alvo="${esc(v.nome)}"${ligada ? " disabled" : ""}>▶ Iniciar</button>
          <button type="button" class="sim-botao" data-acao="parar" data-alvo="${esc(v.nome)}"${ligada ? "" : " disabled"}>■ Parar</button>
          <button type="button" class="sim-botao perigo" data-acao="excluir" data-alvo="${esc(v.nome)}">🗑 Excluir</button>
        </div>
        <dl class="sim-detalhes">
          <dt>Status</dt><dd>${esc(v.estado)}</dd>
          <dt>Grupo de recursos</dt><dd>${esc(v.grupo)}</dd>
          <dt>Localização</dt><dd>${esc(v.regiao)}</dd>
          <dt>Sistema operacional</dt><dd>${esc(v.imagem)}</dd>
          <dt>Tamanho</dt><dd>${esc(v.tamanho)} (${t.vcpu} vCPU, ${t.memoria} GiB de memória)</dd>
          <dt>Disco do SO</dt><dd>${esc(v.disco)}</dd>
          <dt>Portas abertas para a internet</dt><dd>${v.portas.length ? v.portas.map((p) => PORTAS.find((x) => x.id === p).nome).join(", ") : "nenhuma"}</dd>
          <dt>Autenticação</dt><dd>${esc(v.autenticacao)}</dd>
        </dl>`;
    },
  };

  function tabelaRecursos() {
    const linhas = [
      ...estado.grupos.map((g) => `<tr><td>${esc(g.nome)}</td><td>Grupo de recursos</td><td>${esc(g.regiao)}</td></tr>`),
      ...estado.vms.map((v) => `<tr><td><button type="button" class="sim-link" data-vm="${esc(v.nome)}">${esc(v.nome)}</button></td><td>Máquina virtual</td><td>${esc(v.regiao)}</td></tr>`),
    ].join("");
    return linhas
      ? `<div class="sim-tabela"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Localização</th></tr></thead><tbody>${linhas}</tbody></table></div>`
      : `<p class="sim-vazio">Nenhum recurso ainda. Comece por "Criar um recurso".</p>`;
  }

  // ---------- navegação ----------
  function ir(nome, argumento) {
    tela.innerHTML = TELAS[nome] ? TELAS[nome](argumento) : TELAS.inicio();
    menu.querySelectorAll("[data-ir]").forEach((b) => b.toggleAttribute("aria-current", b.dataset.ir === nome));
    menu.classList.remove("aberto");
    hamburguer.setAttribute("aria-expanded", "false");
    if (nome === "criar-vm") prepararFormVm();
    tela.focus({ preventScroll: true });
  }

  // ---------- validações do portal ----------
  const NOME_GRUPO = /^[\w.\-()]{1,90}$/;
  const NOME_VM = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,62}[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

  function lerVm(form) {
    const dados = new FormData(form);
    return {
      grupo: dados.get("grupo"),
      nome: String(dados.get("nome") || "").trim(),
      regiao: dados.get("regiao"),
      imagem: dados.get("imagem"),
      tamanho: dados.get("tamanho"),
      autenticacao: dados.get("autenticacao"),
      usuario: String(dados.get("usuario") || "").trim(),
      disco: dados.get("disco"),
      portas: dados.get("publicas") === "nenhuma" ? [] : dados.getAll("porta"),
    };
  }

  function errosDoPortalVm(v) {
    const erros = [];
    if (!v.nome) erros.push("O nome da máquina virtual é obrigatório.");
    else if (!NOME_VM.test(v.nome)) erros.push("O nome da máquina virtual só aceita letras, números e hífen, sem começar ou terminar com hífen.");
    else if (estado.vms.some((x) => x.nome === v.nome)) erros.push(`Já existe uma máquina virtual chamada ${v.nome}.`);
    if (!v.usuario) erros.push("O nome de usuário é obrigatório.");
    return erros;
  }

  function conferenciaMissaoVm(v) {
    // devolve [missão, motivos] para a missão que esta VM tenta cumprir
    if (v.nome === "vm-atelie-teste") {
      const motivos = [];
      if (v.grupo !== "rg-atelie") motivos.push("A VM de testes também fica no grupo rg-atelie.");
      if (v.tamanho !== "Standard_B1s") motivos.push("Para testes, a menor serve: Standard_B1s. Máquina maior é conta maior.");
      return [3, motivos];
    }
    const motivos = [];
    if (v.nome !== "vm-atelie-site") motivos.push("O nome pedido é vm-atelie-site.");
    if (v.grupo !== "rg-atelie") motivos.push("A VM vai no grupo de recursos rg-atelie.");
    if (v.regiao !== "Brazil South") motivos.push("Os dados dos clientes do Ateliê ficam no Brasil, perto deles e da LGPD: região Brazil South.");
    if (!/^Ubuntu/.test(v.imagem)) motivos.push("O site do Ateliê roda em Linux: escolha o Ubuntu Server.");
    if (v.tamanho !== "Standard_B2s") motivos.push("O tamanho certo para a loja é o Standard_B2s (2 vCPU, 4 GiB). Maior que isso é pagar por máquina parada.");
    if (v.disco !== "SSD Standard") motivos.push("Para a loja, o disco SSD Standard basta e custa menos que o Premium.");
    if (v.autenticacao !== "Chave pública SSH") motivos.push("Use a chave pública SSH no lugar da senha: é mais segura.");
    const abertas = [...v.portas].sort().join(",");
    if (abertas !== ["443", "80"].sort().join(",")) motivos.push("Para a internet, só as portas do site: HTTP (80) e HTTPS (443). SSH e RDP abertos para todo mundo são porta de entrada para ataque.");
    return [2, motivos];
  }

  function prepararFormVm() {
    const form = tela.querySelector('[data-form="vm"]');
    const abas = form.querySelectorAll("[data-aba]");
    const criar = form.querySelector("[data-criar]");
    const revisar = form.querySelector('[data-acao="revisar"]');

    function mostrar(aba) {
      abas.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === aba)));
      form.querySelectorAll("[data-painel]").forEach((p) => { p.hidden = p.dataset.painel !== aba; });
      const naRevisao = aba === "revisar";
      criar.hidden = !naRevisao;
      revisar.hidden = naRevisao;
      if (naRevisao) montarRevisao(form);
    }

    function atualizarCampos() {
      const senha = form.querySelector('input[name="autenticacao"]:checked').value === "Senha";
      form.querySelector("[data-nota-senha]").hidden = !senha;
      const nenhuma = form.querySelector('input[name="publicas"]:checked').value === "nenhuma";
      form.querySelector("[data-portas]").hidden = nenhuma;
    }

    abas.forEach((b) => b.addEventListener("click", () => mostrar(b.dataset.aba)));
    revisar.addEventListener("click", () => mostrar("revisar"));
    form.addEventListener("change", atualizarCampos);
    atualizarCampos();
  }

  function montarRevisao(form) {
    const v = lerVm(form);
    const erros = errosDoPortalVm(v);
    const [, motivos] = conferenciaMissaoVm(v);
    const caixa = form.querySelector("[data-revisao]");
    const t = tamanho(v.tamanho);
    caixa.innerHTML = `
      <p class="${erros.length ? "sim-erro" : "sim-ok"}">${erros.length ? "✘ Falha na validação. Corrija os campos abaixo." : "✔ Validação aprovada"}</p>
      ${erros.length ? `<ul class="sim-erros">${erros.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
      <dl class="sim-detalhes">
        <dt>Grupo de recursos</dt><dd>${esc(v.grupo)}</dd>
        <dt>Nome</dt><dd>${esc(v.nome || "(vazio)")}</dd>
        <dt>Região</dt><dd>${esc(v.regiao)}</dd>
        <dt>Imagem</dt><dd>${esc(v.imagem)}</dd>
        <dt>Tamanho</dt><dd>${esc(v.tamanho)} · custo ${t.custo}</dd>
        <dt>Disco do SO</dt><dd>${esc(v.disco)}</dd>
        <dt>Autenticação</dt><dd>${esc(v.autenticacao)}</dd>
        <dt>Portas abertas</dt><dd>${v.portas.length ? v.portas.map((p) => PORTAS.find((x) => x.id === p).nome).join(", ") : "nenhuma"}</dd>
      </dl>
      <div class="sim-conferencia">
        <strong>Conferência da missão</strong>
        ${motivos.length ? `<ul>${motivos.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : "<p>✔ Tudo como o Ateliê pediu.</p>"}
      </div>`;
    form.querySelector("[data-criar]").disabled = erros.length > 0;
  }

  // ---------- ações ----------
  function criarGrupo(form) {
    const nome = String(form.nome.value || "").trim();
    const regiao = form.regiao.value;
    const erro = form.querySelector("[data-erro]");
    let mensagem = "";
    if (!nome) mensagem = "O nome do grupo de recursos é obrigatório.";
    else if (!NOME_GRUPO.test(nome) || nome.endsWith(".")) mensagem = "O nome só aceita letras, números, sublinhado, hífen, ponto e parênteses, sem terminar em ponto.";
    else if (estado.grupos.some((g) => g.nome.toLowerCase() === nome.toLowerCase())) mensagem = `Já existe um grupo de recursos chamado ${nome}.`;
    if (mensagem) {
      erro.textContent = mensagem;
      erro.hidden = false;
      return;
    }
    estado.grupos.push({ nome: nome, regiao: regiao });
    salvar();
    avisar(`Grupo de recursos ${nome} criado.`);
    if (!estado.missoes[1].feita) {
      const motivos = [];
      if (nome !== "rg-atelie") motivos.push("O nome pedido é rg-atelie.");
      if (regiao !== "Brazil South") motivos.push("A região pedida é Brazil South, perto dos clientes do Ateliê.");
      if (motivos.length) errouMissao(1, motivos); else cumpriuMissao(1);
    }
    desenharMissoes();
    ir("grupos");
  }

  function criarVm(form) {
    const v = lerVm(form);
    if (errosDoPortalVm(v).length) return;
    const [missao, motivos] = conferenciaMissaoVm(v);
    form.querySelector("[data-criar]").disabled = true;
    tela.innerHTML = `${cabecalho("Implantação em andamento")}<p class="sim-nota">Criando ${esc(v.nome)}: rede virtual, IP público, disco e máquina virtual...</p>`;
    setTimeout(() => {
      estado.vms.push(Object.assign(v, { estado: "Em execução" }));
      salvar();
      tela.innerHTML = `${cabecalho("Sua implantação foi concluída")}
        <p class="sim-ok">✔ A máquina virtual ${esc(v.nome)} está em execução.</p>
        <div class="sim-barra-acoes"><button type="button" class="sim-botao primario" data-vm="${esc(v.nome)}">Ir para o recurso</button></div>`;
      avisar(`Implantação de ${v.nome} concluída.`);
      // a VM criada fora do pedido continua existindo: para tentar de novo, o aluno exclui e cria outra
      const deNovo = `Para tentar de novo, abra a ${v.nome}, clique em 🗑 Excluir e crie outra.`;
      if (missao === 2 && !estado.missoes[2].feita) {
        if (motivos.length) errouMissao(2, motivos.concat(deNovo)); else cumpriuMissao(2);
      }
      if (missao === 3 && motivos.length) errouMissao(3, motivos.concat(deNovo));
      desenharMissoes();
    }, 1200);
  }

  function acaoNaVm(acao, nome) {
    const v = estado.vms.find((x) => x.nome === nome);
    if (!v) return;
    if (acao === "parar") {
      v.estado = "Parada (desalocada)";
      if (nome === "vm-atelie-teste") estado.testeParada = true;
      avisar(`${nome} parada. A computação deixa de ser cobrada; o disco continua.`);
    }
    if (acao === "iniciar") {
      v.estado = "Em execução";
      avisar(`${nome} em execução.`);
    }
    if (acao === "excluir") {
      if (!window.confirm(`Excluir ${nome}? No portal de verdade, isto não tem volta.`)) return;
      estado.vms = estado.vms.filter((x) => x.nome !== nome);
      avisar(`${nome} excluída, com o disco.`);
      conferirMissao3(nome, v);
      salvar();
      desenharMissoes();
      ir("vms");
      return;
    }
    salvar();
    ir("vm", nome);
  }

  function conferirMissao3(nome, v) {
    if (nome === "vm-atelie-site") {
      // antes da missão 2, excluir é o jeito de tentar de novo; depois dela, é derrubar a loja
      dica(estado.missoes[2].feita
        ? "<strong>Cuidado:</strong> você excluiu a máquina do site do Ateliê! A loja saiu do ar. Para a missão 3, a vm-atelie-site tem que continuar existindo: crie de novo."
        : "Máquina excluída. Agora crie a vm-atelie-site de novo, do jeito que o Ateliê pediu.");
      return;
    }
    if (nome !== "vm-atelie-teste" || estado.missoes[3].feita) return;
    const motivos = [];
    if (!estado.testeParada) motivos.push("Antes de excluir, pare a máquina e veja em Gerenciamento de Custos o que muda na conta.");
    if (v.tamanho !== "Standard_B1s") motivos.push("A VM de testes deveria ser a menor: Standard_B1s.");
    if (!estado.vms.some((x) => x.nome === "vm-atelie-site")) motivos.push("A vm-atelie-site tem que continuar no ar.");
    estado.testeParada = false;
    if (motivos.length) errouMissao(3, motivos); else cumpriuMissao(3);
  }

  // ---------- eventos ----------
  document.addEventListener("click", (evento) => {
    const alvo = evento.target.closest("[data-ir], [data-vm], [data-acao]");
    if (!alvo || !alvo.closest(".sim-portal")) return;
    if (alvo.dataset.ir) return ir(alvo.dataset.ir);
    if (alvo.dataset.vm) return ir("vm", alvo.dataset.vm);
    const acao = alvo.dataset.acao;
    if (acao === "indisponivel") return avisar("Este recurso entra nas missões da Unidade 2.");
    if (["parar", "iniciar", "excluir"].includes(acao)) return acaoNaVm(acao, alvo.dataset.alvo);
  });

  tela.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const form = evento.target;
    if (form.dataset.form === "grupo") criarGrupo(form);
    if (form.dataset.form === "vm") criarVm(form);
  });

  hamburguer.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    hamburguer.setAttribute("aria-expanded", String(aberto));
  });

  document.getElementById("sim-busca").addEventListener("input", (evento) => {
    const termo = evento.target.value.trim().toLowerCase();
    if (!termo) return ir("inicio");
    const achados = SERVICOS.filter((s) => s.nome.toLowerCase().includes(termo));
    const recursos = [...estado.grupos.map((g) => g.nome), ...estado.vms.map((v) => v.nome)].filter((n) => n.toLowerCase().includes(termo));
    tela.innerHTML = `${cabecalho(`Resultados para "${termo}"`)}
      <h3 class="sim-sub">Serviços</h3>
      ${achados.length ? `<div class="sim-servicos">${achados.map((s) => `<button type="button" data-ir="${s.id}"><span aria-hidden="true">${s.icone}</span>${esc(s.nome)}</button>`).join("")}</div>` : `<p class="sim-vazio">Nenhum serviço encontrado.</p>`}
      <h3 class="sim-sub">Recursos</h3>
      ${recursos.length ? `<ul>${recursos.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : `<p class="sim-vazio">Nenhum recurso encontrado.</p>`}`;
  });

  document.getElementById("sim-recomecar").addEventListener("click", () => {
    if (!window.confirm("Recomeçar o simulador? Os recursos e as missões voltam ao zero.")) return;
    estado = estadoInicial();
    salvar();
    dica("");
    desenharMissoes();
    ir("inicio");
  });

  desenharMissoes();
  ir("inicio");
  // ao entrar com o e-mail da faculdade, traz as missões da conta e registra o que ficou pendente
  if (window.CONTA && CONTA.aoMudar) {
    // o conta.js avisa também quando ninguém entrou: aí não há o que trazer nem registrar
    CONTA.aoMudar(async () => {
      if (!logado()) return;
      await trazerDaConta();
      guardarNaConta();
      if (MISSOES.every((m) => estado.missoes[m.id].feita) && !estado.registrado) registrarResultado();
    });
  }
})();
