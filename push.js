"use strict";
/* ============ Notificações (Web Push) ============
   O aparelho se inscreve para receber avisos; a função "fisiomais-lembretes" no Supabase
   envia o resumo do dia e um aviso antes de cada atendimento, mesmo com o app fechado.
   No iPhone, só funciona com o app instalado na tela inicial (iOS 16.4 ou mais novo). */
(function () {
  const cfg = window.FISIO_CONFIG || {};
  const KEY_PREFS = "fisiomais:avisos";
  const suportado = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const ehIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const instalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let ocupado = false;

  function lerPrefs() {
    try { return { resumo: "07:00", antes: 30, ...JSON.parse(localStorage.getItem(KEY_PREFS)) }; }
    catch (e) { return { resumo: "07:00", antes: 30 }; }
  }
  function salvarPrefs(p) { try { localStorage.setItem(KEY_PREFS, JSON.stringify(p)); } catch (e) {} }
  function chave(b64url) {
    const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
    return Uint8Array.from(atob((b64url + pad).replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  }
  // A chave pública vem de config.js ou, se vazia, da própria função (que lê o segredo VAPID_PUBLIC_KEY).
  async function chavePublica() {
    if (cfg.vapidPublica) return cfg.vapidPublica;
    try { const salva = localStorage.getItem("fisiomais:vapid"); if (salva) return salva; } catch (e) {}
    const { data, error } = await window.Sync.cliente.functions.invoke("fisiomais-lembretes", { body: { chave: true } });
    const k = !error && data?.vapidPublica;
    if (!k || !/^B[A-Za-z0-9_-]{80,}$/.test(k)) return null;
    try { localStorage.setItem("fisiomais:vapid", k); } catch (e) {}
    return k;
  }

  async function inscricaoAtual() {
    if (!suportado) return null;
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? reg.pushManager.getSubscription() : null;
  }

  async function ativar() {
    const sb = window.Sync?.cliente, sessao = window.Sync?.sessao;
    if (!sb || !sessao) { toast("Conecte com o PIN para ativar os avisos."); return; }
    ocupado = true; render();
    try {
      const vapid = await chavePublica();
      if (!vapid) { toast("A função fisiomais-lembretes não respondeu. Confira se foi publicada no Supabase."); return; }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast("Os avisos foram bloqueados. Libere nas configurações do navegador."); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave(vapid) }));
      const j = sub.toJSON(), p = lerPrefs();
      const { error } = await sb.from("push_inscricoes").upsert({
        user_id: sessao.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth,
        resumo_hora: p.resumo, antecedencia_min: +p.antes
      }, { onConflict: "endpoint" });
      if (error) throw error;
      toast("Avisos ativados neste aparelho");
    } catch (e) {
      console.warn("push:", e);
      toast(/does not exist|push_inscricoes/i.test(e?.message || "") ? "Falta rodar supabase/notificacoes.sql no Supabase." : "Não foi possível ativar os avisos.");
    } finally { ocupado = false; render(); }
  }

  async function desativar() {
    ocupado = true; render();
    try {
      const sub = await inscricaoAtual();
      if (sub) {
        await window.Sync?.cliente?.from("push_inscricoes").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      toast("Avisos desativados neste aparelho");
    } finally { ocupado = false; render(); }
  }

  async function testar() {
    const sb = window.Sync?.cliente;
    if (!sb) return;
    const b = $("avTeste"); b.disabled = true; b.textContent = "Enviando…";
    try {
      const { data, error } = await sb.functions.invoke("fisiomais-lembretes", { body: { teste: true } });
      if (error) throw error;
      toast(data?.enviados ? "Aviso de teste enviado" : "Nenhum aparelho inscrito recebeu. Ative os avisos de novo.");
    } catch (e) {
      console.warn("teste push:", e);
      toast("A função fisiomais-lembretes não respondeu. Confira se foi publicada no Supabase.");
    } finally { b.disabled = false; b.textContent = "Testar"; }
  }

  async function mudarPrefs() {
    const p = { resumo: $("avResumo").value, antes: +$("avAntes").value };
    salvarPrefs(p);
    const sb = window.Sync?.cliente, sessao = window.Sync?.sessao;
    if (sb && sessao && (await inscricaoAtual())) {
      const { error } = await sb.from("push_inscricoes")
        .update({ resumo_hora: p.resumo, antecedencia_min: p.antes }).eq("user_id", sessao.user.id);
      toast(error ? "Não foi possível salvar agora. Tente com internet." : "Horários dos avisos salvos");
    }
  }

  async function render() {
    if (!$("avStatus")) return;
    const p = lerPrefs();
    $("avResumo").value = p.resumo; $("avAntes").value = String(p.antes);
    const acao = $("avAcao"), sub = $("avStatus");
    const conectada = !!window.Sync?.sessao;
    let ativo = false, texto, podeAtivar = true;
    if (!suportado) { texto = ehIOS ? "Instale o app na tela inicial para receber avisos" : "Este navegador não recebe avisos"; podeAtivar = false; }
    else if (ehIOS && !instalado()) { texto = "No iPhone, instale o app na tela inicial primeiro"; podeAtivar = false; }
    else if (!conectada) { texto = "Conecte com o PIN para ativar"; podeAtivar = false; }
    else if (Notification.permission === "denied") { texto = "Bloqueados nas configurações do navegador"; podeAtivar = false; }
    else {
      ativo = !!(await inscricaoAtual()) && Notification.permission === "granted";
      texto = ativo ? `Resumo às ${p.resumo} e aviso ${p.antes} min antes` : "Desativados neste aparelho";
    }
    sub.textContent = texto;
    acao.hidden = !podeAtivar;
    acao.disabled = ocupado;
    acao.textContent = ocupado ? "Aguarde…" : ativo ? "Desativar" : "Ativar";
    acao.className = "btn small" + (ativo ? "" : " primary");
    acao.dataset.ativo = ativo ? "1" : "";
    $("avPrefs").hidden = !ativo;
    $("avTesteLi").hidden = !ativo;
  }

  function iniciar() {
    if (!$("avAcao")) return;
    $("avAcao").addEventListener("click", e => (e.currentTarget.dataset.ativo ? desativar() : ativar()));
    $("avResumo").addEventListener("change", mudarPrefs);
    $("avAntes").addEventListener("change", mudarPrefs);
    $("avTeste").addEventListener("click", testar);
  }

  window.Avisos = { render };
  iniciar();
  render(); // a tela pode ter sido desenhada antes deste arquivo carregar
})();
