// Conexão com o Supabase (Project Settings → API).
// A chave aqui é a pública (anon / publishable): pode ficar no site.
// Quem protege os dados são o login e as regras do arquivo supabase/fisiomais.sql.
// Deixe supabaseUrl vazio para usar o app só no aparelho, sem sincronizar.
window.FISIO_CONFIG = {
  supabaseUrl: "https://zemvlkrymvbbqikzcsqz.supabase.co",
  supabaseKey: "sb_publishable_eQqa_K8f93tQplsoK7g-fw_MGKhlL9M", // publishable (pública). Nunca coloque a secret aqui.
  schema: "fisiomais"
};
