"use strict";
/* ============ Sincronização com o Supabase ============
   O app continua salvando tudo no aparelho (funciona offline).
   Com login e internet, este módulo:
   1. baixa o que mudou no banco desde a última vez (por alterado_em, hora do servidor);
   2. envia o que mudou no aparelho (comparando com a última versão sincronizada);
   3. em conflito, fica a alteração mais recente (atualizado_em, hora do aparelho).
   Excluir marca excluido = true, para os outros aparelhos também removerem. */
(function () {
  const cfg = window.FISIO_CONFIG || {};
  const configurado = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const KEY_META = "fisiomais:sync";
  const T_AT = "atendimentos", T_SV = "servicos";
  const LOTE = 500;

  let sb = null, sessao = null;
  let status = configurado ? "iniciando" : "local"; // local | sem-conta | iniciando | sincronizando | ok | offline | erro
  let erroMsg = "", rodando = false, deNovo = false, aplicando = false, timer = null, ultimaOk = null;
  let meta = lerMeta();

  function lerMeta() {
    try { const m = JSON.parse(localStorage.getItem(KEY_META)) || {}; m.snapA ||= {}; m.snapS ||= {}; return m; }
    catch (e) { return { snapA: {}, snapS: {} }; }
  }
  function salvarMeta() { try { localStorage.setItem(KEY_META, JSON.stringify(meta)); } catch (e) {} }
  const js = o => JSON.stringify(o);
  const tempo = s => { const t = Date.parse(s || ""); return isNaN(t) ? 0 : t; };

  /* ---------- O que falta enviar ---------- */
  function pendentes() {
    const meus = state.items.filter(a => !a.exemplo);
    const idsA = new Set(meus.map(a => a.id));
    const mudA = meus.filter(a => meta.snapA[a.id] !== js(a));
    const delA = Object.keys(meta.snapA).filter(id => !idsA.has(id));
    let mudS = [], delS = [];
    if (meta.servicosIniciados) {
      const idsS = new Set(SERVICOS.map(s => s.id));
      mudS = SERVICOS.filter(s => meta.snapS[s.id] !== js(s));
      delS = Object.keys(meta.snapS).filter(id => !idsS.has(id));
    }
    return { mudA, delA, mudS, delS, total: mudA.length + delA.length + mudS.length + delS.length };
  }

  /* ---------- Banco ---------- */
  async function baixar(tabela, cursorKey) {
    const linhas = [];
    for (;;) {
      let q = sb.from(tabela).select("id,dados,atualizado_em,alterado_em,excluido")
        .order("alterado_em", { ascending: true }).limit(LOTE);
      if (meta[cursorKey]) q = q.gt("alterado_em", meta[cursorKey]);
      const { data, error } = await q;
      if (error) throw error;
      linhas.push(...data);
      if (data.length) meta[cursorKey] = data[data.length - 1].alterado_em;
      if (data.length < LOTE) return linhas;
    }
  }
  async function enviar(tabela, linhas) {
    for (let i = 0; i < linhas.length; i += LOTE) {
      const { error } = await sb.from(tabela).upsert(linhas.slice(i, i + LOTE), { onConflict: "user_id,id" });
      if (error) throw error;
    }
  }

  // Aplica no aparelho o que veio do banco (lista = state.items ou SERVICOS)
  function aplicar(linhas, lista, snap) {
    let mudou = false;
    for (const r of linhas) {
      const i = lista.findIndex(x => x.id === r.id);
      const local = i >= 0 ? lista[i] : null;
      const pendenteAqui = local ? snap[r.id] !== js(local) : snap[r.id] !== undefined;
      // alteração do aparelho mais nova que a do banco: mantém e envia depois
      if (pendenteAqui && local && tempo(local.atualizadoEm) > tempo(r.atualizado_em)) continue;
      if (r.excluido) {
        if (i >= 0) { lista.splice(i, 1); mudou = true; }
        delete snap[r.id];
      } else {
        const obj = r.dados;
        if (i >= 0) lista[i] = obj; else lista.push(obj);
        snap[r.id] = js(obj);
        mudou = true;
      }
    }
    return mudou;
  }

  function linhasParaEnviar(mud, del, snap) {
    const agora = new Date().toISOString(), uidUser = sessao.user.id;
    const linhas = mud.map(x => {
      // garante que a hora de alteração avance quando o registro mudou
      const antes = snap[x.id] ? JSON.parse(snap[x.id]) : null;
      if (!x.atualizadoEm || (antes && antes.atualizadoEm === x.atualizadoEm)) x.atualizadoEm = agora;
      return { user_id: uidUser, id: x.id, dados: x, atualizado_em: x.atualizadoEm, excluido: false };
    });
    del.forEach(id => linhas.push({ user_id: uidUser, id, dados: {}, atualizado_em: agora, excluido: true }));
    return linhas;
  }

  /* ---------- Ciclo de sincronização ---------- */
  async function sincronizar() {
    if (!sb || !sessao) return;
    if (rodando) { deNovo = true; return; }
    if (!navigator.onLine) { definir("offline"); return; }
    rodando = true; definir("sincronizando");
    try {
      // tipos de atendimento: na primeira vez, o banco manda (se já tiver algo)
      if (!meta.servicosIniciados) {
        const remotos = (await baixar(T_SV, "cursorS")).filter(r => !r.excluido);
        if (remotos.length) {
          SERVICOS = remotos.map(r => r.dados);
          meta.snapS = Object.fromEntries(remotos.map(r => [r.id, js(r.dados)]));
        } else {
          SERVICOS.forEach(s => { s.atualizadoEm ||= new Date().toISOString(); });
          await enviar(T_SV, linhasParaEnviar(SERVICOS, [], {}));
          meta.snapS = Object.fromEntries(SERVICOS.map(s => [s.id, js(s)]));
        }
        meta.servicosIniciados = true;
        aplicando = true; salvarServicos(); aplicando = false;
        salvarMeta();
      }

      // 1. baixar
      const linA = await baixar(T_AT, "cursorA");
      const linS = await baixar(T_SV, "cursorS");
      const mudouA = aplicar(linA, state.items, meta.snapA);
      const mudouS = aplicar(linS, SERVICOS, meta.snapS);
      salvarMeta();

      // 2. enviar
      const p = pendentes();
      if (p.mudA.length || p.delA.length) {
        await enviar(T_AT, linhasParaEnviar(p.mudA, p.delA, meta.snapA));
        p.mudA.forEach(a => (meta.snapA[a.id] = js(a)));
        p.delA.forEach(id => delete meta.snapA[id]);
      }
      if (p.mudS.length || p.delS.length) {
        await enviar(T_SV, linhasParaEnviar(p.mudS, p.delS, meta.snapS));
        p.mudS.forEach(s => (meta.snapS[s.id] = js(s)));
        p.delS.forEach(id => delete meta.snapS[id]);
      }
      salvarMeta();

      // grava no aparelho e redesenha sem disparar outra sincronização
      aplicando = true;
      store.save();
      if (mudouS || p.mudS.length) salvarServicos();
      aplicando = false;
      if (mudouA || mudouS) render();

      ultimaOk = new Date(); erroMsg = "";
      definir("ok");
    } catch (e) {
      aplicando = false;
      if (!navigator.onLine || /fetch|network|Failed/i.test(e?.message || "")) definir("offline");
      else { erroMsg = traduzErro(e); definir("erro"); console.warn("Sincronização:", e); }
    } finally {
      rodando = false;
      if (deNovo) { deNovo = false; agendar(500); }
    }
  }

  function traduzErro(e) {
    const m = e?.message || String(e);
    if (/schema must be one of|Invalid schema/i.test(m)) return `O schema "${cfg.schema}" não está liberado na API do Supabase (Settings → Data API → Exposed schemas).`;
    if (/does not exist/i.test(m)) return "As tabelas não foram criadas. Rode o arquivo supabase/fisiomais.sql no SQL Editor.";
    if (/JWT|token|401/i.test(m)) return "A sessão expirou. Saia e entre de novo.";
    if (/permission denied|row-level security/i.test(m)) return "O banco recusou o acesso. Confira as regras do arquivo supabase/fisiomais.sql.";
    return m;
  }

  function agendar(ms = 1500) {
    if (aplicando || !sessao) { renderStatus(); return; }
    clearTimeout(timer);
    timer = setTimeout(sincronizar, ms);
    renderStatus();
  }

  /* ---------- Conta ---------- */
  async function entrar(ev) {
    ev.preventDefault();
    const email = $("l-email").value.trim(), senha = $("l-senha").value;
    const erro = $("loginErro");
    if (!email || !senha) { erro.textContent = "Informe e-mail e senha."; erro.hidden = false; return; }
    if (!navigator.onLine) { erro.textContent = "Sem internet. Para entrar pela primeira vez é preciso estar conectada."; erro.hidden = false; return; }
    const btn = $("btnEntrar"); btn.disabled = true; btn.textContent = "Entrando…"; erro.hidden = true;
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    btn.disabled = false; btn.textContent = "Entrar";
    if (error) {
      erro.textContent = /Invalid login/i.test(error.message) ? "E-mail ou senha incorretos." : /Email not confirmed/i.test(error.message) ? "Confirme o e-mail antes de entrar." : error.message;
      erro.hidden = false; return;
    }
    sessao = data.session; meta.semConta = false; salvarMeta();
    $("l-senha").value = "";
    $("sheetLogin").hidden = true; document.body.style.overflow = "";
    toast("Conectado. Sincronizando…");
    sincronizar();
  }

  function pedirLogin() {
    $("loginErro").hidden = true;
    $("sheetLogin").hidden = false; document.body.style.overflow = "hidden";
    setTimeout(() => $("l-email").focus(), 60);
  }

  let sairArmado = false;
  async function sair() {
    const b = $("btnSair");
    const pend = pendentes().total;
    if (!sairArmado) {
      sairArmado = true;
      b.classList.add("armed");
      b.textContent = pend ? `${pend} não enviados! Sair?` : "Toque de novo";
      setTimeout(() => { sairArmado = false; b.classList.remove("armed"); b.textContent = "Sair"; }, 4000);
      return;
    }
    try { await sb.auth.signOut(); } catch (e) {}
    try { ["fisiomais:v1", "fisiomais:servicos", KEY_META].forEach(k => localStorage.removeItem(k)); } catch (e) {}
    location.reload();
  }

  /* ---------- Interface ---------- */
  function definir(s) { status = s; renderStatus(); }

  function textoStatus() {
    const n = sessao ? pendentes().total : 0;
    switch (status) {
      case "sincronizando": return ["sync", "Sincronizando…"];
      case "offline": return ["off", n ? `Offline · ${n} para enviar` : "Offline · salvo no aparelho"];
      case "erro": return ["err", "Erro ao sincronizar"];
      case "ok": return n ? ["sync", `${n} para enviar`] : ["ok", "Sincronizado"];
      case "sem-conta": return ["off", "Só neste aparelho"];
      case "iniciando": return ["sync", "Conectando…"];
      default: return null;
    }
  }

  function renderStatus() {
    const el = $("syncSt"); if (!el) return;
    const t = textoStatus();
    if (!t) { el.hidden = true; return; }
    el.hidden = false; el.className = "sync-st " + t[0]; el.textContent = t[1];
    if (state.view === "ajustes") renderConta();
  }

  function renderConta() {
    const tit = $("contaTitulo"), sub = $("contaSub"), acao = $("contaAcao");
    if (!tit) return;
    $("contaSairLi").hidden = !sessao;
    $("apagarSub").textContent = sessao ? "Apaga também no banco, em todos os aparelhos" : "Não pode ser desfeito";
    $("dadosNota").textContent = sessao
      ? "A agenda fica no aparelho e no banco. Sem internet, as alterações ficam guardadas e são enviadas quando a conexão voltar."
      : "A agenda fica guardada neste aparelho, no navegador em que o app foi aberto.";
    if (!configurado) {
      tit.textContent = "Sincronização desligada";
      sub.textContent = "Configure o Supabase em config.js para salvar no banco";
      acao.hidden = true; return;
    }
    if (!sessao) {
      tit.textContent = "Não conectada";
      sub.textContent = "A agenda está só neste aparelho";
      acao.hidden = false; acao.textContent = "Entrar"; acao.dataset.a = "entrar"; return;
    }
    tit.textContent = sessao.user.email || "Conectada";
    const n = pendentes().total;
    sub.textContent = status === "erro" ? erroMsg
      : status === "offline" ? (n ? `Sem internet · ${n} alteraç${n === 1 ? "ão" : "ões"} para enviar` : "Sem internet · tudo salvo no aparelho")
      : status === "sincronizando" ? "Sincronizando…"
      : ultimaOk ? `Sincronizado às ${ultimaOk.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${n ? ` · ${n} para enviar` : ""}`
      : "Conectada";
    acao.hidden = false; acao.textContent = "Sincronizar"; acao.dataset.a = "sync";
  }

  /* ---------- Início ---------- */
  async function iniciar() {
    $("formLogin").addEventListener("submit", entrar);
    $("semConta").addEventListener("click", () => {
      meta.semConta = true; salvarMeta();
      $("sheetLogin").hidden = true; document.body.style.overflow = "";
      definir("sem-conta");
    });
    $("syncSt").addEventListener("click", () => {
      if (!sessao && configurado) pedirLogin();
      else if (sessao) { sincronizar(); }
    });
    $("contaAcao").addEventListener("click", e => {
      if (e.currentTarget.dataset.a === "entrar") pedirLogin(); else sincronizar();
    });
    $("btnSair").addEventListener("click", sair);

    if (!configurado) { definir("local"); return; }
    if (!window.supabase?.createClient) {
      // biblioteca não carregou (primeira abertura sem internet): segue só no aparelho
      definir("offline"); return;
    }
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      db: { schema: cfg.schema || "fisiomais" },
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "fisiomais:auth" }
    });
    const { data } = await sb.auth.getSession();
    sessao = data.session;
    sb.auth.onAuthStateChange((_ev, s) => { sessao = s; renderStatus(); });

    if (!sessao) {
      definir("sem-conta");
      if (!meta.semConta) pedirLogin();
      return;
    }
    sincronizar();
  }

  window.addEventListener("online", () => agendar(300));
  window.addEventListener("offline", () => { if (sessao) definir("offline"); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) agendar(300); });
  setInterval(() => { if (!document.hidden) sincronizar(); }, 60000);

  window.Sync = { agendar, sincronizar, renderConta, pendentes, get status() { return status; } };
  iniciar().catch(e => { console.warn(e); definir("erro"); });
})();
