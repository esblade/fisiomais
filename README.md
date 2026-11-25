# Fisio+ · Maisa Alves

App de agenda para a fisioterapeuta Maisa Maria da Silva Alves. Funciona no celular como um aplicativo (pode ser instalado na tela inicial) e abre mesmo sem internet.

## O que faz

- **Agenda**: duas formas de ver. *Calendário*: o mês inteiro com bolinhas nos dias com atendimento (e um ponto laranja onde há atendimento a confirmar); toque no dia para ver a lista dele. *Linha do tempo*: a semana no topo e o dia em horas, com os atendimentos como blocos e a hora atual marcada; toque num horário livre para agendar nele. Embaixo, o resumo do mês (recebido, a receber, realizados e faltas).
- **Agendar**: ao escolher o tipo de atendimento, valor, duração e local já vêm preenchidos com o padrão, e podem ser alterados só para aquele atendimento. Dá para marcar o pagamento já no agendamento (quando a paciente paga adiantado), e os agendados sem pagamento têm o botão *Registrar pagamento*. Avisa de horário em conflito e preenche o WhatsApp de pacientes já atendidas.
- **Confirmar atendimento**: marca o atendimento como realizado (ou falta), registra valor, forma de pagamento (Pix, dinheiro, cartão ou incluso no pacote) e anotações da sessão. A aba *Confirmar* lista tudo o que já passou e ainda não foi confirmado, com um contador.
- **Recibo pelo WhatsApp**: ao confirmar, o app prepara uma mensagem para a paciente com o serviço, o número da sessão (ex.: 3 de 4), a data, o pagamento e as datas de todas as sessões já feitas no pacote. Assim fica registrado na conversa quantas sessões ela fez. Dá para reenviar pelo botão *Enviar recibo* no atendimento.
- **Painel**: resumo da semana ou do mês, com setas para ver períodos anteriores: realizados, recebido, a receber (atendido e não pago) e comparecimento, cada um comparado ao período anterior; gráfico de atendimentos por dia (toque no dia para abrir na agenda), presença, faturamento por tipo de atendimento e a lista de quem foi atendido e ainda não pagou.
- **Histórico**: busca por paciente e filtros (próximos, realizados, a receber, faltas, cancelados).
- **Avisos**: resumo do dia e aviso antes de cada atendimento por notificação no celular (veja *Ligar os avisos*).
- **Ajustes**: menu com o perfil, conta e sincronização (sincronizar agora, Face ID / digital, bloquear, sair), *Tipos de atendimento* (tela própria com filtro por grupo para criar, editar e excluir tipos com valor, duração e local padrão), atendimentos guardados, remover exemplos e apagar a agenda.

## Onde ficam os dados

O app salva tudo **no aparelho** e, com login, **sincroniza com o Supabase**:

- Funciona sem internet. As alterações feitas offline ficam guardadas e sobem quando a conexão volta (o selo abaixo da data mostra "Offline · N para enviar").
- Com internet, o app envia o que mudou e baixa o que foi alterado em outro aparelho. Em conflito, fica a alteração mais recente.
- Os atendimentos de exemplo não vão para o banco.
- O link do GitHub Pages é público, mas os dados só aparecem para quem entra com a conta. As regras do banco (RLS) deixam cada conta ver só os próprios registros.
- Sem configurar o Supabase (ou tocando em *Usar só neste aparelho*), o app funciona só no aparelho, como antes.

### Ligar a sincronização (uma vez)

1. No Supabase, abra **SQL Editor**, cole o conteúdo de [`supabase/fisiomais.sql`](supabase/fisiomais.sql) e rode. Ele cria as tabelas `atendimentos` e `servicos` no schema `fisiomais` com as regras de acesso. Se o seu schema tiver outro nome, troque `fisiomais` no arquivo e em `config.js`.
2. Em **Project Settings → Data API → Exposed schemas**, adicione o schema (`fisiomais`) e salve. Sem isso a API não enxerga as tabelas.
3. Em **Authentication → Users → Add user**, crie o usuário do app com o e-mail que está em `contaEmail` no [`config.js`](config.js) (`maisa@fisiomais.app`) e, como senha, o **PIN de 6 dígitos**. Marque *Auto Confirm User*. O e-mail não precisa existir e não aparece no app. Desligue *Allow new users to sign up* em **Authentication → Sign In / Providers**.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon / publishable** e coloque em [`config.js`](config.js). Essa chave é pública e pode ficar no site; quem protege os dados é o login e as regras do passo 1. **Nunca** coloque a chave `service_role` / `secret` no app.
5. Publique. No primeiro acesso de cada aparelho o app pede o PIN e conecta ao banco; os atendimentos que já estavam no aparelho sobem. Depois disso ele abre com Face ID / digital (se ativar) ou com o PIN, conferido no próprio aparelho, e só pede de novo depois de um tempo sem usar o app (5 minutos por padrão, ajustável em Ajustes; recarregar a página não conta). Para trocar o PIN, mude a senha do usuário no Supabase; no próximo desbloqueio com o PIN novo, o app atualiza sozinho.

### Ligar os avisos no celular (uma vez)

O app recebe o **resumo do dia** (no horário escolhido) e um **aviso antes de cada atendimento**, mesmo fechado. Quem envia é a função `fisiomais-lembretes` no Supabase, chamada a cada 5 minutos.

1. **Segredos**: o projeto já tem `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` e `CRON_SECRET` (usados por outro app). O Fisio+ reaproveita os três `VAPID_*`; **não crie nem altere** esses. Crie só um segredo novo, **`FISIOMAIS_CRON_SECRET`**, com o valor aleatório que está no passo a passo (ele protege a rodada automática).
2. **Chave pública no app**: não precisa fazer nada. Com `vapidPublica` vazio no [`config.js`](config.js), o app pede a chave pública à função, que lê o segredo `VAPID_PUBLIC_KEY` (o painel do Supabase só mostra o *digest*, não o valor).
3. **Função**: em **Edge Functions → Deploy a new function → Via Editor**, dê o nome `fisiomais-lembretes`, cole o conteúdo de [`supabase/functions/fisiomais-lembretes/index.ts`](supabase/functions/fisiomais-lembretes/index.ts) e publique. Nas configurações da função, **desligue "Verify JWT"** (ela confere o acesso sozinha).
4. **Agendamento**: abra [`supabase/notificacoes.sql`](supabase/notificacoes.sql), troque `<FISIOMAIS_CRON_SECRET>` pelo mesmo valor do passo 1 e rode no **SQL Editor**. Isso cria as tabelas de inscrição e liga a rodada a cada 5 minutos.
5. **No celular**: abra o app instalado, entre com o PIN e vá em **Ajustes → Avisos → Ativar**. Escolha o horário do resumo e a antecedência, e toque em **Testar**.

No iPhone, os avisos só funcionam com o app **instalado na tela inicial** (iOS 16.4 ou mais novo). Os avisos levam até 5 minutos de diferença, por causa da rodada.

## Publicar no GitHub Pages

1. Crie um repositório novo em <https://github.com/new> (ex.: `fisiomais`). Pode ser público.
2. Envie **o conteúdo desta pasta** (`index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest` e a pasta `icons`) para a raiz do repositório. Pelo site: *Add file → Upload files* e arraste os arquivos.
3. No repositório, vá em **Settings → Pages**. Em *Source* escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
4. Em um ou dois minutos o endereço aparece no topo dessa página, algo como `https://esblade.github.io/fisiomais/`.

Ou pelo terminal, dentro desta pasta:

```powershell
git init
git add .
git commit -m "Fisio+"
git branch -M main
git remote add origin https://github.com/esblade/fisiomais.git
git push -u origin main
```

## Instalar no celular

- **Android (Chrome)**: abra o endereço, toque no menu ⋮ e em **Instalar app** ou **Adicionar à tela inicial**.
- **iPhone (Safari)**: abra o endereço, toque em **Compartilhar** e em **Adicionar à Tela de Início**.

## Atualizar o app

Ao mudar algum arquivo, aumente a versão em `sw.js` (ex.: `fisiomais-v15` → `fisiomais-v16`) e o `?v=` de `styles.css`, `config.js`, `app.js`, `sync.js` e `push.js` no `index.html` (`?v=15` → `?v=16`), e envie de novo. Ao abrir o app com internet, o celular baixa a versão nova e recarrega sozinho uma vez. Os atendimentos salvos não são afetados.

## Testar no computador

```powershell
npx http-server . -p 5190 -c-1
```

Depois abra <http://localhost:5190>.
