# Site — Dra. Fabiana Mugnol

Site institucional de página única (drafabimugnol.com.br), feito a partir do
handoff de design v8 (`design/handoff-v8/`). HTML + CSS + JS puros, **sem etapa
de build**: o que está no repositório é exatamente o que vai ao ar.

## Estrutura
- `index.html` — página principal (todos os textos ficam aqui)
- `planos/index.html` — Área do paciente (entrada no portal Florescer + modalidades)
- `css/site.css` — estilos; cores e fontes da marca em variáveis no topo
- `js/site.js` — rolagem suave, revelação de texto, fundo por seção, fio do
  Caminhar Juntos, botão "Agendar" e as partículas (magnólia e monograma FM).
  Os ajustes das partículas ficam nos objetos `MAGNOLIA` e `MONOGRAMA` no topo.
- `js/area-paciente.js` — entrada no portal do paciente (fala com o Armetz)
- `js/vendor/` — three.js 0.170 e Lenis 1.3.4 (cópias locais, sem CDN)
- `assets/` — fontes Fraunces (OFL) e imagens (WebP), favicon e imagem de compartilhamento
- `vercel.json`, `robots.txt`, `sitemap.xml` — publicação
- `design/handoff-v8/` — protótipo e README do handoff (referência; não vai para produção)
- `design/claude-design/`, `design/marca/` — versões anteriores e manual de marca

## Pendências de conteúdo
- **Concierge**: número provisório `51 99999-9999` (`5551999999999` nos links). Buscar e
  substituir em `index.html` e `planos/index.html`.
- **YouTube**: link marcado com `data-pendente` em `index.html`.

## Área do paciente (`/planos`)
A "Área do paciente" é a porta de entrada do **portal Florescer**, que vive no
Armetz (`app.armetz.com`). O site é estático e **não guarda nem confere dado
nenhum**: `js/area-paciente.js` manda CPF + data de nascimento para
`POST https://app.armetz.com/api/public/portal/entrar` (CORS liberado só para
este domínio), o Armetz confere no servidor e devolve um endereço de entrada de
uso único; o navegador vai para lá e cai dentro do espaço da família.

- Quem entra: qualquer paciente ativo da clínica, pelo CPF do paciente **ou** do
  responsável, com a data de nascimento da mesma pessoa. Irmãos sob o mesmo
  responsável escolhem o nome na tela.
- Erros, bloqueio por tentativas (5 em 15 min) e o aviso "entrada expirada"
  (`/planos/?erro=expirado`) são tratados em `js/area-paciente.js`.
- O conteúdo das modalidades é público; nada sigiloso fica neste repositório.
- Lado do Armetz: `docs/PORTAL_PACIENTE.md` §9 naquele repositório.

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
