# Fisio+ · Maisa Alves

App de agenda para a fisioterapeuta Maisa Maria da Silva Alves. Funciona no celular como um aplicativo (pode ser instalado na tela inicial) e abre mesmo sem internet.

## O que faz

- **Agenda**: duas formas de ver. *Calendário*: o mês inteiro com bolinhas nos dias com atendimento (e um ponto laranja onde há atendimento a confirmar); toque no dia para ver a lista dele. *Linha do tempo*: a semana no topo e o dia em horas, com os atendimentos como blocos e a hora atual marcada; toque num horário livre para agendar nele. Embaixo, o resumo do mês (recebido, a receber, realizados e faltas).
- **Agendar**: ao escolher o tipo de atendimento, valor, duração e local já vêm preenchidos com o padrão, e podem ser alterados só para aquele atendimento. Avisa de horário em conflito e preenche o WhatsApp de pacientes já atendidas.
- **Confirmar atendimento**: marca o atendimento como realizado (ou falta), registra valor, forma de pagamento (Pix, dinheiro, cartão ou incluso no pacote) e anotações da sessão. A aba *Confirmar* lista tudo o que já passou e ainda não foi confirmado, com um contador.
- **Recibo pelo WhatsApp**: ao confirmar, o app prepara uma mensagem para a paciente com o serviço, o número da sessão (ex.: 3 de 4), a data, o pagamento e as datas de todas as sessões já feitas no pacote. Assim fica registrado na conversa quantas sessões ela fez. Dá para reenviar pelo botão *Enviar recibo* no atendimento.
- **Painel**: resumo da semana ou do mês, com setas para ver períodos anteriores: realizados, recebido, a receber (atendido e não pago) e comparecimento, cada um comparado ao período anterior; gráfico de atendimentos por dia (toque no dia para abrir na agenda), presença, faturamento por tipo de atendimento e a lista de quem foi atendido e ainda não pagou.
- **Histórico**: busca por paciente e filtros (próximos, realizados, a receber, faltas, cancelados).
- **Ajustes**: menu com o perfil, conta e sincronização (entrar, sincronizar agora, sair), *Tipos de atendimento* (tela própria com filtro por grupo para criar, editar e excluir tipos com valor, duração e local padrão), atendimentos guardados, remover exemplos e apagar a agenda.

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
3. Em **Authentication → Users → Add user**, crie o usuário da Maisa (e-mail e senha, marcando *Auto Confirm User*). Se ninguém mais deve criar conta, desligue *Allow new users to sign up* em **Authentication → Sign In / Providers**.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon / publishable** e coloque em [`config.js`](config.js). Essa chave é pública e pode ficar no site; quem protege os dados é o login e as regras do passo 1. **Nunca** coloque a chave `service_role` / `secret` no app.
5. Publique. Ao abrir o app, ele pede e-mail e senha; os atendimentos que já estavam no aparelho sobem para o banco.

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

Ao mudar algum arquivo, aumente a versão em `sw.js` (ex.: `fisiomais-v10` → `fisiomais-v11`) e o `?v=` de `styles.css`, `config.js`, `app.js` e `sync.js` no `index.html` (`?v=10` → `?v=11`), e envie de novo. Ao abrir o app com internet, o celular baixa a versão nova e recarrega sozinho uma vez. Os atendimentos salvos não são afetados.

## Testar no computador

```powershell
npx http-server . -p 5190 -c-1
```

Depois abra <http://localhost:5190>.
