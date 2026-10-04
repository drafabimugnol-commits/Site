# Site — Dra. Fabiana Mugnol

Landing page estática (HTML + CSS + JS, sem dependências nem etapa de build).

## Estrutura
- `index.html` — conteúdo do site
- `css/site.css` — estilos; paleta da marca em variáveis no topo
- `js/site.js` — número do WhatsApp e mensagem padrão (bloco `CONFIG`), menu e cérebro de magnólias
- `js/magnolia.js` — desenho da pequena magnólia usada na animação
- `assets/` — fontes (Fraunces, OFL) e imagens otimizadas (WebP)
- `design/claude-design/` — arquivos originais do Claude Design (v1 e v2), mantidos como referência
- `design/marca/` — referências do manual de marca (paleta, tipografia, mockup)

## Pendências de conteúdo
- Retrato da Dra. Fabiana (seção 01)
- CREMERS e RQE (rodapé) e número do WhatsApp (`js/site.js`)
- Links marcados com `data-pendente` no `index.html`: trajetória, área
  Caminhando Juntos, LinkedIn, YouTube, Casados com a Neurodiversidade,
  artigos, agenda e material para imprensa

## Visualizar localmente
```
python3 -m http.server 8000
```
e abrir http://localhost:8000
