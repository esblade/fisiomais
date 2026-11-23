"use strict";

/* ============ Tipos de atendimento ============ */
// Padrão inicial, tirado do portfólio. Depois a fisioterapeuta edita em Ajustes.
const GRUPOS = ["Avaliação", "Gestação e parto", "Pós-parto", "Outros atendimentos"];
const SERVICOS_PADRAO = [
  { id: "avaliacao", grupo: "Avaliação", nome: "Avaliação inicial", valor: null, duracao: 60, hint: "Valor conforme o caso." },
  { id: "retorno", grupo: "Avaliação", nome: "Sessão de acompanhamento", valor: null, duracao: 60, hint: "Sessão de um plano em andamento." },
  { id: "perinatal", grupo: "Gestação e parto", nome: "Educação perinatal", valor: 600, duracao: 90, hint: "R$ 600 pelas 4 aulas. Nas aulas seguintes do pacote, use R$ 0." },
  { id: "prep-parto", grupo: "Gestação e parto", nome: "Preparação física para o parto", valor: 320, duracao: 60, hint: "R$ 320 por mês (4 sessões semanais). Nas sessões seguintes do mês, use R$ 0." },
  { id: "drenagem", grupo: "Gestação e parto", nome: "Drenagem linfática gestacional + escalda-pés", valor: 200, duracao: 60 },
  { id: "massagem", grupo: "Gestação e parto", nome: "Massagem relaxante para gestante", valor: 180, duracao: 60 },
  { id: "amamentacao", grupo: "Pós-parto", nome: "Consulta de amamentação", valor: 300, duracao: 60, hint: "1 aula antes do parto + 1 encontro quando o bebê nascer." },
  { id: "pos-parto", grupo: "Pós-parto", nome: "Fisioterapia no pós-parto", valor: 350, duracao: 60, hint: "3 sessões: na gestação, nas primeiras horas e retorno em 5 a 7 dias." },
  { id: "pacote-pp", grupo: "Pós-parto", nome: "Pacote amamentação + pós-parto", valor: 550, duracao: 60, hint: "2 encontros antes e 2 depois do parto." },
  { id: "abdominal", grupo: "Pós-parto", nome: "Reabilitação abdominal no pós-parto", valor: 1100, duracao: 60, hint: "R$ 1.100 pelas 12 sessões. Nas sessões seguintes, use R$ 0." },
  { id: "parto", grupo: "Outros atendimentos", nome: "Acompanhamento do parto", valor: 1800, duracao: 240, local: "Hospital / maternidade" },
  { id: "vaginismo", grupo: "Outros atendimentos", nome: "Tratamento para vaginismo · avaliação", valor: 180, duracao: 60, hint: "Número de sessões definido após a avaliação." },
  { id: "idosos-av", grupo: "Outros atendimentos", nome: "Domiciliar para idosos · avaliação", valor: 100, duracao: 60, local: "Domicílio" },
  { id: "idosos-5", grupo: "Outros atendimentos", nome: "Domiciliar para idosos · plano de 5 sessões", valor: 580, duracao: 60, local: "Domicílio", hint: "Nas sessões seguintes do plano, use R$ 0." },
  { id: "idosos-10", grupo: "Outros atendimentos", nome: "Domiciliar para idosos · plano de 10 sessões", valor: 1000, duracao: 60, local: "Domicílio", hint: "Nas sessões seguintes do plano, use R$ 0." },
  { id: "incontinencia", grupo: "Outros atendimentos", nome: "Incontinência e urgência urinária", valor: null, duracao: 60 },
  { id: "dor-pelvica", grupo: "Outros atendimentos", nome: "Dor pélvica", valor: null, duracao: 60 }
];
const KEY_SVC = "fisiomais:servicos";
let SERVICOS = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY_SVC));
    if (Array.isArray(s) && s.length) return s;
  } catch (e) {}
  return SERVICOS_PADRAO.map(s => ({ ...s }));
})();
const SVC = {};
function indexarServicos() {
  Object.keys(SVC).forEach(k => delete SVC[k]);
  SERVICOS.forEach(s => (SVC[s.id] = s));
}
function salvarServicos() {
  indexarServicos();
  try { localStorage.setItem(KEY_SVC, JSON.stringify(SERVICOS)); return true; }
  catch (e) { toast("Não foi possível salvar neste aparelho."); return false; }
}
function gruposEmUso() {
  return [...GRUPOS, ...SERVICOS.map(s => s.grupo).filter(g => g && !GRUPOS.includes(g))]
    .filter((g, i, arr) => arr.indexOf(g) === i);
}
indexarServicos();

// Cor e ícone por grupo de serviço
const ICONES_GRUPO = [
  `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2.5"/><path d="M9.5 3.5h5v3h-5zM9.5 12h5M9.5 16h3"/></svg>`,
  `<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`,
  `<svg viewBox="0 0 24 24"><path d="M12 3.5s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5z"/></svg>`,
  `<svg viewBox="0 0 24 24"><path d="M12 4c2 3 2 6 0 9-2-3-2-6 0-9zM12 13c3-2.5 6-2.8 8.5-1.5-1 3-4.5 4.5-8.5 1.5zM12 13c-3-2.5-6-2.8-8.5-1.5 1 3 4.5 4.5 8.5 1.5zM12 13v7"/></svg>`,
  `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8.5v7M8.5 12h7"/></svg>`
];
function grupoIdx(a) {
  const g = (SVC[a.servico] || a).grupo;
  const i = GRUPOS.indexOf(g);
  return i >= 0 ? i : 4;
}
const grupoCls = a => "g" + (grupoIdx(a) + 1);
const grupoIcone = a => ICONES_GRUPO[grupoIdx(a)];

const fmtDur =m => { m = +m || 60; return m % 60 === 0 ? `${m / 60} h` : m > 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
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
  mes: todayIso().slice(0, 7),
  modo: (() => { try { return localStorage.getItem("fisiomais:modo") === "linha" ? "linha" : "calendario"; } catch (e) { return "calendario"; } })(),
  view: "agenda",
  filtro: "",
  editing: null,
  confirming: null
};
if (!loaded) store.save();
try { navigator.storage?.persist?.(); } catch (e) {}

/* ============ Render ============ */
function renderSaudacao() {
  const h = new Date().getHours();
  $("hello").textContent = `${h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}, Maisa`;
  const d = fmtLongo(todayIso());
  $("hojeTxt").textContent = d.charAt(0).toUpperCase() + d.slice(1);
}

function render() {
  renderSaudacao();
  renderBanner();
  renderBadge();
  if (state.view === "agenda") renderAgenda();
  if (state.view === "confirmar") renderPendentes();
  if (state.view === "historico") renderHistorico();
  if (state.view === "ajustes") renderAjustes();
  if (state.view === "painel") renderPainel();
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
  return `<li class="appt is-${a.status} ${grupoCls(a)}">
    <div class="appt-top">
      <span class="svc-ic" aria-hidden="true">${grupoIcone(a)}</span>
      <div class="appt-main">
        ${mostrarData ? `<p class="date-line">${fmtCurto(a.data)}</p>` : ""}
        <p class="name">${esc(a.paciente)}</p>
        <p class="svc">${esc(svcNome(a))}</p>
      </div>
      <div class="hour">${esc(a.hora)}<small>${fmtDur(a.duracao)}</small></div>
    </div>
    <div class="body">
      <div class="chips-row"><span class="tag ${a.status}">${STATUS[a.status] || a.status}</span>${a.exemplo ? '<span class="tag ex">exemplo</span>' : ""}</div>
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

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function contagemPorDia() {
  const c = {};
  state.items.forEach(a => {
    if (!ativo(a)) return;
    const d = (c[a.data] ||= { n: 0, pend: 0 });
    d.n++;
    if (pendente(a)) d.pend++;
  });
  return c;
}

function monthHTML() {
  const [y, m] = state.mes.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = new Date(y, m - 1, 1 - first.getDay());
  const semanas = Math.ceil((first.getDay() + new Date(y, m, 0).getDate()) / 7);
  const t = todayIso(), c = contagemPorDia();
  let h = LETRAS.map(l => `<span class="m-wd">${l}</span>`).join("");
  for (let i = 0; i < semanas * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const s = iso(d), info = c[s];
    const cls = ["m-day", d.getMonth() !== m - 1 ? "out" : "", s === t ? "today" : "", s === state.sel ? "sel" : "", info ? "has" : ""].join(" ");
    const dots = info ? `<span class="m-dots">${"<i></i>".repeat(Math.min(info.n, 3))}${info.n > 3 ? "<b>+</b>" : ""}</span>` : `<span class="m-dots"></span>`;
    h += `<button type="button" class="${cls}" data-day="${s}" aria-label="${fmtLongo(s)}${info ? `, ${plural(info.n, "atendimento")}` : ""}"><span class="m-n">${d.getDate()}</span>${dots}${info?.pend ? '<span class="m-pend" title="A confirmar"></span>' : ""}</button>`;
  }
  return h;
}

function weekStripHTML() {
  const t = todayIso(), c = contagemPorDia();
  const ini = addDays(state.sel, -parse(state.sel).getDay());
  let h = "";
  for (let i = 0; i < 7; i++) {
    const s = addDays(ini, i);
    const cls = ["wk-day", s === t ? "today" : "", s === state.sel ? "sel" : "", c[s] ? "has" : ""].join(" ");
    h += `<button type="button" class="${cls}" data-day="${s}" aria-label="${fmtLongo(s)}${c[s] ? `, ${plural(c[s].n, "atendimento")}` : ""}"><span class="w">${DIAS_CURTOS[i]}</span><span class="n">${parse(s).getDate()}</span><span class="dot"></span></button>`;
  }
  return h;
}

const HORA_PX = 64;
function timelineHTML(doDia) {
  const its = doDia.map(a => ({ a, ini: toMin(a.hora), fim: toMin(a.hora) + Math.min(+a.duracao || 60, 240) }));
  let h0 = 7, h1 = 20;
  its.forEach(x => { h0 = Math.min(h0, Math.floor(x.ini / 60)); h1 = Math.max(h1, Math.ceil(x.fim / 60)); });
  h1 = Math.min(h1, 24);
  const px = min => ((min - h0 * 60) / 60) * HORA_PX;

  // colunas para atendimentos no mesmo horário
  its.sort((p, q) => p.ini - q.ini || q.fim - p.fim);
  let grupo = [], fimGrupo = -1;
  const fecha = () => { const n = Math.max(...grupo.map(g => g.col)) + 1; grupo.forEach(g => (g.cols = n)); grupo = []; };
  its.forEach(x => {
    if (grupo.length && x.ini >= fimGrupo) fecha();
    const usadas = grupo.filter(g => g.fim > x.ini).map(g => g.col);
    let col = 0; while (usadas.includes(col)) col++;
    x.col = col; grupo.push(x); fimGrupo = Math.max(fimGrupo, x.fim);
  });
  if (grupo.length) fecha();

  let h = `<div class="tl" style="height:${(h1 - h0) * HORA_PX}px">`;
  for (let hr = h0; hr < h1; hr++) {
    h += `<div class="tl-row" style="top:${px(hr * 60)}px"><span class="tl-label">${pad(hr)}h</span></div>`;
    for (const mm of [0, 30]) h += `<button type="button" class="tl-slot" data-slot="${pad(hr)}:${pad(mm)}" style="top:${px(hr * 60 + mm)}px" aria-label="Agendar às ${pad(hr)}:${pad(mm)}"></button>`;
  }
  if (state.sel === todayIso()) {
    const agora = toMin(nowHM());
    if (agora >= h0 * 60 && agora <= h1 * 60) h += `<div class="tl-now" style="top:${px(agora)}px"></div>`;
  }
  its.forEach(({ a, ini, fim, col, cols }) => {
    const alto = Math.max(px(fim) - px(ini), 40);
    const curto = alto < 58;
    h += `<button type="button" class="tl-ev is-${a.status} ${grupoCls(a)}${curto ? " curto" : ""}" data-act="detalhe" data-id="${a.id}"
      style="top:${px(ini) + 1}px;height:${alto - 2}px;left:calc(var(--tl-gutter) + (100% - var(--tl-gutter)) * ${col} / ${cols});width:calc((100% - var(--tl-gutter)) / ${cols} - 4px)">
      <span class="tl-name">${esc(a.paciente)}</span>
      <span class="tl-meta">${esc(a.hora)}–${pad(Math.floor(fim / 60) % 24)}:${pad(fim % 60)} · ${esc(svcNome(a))}</span>
      ${pendente(a) ? `<span class="tl-flag">a confirmar</span>` : a.status === "realizado" ? `<span class="tl-flag ok">${ICON_CHECK}</span>` : ""}
    </button>`;
  });
  return h + `</div><p class="tl-hint">Toque num horário livre para agendar.</p>`;
}

function renderAgenda() {
  const sel = state.sel, t = todayIso();
  const linha = state.modo === "linha";
  document.querySelectorAll("[data-modo]").forEach(b => b.classList.toggle("on", b.dataset.modo === state.modo));

  // título: mês exibido
  const [y, m] = (linha ? sel.slice(0, 7) : state.mes).split("-").map(Number);
  $("calTitle").innerHTML = `${MESES[m - 1]}${y !== new Date().getFullYear() ? ` <span>${y}</span>` : ""}`;
  $("navPrev").setAttribute("aria-label", linha ? "Semana anterior" : "Mês anterior");
  $("navNext").setAttribute("aria-label", linha ? "Próxima semana" : "Próximo mês");

  $("monthGrid").hidden = linha;
  $("wkDays").hidden = !linha;
  if (linha) $("wkDays").innerHTML = weekStripHTML();
  else $("monthGrid").innerHTML = monthHTML();

  // dia selecionado
  const doDia = state.items.filter(a => a.data === sel).sort(byTime);
  const ativos = doDia.filter(ativo);
  const nPend = doDia.filter(pendente).length;
  const nome = fmtLongo(sel);
  $("dayTitle").textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
  const rel = sel === t ? "Hoje" : sel === addDays(t, 1) ? "Amanhã" : sel === addDays(t, -1) ? "Ontem" : "";
  $("daySub").textContent = [rel, ativos.length ? plural(ativos.length, "atendimento") : "Dia livre", nPend ? `${nPend} a confirmar` : ""].filter(Boolean).join(" · ");

  $("dayList").hidden = linha;
  $("timeline").hidden = !linha;
  if (linha) {
    $("timeline").innerHTML = timelineHTML(doDia);
  } else {
    $("dayList").innerHTML = doDia.length
      ? doDia.map(a => apptHTML(a)).join("")
      : `<li class="empty"><h3>Nenhum atendimento neste dia</h3><p>Toque em <em>Agendar</em> para marcar uma paciente.</p></li>`;
  }

  renderHero();
}

// Cartão de hoje, no topo da agenda
function renderHero() {
  const t = todayIso();
  const hoje = state.items.filter(a => a.data === t && ativo(a)).sort(byTime);
  const previsto = hoje.filter(a => a.status !== "faltou").reduce((s, a) => s + valor(a), 0);
  const pend = state.items.filter(pendente).length;
  $("hAt").textContent = hoje.length;
  $("hAtL").textContent = hoje.length === 1 ? "atendimento" : "atendimentos";
  $("hVal").textContent = brl(previsto);
  $("hPend").textContent = pend;
  const agora = nowHM();
  const prox = hoje.find(a => a.hora >= agora && a.status !== "realizado");
  $("hNext").innerHTML = prox
    ? `<span class="dot"></span>Próximo: <b>${esc(prox.hora)}</b> · ${esc(prox.paciente)}`
    : hoje.length ? `<span class="dot"></span>Nenhum atendimento restante hoje` : `<span class="dot"></span>Dia livre`;
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
  $("histList").innerHTML = list.length ? list.map(a => `<li data-act="editar" data-id="${a.id}" class="${grupoCls(a)}">
      <span class="svc-ic sm" aria-hidden="true">${grupoIcone(a)}</span>
      <span class="h-date">${fmtCurto(a.data)} · ${esc(a.hora)}</span>
      <span class="h-name">${esc(a.paciente)}</span>
      <span class="h-svc">${esc(svcNome(a))}${a.sessao ? ` · sessão ${esc(a.sessao)}` : ""}</span>
      <span class="h-right"><span class="tag ${a.status}">${STATUS[a.status]}</span>${valor(a) ? `<span class="price ${a.pagamento || a.status === "cancelado" ? "" : "open"}">${brl(a.valor)}</span>` : ""}</span>
    </li>`).join("")
    : `<li class="empty" style="cursor:default"><h3>Nada encontrado</h3><p>Tente outro nome ou filtro.</p></li>`;
  const soma = list.filter(ativo).reduce((s, a) => s + valor(a), 0);
  $("histFoot").textContent = list.length ? `${list.length} atendimento${list.length > 1 ? "s" : ""} · ${brl(soma)}` : "";
}

function renderTipos() {
  const uso = {};
  state.items.forEach(a => (uso[a.servico] = (uso[a.servico] || 0) + 1));
  $("tiposList").innerHTML = gruposEmUso().map(g => {
    const its = SERVICOS.filter(s => s.grupo === g);
    if (!its.length) return "";
    const gc = "g" + ((GRUPOS.indexOf(g) >= 0 ? GRUPOS.indexOf(g) : 4) + 1), ic = ICONES_GRUPO[GRUPOS.indexOf(g) >= 0 ? GRUPOS.indexOf(g) : 4];
    return `<section class="tipo-grupo ${gc}"><p class="tipo-g"><span class="svc-ic sm">${ic}</span>${esc(g)}</p><ul>${its.map(s => `
      <li><button type="button" class="tipo" data-tipo="${esc(s.id)}">
        <span class="tipo-nome">${esc(s.nome)}</span>
        <span class="tipo-val">${s.valor ? brl(s.valor) : "a combinar"}</span>
        <span class="tipo-dur">${fmtDur(s.duracao)}${s.local ? ` · ${esc(s.local)}` : ""}${uso[s.id] ? ` · ${plural(uso[s.id], "agendamento")}` : ""}</span>
      </button></li>`).join("")}</ul></section>`;
  }).join("");
}

function openTipo(s) {
  state.tipo = s?.id || null;
  $("tipoEyebrow").textContent = s ? "Editar tipo de atendimento" : "Novo tipo de atendimento";
  $("tipoTitle").textContent = s ? s.nome : "Tipo de atendimento";
  $("t-nome").value = s?.nome || "";
  $("t-valor").value = s?.valor ?? "";
  $("t-duracao").value = s?.duracao || 60;
  $("t-grupo").innerHTML = gruposEmUso().map(g => `<option>${esc(g)}</option>`).join("");
  $("t-grupo").value = s?.grupo || "Outros atendimentos";
  $("t-local").value = s?.local || "";
  $("t-hint").value = s?.hint || "";
  const ex = $("btnExcluirTipo"); ex.hidden = !s; ex.classList.remove("armed"); ex.textContent = "Excluir";
  openSheet("sheetTipo");
  if (!s) setTimeout(() => $("t-nome").focus(), 60);
}
function salvarTipo(ev) {
  ev.preventDefault();
  const nome = $("t-nome").value.trim();
  if (!nome) { $("t-nome").focus(); toast("Informe o nome do atendimento."); return; }
  const v = $("t-valor").value;
  const dados = {
    nome, grupo: $("t-grupo").value,
    valor: v === "" ? null : Math.max(0, +v),
    duracao: Math.min(720, Math.max(15, +$("t-duracao").value || 60)),
    local: $("t-local").value || undefined,
    hint: $("t-hint").value.trim() || undefined
  };
  const novo = !state.tipo;
  if (novo) SERVICOS.push({ id: "t-" + uid(), ...dados });
  else Object.assign(SVC[state.tipo], dados);
  if (!salvarServicos()) return;
  closeSheets(); renderTipos();
  toast(novo ? "Tipo de atendimento criado" : "Tipo de atendimento salvo");
}
function excluirTipo() {
  const b = $("btnExcluirTipo");
  if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = "Toque de novo para excluir"; return; }
  SERVICOS = SERVICOS.filter(s => s.id !== state.tipo);
  salvarServicos(); closeSheets(); renderTipos();
  toast("Tipo excluído. Os agendamentos já feitos continuam com o nome.");
}

/* ============ Painel (semana / mês) ============ */
const painel = { modo: "semana", ref: todayIso() };

function periodo(ref, modo) {
  if (modo === "mes") {
    const d = parse(ref);
    const ini = iso(new Date(d.getFullYear(), d.getMonth(), 1));
    const fim = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    return { ini, fim };
  }
  const ini = addDays(ref, -parse(ref).getDay());
  return { ini, fim: addDays(ini, 6) };
}
function anterior(p, modo) {
  return modo === "mes" ? periodo(addDays(p.ini, -1), "mes") : { ini: addDays(p.ini, -7), fim: addDays(p.ini, -1) };
}
const pagoDeFato = a => a.pagamento && a.pagamento !== "Incluso no pacote";
function metricas({ ini, fim }) {
  const its = state.items.filter(a => a.data >= ini && a.data <= fim);
  const conta = st => its.filter(a => a.status === st).length;
  const realizados = conta("realizado"), faltas = conta("faltou"), cancelados = conta("cancelado");
  const previstos = its.filter(a => a.status === "agendado" || a.status === "confirmado").length;
  const cobravel = its.filter(a => a.status !== "cancelado" && a.status !== "faltou");
  const recebido = cobravel.filter(pagoDeFato).reduce((s, a) => s + valor(a), 0);
  // a receber = já atendido e ainda não pago; previsto = agendamentos futuros ainda não pagos
  const abertos = cobravel.filter(a => a.status === "realizado" && !a.pagamento && valor(a) > 0);
  const aReceber = abertos.reduce((s, a) => s + valor(a), 0);
  const previsto = cobravel.filter(a => a.status !== "realizado" && !a.pagamento).reduce((s, a) => s + valor(a), 0);
  const pacientes = new Set(its.filter(ativo).map(a => (a.paciente || "").trim().toLowerCase())).size;
  const comparec = realizados + faltas ? Math.round((realizados / (realizados + faltas)) * 100) : null;
  return { its, realizados, faltas, cancelados, previstos, recebido, aReceber, previsto, abertos, pacientes, comparec, cobravel };
}

function delta(atual, antes, fmt, rotulo) {
  const d = atual - antes;
  if (!antes && !atual) return "";
  if (d === 0) return `<span class="kpi-d">igual ${rotulo}</span>`;
  return `<span class="kpi-d ${d > 0 ? "up" : "down"}">${d > 0 ? "▲" : "▼"} ${fmt(Math.abs(d))} ${rotulo}</span>`;
}

function barTopo(x, y, w, h, r) {
  // retângulo com só os cantos de cima arredondados (base reta no eixo)
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function graficoDias(p) {
  const dias = [];
  for (let s = p.ini; s <= p.fim; s = addDays(s, 1)) {
    const its = state.items.filter(a => a.data === s);
    dias.push({ s, feitos: its.filter(a => a.status === "realizado").length, prev: its.filter(a => a.status === "agendado" || a.status === "confirmado").length });
  }
  const max = Math.max(2, ...dias.map(d => d.feitos + d.prev));
  const W = 340, H = 150, L = 22, B = 20, T = 8;
  const band = (W - L) / dias.length, bw = Math.max(4, Math.min(28, band * (dias.length > 7 ? 0.62 : 0.5)));
  const y = v => T + (H - T - B) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);
  const t = todayIso();
  let g = ticks.map(v => `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 3.5}" class="ax" text-anchor="end">${v}</text>`).join("");
  dias.forEach((d, i) => {
    const cx = L + band * i + band / 2, x = cx - bw / 2;
    const total = d.feitos + d.prev;
    const mostrarRotulo = dias.length <= 7 || i === 0 || (i + 1) % 5 === 0;
    const rot = dias.length <= 7 ? DIAS_CURTOS[parse(d.s).getDay()] : String(parse(d.s).getDate());
    if (mostrarRotulo) g += `<text x="${cx}" y="${H - 5}" class="ax${d.s === t ? " hoje" : ""}" text-anchor="middle">${rot}</text>`;
    if (d.feitos) {
      const h = (H - T - B) * d.feitos / max;
      g += d.prev ? `<rect x="${x}" y="${y(d.feitos)}" width="${bw}" height="${h}" class="s1"/>` : `<path d="${barTopo(x, y(d.feitos), bw, h, 4)}" class="s1"/>`;
    }
    if (d.prev) {
      const yTop = y(total), h = (H - T - B) * d.prev / max - (d.feitos ? 2 : 0);
      g += `<path d="${barTopo(x, yTop, bw, Math.max(h, 1), 4)}" class="s2"/>`;
    }
    const tip = `${fmtCurto(d.s)}|Realizados: ${d.feitos}|Agendados: ${d.prev}`;
    g += `<rect x="${L + band * i}" y="${T}" width="${band}" height="${H - T - B}" class="hit" data-tip="${esc(tip)}" data-day="${d.s}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Atendimentos por dia">${g}</svg>`;
}

function renderPainel() {
  const p = periodo(painel.ref, painel.modo), ant = anterior(p, painel.modo);
  const m = metricas(p), mAnt = metricas(ant);
  const t = todayIso(), semana = painel.modo === "semana";
  document.querySelectorAll("[data-pmodo]").forEach(b => b.classList.toggle("on", b.dataset.pmodo === painel.modo));

  // título
  if (semana) {
    const iniHoje = periodo(t, "semana").ini;
    $("pTitle").textContent = p.ini === iniHoje ? "Esta semana" : p.ini === addDays(iniHoje, -7) ? "Semana passada" : p.ini === addDays(iniHoje, 7) ? "Próxima semana" : "Semana";
    const a = parse(p.ini), b = parse(p.fim);
    $("pSub").textContent = a.getMonth() === b.getMonth()
      ? `${a.getDate()} a ${b.getDate()} de ${MESES[b.getMonth()].toLowerCase()}`
      : `${a.getDate()} de ${MESES[a.getMonth()].toLowerCase()} a ${b.getDate()} de ${MESES[b.getMonth()].toLowerCase()}`;
  } else {
    const d = parse(p.ini);
    $("pTitle").innerHTML = `${MESES[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ` <span>${d.getFullYear()}</span>` : ""}`;
    const mesT = t.slice(0, 7), mesP = p.ini.slice(0, 7);
    $("pSub").textContent = mesP === mesT ? "Mês atual" : mesP < mesT ? "Mês encerrado" : "Mês futuro";
  }
  const rot = semana ? "vs semana anterior" : "vs mês anterior";
  const n = v => String(v);

  $("pKpis").innerHTML = `
    <div class="kpi"><span class="bar"></span><h3>Realizados</h3><p class="kpi-v">${m.realizados}</p>
      <p class="kpi-s">${m.previstos ? `+ ${plural(m.previstos, "agendado")}` : "nenhum agendado pela frente"}</p>${delta(m.realizados, mAnt.realizados, n, rot)}</div>
    <div class="kpi"><span class="bar"></span><h3>Recebido</h3><p class="kpi-v money">${brl(m.recebido)}</p>
      <p class="kpi-s">${m.cobravel.filter(pagoDeFato).length ? plural(m.cobravel.filter(pagoDeFato).length, "pagamento") : "nenhum pagamento"}</p>${delta(m.recebido, mAnt.recebido, brl, rot)}</div>
    <div class="kpi"><span class="bar"></span><h3>A receber</h3><p class="kpi-v money${m.aReceber ? " open" : ""}">${brl(m.aReceber)}</p>
      <p class="kpi-s">${m.abertos.length ? plural(m.abertos.length, "atendimento") + " sem pagamento" : "nada pendente"}</p>
      ${m.previsto ? `<span class="kpi-d">+ ${brl(m.previsto)} previsto nos agendamentos</span>` : ""}</div>
    <div class="kpi"><span class="bar"></span><h3>Comparecimento</h3><p class="kpi-v">${m.comparec === null ? "—" : m.comparec + "%"}</p>
      <p class="kpi-s">${plural(m.faltas, "falta")} · ${plural(m.pacientes, "paciente")}</p></div>`;

  $("pDias").innerHTML = graficoDias(p);

  // presença
  const tot = m.realizados + m.faltas + m.cancelados + m.previstos;
  const seg = [["realizado", "Realizados", m.realizados], ["previsto", "Agendados", m.previstos], ["faltou", "Faltas", m.faltas], ["cancelado", "Cancelados", m.cancelados]].filter(s => s[2]);
  $("pPresNote").textContent = tot ? plural(tot, "agendamento") : "";
  $("pPresenca").innerHTML = tot
    ? `<div class="seg-bar">${seg.map(s => `<span class="sg ${s[0]}" style="flex:${s[2]}" data-tip="${s[1]}|${s[2]} de ${tot} (${Math.round(s[2] / tot * 100)}%)"></span>`).join("")}</div>
       <ul class="seg-legend">${seg.map(s => `<li><i class="sg ${s[0]}"></i>${s[1]} <b>${s[2]}</b></li>`).join("")}</ul>`
    : `<p class="p-empty">Nenhum atendimento neste período.</p>`;

  // faturamento por tipo
  const porTipo = {};
  m.cobravel.forEach(a => { const k = svcNome(a); porTipo[k] = (porTipo[k] || 0) + valor(a); });
  let tipos = Object.entries(porTipo).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]);
  if (tipos.length > 6) { const resto = tipos.slice(5).reduce((s, e) => s + e[1], 0); tipos = [...tipos.slice(0, 5), ["Outros", resto]]; }
  const maxT = Math.max(...tipos.map(e => e[1]), 1);
  $("pTipos").innerHTML = tipos.length
    ? `<ul class="hbars">${tipos.map(([nome, v]) => `<li data-tip="${esc(nome)}|${brl(v)}"><span class="hb-l">${esc(nome)}</span><span class="hb-v">${brl(v)}</span><span class="hb-track"><span class="hb-bar" style="width:${Math.max(2, v / maxT * 100)}%"></span></span></li>`).join("")}</ul>`
    : `<p class="p-empty">Sem valores neste período.</p>`;

  // a receber
  const abertos = [...m.abertos].sort(byTime);
  $("pRecNote").textContent = abertos.length ? brl(m.aReceber) : "";
  $("pReceber").innerHTML = abertos.length
    ? abertos.map(a => `<li data-act="detalhe" data-id="${a.id}"><span class="pl-d">${DIAS_CURTOS[parse(a.data).getDay()]}<b>${ddmm(a.data)}</b></span><span class="pl-n">${esc(a.paciente)}<small>${esc(svcNome(a))}</small></span><span class="price open">${brl(a.valor)}</span></li>`).join("")
    : `<li class="p-empty">Nenhum atendimento feito sem pagamento neste período.</li>`;
}

function renderAjustes() {
  renderTipos();
  $("rowEx").hidden = !state.items.some(a => a.exemplo);
  $("totalItens").textContent = `${state.items.length} atendimento${state.items.length === 1 ? "" : "s"} guardado${state.items.length === 1 ? "" : "s"} neste aparelho.`;
}

/* ============ Navegação ============ */
function setView(v) {
  state.view = v;
  ["agenda", "painel", "confirmar", "historico", "ajustes"].forEach(n => ($("view-" + n).hidden = n !== v));
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  $("btnNovo").hidden = v === "ajustes" || v === "painel";
  if (location.hash !== "#" + v) history.replaceState(null, "", "#" + v);
  window.scrollTo(0, 0);
  render();
}

/* ============ Formulário ============ */
function fillServicos(extra) {
  // extra: atendimento antigo cujo tipo foi excluído, para não perder o nome ao editar
  let h = gruposEmUso().map(g => {
    const its = SERVICOS.filter(s => s.grupo === g);
    return its.length ? `<optgroup label="${esc(g)}">${its.map(s => `<option value="${esc(s.id)}">${esc(s.nome)}</option>`).join("")}</optgroup>` : "";
  }).join("");
  if (extra && !SVC[extra.servico]) h += `<optgroup label="Tipo excluído"><option value="${esc(extra.servico || "")}">${esc(extra.servicoNome || "Atendimento")}</option></optgroup>`;
  $("f-servico").innerHTML = h;
}
function svcChanged(aplicarPadrao) {
  const s = SVC[$("f-servico").value];
  const padrao = s ? [s.valor ? brl(s.valor) : "valor a combinar", fmtDur(s.duracao)].join(" · ") : "";
  $("svcHint").textContent = s ? `Padrão: ${padrao}${s.hint ? `. ${s.hint}` : ""}` : "";
  $("svcHint").hidden = !s;
  if (aplicarPadrao && s) {
    $("f-valor").value = s.valor ?? "";
    $("f-duracao").value = String(s.duracao || 60);
    if (s.local) $("f-local").value = s.local;
    checkConflito();
  }
}
function openSheet(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
function openDetalhe(a) {
  $("detalheBody").innerHTML = apptHTML(a, { mostrarData: true });
  openSheet("sheetDetalhe");
}
function closeSheets() {
  ["sheetForm", "sheetConf", "sheetRecibo", "sheetDetalhe", "sheetTipo"].forEach(id => ($(id).hidden = true));
  document.body.style.overflow = "";
  state.editing = null; state.confirming = null; state.recibo = null; state.tipo = null;
}

function openForm(a, pre = {}) {
  state.editing = a?.id || null;
  $("formEyebrow").textContent = a ? "Editar agendamento" : "Novo agendamento";
  $("formTitle").textContent = a ? a.paciente : "Agendar atendimento";
  $("f-paciente").value = a?.paciente || "";
  $("f-telefone").value = a?.telefone || "";
  $("f-local").value = a?.local || "Consultório";
  fillServicos(a);
  $("f-servico").value = a ? (a.servico || "") : (SVC.avaliacao ? "avaliacao" : SERVICOS[0]?.id || "");
  $("f-data").value = a?.data || state.sel;
  $("f-hora").value = a?.hora || pre.hora || "09:00";
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
    servico: $("f-servico").value,
    servicoNome: SVC[$("f-servico").value]?.nome || $("f-servico").selectedOptions[0]?.textContent || "",
    data: $("f-data").value, hora: $("f-hora").value, duracao: Math.min(720, Math.max(15, +$("f-duracao").value || 60)),
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
  state.sel = dados.data; state.mes = dados.data.slice(0, 7);
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
  state.mes = state.sel.slice(0, 7);
  try { localStorage.setItem("fisiomais:modo", m); } catch (e) {}
  renderAgenda();
  if (m === "linha") rolarParaAgora();
}
function selecionar(s) { state.sel = s; state.mes = s.slice(0, 7); renderAgenda(); }
function navegar(dir) {
  if (state.modo === "linha") return selecionar(addDays(state.sel, 7 * dir));
  const [y, m] = state.mes.split("-").map(Number);
  const novo = iso(new Date(y, m - 1 + dir, 1)).slice(0, 7);
  state.mes = novo;
  state.sel = todayIso().slice(0, 7) === novo ? todayIso() : novo + "-01";
  renderAgenda();
}
function rolarParaAgora() {
  // na linha do tempo, leva a tela até o primeiro atendimento (ou 8h)
  requestAnimationFrame(() => {
    const alvo = document.querySelector("#timeline .tl-ev") || document.querySelector('#timeline [data-slot="08:00"]');
    if (alvo) window.scrollTo({ top: Math.max(0, alvo.getBoundingClientRect().top + window.scrollY - 220), behavior: "smooth" });
  });
}
document.querySelectorAll("[data-modo]").forEach(b => b.addEventListener("click", () => setModo(b.dataset.modo)));
$("monthGrid").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (b) selecionar(b.dataset.day); });
$("wkDays").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (b) selecionar(b.dataset.day); });
$("navPrev").addEventListener("click", () => navegar(-1));
$("navNext").addEventListener("click", () => navegar(1));
$("btnHoje").addEventListener("click", () => selecionar(todayIso()));
$("timeline").addEventListener("click", e => {
  const s = e.target.closest("[data-slot]");
  if (s) openForm(null, { hora: s.dataset.slot });
});

// deslizar com o dedo no calendário e na faixa da semana
let tx = null;
["monthGrid", "wkDays"].forEach(id => {
  $(id).addEventListener("touchstart", e => (tx = e.touches[0].clientX), { passive: true });
  $(id).addEventListener("touchend", e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) navegar(dx < 0 ? 1 : -1);
  });
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
  if (el.closest("#sheetDetalhe")) $("sheetDetalhe").hidden = true; // troca o detalhe pela ação escolhida
  switch (el.dataset.act) {
    case "detalhe": if (a) openDetalhe(a); break;
    case "editar": if (a) openForm(a); break;
    case "confirmar": if (a) openConfirmar(a); break;
    case "recibo": if (a) openRecibo(a); break;
    case "limpar-ex":
      state.items = state.items.filter(x => !x.exemplo); store.save(); render(); toast("Exemplos removidos"); break;
  }
});

// Painel
document.querySelectorAll("[data-pmodo]").forEach(b => b.addEventListener("click", () => { painel.modo = b.dataset.pmodo; renderPainel(); }));
$("pPrev").addEventListener("click", () => { painel.ref = painel.modo === "mes" ? addDays(periodo(painel.ref, "mes").ini, -1) : addDays(painel.ref, -7); renderPainel(); });
$("pNext").addEventListener("click", () => { painel.ref = painel.modo === "mes" ? addDays(periodo(painel.ref, "mes").fim, 1) : addDays(painel.ref, 7); renderPainel(); });
$("pHoje").addEventListener("click", () => { painel.ref = todayIso(); renderPainel(); });
$("pDias").addEventListener("click", e => { const r = e.target.closest("[data-day]"); if (r) { state.sel = r.dataset.day; state.mes = r.dataset.day.slice(0, 7); setView("agenda"); } });

// Dica ao passar o dedo/mouse nos gráficos
function mostrarDica(el, x, y) {
  const [titulo, ...linhas] = el.dataset.tip.split("|");
  const tip = $("tip");
  tip.innerHTML = `<b>${esc(titulo)}</b>${linhas.map(l => `<span>${esc(l)}</span>`).join("")}`;
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)) + "px";
  tip.style.top = Math.max(8, y - h - 14) + "px";
}
$("view-painel").addEventListener("pointermove", e => {
  const el = e.target.closest("[data-tip]");
  if (el) mostrarDica(el, e.clientX, e.clientY); else $("tip").hidden = true;
});
$("view-painel").addEventListener("pointerleave", () => ($("tip").hidden = true));
window.addEventListener("scroll", () => ($("tip").hidden = true), { passive: true });

$("btnNovoTipo").addEventListener("click", () => openTipo(null));
$("tiposList").addEventListener("click", e => { const b = e.target.closest("[data-tipo]"); if (b) openTipo(SVC[b.dataset.tipo]); });
$("formTipo").addEventListener("submit", salvarTipo);
$("btnExcluirTipo").addEventListener("click", excluirTipo);
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
setView(["agenda", "painel", "confirmar", "historico", "ajustes"].includes(inicial) ? inicial : "agenda");

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  // Quando uma versão nova do app assume, recarrega uma vez para não misturar arquivos antigos e novos.
  const tinhaVersao = !!navigator.serviceWorker.controller;
  let recarregou = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!tinhaVersao || recarregou) return;
    recarregou = true;
    location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
      .then(reg => reg.update())
      .catch(() => {});
  });
}
