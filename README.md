# Site — Dra. Fabiana Mugnol

Site institucional de página única (drafabimugnol.com.br), feito a partir do
handoff de design v8 (`design/handoff-v8/`). HTML + CSS + JS puros, **sem etapa
de build**: o que está no repositório é exatamente o que vai ao ar.

## Estrutura
- `index.html` — página principal (todos os textos ficam aqui)
- `planos/index.html` — Área do paciente (login + modalidades)
- `css/site.css` — estilos; cores e fontes da marca em variáveis no topo
- `js/site.js` — rolagem suave, revelação de texto, fundo por seção, fio do
  Caminhar Juntos, botão "Agendar" e as partículas (magnólia e monograma FM).
  Os ajustes das partículas ficam nos objetos `MAGNOLIA` e `MONOGRAMA` no topo.
- `js/vendor/` — three.js 0.170 e Lenis 1.3.4 (cópias locais, sem CDN)
- `assets/` — fontes Fraunces (OFL) e imagens (WebP), favicon e imagem de compartilhamento
- `vercel.json`, `robots.txt`, `sitemap.xml` — publicação
- `design/handoff-v8/` — protótipo e README do handoff (referência; não vai para produção)
- `design/claude-design/`, `design/marca/` — versões anteriores e manual de marca

## Pendências de conteúdo
- **Foto do moinho / nonno Rico** (4:3): salvar em
  `assets/img/` e trocar o marcador no `index.html` (há um comentário explicando).
- **Concierge**: número provisório `51 99999-9999` (`5551999999999` nos links). Buscar e
  substituir em `index.html` e `planos/index.html`.
- **YouTube**: link marcado com `data-pendente` em `index.html`.

## Área do paciente — atenção
O login de `/planos` ainda é o do protótipo: **qualquer e-mail e senha entram**
(o estado fica só no navegador). Serve para apresentar o fluxo, não protege nada.
Antes de colocar ali conteúdo restrito, trocar por autenticação real no servidor
(ex.: Vercel Middleware + Auth.js, Clerk ou Supabase Auth).

## Visualizar localmente
```
python3 -m http.server 8000
```
e abrir http://localhost:8000 (os caminhos são absolutos, então abrir o arquivo
direto no navegador não funciona).

## Publicação (GitHub → Vercel → registro.br)
1. Vercel → **Add New → Project → Import** este repositório. Framework: *Other*,
   sem comando de build, diretório de saída: raiz. Deploy.
2. Vercel → Project → **Settings → Domains**: adicionar `drafabimugnol.com.br` e
   `www.drafabimugnol.com.br` (redirecionar um para o outro).
3. registro.br → domínio → **DNS** → "Editar zona":
   - `A` · nome em branco · `76.76.21.21`
   - `CNAME` · `www` · `cname.vercel-dns.com.`
   Confirme os valores na tela de Domains da Vercel.
4. Aguardar a propagação; a Vercel emite o HTTPS sozinha.
