// Área do paciente — entrada no Portal do Paciente (Florescer), que vive no
// Armetz (app.armetz.com). Este site é estático: ele NÃO guarda nem confere
// dado nenhum. O formulário manda CPF + data de nascimento para o Armetz, que
// confere no servidor e devolve um endereço de entrada de uso único; o
// navegador então vai para lá e cai dentro do portal da família.
//
// Fluxo completo (e as regras de segurança) estão documentados no repositório
// do Armetz, em docs/PORTAL_PACIENTE.md §9.

const ARMETZ = "https://app.armetz.com";
const CLINICA = "drafabi"; // slug público da clínica no Armetz

const MENSAGENS = {
  nao_reconhecido:
    "Não encontramos um paciente com esse CPF e essa data de nascimento. Confira os dados ou fale com o secretariado.",
  sem_acesso:
    "Seu acesso ao portal ainda não foi liberado. Fale com o secretariado para receber a liberação.",
  cadastro_incompleto:
    "Seu cadastro está incompleto e não conseguimos confirmar sua identidade. Fale com o secretariado.",
  bloqueado:
    "Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo, ou fale com o secretariado.",
  rate_limit: "Muitas tentativas seguidas. Aguarde alguns minutos.",
  portal_indisponivel: "O portal está fora do ar neste momento. Tente mais tarde.",
  cpf_invalido: "Esse CPF não é válido. Confira os números.",
  data_invalida: "Informe a data de nascimento no formato dia/mês/ano.",
  expirado: "A entrada expirou. Entre de novo com o CPF e a data de nascimento.",
  rede: "Não conseguimos falar com o portal. Verifique sua conexão e tente de novo.",
  erro: "Algo deu errado por aqui. Tente de novo em instantes ou fale com o secretariado.",
};

const form = document.getElementById("form-login");
const cpfEl = form.elements.cpf;
const dataEl = form.elements.data_nascimento;
const botao = form.querySelector('button[type="submit"]');
const erroEl = document.getElementById("login-erro");
const escolhaEl = document.getElementById("login-escolha");
const escolhaLista = document.getElementById("login-escolha-lista");

const somenteDigitos = (v) => v.replace(/\D/g, "");

// Máscaras leves: só organizam o que a pessoa digita. A validação é do servidor.
cpfEl.addEventListener("input", () => {
  const d = somenteDigitos(cpfEl.value).slice(0, 11);
  cpfEl.value = d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
});
dataEl.addEventListener("input", () => {
  const d = somenteDigitos(dataEl.value).slice(0, 8);
  dataEl.value = d.replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
});

function mostrarErro(chave) {
  erroEl.textContent = MENSAGENS[chave] || MENSAGENS.erro;
  erroEl.hidden = false;
}
function limparErro() {
  erroEl.hidden = true;
  erroEl.textContent = "";
}
function ocupado(sim) {
  botao.disabled = sim;
  botao.textContent = sim ? "Conferindo…" : "Entrar";
  form.setAttribute("aria-busy", sim ? "true" : "false");
}

function mostrarEscolha(opcoes) {
  escolhaLista.innerHTML = "";
  for (const o of opcoes) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "escolha__opcao";
    b.textContent = o.primeiro_nome || "Paciente";
    b.addEventListener("click", () => entrar(o.ref));
    escolhaLista.appendChild(b);
  }
  escolhaEl.hidden = false;
  escolhaLista.querySelector("button")?.focus();
}
function esconderEscolha() {
  escolhaEl.hidden = true;
  escolhaLista.innerHTML = "";
}

async function entrar(escolha) {
  limparErro();
  const cpf = somenteDigitos(cpfEl.value);
  const data = dataEl.value.trim();
  if (cpf.length !== 11) return mostrarErro("cpf_invalido");
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return mostrarErro("data_invalida");

  ocupado(true);
  try {
    const res = await fetch(`${ARMETZ}/api/public/portal/entrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: CLINICA, cpf, data_nascimento: data, escolha: escolha || undefined }),
    });
    const dados = await res.json().catch(() => ({}));

    if (res.ok && dados.estado === "pronto" && typeof dados.url === "string" && dados.url.startsWith(`${ARMETZ}/`)) {
      botao.textContent = "Abrindo o seu espaço…";
      window.location.assign(dados.url);
      return;
    }
    if (res.ok && dados.estado === "escolher" && Array.isArray(dados.opcoes) && dados.opcoes.length) {
      ocupado(false);
      mostrarEscolha(dados.opcoes);
      return;
    }
    ocupado(false);
    esconderEscolha();
    mostrarErro(dados.error);
  } catch (_) {
    ocupado(false);
    mostrarErro("rede");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  esconderEscolha();
  entrar(null);
});

// Volta do Armetz com aviso (ex.: /planos/?erro=expirado).
const erroUrl = new URLSearchParams(location.search).get("erro");
if (erroUrl && MENSAGENS[erroUrl]) {
  mostrarErro(erroUrl);
  history.replaceState(null, "", location.pathname);
}
