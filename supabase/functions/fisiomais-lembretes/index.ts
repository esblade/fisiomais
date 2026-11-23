// Fisio+ · função "fisiomais-lembretes" (Supabase Edge Function)
// Chamada a cada 5 minutos pelo pg_cron (cabeçalho x-cron-secret) para:
//   • enviar o resumo do dia no horário escolhido;
//   • avisar antes de cada atendimento agendado ou confirmado.
// Também aceita pedidos do app:
//   { chave: true }  → devolve a chave VAPID pública (é pública; o painel do Supabase só mostra o digest);
//   { teste: true }  → com o token da usuária, manda um aviso de teste.
//
// Segredos (Edge Functions → Secrets), os mesmos já usados por outros apps do projeto:
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT.
// Segredo próprio do Fisio+ para o agendador: FISIOMAIS_CRON_SECRET (não mexe no CRON_SECRET do outro app).
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos no ambiente das funções.
// Ao publicar, desligue "Verify JWT" (a função confere o acesso por conta própria).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const FUSO = "America/Maceio";
const SCHEMA = "fisiomais";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  db: { schema: SCHEMA },
  auth: { persistSession: false },
});
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:contato@fisiomais.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Inscricao = { user_id: string; endpoint: string; p256dh: string; auth: string; resumo_hora: string; antecedencia_min: number };
type Atendimento = { id: string; paciente: string; data: string; hora: string; duracao?: number; status: string; servicoNome?: string; local?: string; exemplo?: boolean };

// data e hora de agora no fuso de Maceió
function agoraLocal() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  const hora = p.hour === "24" ? "00" : p.hour;
  return { data: `${p.year}-${p.month}-${p.day}`, min: +hora * 60 + +p.minute };
}
const paraMin = (h: string) => { const [a, b] = (h || "0:0").split(":").map(Number); return a * 60 + b; };
const primeiroNome = (n: string) => (n || "").replace(/\s*\(exemplo\)/i, "").trim();

async function enviar(subs: Inscricao[], titulo: string, corpo: string, tag: string) {
  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titulo, corpo, tag, url: "./#agenda" }),
        { TTL: 3600, urgency: "high" },
      );
      ok++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sb.from("push_inscricoes").delete().eq("endpoint", s.endpoint); // aparelho saiu
      else console.error("push falhou", code, (e as Error).message);
    }
  }
  return ok;
}

async function jaEnviado(user_id: string, chave: string) {
  const { error } = await sb.from("push_enviados").insert({ user_id, chave });
  return !!error; // conflito de chave = já foi enviado
}

async function processarUsuaria(user_id: string, subs: Inscricao[]) {
  const agora = agoraLocal();
  const { data: linhas, error } = await sb.from("atendimentos")
    .select("dados").eq("user_id", user_id).eq("excluido", false).eq("dados->>data", agora.data);
  if (error) throw error;
  const hoje = (linhas || []).map((l) => l.dados as Atendimento)
    .filter((a) => !a.exemplo && (a.status === "agendado" || a.status === "confirmado"))
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const pref = subs[0];
  let enviados = 0;

  // resumo do dia
  if (hoje.length && agora.min >= paraMin(pref.resumo_hora) && !(await jaEnviado(user_id, `dia:${agora.data}`))) {
    const titulo = `Hoje: ${hoje.length} atendimento${hoje.length > 1 ? "s" : ""}`;
    const corpo = hoje.slice(0, 4).map((a) => `${a.hora} · ${primeiroNome(a.paciente)}`).join("\n")
      + (hoje.length > 4 ? `\n+ ${hoje.length - 4}` : "");
    enviados += await enviar(subs, titulo, corpo, `dia-${agora.data}`);
  }

  // aviso antes de cada atendimento
  for (const a of hoje) {
    const falta = paraMin(a.hora) - agora.min;
    if (falta < 0 || falta > (pref.antecedencia_min || 30)) continue;
    if (await jaEnviado(user_id, `at:${a.id}:${a.data} ${a.hora}`)) continue;
    const titulo = falta <= 1 ? `Agora: ${primeiroNome(a.paciente)}` : `Em ${falta} min: ${primeiroNome(a.paciente)}`;
    const corpo = [`${a.hora} · ${a.servicoNome || "Atendimento"}`, a.local].filter(Boolean).join(" · ");
    enviados += await enviar(subs, titulo, corpo, `at-${a.id}`);
  }
  return enviados;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // 1) aviso de teste pedido pelo app (com o token da usuária)
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const corpo = await req.json().catch(() => ({}));
  if (corpo?.chave) return json({ vapidPublica: Deno.env.get("VAPID_PUBLIC_KEY") || "" });
  if (corpo?.teste) {
    const { data: u, error } = await sb.auth.getUser(token);
    if (error || !u?.user) return json({ erro: "não autorizado" }, 401);
    const { data: subs } = await sb.from("push_inscricoes").select("*").eq("user_id", u.user.id);
    const n = await enviar((subs || []) as Inscricao[], "Fisio+ funcionando ✓", "Você vai receber o resumo do dia e um aviso antes de cada atendimento.", "teste");
    return json({ enviados: n });
  }

  // 2) rodada do agendador
  const segredo = Deno.env.get("FISIOMAIS_CRON_SECRET");
  if (!segredo || req.headers.get("x-cron-secret") !== segredo) return json({ erro: "não autorizado" }, 401);
  const { data: subs, error } = await sb.from("push_inscricoes").select("*");
  if (error) return json({ erro: error.message }, 500);
  const porUsuaria = new Map<string, Inscricao[]>();
  for (const s of (subs || []) as Inscricao[]) porUsuaria.set(s.user_id, [...(porUsuaria.get(s.user_id) || []), s]);

  let total = 0;
  for (const [user_id, lista] of porUsuaria) {
    try { total += await processarUsuaria(user_id, lista); }
    catch (e) { console.error("usuária", user_id, (e as Error).message); }
  }
  // limpa o histórico de avisos com mais de 7 dias
  await sb.from("push_enviados").delete().lt("enviado_em", new Date(Date.now() - 7 * 864e5).toISOString());
  return json({ usuarias: porUsuaria.size, enviados: total });
});
