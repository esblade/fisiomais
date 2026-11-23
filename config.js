// Conexão com o Supabase (Project Settings → API).
// A chave aqui é a pública (anon / publishable): pode ficar no site.
// Quem protege os dados são o login e as regras do arquivo supabase/fisiomais.sql.
// Deixe supabaseUrl vazio para usar o app só no aparelho, sem sincronizar.
window.FISIO_CONFIG = {
  supabaseUrl: "",
  supabaseKey: "",
  schema: "fisiomais"
};
