# Site — Dra. Fabiana Mugnol

Landing page estática (HTML + CSS + JS, sem dependências nem etapa de build).

## Estrutura
- `index.html` — conteúdo do site
- `css/site.css` — estilos; paleta da marca em variáveis no topo
- `js/site.js` — número do WhatsApp, mensagem padrão e animação da constelação (bloco `CONFIG`)
- `assets/` — fontes (Fraunces, OFL) e imagens otimizadas (WebP)
- `design/claude-design/` — arquivos originais do Claude Design (v1 e v2), mantidos como referência
- `design/marca/` — referências do manual de marca (paleta, tipografia, mockup)

## Pendências de conteúdo
Trechos entre colchetes (`[...]`) no `index.html` aguardam texto definitivo:
apresentação, descrição do curso, trajetória, depoimentos, convênio, endereço,
CREMERS e RQE, número do WhatsApp (`js/site.js`), retrato e capa do curso.

## Visualizar localmente
```
python3 -m http.server 8000
```
e abrir http://localhost:8000
