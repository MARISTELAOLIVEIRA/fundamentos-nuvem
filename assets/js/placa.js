/* placa.js: comportamento comum a todos os sites.
   versão 7 · 2026-10-06 (cada site tem a sua cópia; mantenha igual ao estilo.css)

   Carregue no <head>, ANTES do CSS e SEM "defer":
     <script src="assets/js/placa.js"></script>
   Assim o tema, o tamanho do texto e a pausa são aplicados antes de a página
   aparecer (nada pisca). Os botões são ligados quando a página termina de carregar.

   O que ele faz:
   - #btn-tema: escuro (padrão) ↔ claro
   - #btn-fonte: tamanho do texto (normal → maior → bem maior → normal)
   - #btn-movimento: pausar/ativar animações (sem escolha salva, segue o "reduzir movimento" do sistema)
   - #btn-menu: abre e fecha o menu no celular (aria-controls aponta para o id do <nav>)
   - [data-revela]: o elemento aparece suavemente ao entrar na tela
   - .luz: card com uma luz que segue o mouse

   As escolhas ficam salvas no navegador (placa:tema, placa:fonte, placa:pausado)
   e valem para todos os sites, porque todos estão no mesmo endereço.

   Páginas com animação própria podem escutar os avisos:
     document.addEventListener('placa:movimento', function(e){ e.detail.pausado })
     document.addEventListener('placa:tema', function(e){ e.detail.tema })   // 'claro' ou 'escuro'
     document.addEventListener('placa:fonte', function(){ ... })
   ou perguntar a qualquer momento: document.documentElement.classList.contains('pausado') */
(function(){
  var raiz=document.documentElement;
  function ler(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function gravar(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function avisa(nome,detalhe){document.dispatchEvent(new CustomEvent(nome,{detail:detalhe||{}}))}
  function pausado(){return raiz.classList.contains('pausado')}

  // ---- preferências aplicadas já, antes de a página aparecer ----
  raiz.classList.add('js');
  if(ler('placa:tema')==='claro')raiz.dataset.tema='claro';
  var niveis=['','fonte-1','fonte-2'], nivel=+(ler('placa:fonte')||0)%3;
  if(niveis[nivel])raiz.classList.add(niveis[nivel]);
  var escolha=ler('placa:pausado'), reduz=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(escolha==='1'||(escolha===null&&reduz))raiz.classList.add('pausado');

  function liga(){
    // tema
    var bt=document.getElementById('btn-tema');
    function rotuloTema(){if(bt)bt.setAttribute('aria-label',raiz.dataset.tema==='claro'?'Mudar para o tema escuro':'Mudar para o tema claro')}
    rotuloTema();
    if(bt)bt.addEventListener('click',function(){
      var claro=raiz.dataset.tema!=='claro';
      if(claro)raiz.dataset.tema='claro'; else delete raiz.dataset.tema;
      gravar('placa:tema',claro?'claro':'escuro'); rotuloTema(); avisa('placa:tema',{tema:claro?'claro':'escuro'});
    });

    // tamanho do texto
    var bf=document.getElementById('btn-fonte');
    function aplicaFonte(){
      niveis.forEach(function(c){if(c)raiz.classList.remove(c)}); if(niveis[nivel])raiz.classList.add(niveis[nivel]);
      if(!bf)return; bf.textContent=nivel===2?'A':'A+';
      bf.setAttribute('aria-label',nivel===2?'Voltar o texto ao tamanho normal':'Aumentar o tamanho do texto');
    }
    aplicaFonte();
    if(bf)bf.addEventListener('click',function(){nivel=(nivel+1)%3; gravar('placa:fonte',nivel); aplicaFonte(); avisa('placa:fonte')});

    // animações
    var bm=document.getElementById('btn-movimento'), rot=bm&&(bm.querySelector('.rotulo')||bm);
    function aplicaMov(){if(!bm)return; bm.setAttribute('aria-pressed',String(pausado())); rot.textContent=pausado()?'Ativar animações':'Pausar animações'}
    aplicaMov();
    if(bm)bm.addEventListener('click',function(){
      raiz.classList.toggle('pausado'); gravar('placa:pausado',pausado()?'1':'0'); aplicaMov();
      if(pausado())revelaTudo(); avisa('placa:movimento',{pausado:pausado()});
    });

    // menu no celular: fecha ao escolher uma seção ou ao apertar Esc
    var bmenu=document.getElementById('btn-menu'), nav=bmenu&&document.getElementById(bmenu.getAttribute('aria-controls'));
    if(bmenu&&nav){
      var abre=function(sim){nav.classList.toggle('aberto',sim); bmenu.setAttribute('aria-expanded',String(sim))};
      bmenu.addEventListener('click',function(){abre(!nav.classList.contains('aberto'))});
      nav.addEventListener('click',function(e){if(e.target.closest('a'))abre(false)});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('aberto')){abre(false); bmenu.focus()}});
    }

    // aparecer ao rolar
    var alvos=[].slice.call(document.querySelectorAll('[data-revela]'));
    function revelaTudo(){alvos.forEach(function(el){el.classList.add('visivel')})}
    if(pausado()||!('IntersectionObserver' in window))revelaTudo();
    else{
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visivel'); io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
      alvos.forEach(function(el){io.observe(el)});
    }

    // luz que segue o mouse nos cards .luz
    document.addEventListener('pointermove',function(e){
      var c=e.target.closest&&e.target.closest('.luz'); if(!c)return;
      var r=c.getBoundingClientRect(); c.style.setProperty('--mx',(e.clientX-r.left)+'px'); c.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',liga); else liga();
})();
