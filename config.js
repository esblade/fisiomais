// Conexão com o Supabase (Project Settings → API).
// A chave aqui é a pública (anon / publishable): pode ficar no site.
// Quem protege os dados são o login e as regras do arquivo supabase/fisiomais.sql.
// Deixe supabaseUrl vazio para usar o app só no aparelho, sem sincronizar.
window.FISIO_CONFIG = {
  supabaseUrl: "https://zemvlkrymvbbqikzcsqz.supabase.co",
  supabaseKey: "sb_publishable_eQqa_K8f93tQplsoK7g-fw_MGKhlL9M", // publishable (pública). Nunca coloque a secret aqui.
  schema: "fisiomais",
  // Conta única do app. Crie no Supabase (Authentication → Users → Add user) um usuário
  // com este e-mail e com o PIN de 6 dígitos como senha. O e-mail não aparece no app.
  contaEmail: "maisa@fisiomais.app",
  // Chave pública das notificações: o MESMO valor do segredo VAPID_PUBLIC_KEY do Supabase
  // (a chave pública já usada pelo outro app do projeto). Precisa ser igual, senão os avisos não chegam.
  vapidPublica: ""
};
