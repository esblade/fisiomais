"use strict";

/* ============ Catálogo (portfólio) ============ */
const SERVICOS = [
  { g: "Avaliação", items: [
    { id: "avaliacao", nome: "Avaliação inicial", valor: null, hint: "Valor conforme o caso." },
    { id: "retorno", nome: "Sessão de acompanhamento", valor: null, hint: "Sessão de um plano em andamento." } ] },
  { g: "Gestação e parto", items: [
    { id: "perinatal", nome: "Educação perinatal", valor: 600, hint: "R$ 600 pelas 4 aulas. Nas aulas seguintes do pacote, use R$ 0." },
    { id: "prep-parto", nome: "Preparação física para o parto", valor: 320, hint: "R$ 320 por mês (4 sessões semanais). Nas sessões seguintes do mês, use R$ 0." },
    { id: "drenagem", nome: "Drenagem linfática gestacional + escalda-pés", valor: 200 },
    { id: "massagem", nome: "Massagem relaxante para gestante", valor: 180 } ] },
  { g: "Pós-parto", items: [
    { id: "amamentacao", nome: "Consulta de amamentação", valor: 300, hint: "1 aula antes do parto + 1 encontro quando o bebê nascer." },
    { id: "pos-parto", nome: "Fisioterapia no pós-parto", valor: 350, hint: "3 sessões: na gestação, nas primeiras horas e retorno em 5 a 7 dias." },
    { id: "pacote-pp", nome: "Pacote amamentação + pós-parto", valor: 550, hint: "2 encontros antes e 2 depois do parto." },
    { id: "abdominal", nome: "Reabilitação abdominal no pós-parto", valor: 1100, hint: "R$ 1.100 pelas 12 sessões. Nas sessões seguintes, use R$ 0." } ] },
  { g: "Outros atendimentos", items: [
    { id: "parto", nome: "Acompanhamento do parto", valor: 1800 },
    { id: "vaginismo", nome: "Tratamento para vaginismo · avaliação", valor: 180, hint: "Número de sessões definido após a avaliação." },
    { id: "idosos-av", nome: "Domiciliar para idosos · avaliação", valor: 100 },
    { id: "idosos-5", nome: "Domiciliar para idosos · plano de 5 sessões", valor: 580, hint: "Nas sessões seguintes do plano, use R$ 0." },
    { id: "idosos-10", nome: "Domiciliar para idosos · plano de 10 sessões", valor: 1000, hint: "Nas sessões seguintes do plano, use R$ 0." },
    { id: "incontinencia", nome: "Incontinência e urgência urinária", valor: null },
    { id: "dor-pelvica", nome: "Dor pélvica", valor: null } ] }
];
const SVC = {};
SERVICOS.forEach(g => g.items.forEach(s => (SVC[s.id] = s)));
const STATUS = { agendado: "Agendado", confirmado: "Confirmado", realizado: "Realizado", faltou: "Faltou", cancelado: "Cancelado" };

/* ============ Utilidades ============ */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const toMin = h => { const [a, b] = (h || "0:0").split(":").map(Number); return a * 60 + b; };
const brl = v => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtLongo = s => parse(s).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const fmtCurto = s => parse(s).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, "");
const svcNome = a => SVC[a.servico]?.nome || a.servicoNome || "Atendimento";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowIso = () => new Date().toISOString();
const todayIso = () => iso(new Date());
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const ativo = a => a.status !== "cancelado";
const byTime = (a, b) => (a.data + a.hora).localeCompare(b.data + b.hora);
const jaPassou = a => a.data < todayIso() || (a.data === todayIso() && toMin(a.hora) + (+a.duracao || 60) <= toMin(nowHM()));
const pendente = a => (a.status === "agendado" || a.status === "confirmado") && jaPassou(a);
const valor = a => +a.valor || 0;

/* ============ Armazenamento ============ */
const KEY = "fisiomais:v1";
const store = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data.items) ? data : { items: [] };
    } catch (e) { return { items: [] }; }
  },
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, items: state.items }));
      return true;
    } catch (e) { toast("Não foi possível salvar neste aparelho."); return false; }
  }
};

function exemplos() {
  const t = todayIso();
  const base = { telefone: "", local: "Consultório", sessao: "", obs: "", exemplo: true, criadoEm: nowIso() };
  return [
    { ...base, id: uid(), paciente: "Ana Paula (exemplo)", servico: "prep-parto", data: addDays(t, -1), hora: "08:30", duracao: 60, sessao: "2/4", valor: 0, status: "confirmado", pagamento: "Incluso no pacote", obs: "32 semanas de gestação" },
    { ...base, id: uid(), paciente: "Juliana Santos (exemplo)", servico: "drenagem", data: t, hora: "10:00", duracao: 90, valor: 200, status: "agendado", pagamento: "" },
    { ...base, id: uid(), paciente: "Carla Mendes (exemplo)", servico: "pos-parto", data: t, hora: "15:00", duracao: 60, local: "Domicílio", sessao: "3/3", valor: 350, status: "confirmado", pagamento: "Pix", obs: "Retorno 6 dias após o parto" },
    { ...base, id: uid(), paciente: "Dona Lúcia (exemplo)", servico: "idosos-av", data: addDays(t, 2), hora: "09:00", duracao: 60, local: "Domicílio", valor: 100, status: "agendado", pagamento: "" },
    { ...base, id: uid(), paciente: "Marina Costa (exemplo)", servico: "abdominal", data: addDays(t, -3), hora: "17:00", duracao: 60, sessao: "1/12", valor: 1100, status: "realizado", pagamento: "Cartão", realizadoEm: nowIso(), evolucao: "Diástase de 3 cm. Orientados exercícios respiratórios para casa." }
  ];
}

/* ============ Estado ============ */
const loaded = store.load();
const state = {
  items: loaded ? loaded.items : exemplos(),
  sel: todayIso(),
  modo: (() => { try { return localStorage.getItem("fisiomais:modo") === "semana" ? "semana" : "dia"; } catch (e) { return "dia"; } })(),
  view: "agenda",
  filtro: "",
  editing: null,
  confirming: null
};
if (!loaded) store.save();
try { navigator.storage?.persist?.(); } catch (e) {}

/* ============ Render ============ */
function render() {
  renderBanner();
  renderBadge();
  if (state.view === "agenda") renderAgenda();
  if (state.view === "confirmar") renderPendentes();
  if (state.view === "historico") renderHistorico();
  if (state.view === "ajustes") renderAjustes();
}

function renderBanner() {
  const ex = state.items.filter(a => a.exemplo).length;
  const b = $("banner");
  if (ex) {
    b.innerHTML = `<span>Os atendimentos marcados como <strong>exemplo</strong> são fictícios, só para você ver como a agenda funciona.</span><button class="btn small" type="button" data-act="limpar-ex">Remover exemplos</button>`;
    b.hidden = false;
  } else b.hidden = true;
}

function renderBadge() {
  const n = state.items.filter(pendente).length;
  $("badge").textContent = n;
  $("badge").hidden = !n;
}

const ICON_CHECK = `<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
const ICON_WA = `<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg>`;

function waLink(a, tipo) {
  let d = String(a.telefone || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length <= 11) d = "55" + d;
  const nome = (a.paciente || "").replace(/\(exemplo\)/i, "").trim().split(/\s+/)[0] || "";
  const msg = tipo === "lembrete"
    ? `Olá, ${nome}! Aqui é a Maisa, fisioterapeuta. Passando para confirmar seu atendimento de ${svcNome(a)} ${fmtLongo(a.data)}, às ${a.hora}. Posso confirmar?`
    : `Olá, ${nome}!`;
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`;
}

/* ============ Recibo da sessão ============ */
const mesmaPaciente = (x, y) => (x.paciente || "").trim().toLowerCase() === (y.paciente || "").trim().toLowerCase();
const ddmm = s => s.slice(8, 10) + "/" + s.slice(5, 7);
const listaPt = arr => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " e " + arr[arr.length - 1];

function sessoesDoPacote(a) {
  // Sessões realizadas do mesmo serviço para a mesma paciente, até este atendimento
  let feitas = state.items
    .filter(x => x.status === "realizado" && x.servico === a.servico && mesmaPaciente(x, a) && byTime(x, a) <= 0)
    .sort(byTime);
  const m = String(a.sessao || "").match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
  const numero = m ? +m[1] : feitas.length;
  const total = m ? +m[2] : null;
  if (m) feitas = feitas.slice(-numero); // só o pacote atual
  return { feitas, numero, total };
}

function reciboTexto(a) {
  const nome = (a.paciente || "").replace(/\(exemplo\)/i, "").trim().split(/\s+/)[0] || "";
  const { feitas, numero, total } = sessoesDoPacote(a);
  const dia = parse(a.data).toLocaleDateString("pt-BR");
  const quando = a.data === todayIso() ? "de hoje" : `do dia ${ddmm(a.data)}`;
  let pag = "";
  if (a.pagamento === "Incluso no pacote") pag = "Incluso no pacote";
  else if (a.pagamento) pag = `${a.pagamento}${valor(a) ? `, ${brl(a.valor)}` : ""}`;
  else if (valor(a)) pag = `${brl(a.valor)} (a pagar)`;
  const linhas = [
    `Olá, ${nome}! Aqui é a Maisa, fisioterapeuta.`,
    ``,
    `Recibo do atendimento ${quando}:`,
    `• ${svcNome(a)}`,
    numero ? `• Sessão ${numero}${total ? ` de ${total}` : ""}` : null,
    `• ${dia} às ${a.hora}`,
    pag ? `• Pagamento: ${pag}` : null
  ];
  if (feitas.length > 1) {
    linhas.push("", `Sessões realizadas${total ? " neste pacote" : ""}: ${listaPt(feitas.map(x => ddmm(x.data)))}.`);
  }
  if (total && total > numero) {
    const r = total - numero;
    linhas.push(`${r === 1 ? "Falta 1 sessão" : `Faltam ${r} sessões`} para concluir.`);
  } else if (total && total === numero) {
    linhas.push(`Pacote concluído.`);
  }
  linhas.push("", "Obrigada pela confiança!");
  return linhas.filter(l => l !== null).join("\n");
}

function waNumero(tel) {
  let d = String(tel || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length <= 11) d = "55" + d;
  return d;
}

function openRecibo(a, acabouDeConfirmar = false) {
  state.recibo = a.id;
  $("recEyebrow").textContent = acabouDeConfirmar ? "Atendimento confirmado ✓" : "Recibo da sessão";
  $("recTitle").textContent = `Enviar recibo para ${(a.paciente || "").replace(/\s*\(exemplo\)/i, "")}?`;
  $("recTexto").textContent = reciboTexto(a);
  $("recTelBox").hidden = !!waNumero(a.telefone);
  $("r-telefone").value = "";
  atualizaLinkRecibo();
  openSheet("sheetRecibo");
}
function atualizaLinkRecibo() {
  const a = state.items.find(x => x.id === state.recibo);
  if (!a) return;
  const num = waNumero(a.telefone) || waNumero($("r-telefone").value);
  const link = $("recEnviar");
  if (num && num.length >= 12) {
    link.href = `https://wa.me/${num}?text=${encodeURIComponent(reciboTexto(a))}`;
    link.removeAttribute("aria-disabled");
  } else {
    link.href = "#";
    link.setAttribute("aria-disabled", "true");
  }
}
function reciboEnviado() {
  const a = state.items.find(x => x.id === state.recibo);
  if (!a) return;
  if (!waNumero(a.telefone) && $("r-telefone").value.trim()) a.telefone = $("r-telefone").value.trim();
  a.reciboEm = nowIso();
  store.save();
  setTimeout(() => { closeSheets(); render(); }, 300);
}

function apptHTML(a, { mostrarData = false } = {}) {
  const meta = [a.local, a.sessao ? `Sessão ${a.sessao}` : "", valor(a) ? `<span class="price ${a.pagamento || a.status === "cancelado" ? "" : "open"}">${brl(a.valor)}${a.pagamento ? ` · ${esc(a.pagamento)}` : a.status === "cancelado" ? "" : " · a receber"}</span>` : (a.pagamento === "Incluso no pacote" ? "Incluso no pacote" : "")]
    .filter(Boolean).map(m => `<li>${m.startsWith("<span") ? m : esc(m)}</li>`).join("");
  const wa = a.status !== "realizado" && a.status !== "cancelado" ? waLink(a, "lembrete") : null;
  const podeConfirmar = a.status === "agendado" || a.status === "confirmado";
  const quando = a.realizadoEm ? new Date(a.realizadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  return `<li class="appt is-${a.status}">
    <div class="hour">${esc(a.hora)}<small>${a.duracao >= 240 ? "plantão" : (a.duracao || 60) + " min"}</small></div>
    <div class="body">
      ${mostrarData ? `<p class="date-line">${fmtCurto(a.data)}</p>` : ""}
      <p class="name">${esc(a.paciente)}<span class="tag ${a.status}">${STATUS[a.status] || a.status}</span>${a.exemplo ? '<span class="tag ex">exemplo</span>' : ""}</p>
      <p class="svc">${esc(svcNome(a))}</p>
      ${meta ? `<ul class="meta">${meta}</ul>` : ""}
      ${a.obs ? `<p class="obs">${esc(a.obs)}</p>` : ""}
      ${a.status === "realizado" ? `<p class="done">${ICON_CHECK}<span>Atendimento confirmado${quando ? ` em ${quando}` : ""}${a.evolucao ? `<span class="ev">${esc(a.evolucao)}</span>` : ""}</span></p>` : ""}
      ${a.status === "realizado" && a.reciboEm ? `<p class="receipt">Recibo aberto no WhatsApp em ${new Date(a.reciboEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>` : ""}
      ${a.status === "faltou" ? `<p class="done" style="color:var(--amber)"><span>Falta registrada${quando ? ` em ${quando}` : ""}</span></p>` : ""}
      <div class="actions">
        ${podeConfirmar ? `<button class="btn small confirm" type="button" data-act="confirmar" data-id="${a.id}">${ICON_CHECK}Confirmar atendimento</button>` : ""}
        ${a.status === "realizado" && valor(a) && !a.pagamento ? `<button class="btn small" type="button" data-act="confirmar" data-id="${a.id}">Registrar pagamento</button>` : ""}
        ${wa ? `<a class="btn small" href="${wa}" target="_blank" rel="noopener">${ICON_WA}Lembrar pelo WhatsApp</a>` : ""}
        ${a.status === "realizado" ? `<button class="btn small" type="button" data-act="recibo" data-id="${a.id}">${ICON_WA}${a.reciboEm ? "Reenviar recibo" : "Enviar recibo"}</button>` : ""}
        <button class="btn small ghost" type="button" data-act="editar" data-id="${a.id}">Editar</button>
      </div>
    </div>
  </li>`;
}

const plural = (n, s) => `${n} ${s}${n === 1 ? "" : "s"}`;

function weekHTML(ini) {
  const t = todayIso();
  let h = "";
  for (let i = 0; i < 7; i++) {
    const s = addDays(ini, i);
    const its = state.items.filter(a => a.data === s).sort(byTime);
    const n = its.filter(ativo).length;
    const label = parse(s).toLocaleDateString("pt-BR", { weekday: "long" });
    h += `<section class="wv-day${s === t ? " today" : ""}${its.length ? "" : " free"}">
      <button type="button" class="wv-head" data-goday="${s}">
        <span class="wv-num">${parse(s).getDate()}</span>
        <span class="wv-name">${label.charAt(0).toUpperCase() + label.slice(1)}${s === t ? " · hoje" : ""}</span>
        <span class="wv-count">${n ? plural(n, "atendimento") : "livre"}</span>
      </button>
      ${its.length ? `<ul class="wv-list">${its.map(a => `<li class="wv-item is-${a.status}" data-act="editar" data-id="${a.id}">
          <span class="wv-hora">${esc(a.hora)}</span>
          <span class="wv-info"><span class="wv-pac">${esc(a.paciente)}</span><span class="wv-svc">${esc(svcNome(a))}${a.local && a.local !== "Consultório" ? ` · ${esc(a.local)}` : ""}</span></span>
          ${pendente(a) ? `<button type="button" class="wv-ok" data-act="confirmar" data-id="${a.id}" aria-label="Confirmar atendimento de ${esc(a.paciente)}">${ICON_CHECK}</button>` : `<span class="tag ${a.status}">${STATUS[a.status]}</span>`}
        </li>`).join("")}</ul>` : ""}
    </section>`;
  }
  return h;
}

function renderAgenda() {
  const sel = state.sel, t = todayIso();
  const semana = state.modo === "semana";
  document.querySelectorAll("[data-modo]").forEach(b => b.classList.toggle("on", b.dataset.modo === state.modo));
  const d0 = parse(sel); const ini = addDays(sel, -d0.getDay()); const fim = addDays(ini, 6);
  const doDia = state.items.filter(a => a.data === sel).sort(byTime);
  const ativos = doDia.filter(ativo);
  if (semana) {
    const iniT = parse(t); const iniHoje = addDays(t, -iniT.getDay());
    $("dayTitle").textContent = ini === iniHoje ? "Esta semana" : ini === addDays(iniHoje, 7) ? "Próxima semana" : ini === addDays(iniHoje, -7) ? "Semana passada" : "Semana";
    const a = parse(ini), b = parse(fim);
    const periodo = a.getMonth() === b.getMonth()
      ? `${a.getDate()} a ${b.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`
      : `${a.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")} a ${b.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}`;
    const nSem = state.items.filter(x => x.data >= ini && x.data <= fim && ativo(x)).length;
    $("daySub").textContent = `${periodo} · ${nSem ? plural(nSem, "atendimento") : "nenhum atendimento"}`;
  } else {
    $("dayTitle").textContent = sel === t ? "Hoje" : sel === addDays(t, 1) ? "Amanhã" : sel === addDays(t, -1) ? "Ontem" : fmtLongo(sel).split(",")[0];
    const dataTxt = parse(sel).toLocaleDateString("pt-BR", { weekday: sel === t || Math.abs(parse(sel) - parse(t)) <= 864e5 ? "long" : undefined, day: "numeric", month: "long", year: parse(sel).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
    $("daySub").textContent = dataTxt.charAt(0).toUpperCase() + dataTxt.slice(1) + (ativos.length ? ` · ${plural(ativos.length, "atendimento")}` : "");
  }
  $("pickDate").value = sel;
  $("dayList").hidden = semana;
  $("weekList").hidden = !semana;
  if (semana) $("weekList").innerHTML = weekHTML(ini);

  // faixa da semana (domingo a sábado)
  const count = {};
  state.items.filter(ativo).forEach(a => (count[a.data] = (count[a.data] || 0) + 1));
  const letras = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  let h = "";
  for (let i = 0; i < 7; i++) {
    const s = addDays(ini, i);
    const cls = ["wk-day", s === t ? "today" : "", s === sel && !semana ? "sel" : "", count[s] ? "has" : ""].join(" ");
    h += `<button type="button" class="${cls}" data-day="${s}" aria-label="${fmtLongo(s)}${count[s] ? `, ${count[s]} atendimento(s)` : ""}"><span class="w">${letras[i]}</span><span class="n">${parse(s).getDate()}</span><span class="dot"></span></button>`;
  }
  $("wkDays").innerHTML = h;

  $("dayList").innerHTML = doDia.length
    ? doDia.map(a => apptHTML(a)).join("")
    : `<li class="empty"><h3>Nenhum atendimento neste dia</h3><p>Toque em <em>Agendar</em> para marcar uma paciente.</p></li>`;

  // resumo do mês do dia selecionado
  const mes = sel.slice(0, 7);
  const doMes = state.items.filter(a => a.data.slice(0, 7) === mes);
  const recebido = doMes.filter(a => a.pagamento && a.pagamento !== "Incluso no pacote" && ativo(a)).reduce((s, a) => s + valor(a), 0);
  const abertos = doMes.filter(a => !a.pagamento && valor(a) > 0 && (a.status === "realizado" || a.status === "agendado" || a.status === "confirmado"));
  const feitos = doMes.filter(a => a.status === "realizado").length;
  const faltas = doMes.filter(a => a.status === "faltou").length;
  $("sRecebido").textContent = brl(recebido);
  $("sReceber").textContent = brl(abertos.reduce((s, a) => s + valor(a), 0));
  $("sReceberN").textContent = abertos.length ? `${abertos.length} atendimento${abertos.length > 1 ? "s" : ""}` : "tudo em dia";
  $("sFeitos").textContent = feitos;
  $("sFaltas").textContent = faltas ? `${faltas} falta${faltas > 1 ? "s" : ""}` : "nenhuma falta";
  document.querySelector(".summary .eyebrow").textContent = "Em " + parse(sel).toLocaleDateString("pt-BR", { month: "long" });
}

function renderPendentes() {
  const list = state.items.filter(pendente).sort(byTime);
  $("pendList").innerHTML = list.length
    ? list.map(a => apptHTML(a, { mostrarData: true })).join("")
    : `<li class="empty"><h3>Tudo confirmado</h3><p>Todos os atendimentos que já passaram estão registrados.</p></li>`;
}

function renderHistorico() {
  const q = $("fBusca").value.trim().toLowerCase();
  const f = state.filtro, t = todayIso();
  let list = state.items.filter(a => {
    if (f === "proximos" && !(a.data >= t && ativo(a) && a.status !== "realizado" && a.status !== "faltou")) return false;
    if (f === "realizado" && a.status !== "realizado") return false;
    if (f === "receber" && !(valor(a) > 0 && !a.pagamento && a.status !== "cancelado" && a.status !== "faltou")) return false;
    if (f === "faltou" && a.status !== "faltou") return false;
    if (f === "cancelado" && a.status !== "cancelado") return false;
    if (q && !`${a.paciente} ${svcNome(a)} ${a.obs || ""} ${a.evolucao || ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
  list.sort(f === "proximos" ? byTime : (a, b) => byTime(b, a));
  $("histList").innerHTML = list.length ? list.map(a => `<li data-act="editar" data-id="${a.id}">
      <span class="h-date">${fmtCurto(a.data)} · ${esc(a.hora)}</span>
      <span class="h-name">${esc(a.paciente)}</span>
      <span class="h-svc">${esc(svcNome(a))}${a.sessao ? ` · sessão ${esc(a.sessao)}` : ""}</span>
      <span class="h-right"><span class="tag ${a.status}">${STATUS[a.status]}</span>${valor(a) ? `<span class="price ${a.pagamento || a.status === "cancelado" ? "" : "open"}">${brl(a.valor)}</span>` : ""}</span>
    </li>`).join("")
    : `<li class="empty" style="cursor:default"><h3>Nada encontrado</h3><p>Tente outro nome ou filtro.</p></li>`;
  const soma = list.filter(ativo).reduce((s, a) => s + valor(a), 0);
  $("histFoot").textContent = list.length ? `${list.length} atendimento${list.length > 1 ? "s" : ""} · ${brl(soma)}` : "";
}

function renderAjustes() {
  $("rowEx").hidden = !state.items.some(a => a.exemplo);
  $("totalItens").textContent = `${state.items.length} atendimento${state.items.length === 1 ? "" : "s"} guardado${state.items.length === 1 ? "" : "s"} neste aparelho.`;
}

/* ============ Navegação ============ */
function setView(v) {
  state.view = v;
  ["agenda", "confirmar", "historico", "ajustes"].forEach(n => ($("view-" + n).hidden = n !== v));
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  $("btnNovo").hidden = v === "ajustes";
  if (location.hash !== "#" + v) history.replaceState(null, "", "#" + v);
  window.scrollTo(0, 0);
  render();
}

/* ============ Formulário ============ */
function fillServicos() {
  $("f-servico").innerHTML = SERVICOS.map(g => `<optgroup label="${esc(g.g)}">${g.items.map(s => `<option value="${s.id}">${esc(s.nome)}${s.valor ? ` · ${brl(s.valor)}` : ""}</option>`).join("")}</optgroup>`).join("");
}
function svcChanged(setValor) {
  const s = SVC[$("f-servico").value];
  $("svcHint").textContent = s?.hint || "";
  $("svcHint").hidden = !s?.hint;
  if (setValor) {
    $("f-valor").value = s?.valor ?? "";
    if (s?.id === "parto") $("f-duracao").value = "240";
    if (s?.id?.startsWith("idosos")) $("f-local").value = "Domicílio";
  }
}
function openSheet(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
function closeSheets() { $("sheetForm").hidden = true; $("sheetConf").hidden = true; $("sheetRecibo").hidden = true; document.body.style.overflow = ""; state.editing = null; state.confirming = null; state.recibo = null; }

function openForm(a) {
  state.editing = a?.id || null;
  $("formEyebrow").textContent = a ? "Editar agendamento" : "Novo agendamento";
  $("formTitle").textContent = a ? a.paciente : "Agendar atendimento";
  $("f-paciente").value = a?.paciente || "";
  $("f-telefone").value = a?.telefone || "";
  $("f-local").value = a?.local || "Consultório";
  $("f-servico").value = a?.servico && SVC[a.servico] ? a.servico : "avaliacao";
  $("f-data").value = a?.data || state.sel;
  $("f-hora").value = a?.hora || "09:00";
  $("f-duracao").value = String(a?.duracao || 60);
  $("f-sessao").value = a?.sessao || "";
  $("f-status").value = a?.status || "agendado";
  $("f-obs").value = a?.obs || "";
  svcChanged(!a);
  if (a) $("f-valor").value = a.valor ?? "";
  const ex = $("btnExcluir"); ex.hidden = !a; ex.classList.remove("armed"); ex.textContent = "Excluir";
  const pats = [...new Set(state.items.map(x => x.paciente).filter(Boolean))].sort((x, y) => x.localeCompare(y, "pt-BR"));
  $("dlPacientes").innerHTML = pats.map(p => `<option value="${esc(p)}">`).join("");
  checkConflito();
  openSheet("sheetForm");
  if (!a) setTimeout(() => $("f-paciente").focus(), 60);
}

function checkConflito() {
  const d = $("f-data").value, h = $("f-hora").value, dur = +$("f-duracao").value;
  const box = $("conflito");
  if (!d || !h || $("f-status").value === "cancelado") { box.hidden = true; return; }
  const s = toMin(h), e = s + dur;
  const hit = state.items.filter(a => a.id !== state.editing && a.data === d && ativo(a))
    .filter(a => { const as = toMin(a.hora); return s < as + (+a.duracao || 60) && as < e; });
  box.textContent = hit.length ? "Esse horário coincide com " + hit.map(a => `${a.paciente} (${a.hora})`).join(", ") + "." : "";
  box.hidden = !hit.length;
}

function salvarForm(ev) {
  ev.preventDefault();
  const paciente = $("f-paciente").value.trim();
  if (!paciente) { $("f-paciente").focus(); toast("Informe o nome da paciente."); return; }
  if (!$("f-data").value || !$("f-hora").value) { toast("Informe a data e o horário."); return; }
  const v = $("f-valor").value;
  const dados = {
    paciente, telefone: $("f-telefone").value.trim(), local: $("f-local").value,
    servico: $("f-servico").value, servicoNome: SVC[$("f-servico").value]?.nome || "",
    data: $("f-data").value, hora: $("f-hora").value, duracao: +$("f-duracao").value,
    sessao: $("f-sessao").value.trim(), valor: v === "" ? 0 : Math.max(0, +v),
    status: $("f-status").value, obs: $("f-obs").value.trim(), atualizadoEm: nowIso()
  };
  const editando = !!state.editing;
  if (editando) {
    const a = state.items.find(x => x.id === state.editing);
    if ((dados.status === "realizado" || dados.status === "faltou") && a.status !== dados.status) dados.realizadoEm = nowIso();
    Object.assign(a, dados);
  } else {
    state.items.push({ id: uid(), criadoEm: nowIso(), pagamento: "", ...dados });
  }
  if (!store.save()) return;
  state.sel = dados.data;
  closeSheets();
  toast(editando ? "Alterações salvas" : "Atendimento agendado");
  render();
}

function excluir() {
  const b = $("btnExcluir");
  if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = "Toque de novo para excluir"; return; }
  state.items = state.items.filter(a => a.id !== state.editing);
  store.save(); closeSheets(); toast("Atendimento excluído"); render();
}

/* ============ Confirmação de atendimento ============ */
function openConfirmar(a) {
  state.confirming = a.id;
  $("confTitle").textContent = a.paciente;
  $("confSub").textContent = `${svcNome(a)} · ${fmtLongo(a.data)}, ${a.hora}`;
  document.querySelector('input[name="presenca"][value="realizado"]').checked = true;
  $("c-valor").value = a.valor ?? "";
  $("c-forma").value = a.pagamento || (valor(a) === 0 && a.sessao ? "Incluso no pacote" : "");
  $("c-evolucao").value = a.evolucao || "";
  presencaChanged();
  openSheet("sheetConf");
}
function presencaChanged() {
  const faltou = document.querySelector('input[name="presenca"]:checked').value === "faltou";
  $("confPagBox").hidden = faltou;
  $("btnConfOk").textContent = faltou ? "Registrar falta" : "Confirmar atendimento";
}
function salvarConfirmacao(ev) {
  ev.preventDefault();
  const a = state.items.find(x => x.id === state.confirming);
  if (!a) return closeSheets();
  const st = document.querySelector('input[name="presenca"]:checked').value;
  a.status = st;
  a.realizadoEm = nowIso();
  if (st === "realizado") {
    const v = $("c-valor").value;
    a.valor = v === "" ? 0 : Math.max(0, +v);
    a.pagamento = $("c-forma").value;
    a.evolucao = $("c-evolucao").value.trim();
  }
  a.atualizadoEm = nowIso();
  if (!store.save()) return;
  closeSheets();
  render();
  if (st === "realizado") openRecibo(a, true);
  else toast("Falta registrada");
}

/* ============ Toast ============ */
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600);
}

/* ============ Eventos ============ */
fillServicos();
$("btnNovo").addEventListener("click", () => openForm(null));
$("form").addEventListener("submit", salvarForm);
$("formConf").addEventListener("submit", salvarConfirmacao);
$("btnExcluir").addEventListener("click", excluir);
$("f-servico").addEventListener("change", () => svcChanged(true));
["f-data", "f-hora", "f-duracao", "f-status"].forEach(id => $(id).addEventListener("change", checkConflito));
$("f-paciente").addEventListener("change", () => {
  if ($("f-telefone").value) return;
  const p = state.items.filter(a => a.paciente === $("f-paciente").value.trim() && a.telefone).sort(byTime).pop();
  if (p) $("f-telefone").value = p.telefone;
});
document.querySelectorAll('input[name="presenca"]').forEach(r => r.addEventListener("change", presencaChanged));
$("r-telefone").addEventListener("input", atualizaLinkRecibo);
$("recEnviar").addEventListener("click", e => {
  if ($("recEnviar").getAttribute("aria-disabled") === "true") { e.preventDefault(); $("r-telefone").focus(); return; }
  reciboEnviado();
});
document.querySelectorAll(".sheet-bg").forEach(bg => bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-close]")) closeSheets(); }));
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheets(); });

document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
function setModo(m) {
  state.modo = m;
  try { localStorage.setItem("fisiomais:modo", m); } catch (e) {}
  renderAgenda();
}
function irParaDia(s) { state.sel = s; if (state.modo !== "dia") setModo("dia"); else renderAgenda(); }
document.querySelectorAll("[data-modo]").forEach(b => b.addEventListener("click", () => setModo(b.dataset.modo)));
$("wkDays").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (b) irParaDia(b.dataset.day); });
$("weekList").addEventListener("click", e => { const b = e.target.closest("[data-goday]"); if (b) irParaDia(b.dataset.goday); });
$("wkPrev").addEventListener("click", () => { state.sel = addDays(state.sel, -7); renderAgenda(); });
$("wkNext").addEventListener("click", () => { state.sel = addDays(state.sel, 7); renderAgenda(); });
$("pickDate").addEventListener("change", e => { if (e.target.value) { state.sel = e.target.value; renderAgenda(); } });
$("dayTitle").addEventListener("dblclick", () => { state.sel = todayIso(); renderAgenda(); });

// deslizar a semana com o dedo
let tx = null;
$("wkDays").addEventListener("touchstart", e => (tx = e.touches[0].clientX), { passive: true });
$("wkDays").addEventListener("touchend", e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx; tx = null;
  if (Math.abs(dx) > 50) { state.sel = addDays(state.sel, dx < 0 ? 7 : -7); renderAgenda(); }
});

$("fBusca").addEventListener("input", renderHistorico);
$("fChips").addEventListener("click", e => {
  const c = e.target.closest(".chip"); if (!c) return;
  state.filtro = c.dataset.f;
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === c));
  renderHistorico();
});

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = state.items.find(x => x.id === el.dataset.id);
  switch (el.dataset.act) {
    case "editar": if (a) openForm(a); break;
    case "confirmar": if (a) openConfirmar(a); break;
    case "recibo": if (a) openRecibo(a); break;
    case "limpar-ex":
      state.items = state.items.filter(x => !x.exemplo); store.save(); render(); toast("Exemplos removidos"); break;
  }
});

$("btnEx").addEventListener("click", () => { state.items = state.items.filter(x => !x.exemplo); store.save(); render(); toast("Exemplos removidos"); });
$("btnZerar").addEventListener("click", e => {
  const b = e.currentTarget;
  if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = "Toque de novo"; setTimeout(() => { b.classList.remove("armed"); b.textContent = "Apagar"; }, 4000); return; }
  state.items = []; store.save(); b.classList.remove("armed"); b.textContent = "Apagar"; render(); toast("Agenda apagada");
});

// Atualiza badge e pendências quando o app volta ao primeiro plano
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
setInterval(renderBadge, 60000);

// Inicialização
const inicial = (location.hash || "").slice(1);
setView(["agenda", "confirmar", "historico", "ajustes"].includes(inicial) ? inicial : "agenda");

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
