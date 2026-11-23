# Fisio+ · Maisa Alves

App de agenda para a fisioterapeuta Maisa Maria da Silva Alves. Funciona no celular como um aplicativo (pode ser instalado na tela inicial) e abre mesmo sem internet.

## O que faz

- **Agenda**: ver por dia ou pela semana inteira, semana deslizável e resumo do mês (recebido, a receber, realizados e faltas).
- **Agendar**: serviços e valores do portfólio já cadastrados, aviso de horário em conflito e preenchimento automático do WhatsApp de pacientes já atendidas.
- **Confirmar atendimento**: marca o atendimento como realizado (ou falta), registra valor, forma de pagamento (Pix, dinheiro, cartão ou incluso no pacote) e anotações da sessão. A aba *Confirmar* lista tudo o que já passou e ainda não foi confirmado, com um contador.
- **Histórico**: busca por paciente e filtros (próximos, realizados, a receber, faltas, cancelados).
- **Ajustes**: remover os atendimentos de exemplo ou apagar a agenda.

## Onde ficam os dados

Os atendimentos ficam salvos **no próprio aparelho** (no navegador), não em um servidor. Por isso:

- O link do GitHub Pages pode ser aberto por qualquer pessoa, mas ninguém vê os seus atendimentos: cada aparelho tem a sua própria agenda.
- Se você limpar os dados do navegador, desinstalar o app ou trocar de celular, a agenda some.

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

Ao mudar algum arquivo, aumente a versão na primeira linha de `sw.js` (`fisiomais-v1` → `fisiomais-v2`) e envie de novo. O celular pega a versão nova na próxima vez que abrir o app com internet. Os atendimentos salvos não são afetados.

## Testar no computador

```powershell
npx http-server . -p 5190 -c-1
```

Depois abra <http://localhost:5190>.
