# Handoff: Site Dra. Fabiana Mugnol (drafabimugnol.com.br)

## Overview
Site institucional de página única da Dra. Fabiana Mugnol, neurologista (Porto Alegre). Apresenta a médica, o acompanhamento "Caminhar Juntos", os projetos (Rodas de Anil, Cursos e Mentorias, Palestras, Mutirão Florescer), Conteúdos, Parcerias e Contato. Há uma página secundária `/planos`, acessível só após login (Área do paciente).

Destino: repositório no GitHub → deploy na Vercel → domínio `drafabimugnol.com.br` (registro.br).

## About the Design Files
Os arquivos em `referencia/` são **referências de design feitas em HTML** (protótipos que mostram aparência e comportamento), não código de produção para copiar. Eles usam um runtime próprio de prototipagem (`support.js`, tags `<x-dc>`, `<sc-for>`, `<sc-if>`, holes `{{ }}`) que **não deve ir para produção**.

A tarefa é **recriar o design num projeto web real**. Não há base de código existente. Recomendação:
- **Astro** (site estático, ótimo SEO, zero JS por padrão) + ilhas em JS puro para o WebGL, a rolagem suave e o FAQ/login. Alternativa equivalente: **Next.js (App Router, export estático)**.
- **three.js** (0.170) para as partículas, **Lenis** (1.3) para rolagem suave.
- CSS: CSS Modules ou Tailwind, com os tokens abaixo.

Para abrir a referência localmente: sirva a pasta `referencia/` com um servidor estático (`npx serve referencia`) e abra `Landing Fabiana Mugnol v8.dc.html`.

## Fidelity
**Alta fidelidade.** Cores, tipografia, espaçamentos, textos e animações são finais. Recriar com fidelidade visual. Os textos foram revisados e aprovados; manter literalmente (copiar do HTML de referência).

## Estrutura da página (ordem)
| # | id | Fundo (data-tom) | Conteúdo |
|---|----|------|----------|
| — | `topo` | #e3d3ca | Nav + hero fixo (pin) com a magnólia WebGL |
| 01 | `sobre` | #e3d3ca | Quem é: retrato + intro, Trajetória (linha do tempo 5 marcos), Atuação (4 linhas), Ciência/Cuidado/Afeto, frase de fecho |
| 02 | `caminhar` | #ece2db | Caminhar Juntos: título sticky + 5 etapas com fio que se desenha; card "Documentos" dentro da etapa 04; link "Área do paciente →" para `/planos` |
| 03 | `rodas` | #5f454e (texto claro) | Rodas de Anil: intro, "De onde vem o nome" (sticky + foto), lista de 4 itens, fecho "Olhar, tocar, abraçar e conectar." |
| 04 | `cursos` | #ece2db | Cursos e Mentorias: intro, 5 temas em linhas, 3 cards de formatos |
| 05 | `palestras` | #e3d3ca | Palestras: intro + 7 temas numerados |
| 06 | `mutirao` | #d6c1b5 | Mutirão Florescer: intro, 4 passos, Cuidar em rede / Como apoiar |
| 07 | `conteudos` | #ece2db | Conteúdos: Instagram + YouTube, card YouTube (vinho), card "Casados com a Neurodiversidade", Artigos / O que vem por aí |
| 08 | `parcerias` | #e3d3ca | Parcerias: intro, 4 caminhos, card "Nossos princípios" + Concierge |
| — | contato | #52594e (texto claro) | "Fale conosco.", 3 WhatsApps, monograma FM em partículas, endereço + Google Maps, rodapé |

### Layout geral
- Container: `max-width:1360px; margin:0 auto; padding:0 clamp(22px,5vw,72px)`.
- Seções: `padding: clamp(110px,14vw,200px) 0`; gap interno `clamp(60px,8vw,120px)`.
- Blocos de duas colunas: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 300–380px), 1fr)); gap: clamp(40px,7vw,110px)`.
- Breakpoint "estreito": `< 760px` (layout de 1 coluna, magnólia atrás do texto, linha do tempo vertical, mapa abaixo do endereço). Altura "baixa": `< 760px` de altura esconde a faixa inferior do hero.

### Componentes recorrentes
- **Eyebrow:** Jost 500, 12px, `letter-spacing:.22em`, maiúsculas, cor #7d4f50 (claro: #d8c4b8), traço de 34×1px à esquerda, gap 14px. Formato "01 · Quem é Fabiana Mugnol".
- **H2 de seção:** Fraunces 300, `font-variation-settings:'SOFT' 100`, `clamp(40px,5.4vw,84px)`, lh 1.02, ls −0.035em, `text-wrap:balance`. Palavra-chave em itálico #96625f (em fundo escuro #e0b8b2). Em "Quem é" e "Parcerias" o H2 é menor: `clamp(34–36px, 3.6–4.2vw, 56–64px)`.
- **H3 de bloco:** Fraunces 300, `clamp(34px,3.6vw,56px)`, lh 1.06.
- **Frase de entrada (lead):** Fraunces 300, `clamp(19px,1.45vw,21px)` a 24px, lh 1.5, máx. 40ch.
- **Texto corrido:** Jost 300, 16–17px, lh 1.75, cor #52594e, máx. 50–62ch.
- **Linhas de lista:** borda 1px #c4ada2 (escuro: #856b72); rótulo em Fraunces 22–28px + texto Jost 16px; hover desloca `padding-left:16px` em .6s `cubic-bezier(.16,1,.3,1)`.
- **Cards:** fundo #d9c5ba, raio 24–32px, padding `clamp(28px,4–5vw,56–72px)`.
- **Botão primário:** pílula, fundo #5f454e, texto #e3d3ca, Jost 500 12px, ls .18em, maiúsculas, padding 16–17px × 26px; hover fundo #52594e (.5s).
- **Botão flutuante "Agendar":** fixo canto inferior direito; aparece após o hero e some no contato (opacity/translateY .7s).
- **Retrato:** retângulo 4:5, sem arredondamento, legenda "Dra. Fabiana Mugnol · CREMERS 24336 · RQE 37821".

## Interações e animações
1. **Rolagem suave:** Lenis `{ lerp: 0.09, smoothWheel: true }`. Desligar com `prefers-reduced-motion`.
2. **Revelação de texto:** elementos `[data-revela]` entram com `opacity 0→1`, `translateY(26px)→0`, `blur(6px)→0`, 1.2s `cubic-bezier(.16,1,.3,1)`, escalonados 90ms (IntersectionObserver, rootMargin `0px 0px -8% 0px`).
3. **Fundo por seção:** cor do fundo da página interpola para o `data-tom` da seção quando o topo dela cruza 60% da viewport, numa janela de 16% da altura (transição marcada). Implementar no loop de rAF ou com ScrollTrigger.
4. **Hero fixo + magnólia WebGL (three.js):**
   - Wrapper com `height:230vh`; filho `position:sticky; top:0; height:100vh`.
   - `assets/ilu-2-rose.png` amostrada em grade com jitter (passo = prop `fragmento`, padrão 3px) → um fragmento por amostra; mapa de espessura (imagem desfocada) gera relevo z.
   - Cada fragmento é um ponto com forma de **pétala** (shader: oval alongado, base estreita, nervura clara), cor sorteada entre #5f454e, #a87776, #96625f, #d8a8a2, #52594e.
   - Progresso = rolagem dentro do pin (0→1). Em 0 os fragmentos estão espalhados pela tela em profundidade; ao rolar **voam e formam a flor** (da base ao topo), dando **uma volta completa no eixo Y** (`giro` voltas) e assentando de frente. Perspectiva manual `1500/(1500 − z)`; mouse inclina levemente.
   - Renderização em supersampling 2× num render target e composição em quad (bordas macias).
   - Padrões: profundidade 70, giro 0.5, força 0.8, vento 3, fragmento 3, intensidade 0.7, tamanho 7.
5. **Monograma FM (contato):** segundo sistema de pontos a partir de `assets/logo-2-off.png` (passo 1.15px). Pétalas chegam de todas as direções num anel além das bordas da tela, em espiral larga, **coloridas em voo** e ficam **brancas (#fbf7f4)** ao assentar. Progresso: quando o centro do slot do logo passa de 105% → 55% da altura da tela. Padrões: força 0, vento 1, densidade do halo 0, intensidade 0.6, tamanho 4.5.
6. **Fio do Caminhar Juntos:** linha vertical 1px preenche (`scaleY`) conforme a lista atravessa 60% da tela.
7. **Linha do tempo da Trajetória:** 5 colunas iguais ≥760px; vertical abaixo disso; cada item com borda superior própria e ponto de 9px.
8. Os shaders completos estão em `referencia/Landing Fabiana Mugnol v8.dc.html` (métodos `build`, `buildFM`, `tick`). Podem ser portados quase literalmente para um módulo JS.

### Desempenho / acessibilidade
- Limitar `devicePixelRatio` a 2; pausar o rAF quando a aba não está visível.
- `prefers-reduced-motion`: magnólia já montada, sem Lenis, sem revelação.
- Canvas WebGL `aria-hidden`; slots da ilustração com `role="img"` e `aria-label`.
- Fallback sem WebGL: mostrar o PNG estático da magnólia e do logo.

## Página `/planos` (Área do paciente)
- Tela de login (e-mail, senha, "Entrar", "Não tenho acesso" → WhatsApp Suporte). Após login: card "Quando maior proximidade é imprescindível" com Essencial / Integrado / Intensivo e botão Concierge.
- **No protótipo o login é falso** (qualquer dado entra; usa sessionStorage). Em produção, proteger de verdade: ex. **Vercel Middleware + Auth.js**, **Clerk** ou **Supabase Auth**, renderizando o conteúdo só no servidor para usuários autenticados.

## Contatos e links
- WhatsApp Agendamentos e financeiro: **51 99217-9578** (botões gerais "Agendar"/"Falar pelo WhatsApp").
- WhatsApp Suporte e assistência: **51 97401-9090**.
- WhatsApp Concierge: **51 99999-9999** (provisório; confirmar).
- Links `https://wa.me/55<número>?text=<mensagem>`; mensagens no HTML de referência.
- Instagram: https://www.instagram.com/fabimugnol/ · YouTube: pendente.
- Endereço: **Sinapse Clínica**, Rua Padre Chagas, 35 · Sala 401 · Moinhos de Vento · Porto Alegre, RS. Mapa: iframe Google Maps (`output=embed`, z=16) com `filter: grayscale(.7) sepia(.18) contrast(.95)`, raio 24px.

## Design Tokens
**Cores**
- nude `#e3d3ca` · nude claro `#ece2db` · nude profundo `#d6c1b5` · card `#d9c5ba`
- vinho `#5f454e` · vinho texto `#7d4f50` · rosé `#a87776` · rosé escuro `#96625f` · rosé claro `#d8a8a2` / `#e0b8b2`
- musgo `#52594e` · linha clara `#c4ada2` · linha em vinho `#856b72` · linha em musgo `#6b7266`
- branco quente (FM) `#fbf7f4`

**Tipografia**
- Títulos: **Fraunces** (variável, arquivos em `assets/`), peso 300, `SOFT 100`, itálico para ênfases.
- Texto/UI: **Jost** (Google Fonts) 300/400/500.

**Raios:** 0 (retrato, fotos) · 14px (inputs) · 16px (card documentos) · 20–24px (cards, mapa) · 32px (painéis) · 999px (pílulas).
**Sombra:** só no botão flutuante: `0 18px 40px -18px rgba(60,40,45,.55)`.
**Textura:** ruído SVG fixo sobre a página, `opacity .06`, `mix-blend-mode: multiply`.

## Assets
- `assets/ilu-2-rose.png`: magnólia (fonte das partículas).
- `assets/logo-2-off.png`: monograma FM (fonte das partículas do contato).
- `assets/logo-4-bordo.png`: logo da nav e do rodapé (no rodapé com filtro claro).
- `assets/Fraunces.ttf`, `assets/Fraunces-Italic.ttf`.
- **A enviar pelo cliente:** retrato da Dra. Fabiana (no protótipo é um slot de imagem; usar a foto aprovada, 4:5) e a foto opcional do moinho/nonno Rico (4:3). Gerar favicon e imagem Open Graph a partir do monograma.

## SEO
- `<title>`: Dra. Fabiana Mugnol · Neurologista em Porto Alegre
- `lang="pt-BR"`, meta description, Open Graph, `schema.org/Physician` com endereço e CRM.
- Respeitar publicidade médica (Res. CFM 2.336/2023): sem promessa de resultado, CRM/RQE visíveis (já no rodapé).

## Publicação (GitHub → Vercel → registro.br)
1. `npm create astro@latest drafabimugnol` → implementar → `git init` → criar repositório no GitHub e dar push.
2. Na Vercel: **Add New → Project → Import** do repositório (framework detectado automaticamente) → Deploy.
3. Vercel → Project → **Settings → Domains**: adicionar `drafabimugnol.com.br` e `www.drafabimugnol.com.br` (redirecionar www → raiz ou o inverso).
4. No **registro.br** → domínio → **DNS** → "Editar zona" (usar os servidores DNS do registro.br):
   - `A` · nome em branco (raiz) · `76.76.21.21`
   - `CNAME` · `www` · `cname.vercel-dns.com.`
   - Confirme os valores exatos na tela de Domains da Vercel, que mostra o registro esperado.
5. Aguardar propagação (minutos a algumas horas); a Vercel emite o HTTPS automaticamente.

## Files
- `referencia/Landing Fabiana Mugnol v8.dc.html`: página principal (fonte da verdade para textos, estilos e shaders).
- `referencia/planos/Planos.dc.html`: Área do paciente / planos.
- `referencia/support.js`, `referencia/image-slot.js`: só para abrir o protótipo; não usar em produção.
- `assets/`: arquivos finais para o projeto.
