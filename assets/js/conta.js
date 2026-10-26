/* ===================================================================
   conta.js: login dos alunos nos sites das disciplinas · versão 5 · 2026-10-21 (progresso dos checklists na conta; ranking das atividades)
   (cópia comum às disciplinas; o dos preparatórios é outro, em js/conta.js de lá)

   O site continua aberto para todo mundo. Para REGISTRAR o resultado de um quiz
   ou de uma atividade, o aluno entra com o e-mail da faculdade (@edu.df.senac.br).
   O resultado vai para o Supabase (tabelas disc_..., SQL em
   Placa-Mae/supabase/tabelas-disciplinas.sql) e o Placa-Mãe da professora busca de lá.
   O login é o mesmo em todos os sites (estão no mesmo endereço) e nos preparatórios.

   Uso numa atividade:
     const registro = await CONTA.registrarTentativa({
       atividade: "pyquiz", titulo: "PyQuiz", acertos: 8, total: 10, duracao_seg: 312, detalhes: {...}
     });
     // registro = { codigo: "A1B2C3D4", feito_em: "2026-10-14T..." } ou null (não entrou / deu erro)

   Progresso dos checklists das aulas (versão 4; SQL em Placa-Mae/supabase/progresso-disciplinas.sql):
     const salvo = await CONTA.carregarProgresso();          // { "aulas/aula-11.html|passos-aula-11": [0, 2], ... } ou null
     CONTA.salvarProgresso("aulas/aula-11.html", "passos-aula-11", [0, 2], 6);
   O aulas.js usa as duas sozinho: quem entra com o e-mail da faculdade guarda o checklist na conta.

   Ranking de uma atividade (versão 5; função disc_ranking, SQL em Placa-Mae/supabase/ranking-disciplinas.sql):
     const linhas = await CONTA.ranking("uti-da-nuvem");   // [{ posicao, nome, equipe, pontos, eu }] ou null

   A disciplina vem do atributo data-disciplina do <script> (ou da primeira pasta do endereço).
   A chave abaixo é a PÚBLICA (publishable): a segurança está nas regras do banco (RLS).
   Nunca coloque aqui a chave secreta (service_role).
   =================================================================== */

const CONTA_URL = "https://isnmqovwcmwrzbafpknp.supabase.co";
const CONTA_CHAVE = "sb_publishable_p7CqrA9dQNM9JqjAJm3TKg_jKcvQ2Vp";
const CONTA_DOMINIO = "@edu.df.senac.br";

window.CONTA = (function () {
  const script = document.currentScript;
  const DISCIPLINA = (script && script.dataset.disciplina) || location.pathname.split("/").filter(Boolean)[0] || "";
  const nuvem = window.supabase ? window.supabase.createClient(CONTA_URL, CONTA_CHAVE) : null;
  let usuario = null;
  let cadastro = null; // promessa do cadastro em disc_alunos (feito uma vez por login)
  let nomeConta = ""; // o nome do aluno (da conta, do cadastro das disciplinas ou do dos preparatórios)
  let esperandoLogin = null; // quem está esperando o aluno entrar para registrar um resultado
  let desistiu = null; // avisa a atividade quando o aluno fecha a janela sem entrar
  const avisos = [];

  const emailDaFaculdade = (email) => String(email || "").trim().toLowerCase().endsWith(CONTA_DOMINIO);
  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  // nome bonito: "MARIA DA SILVA" e "maria da silva" viram "Maria da Silva"
  // (as ligações da, de, do, das, dos e "e" ficam minúsculas; "ana-paula" vira "Ana-Paula")
  const LIGACOES = ["da", "de", "do", "das", "dos", "e"];
  function formatarNome(nome) {
    return String(nome || "")
      .trim()
      .toLocaleLowerCase("pt-BR")
      .split(/\s+/)
      .filter(Boolean)
      .map((palavra, i) =>
        i > 0 && LIGACOES.includes(palavra)
          ? palavra
          : palavra.split("-").map((parte) => parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1)).join("-")
      )
      .join(" ");
  }

  // "nome" que é só o começo do e-mail (ex.: maristela33781197) não vale como nome
  const nomeValido = (nome, u) => {
    const limpo = String(nome || "").trim();
    return limpo.length >= 2 && !(u && u.email && limpo.toLowerCase() === u.email.split("@")[0].toLowerCase());
  };
  const primeiroNome = () => nomeConta.split(/\s+/)[0];

  // procura o nome: na conta, no cadastro das disciplinas e no dos preparatórios (só lê, não muda nada)
  async function descobrirNome(u) {
    const daConta = u.user_metadata && u.user_metadata.nome;
    if (nomeValido(daConta, u)) return formatarNome(daConta);
    for (const tabela of ["disc_alunos", "prep_alunos"]) {
      const { data } = await nuvem.from(tabela).select("nome").eq("id", u.id).maybeSingle();
      if (data && nomeValido(data.nome, u)) return formatarNome(data.nome);
    }
    return "";
  }

  // o aluno informou o nome: guarda na conta e no cadastro das disciplinas
  async function salvarNome(nome) {
    nomeConta = formatarNome(nome);
    await nuvem.auth.updateUser({ data: { nome: nomeConta } });
    if (emailDaFaculdade(usuario.email)) {
      await nuvem.from("disc_alunos").upsert({ id: usuario.id, nome: nomeConta, email: usuario.email.toLowerCase() });
    }
    atualizarBotao();
  }

  // quem quiser saber quando a pessoa entra ou sai
  function aoMudar(funcao) {
    avisos.push(funcao);
    if (usuario) funcao(usuario);
  }

  // mensagens do Supabase (em inglês) traduzidas para o aluno
  function explicarErro(error, aba) {
    const texto = (error && error.message ? error.message : "").toLowerCase();
    const codigo = error && error.code ? error.code : "";
    if (codigo === "email_not_confirmed" || texto.includes("not confirmed")) {
      return "Falta confirmar o seu e-mail: abra o link que enviamos (confira também o spam) e tente de novo.";
    }
    if (texto.includes("already registered") || codigo === "user_already_exists") {
      return "Este e-mail já tem conta. Use a aba Já tenho conta.";
    }
    if (texto.includes("rate limit") || codigo === "over_email_send_rate_limit") {
      return "Muitas contas criadas agora há pouco. Espere alguns minutos e tente de novo.";
    }
    if (texto.includes("password")) {
      return "A senha precisa ter pelo menos 6 letras ou números.";
    }
    if (aba === "entrar") {
      return "E-mail ou senha não conferem. Ainda não tem conta? Use a aba Criar conta.";
    }
    return "Não deu para criar a conta agora. Confira o e-mail e tente de novo.";
  }

  // cadastro do aluno nas disciplinas (uma vez por login; só com o e-mail da faculdade).
  // Só cria quando ainda não existe: um nome corrigido no cadastro nunca é regravado por cima.
  function garantirCadastro() {
    if (!usuario || !emailDaFaculdade(usuario.email)) return Promise.resolve(false);
    if (!cadastro) {
      const u = usuario;
      cadastro = descobrirNome(u).then((nome) => {
        nomeConta = nome;
        atualizarBotao();
        return nuvem
          .from("disc_alunos")
          .upsert(
            { id: u.id, nome: nome || u.email.split("@")[0], email: u.email.toLowerCase() },
            { onConflict: "id", ignoreDuplicates: true }
          )
          .then(({ error }) => !error);
      });
    }
    return cadastro;
  }

  function mudou(u) {
    usuario = u;
    cadastro = null;
    nomeConta = "";
    atualizarBotao();
    if (u && emailDaFaculdade(u.email)) garantirCadastro();
    else if (u) descobrirNome(u).then((nome) => { nomeConta = nome; atualizarBotao(); });
    aplicarBloqueios();
    avisos.forEach((funcao) => funcao(u));
    if (u && emailDaFaculdade(u.email) && esperandoLogin) {
      const continuar = esperandoLogin;
      esperandoLogin = null;
      desistiu = null;
      continuar();
    }
  }

  /* ---------- áreas que só funcionam com login ----------
     Marque a área da atividade com data-exige-login: sem o login da faculdade, ela fica bloqueada
     (atributo inert: não dá para clicar nem digitar) e aparece um aviso com o botão Entrar.
     data-exige-login="sem-aviso" bloqueia sem repetir o aviso (quando já há um mais acima). */
  function aplicarBloqueios() {
    const liberado = Boolean(usuario && emailDaFaculdade(usuario.email));
    document.querySelectorAll("[data-exige-login]").forEach((area) => {
      if (area.dataset.exigeLogin !== "sem-aviso") {
        let aviso = area.previousElementSibling;
        if (!aviso || !aviso.classList.contains("aviso-login")) {
          aviso = document.createElement("div");
          aviso.className = "aviso-login";
          aviso.setAttribute("role", "status");
          aviso.innerHTML = `<p><strong>Esta atividade vale nota.</strong> Entre com o e-mail da faculdade
            (${CONTA_DOMINIO}) para começar: o resultado fica registrado para a professora.</p>
            <button type="button">Entrar</button>`;
          aviso.querySelector("button").addEventListener("click", () => abrir("Entre com o seu e-mail da faculdade para começar a atividade."));
          area.parentNode.insertBefore(aviso, area);
        }
        aviso.hidden = liberado;
      }
      area.classList.toggle("bloqueado-login", !liberado);
      area.inert = !liberado;
    });
  }

  /* ---------- o que as atividades usam ---------- */

  async function gravar(dados) {
    if (!(await garantirCadastro())) return null;
    const { data, error } = await nuvem
      .from("disc_tentativas")
      .insert({
        disciplina: DISCIPLINA,
        atividade: dados.atividade,
        titulo: dados.titulo || null,
        acertos: dados.acertos,
        total: dados.total,
        duracao_seg: dados.duracao_seg == null ? null : Math.max(0, Math.round(dados.duracao_seg)),
        detalhes: dados.detalhes || null,
      })
      .select("codigo, feito_em")
      .single();
    return error ? null : data;
  }

  /* ---------- progresso dos checklists (disc_progresso) ---------- */

  // todo o progresso do aluno nesta disciplina, por "pagina|lista"; null se não entrou ou deu erro
  async function carregarProgresso() {
    if (!nuvem || !usuario || !emailDaFaculdade(usuario.email)) return null;
    const { data, error } = await nuvem
      .from("disc_progresso")
      .select("pagina, lista, marcadas")
      .eq("aluno_id", usuario.id)
      .eq("disciplina", DISCIPLINA);
    if (error) return null;
    const salvo = {};
    data.forEach((linha) => {
      salvo[linha.pagina + "|" + linha.lista] = linha.marcadas || [];
    });
    return salvo;
  }

  // grava os itens marcados de um checklist (só com o login da faculdade); devolve true se gravou
  async function salvarProgresso(pagina, lista, marcadas, total) {
    if (!nuvem || !usuario || !emailDaFaculdade(usuario.email)) return false;
    if (!(await garantirCadastro())) return false;
    const { error } = await nuvem.from("disc_progresso").upsert({
      aluno_id: usuario.id,
      disciplina: DISCIPLINA,
      pagina: pagina,
      lista: lista,
      marcadas: marcadas,
      total: total,
      atualizado_em: new Date().toISOString(),
    });
    return !error;
  }

  // o ranking de uma atividade nesta disciplina (a melhor pontuação de cada aluno); null se não entrou ou deu erro
  async function ranking(atividade) {
    if (!nuvem || !usuario || !emailDaFaculdade(usuario.email)) return null;
    const { data, error } = await nuvem.rpc("disc_ranking", { p_disciplina: DISCIPLINA, p_atividade: atividade });
    return error ? null : data;
  }

  // registra o resultado; se o aluno ainda não entrou, abre a janela e espera o login
  function registrarTentativa(dados) {
    if (!nuvem) return Promise.resolve(null);
    if (usuario && emailDaFaculdade(usuario.email)) return gravar(dados);
    return new Promise((resolve) => {
      esperandoLogin = () => gravar(dados).then(resolve);
      desistiu = () => resolve(null);
      abrir("Entre com o seu e-mail da faculdade para registrar este resultado.");
    });
  }

  // a janela fechou: se o aluno não entrou, o resultado não foi registrado
  // (espera um pouco: ao entrar, a janela fecha antes de o Supabase avisar do login)
  function conferirFechamento() {
    setTimeout(() => {
      if (esperandoLogin && !janela.open) {
        esperandoLogin = null;
        if (desistiu) desistiu();
        desistiu = null;
      }
    }, 1500);
  }

  /* ---------- botão na barra e janela de login ---------- */

  const botao = document.createElement("button");
  botao.type = "button";
  botao.id = "btn-conta";
  botao.setAttribute("aria-haspopup", "dialog");
  botao.textContent = "Entrar";

  function atualizarBotao() {
    botao.textContent = !usuario ? "Entrar" : nomeConta ? "Olá, " + primeiroNome() : "Olá!";
    botao.title = usuario ? "Conectado como " + (nomeConta || usuario.email) : "Entrar com o e-mail da faculdade para salvar o progresso e registrar os resultados";
  }

  const janela = document.createElement("dialog");
  janela.className = "conta-janela";
  janela.setAttribute("aria-labelledby", "conta-titulo");

  function desenharJanela(aviso) {
    if (usuario && emailDaFaculdade(usuario.email)) {
      janela.innerHTML = `
        <h2 id="conta-titulo">${nomeConta ? "Olá, " + escapar(primeiroNome()) + "!" : "Sua conta"}</h2>
        <p>Conectado como <strong>${escapar(nomeConta || "aluno(a)")}</strong> (${escapar(usuario.email)}). Os seus resultados nos quizzes e atividades estão sendo registrados.</p>
        ${nomeConta ? "" : `
        <form class="conta-form conta-nome" novalidate>
          <label>Como é o seu nome completo?<input name="nome" autocomplete="name" required></label>
          <p class="conta-msg" aria-live="polite"></p>
          <div class="conta-botoes"><button type="submit">Salvar o nome</button></div>
        </form>`}
        <div class="conta-botoes">
          <button type="button" data-acao="sair"${nomeConta ? "" : ' class="sec"'}>Sair</button>
          <button type="button" data-acao="fechar" class="sec">Fechar</button>
        </div>`;
      const formNome = janela.querySelector(".conta-nome");
      if (formNome) {
        formNome.addEventListener("submit", async (ev) => {
          ev.preventDefault();
          const nome = formNome.nome.value.trim();
          if (nome.split(/\s+/).length < 2) {
            formNome.querySelector(".conta-msg").textContent = "Digite o nome e o sobrenome.";
            return;
          }
          formNome.querySelector(".conta-msg").textContent = "Um instante…";
          await salvarNome(nome);
          desenharJanela();
        });
      }
      return;
    }
    if (usuario) {
      // conta de um preparatório, com e-mail pessoal: aqui não serve
      janela.innerHTML = `
        <h2 id="conta-titulo">Use o e-mail da faculdade</h2>
        <p>Você entrou com <strong>${escapar(usuario.email)}</strong>. Nas disciplinas, os resultados só são registrados com o e-mail da faculdade (<strong>${CONTA_DOMINIO}</strong>).</p>
        <div class="conta-botoes">
          <button type="button" data-acao="trocar">Sair e entrar com o e-mail da faculdade</button>
          <button type="button" data-acao="fechar" class="sec">Fechar</button>
        </div>`;
      return;
    }
    janela.innerHTML = `
      <h2 id="conta-titulo">Entrar</h2>
      <p class="conta-explica">${escapar(aviso || "O site funciona sem login. Entrando, o progresso das aulas fica salvo na sua conta (em qualquer computador) e os resultados dos quizzes e atividades ficam registrados para a professora.")}
        Use o e-mail da faculdade (<strong>${CONTA_DOMINIO}</strong>).</p>
      <div class="conta-abas" role="tablist">
        <button type="button" role="tab" aria-selected="true" data-aba="entrar">Já tenho conta</button>
        <button type="button" role="tab" aria-selected="false" data-aba="criar">Criar conta</button>
      </div>
      <form class="conta-form" novalidate>
        <label class="so-criar" hidden>Nome completo<input name="nome" autocomplete="name"></label>
        <label>E-mail da faculdade<input name="email" type="email" autocomplete="email" placeholder="seu.nome${CONTA_DOMINIO}" required></label>
        <label>Senha<input name="senha" type="password" autocomplete="current-password" minlength="6" required></label>
        <p class="conta-msg" aria-live="polite"></p>
        <div class="conta-botoes">
          <button type="submit">Entrar</button>
          <button type="button" data-acao="fechar" class="sec">Cancelar</button>
        </div>
        <p class="conta-lgpd">Guardamos só o seu nome, o e-mail, os itens marcados nas aulas e os resultados das
          atividades, para a professora acompanhar a turma e lançar as notas. Nada é compartilhado.</p>
      </form>`;
    let aba = "entrar";
    const form = janela.querySelector("form");
    const msg = janela.querySelector(".conta-msg");
    janela.querySelectorAll("[data-aba]").forEach((b) => {
      b.addEventListener("click", () => {
        aba = b.dataset.aba;
        janela.querySelectorAll("[data-aba]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        janela.querySelector(".so-criar").hidden = aba !== "criar";
        form.querySelector('button[type="submit"]').textContent = aba === "criar" ? "Criar conta" : "Entrar";
        form.senha.autocomplete = aba === "criar" ? "new-password" : "current-password";
        msg.textContent = "";
      });
    });
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = form.email.value.trim().toLowerCase();
      const senha = form.senha.value;
      const nome = formatarNome(form.nome.value);
      if (!email || senha.length < 6 || (aba === "criar" && nome.split(/\s+/).length < 2)) {
        msg.textContent = aba === "criar" ? "Preencha o nome completo, o e-mail e uma senha de pelo menos 6 letras ou números." : "Preencha o e-mail e a senha.";
        return;
      }
      if (!emailDaFaculdade(email)) {
        msg.textContent = "Use o e-mail da faculdade, que termina com " + CONTA_DOMINIO + ".";
        return;
      }
      msg.textContent = "Um instante…";
      if (aba === "criar") {
        // o link de confirmação do e-mail (se estiver ligado no Supabase) volta para esta página
        const voltarPara = location.origin + location.pathname.replace(/[^/]*$/, "");
        const { data, error } = await nuvem.auth.signUp({ email: email, password: senha, options: { data: { nome: nome }, emailRedirectTo: voltarPara } });
        if (error) {
          msg.textContent = explicarErro(error, "criar");
        } else if (!data.session) {
          msg.textContent = "Conta criada! Confira o seu e-mail e clique no link de confirmação. Depois, entre aqui.";
        } else {
          janela.close();
        }
      } else {
        const { error } = await nuvem.auth.signInWithPassword({ email: email, password: senha });
        if (error) {
          msg.textContent = explicarErro(error, "entrar");
        } else {
          janela.close();
        }
      }
    });
  }

  function abrir(aviso) {
    desenharJanela(aviso);
    if (!janela.open) janela.showModal();
  }

  // não depende só do evento "close" (alguns navegadores só o mandam ao redesenhar a tela)
  janela.addEventListener("close", conferirFechamento);
  janela.addEventListener("cancel", conferirFechamento);

  janela.addEventListener("click", async (ev) => {
    const acao = ev.target.dataset && ev.target.dataset.acao;
    if (acao === "fechar") {
      janela.close();
      conferirFechamento();
    }
    if (acao === "sair") {
      await nuvem.auth.signOut();
      janela.close();
      conferirFechamento();
    }
    if (acao === "trocar") {
      await nuvem.auth.signOut();
      desenharJanela();
    }
  });

  botao.addEventListener("click", () => abrir());

  // o botão vai para o lugar marcado com data-conta-lugar, ou para a barra, antes do link da Stela
  const lugar = document.querySelector("[data-conta-lugar]");
  const ajustes = document.querySelector(".barra .ajustes");
  if (nuvem && (lugar || ajustes)) {
    if (lugar) lugar.appendChild(botao);
    else ajustes.insertBefore(botao, ajustes.querySelector(".marca"));
    document.body.appendChild(janela);
    nuvem.auth.getSession().then(({ data }) => mudou(data.session ? data.session.user : null));
    nuvem.auth.onAuthStateChange((evento, sessao) => {
      const u = sessao ? sessao.user : null;
      if ((u && u.id) !== (usuario && usuario.id)) mudou(u);
    });
  }

  return {
    aoMudar,
    abrir,
    registrarTentativa,
    carregarProgresso,
    salvarProgresso,
    ranking,
    disciplina: DISCIPLINA,
    usuario: () => usuario,
    nome: () => nomeConta,
    formatarNome,
    daFaculdade: () => Boolean(usuario && emailDaFaculdade(usuario.email)),
  };
})();
