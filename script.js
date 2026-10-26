const UT_OPTIONS = [
  { label: "UT I – Habitacional", factor: 1 },
  { label: "UT II – Estacionamento", factor: 1.4 },
  { label: "UT III – Administrativo", factor: 1 },
  { label: "UT IV – Escolar", factor: 1.4 },
  { label: "UT V – Hospitalar / Lares", factor: 1.8 },
  { label: "UT VI – Espetáculos e reuniões públicas", factor: 1.4 },
  { label: "UT VII – Hoteleiro / Restauração", factor: 1.4 },
  { label: "UT VIII – Comercial / Gares de transporte", factor: 1 },
  { label: "UT IX – Desportivo / Lazer", factor: 1.4 },
  { label: "UT X – Museus e galerias", factor: 1 },
  { label: "UT XI – Bibliotecas e arquivos", factor: 1 },
  { label: "UT XII – Industrial / Oficinas / Armazéns", factor: 1.8 },
];

const DISTRICT_SURCHARGES = {
  "Viana do Castelo": 220,
  "Braga": 220,
  "Vila Real": 220,
  "Bragança": 220,
  "Porto": 220,

  "Aveiro": 180,
  "Viseu": 180,
  "Guarda": 180,
  "Coimbra": 180,
  "Castelo Branco": 180,
  "Leiria": 180,

  "Lisboa": 25,
  "Santarém": 40,
  "Setúbal": 40,

  "Portalegre": 120,
  "Évora": 120,
  "Beja": 120,

  "Faro": 180,
};

const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const byId = (id) => document.getElementById(id);
function getProgressiveDiscountRate(area) {
  if (area <= 750) return 0;
  if (area >= 2500) return 0.6;
  return ((area - 750) / (2500 - 750)) * 0.6;
}

/* ===== DESCONTO EXCLUSIVO MAP ===== */

function getMAPDiscountRate(area) {

  // sem desconto até 500 m²
  if (area <= 500) return 0;

  // desconto máximo de 35%
  if (area >= 2500) return 0.35;

  // desconto progressivo
  return ((area - 500) / (2500 - 500)) * 0.35;
}

function getMAPDiscountedM2Rate(baseRate, area) {
  return baseRate * (1 - getMAPDiscountRate(area));
}

function getDiscountedM2Rate(baseRate, area) {
  return baseRate * (1 - getProgressiveDiscountRate(area));
}

function getDistrictSurcharge(district) {
  return DISTRICT_SURCHARGES[district] || 0;
}
function getFloorFactor(floors) {
  if (floors <= 1) return 1;

  const factor = 1 + (0.10 + ((floors - 2) * 0.10));

  return Math.min(factor, 2.35);
}
function getSimulacroBasePrice(area) {
  if (area <= 0) return 0;
  if (area <= 900) return 280;
  if (area >= 5000) return 1450;
  return Math.round(280 + ((area - 900) / (5000 - 900)) * (1450 - 280));
}

function getSimulacroDiscountRate(area) {
  if (area <= 2500) return 0;
  if (area >= 5000) return 0.6;
  return ((area - 2500) / (5000 - 2500)) * 0.6;
}

function calculateEstimate() {
  const mainService = byId("mainService")?.value || "";
  const includeMAP = byId("includeMAP")?.checked || false;
  const includeCoordenacao = byId("includeCoordenacao")?.checked || false;
  const includeSimulacro = byId("includeSimulacro")?.checked || false;
  const areaNum = parseFloat(byId("area")?.value || "0") || 0;
  const floors = parseInt(byId("floors")?.value || "1") || 1;
  const district = byId("district")?.value || "";
  const utIndexValue = byId("utIndex")?.value;
  const ut = utIndexValue === "" ? null : UT_OPTIONS[Number(utIndexValue)];

  const hasAnyService = mainService !== "" || includeMAP || includeCoordenacao || includeSimulacro;
  const needsUT = mainService !== "" || includeMAP;

  function calcAreaBasedPrice(baseRate, minPrice, useUTFactor = true) {
    if (areaNum <= 0) return { total: 0, discount: 0 };

    const effectiveRate = getDiscountedM2Rate(baseRate, areaNum);
    const floorFactor = getFloorFactor(floors);

const multiplier =
  (useUTFactor && ut ? ut.factor : 1) *
  floorFactor;
    const gross = areaNum * baseRate * multiplier;
    const discounted = areaNum * effectiveRate * multiplier;
   const minimum =
  minPrice * floorFactor;

const total =
  Math.max(discounted, minimum);

    return {
      total,
      discount:
  Math.max(
    0,
    gross - total
  ),
    };
  }

 function calcMainPrice() {
  if (!mainService || areaNum <= 0 || !ut) {
    return { total: 0, discount: 0 };
  }

  const baseRate =
    mainService === "projeto"
      ? 0.50
      : 0.35;

  // ===== PREÇO MÍNIMO BASE =====

  let minPrice =
    mainService === "projeto"
      ? 450
      : 225;

  // ===== UT MÉDIAS =====

  if (ut.factor >= 1.4) {
    minPrice =
      mainService === "projeto"
        ? 575
        : 295;
  }

  // ===== UT COMPLEXAS =====

  if (ut.factor >= 1.8) {
    minPrice =
      mainService === "projeto"
        ? 720
        : 380;
  }

  return calcAreaBasedPrice(
  baseRate,
  minPrice,
  true
);
}

function calcMAPPrice() {
  if (!includeMAP || areaNum <= 0 || !ut) {
    return { total: 0, discount: 0 };
  }

  // ===== CONFIGURAÇÃO =====

 // ===== PREÇO MÍNIMO DINÂMICO =====

let minPrice = 270;

// UT médias
if (ut.factor >= 1.4) {
  minPrice = 345;
}

// UT complexas
if (ut.factor >= 1.8) {
  minPrice = 420;
}

  // área incluída no preço mínimo
  const includedArea = 200;

  // taxa por m² adicional
  const baseRate = 0.35;

  // ===== MULTIPLICADORES =====

  const floorFactor =
    getFloorFactor(floors);

 const mapFactor =
  ut?.factor >= 1.8
    ? 1.6
    : ut?.factor || 1;

const multiplier =
  mapFactor *
  floorFactor;

  // ===== ATÉ 200 m² =====

  if (areaNum <= includedArea) {
    return {
      total:
  minPrice * floorFactor,
      discount: 0,
    };
  }

  // ===== ÁREA EXTRA =====

  const extraArea =
    areaNum - includedArea;

  // desconto progressivo exclusivo MAP
  const effectiveRate =
    getMAPDiscountedM2Rate(
      baseRate,
      areaNum
    );

  // valor extra
  const extraPrice =
    extraArea *
    effectiveRate *
    multiplier;

  // total final
  const total =
  (minPrice * floorFactor) +
  extraPrice;

  // valor bruto sem desconto
 
const gross =
  (minPrice * floorFactor) +
  (
    extraArea *
    baseRate *
    multiplier
  );
  return {
    total,
    discount: Math.max(0, gross - total),
  };
}
  function calcCoordenacaoPrice() {
    if (!includeCoordenacao || areaNum <= 0) return { total: 0, discount: 0 };

    if (areaNum <= 7500) {
      return { total: 230, discount: 0 };
    }

    return {
      total: 230 + ((areaNum - 7500) * 0.15),
      discount: 0,
    };
  }

  function calcSimulacroPrice() {
    if (!includeSimulacro || areaNum <= 0) {
      return { total: 0, discount: 0, hasDiscount: false };
    }

    const basePrice = getSimulacroBasePrice(areaNum);
    const discountRate = getSimulacroDiscountRate(areaNum);
    const total = basePrice * (1 - discountRate);
    const discount = basePrice - total;

    return {
      total,
      discount,
      hasDiscount: discountRate > 0,
    };
  }

  const mainCalc = calcMainPrice();
  const mapCalc = calcMAPPrice();
  const coordenacaoCalc = calcCoordenacaoPrice();
  const simulacroCalc = calcSimulacroPrice();

  const districtSurcharge = getDistrictSurcharge(district);

  const mainPrice = mainCalc.total;
  const mapPrice = mapCalc.total;
  const coordenacaoPrice = coordenacaoCalc.total;
  const simulacroPrice = simulacroCalc.total;

  const totalDiscount =
    mainCalc.discount +
    mapCalc.discount +
    simulacroCalc.discount;

  const totalPrice =
    mainPrice +
    mapPrice +
    coordenacaoPrice +
    simulacroPrice +
    districtSurcharge;

  const canShow =
    hasAnyService &&
    areaNum > 0 &&
    district !== "" &&
    (!needsUT || ut !== null);

  return {
    canShow,
    areaNum,
    district,
    ut,
  
     items: [
  mainPrice > 0
    ? [mainService === "projeto" ? "Projeto SCIE" : "Ficha de Segurança", mainPrice]
    : null,
  mapPrice > 0 ? ["Medidas de Autoproteção", mapPrice] : null,
  coordenacaoPrice > 0 ? ["Coordenação de Segurança — Valor mensal", coordenacaoPrice] : null,
  simulacroPrice > 0 ? ["Simulacro", simulacroPrice] : null,
  districtSurcharge > 0 ? ["Custos operacionais", districtSurcharge] : null,
].filter(Boolean),
    totalPrice,
    totalDiscount,
    showDiscountMessage: totalDiscount > 0,
    services: [
      mainService === "projeto" ? "Projeto SCIE" : "",
      mainService === "ficha" ? "Ficha de Segurança" : "",
      includeMAP ? "Medidas de Autoproteção" : "",
      includeCoordenacao ? "Coordenação de Segurança (valor mensal)" : "",
      includeSimulacro ? "Simulacro" : "",
    ].filter(Boolean),
  };
}

function renderEstimate() {
  const result = calculateEstimate();
  const empty = byId("resultEmpty");
  const content = byId("resultContent");
  const list = byId("resultItems");
  const total = byId("resultTotal");
  const discount = byId("resultDiscount");

  if (!empty || !content || !list || !total || !discount) return;

  if (!result.canShow) {
    empty.classList.remove("hidden");
    content.classList.add("hidden");
    list.innerHTML = "";
    total.textContent = euro.format(0);
    discount.textContent = "";
    discount.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  content.classList.remove("hidden");

  list.innerHTML = result.items
    .map(([label, price]) => `<li><span>${label}</span><strong>${euro.format(price)}</strong></li>`)
    .join("");

  total.textContent = euro.format(result.totalPrice);

  if (result.showDiscountMessage) {
    discount.textContent = `Desconto aplicado: ${euro.format(result.totalDiscount)}`;
    discount.classList.remove("hidden");
  } else {
    discount.textContent = "";
    discount.classList.add("hidden");
  }
}

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mreyeqdq";

function setStatus(elementId, message, type = "") {
  const el = byId(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `form-status${type ? ` ${type}` : ""}`;
}

async function submitToFormspree(payload) {
  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Não foi possível enviar o formulário. Tente novamente.";
    try {
      const data = await response.json();
      if (data?.errors?.length) {
        errorMessage = data.errors.map((item) => item.message).join(" ");
      }
    } catch (error) {
      // ignore parsing errors and keep generic message
    }
    throw new Error(errorMessage);
  }

  return response.json().catch(() => ({}));
}

async function openProposalEmail(event) {
  event.preventDefault();
  const result = calculateEstimate();

  if (!result.canShow) {
    setStatus("proposalStatus", "Preencha primeiro o simulador para gerar uma proposta detalhada.", "error");
    return;
  }

  const nome = byId("nome")?.value?.trim();
  const empresa = byId("empresa")?.value?.trim();
  const email = byId("email")?.value?.trim();
  const telefone = byId("telefone")?.value?.trim();
  const morada = byId("morada")?.value?.trim();
  const tipoEdificio = byId("tipoEdificio")?.value?.trim();
  const mensagem = byId("mensagem")?.value?.trim() || "(sem mensagem adicional)";
  const area = byId("area")?.value?.trim();
if (!nome || !empresa || !email || !telefone || !morada || !tipoEdificio) {
 
    setStatus("proposalStatus", "Preencha todos os campos obrigatórios do pedido de proposta.", "error");
    return;
  }

  const form = byId("proposal-form");
  const submitButton = form?.querySelector('button[type="submit"]');
  submitButton && (submitButton.disabled = true);
  setStatus("proposalStatus", "A enviar pedido de orçamento...", "");

  try {
  await submitToFormspree({
    formType: "Pedido de orçamento",
    _subject: `Pedido de Proposta – ${result.services.join(" + ")}`,

    gclid: document.getElementById('gclid_field')?.value || "",
    
    nome,
    empresa,
    email,
    telefone,
    morada,
    tipoEdificio,
    area: `${area} m²`,
    distrito: result.district || "N/A",
    utilizacaoTipo: result.ut ? result.ut.label : "N/A",
    duracaoCoordenacao: byId("includeCoordenacao")?.checked ? "Valor mensal" : "N/A",
    servicos: result.services.join(", "),
    estimativa: result.items.map(([label, price]) => `${label}: ${euro.format(price)}`).join(" | "),
    valorTotal: euro.format(result.totalPrice),
    mensagem,
  });

    
// ===== GOOGLE ADS =====
 if (
  typeof gtag_report_conversion ===
  "function"
) {
  gtag_report_conversion();
}

  form?.reset();

    ["mainService", "area", "utIndex", "district"].forEach((id) => {
      if (byId(id)) byId(id).value = "";
    });

    ["includeMAP", "includeCoordenacao", "includeSimulacro"].forEach((id) => {
      if (byId(id)) byId(id).checked = false;
    });

   renderEstimate();

setTimeout(() => {
  window.location.href = "/obrigado.html";
}, 800);
  } catch (error) {
    setStatus("proposalStatus", error.message || "Não foi possível enviar o formulário.", "error");
  } finally {
    submitButton && (submitButton.disabled = false);
  }
}

async function openContactEmail(event) {
  event.preventDefault();
  const name = byId("contactName")?.value?.trim();
  const email = byId("contactEmail")?.value?.trim();
  const phone = byId("contactPhone")?.value?.trim() || "";
  const message = byId("contactMessage")?.value?.trim();

  if (!name || !email || !message) {
    setStatus("contactStatus", "Preencha nome, email e mensagem.", "error");
    return;
  }

  const form = byId("contact-form");
  const submitButton = form?.querySelector('button[type="submit"]');
  submitButton && (submitButton.disabled = true);
  setStatus("contactStatus", "A enviar mensagem...", "");

  try {
  await submitToFormspree({
    formType: "Contacto geral",

    gclid: document.getElementById('gclid_contact')?.value || "",
    
    _subject: `Pedido de contacto — ${name}`,
    nome: name,
    email,
    telefone: phone || "N/A",
    mensagem: message,
  });
if (
  typeof gtag_report_conversion ===
  "function"
) {
  gtag_report_conversion();
}

form?.reset();

setTimeout(() => {
  window.location.href = "/obrigado.html";
}, 800);
  
  } catch (error) {
    setStatus("contactStatus", error.message || "Não foi possível enviar a mensagem.", "error");
  } finally {
    submitButton && (submitButton.disabled = false);
  }
}

function init() {
  byId("year") && (byId("year").textContent = new Date().getFullYear());

 [
  "mainService",
  "includeMAP",
  "includeCoordenacao",
  "includeSimulacro",
  "area",
  "utIndex",
  "district",
  "floors"
].forEach((id) => {
    const el = byId(id);
    el && el.addEventListener("input", renderEstimate);
    el && el.addEventListener("change", renderEstimate);
  });

  byId("proposal-form")?.addEventListener("submit", openProposalEmail);
  byId("contact-form")?.addEventListener("submit", openContactEmail);
  renderEstimate();
  initSCIECalculator();
  initloadCalculator();
  initSCIECheck();
  initPdfExports();
  initAutoHideHeader();
}

document.addEventListener("DOMContentLoaded", init);


  /* ===== CALCULADORA PROFISSIONAL — DENSIDADE DA CARGA DE INCÊNDIO ===== */

/*
Base legal de cálculo:
- Método determinístico:
  Qs = Σ (Mi × Hi × Ci × Rai)
  qs = Qs / S
- Método probabilístico:
  Atividade: Qs = Σ (qsi × Si × Ci × Rai)
  Armazenamento: Qs = Σ (qvi × hi × Si × Ci × Rai)
  qs = Qs / S

Nota:
Os bancos abaixo são um "banco inicial Lisprotec" para teste e operação.
Os valores continuam editáveis no frontend e devem ser validados tecnicamente caso a caso.
*/
/* ===== CALCULADORA SCIE ÚNICA ===== */

const SCIE_FIELDS = {
  I: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "pisosAbaixo", label: "N.º de pisos abaixo do plano de referência", type: "number", min: 0, step: "1" }
  ],
  II: [
    { id: "espaco", label: "Tipo de espaço", type: "select", options: [["edificio", "Espaço coberto e fechado"], ["arlivre", "Ao ar livre"]] },
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "areaBruta", label: "Área bruta da utilização-tipo (m²)", type: "number", min: 0, step: "0.01" },
    { id: "pisosAbaixo", label: "N.º de pisos abaixo do plano de referência", type: "number", min: 0, step: "1" }
  ],
  III: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" }
  ],
  IV: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" },
    { id: "efetivoRisco", label: "Efetivo em locais de risco D ou E", type: "number", min: 0, step: "1" },
    { id: "saidaIndependente", label: "Locais de risco D/E com saídas independentes diretas ao exterior", type: "select", options: [["sim", "Sim"], ["nao", "Não"]] },
    { id: "semLocaisDE", label: "Não existem locais de risco D ou E?", type: "select", options: [["nao", "Não"], ["sim", "Sim"]] }
  ],
  V: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" },
    { id: "efetivoRisco", label: "Efetivo em locais de risco D", type: "number", min: 0, step: "1" },
    { id: "saidaIndependente", label: "Locais de risco D com saídas independentes diretas ao exterior", type: "select", options: [["sim", "Sim"], ["nao", "Não"]] }
  ],
  VI: [
    { id: "espaco", label: "Tipo de espaço", type: "select", options: [["edificio", "Integrado em edifício / recinto coberto"], ["arlivre", "Ao ar livre"]] },
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "pisosAbaixo", label: "N.º de pisos abaixo do plano de referência", type: "number", min: 0, step: "1" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" }
  ],
  VII: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" },
    { id: "efetivoRisco", label: "Efetivo em locais de risco E", type: "number", min: 0, step: "1" },
    { id: "saidaIndependente", label: "Locais de risco E com saídas independentes diretas ao exterior", type: "select", options: [["sim", "Sim"], ["nao", "Não"]] }
  ],
  VIII: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "pisosAbaixo", label: "N.º de pisos abaixo do plano de referência", type: "number", min: 0, step: "1" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" }
  ],
  IX: [
    { id: "espaco", label: "Tipo de espaço", type: "select", options: [["edificio", "Integrado em edifício / recinto coberto"], ["arlivre", "Ao ar livre"]] },
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "pisosAbaixo", label: "N.º de pisos abaixo do plano de referência", type: "number", min: 0, step: "1" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" }
  ],
  X: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" }
  ],
  XI: [
    { id: "altura", label: "Altura da utilização-tipo (m)", type: "number", min: 0, step: "0.01" },
    { id: "pisosAbaixo", label: "N.º de pisos abaixo do plano de referência", type: "number", min: 0, step: "1" },
    { id: "efetivo", label: "Efetivo", type: "number", min: 0, step: "1" },
    { id: "carga", label: "Densidade de carga de incêndio modificada (MJ/m²)", type: "number", min: 0, step: "0.01" }
  ],
  XII: [
    { id: "espaco", label: "Tipo de espaço", type: "select", options: [["edificio", "Espaço coberto e fechado"], ["arlivre", "Ao ar livre"]] },
    { id: "pisosAbaixo", label: "N.º de pisos abaixo do plano de referência", type: "number", min: 0, step: "1" },
    { id: "carga", label: "Densidade de carga de incêndio modificada (MJ/m²)", type: "number", min: 0, step: "0.01" },
    { id: "soArmazem", label: "Destina-se exclusivamente a armazém?", type: "select", options: [["nao", "Não"], ["sim", "Sim"]] }
  ]
};

const SCIE_UT_LABELS = {
  I: "UT I – Habitacional",
  II: "UT II – Estacionamentos",
  III: "UT III – Administrativos",
  IV: "UT IV – Escolares",
  V: "UT V – Hospitalares e Lares",
  VI: "UT VI – Espetáculos e reuniões públicas",
  VII: "UT VII – Hoteleiros e restauração",
  VIII: "UT VIII – Comerciais e gares de transporte",
  IX: "UT IX – Desportivos e de lazer",
  X: "UT X – Museus e galerias",
  XI: "UT XI – Bibliotecas e arquivos",
  XII: "UT XII – Industrial / Oficinas / Armazéns"
};

function scieById(id) {
  return document.getElementById(id);
}

function scieCriteriaLine(label, ok, detail = "") {
  return { label, ok, detail };
}

function highestPassingCategory(checks) {
  for (const check of checks) {
    if (check.pass) return check;
  }
  return checks[checks.length - 1];
}

function renderSCIEFields() {
  const ut = scieById("scie-ut")?.value || "";
  const wrap = scieById("scie-fields");
  if (!wrap) return;

  wrap.innerHTML = "";
  if (!ut || !SCIE_FIELDS[ut]) return;

  const grid = document.createElement("div");
  grid.className = "risk-inline-grid";

  SCIE_FIELDS[ut].forEach((field) => {
    const group = document.createElement("div");
    group.className = "field-group";

    const label = document.createElement("label");
    label.setAttribute("for", `scie-${field.id}`);
    label.textContent = field.label;

    let control;

    if (field.type === "select") {
      control = document.createElement("select");
      field.options.forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        control.appendChild(option);
      });
    } else {
      control = document.createElement("input");
      control.type = field.type;
      control.min = field.min ?? "0";
      control.step = field.step ?? "1";
    }

    control.id = `scie-${field.id}`;
    group.appendChild(label);
    group.appendChild(control);
    grid.appendChild(group);
  });

  wrap.appendChild(grid);
}

function readSCIEData() {
  const ut = scieById("scie-ut")?.value || "";
  const data = { ut };

  (SCIE_FIELDS[ut] || []).forEach((field) => {
    const el = scieById(`scie-${field.id}`);
    if (!el) return;
    data[field.id] = el.tagName === "SELECT" ? el.value : (el.value === "" ? null : Number(el.value));
  });

  return data;
}

function validateSCIEData(data) {
  if (!data.ut) return "Selecione a utilização-tipo.";

  for (const field of (SCIE_FIELDS[data.ut] || [])) {
    const value = data[field.id];
    if (value === null || value === "") {
      return `Preencha o campo: ${field.label}`;
    }
  }

  return "";
}

function evalUTI(d) {
  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.pisosAbaixo <= 1,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 1", d.pisosAbaixo <= 1, `${d.pisosAbaixo}`)
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.pisosAbaixo <= 3,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 3", d.pisosAbaixo <= 3, `${d.pisosAbaixo}`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 50 && d.pisosAbaixo <= 5,
      criteria: [
        scieCriteriaLine("Altura ≤ 50 m", d.altura <= 50, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 5", d.pisosAbaixo <= 5, `${d.pisosAbaixo}`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTII(d) {
  if (d.espaco === "arlivre") {
    return {
      category: 1,
      pass: true,
      criteria: [scieCriteriaLine("Estacionamento ao ar livre", true, "Enquadramento direto na 1.ª categoria")]
    };
  }

  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.areaBruta <= 3200 && d.pisosAbaixo <= 1,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Área bruta ≤ 3 200 m²", d.areaBruta <= 3200, `${d.areaBruta} m²`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 1", d.pisosAbaixo <= 1, `${d.pisosAbaixo}`)
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.areaBruta <= 9600 && d.pisosAbaixo <= 3,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Área bruta ≤ 9 600 m²", d.areaBruta <= 9600, `${d.areaBruta} m²`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 3", d.pisosAbaixo <= 3, `${d.pisosAbaixo}`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 28 && d.areaBruta <= 32000 && d.pisosAbaixo <= 5,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Área bruta ≤ 32 000 m²", d.areaBruta <= 32000, `${d.areaBruta} m²`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 5", d.pisosAbaixo <= 5, `${d.pisosAbaixo}`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTIII(d) {
  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.efetivo <= 100,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 100", d.efetivo <= 100, `${d.efetivo}`)
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.efetivo <= 1000,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 1 000", d.efetivo <= 1000, `${d.efetivo}`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 50 && d.efetivo <= 5000,
      criteria: [
        scieCriteriaLine("Altura ≤ 50 m", d.altura <= 50, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 5 000", d.efetivo <= 5000, `${d.efetivo}`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTIVorV(d, isUTIV) {
  const semLocais = isUTIV && d.semLocaisDE === "sim";
  const lim2 = semLocais ? 750 : 500;
  const lim3 = semLocais ? 2250 : 1500;
  const labelRisco = isUTIV ? "D ou E" : "D";

  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.efetivo <= 100 && d.efetivoRisco <= 25 && d.saidaIndependente === "sim",
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 100", d.efetivo <= 100, `${d.efetivo}`),
        scieCriteriaLine(`Efetivo em locais de risco ${labelRisco} ≤ 25`, d.efetivoRisco <= 25, `${d.efetivoRisco}`),
        scieCriteriaLine("Saídas independentes diretas ao exterior", d.saidaIndependente === "sim", d.saidaIndependente === "sim" ? "Sim" : "Não")
      ]
    },
    {
      category: 2,
      pass: d.altura <= 9 && d.efetivo <= lim2 && d.efetivoRisco <= 100,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine(`Efetivo ≤ ${lim2}`, d.efetivo <= lim2, `${d.efetivo}`),
        scieCriteriaLine(`Efetivo em locais de risco ${labelRisco} ≤ 100`, d.efetivoRisco <= 100, `${d.efetivoRisco}`),
        scieCriteriaLine("Majoração de 50% aplicada ao efetivo", semLocais, semLocais ? "Aplicada" : "Não aplicável")
      ]
    },
    {
      category: 3,
      pass: d.altura <= 28 && d.efetivo <= lim3 && d.efetivoRisco <= 400,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine(`Efetivo ≤ ${lim3}`, d.efetivo <= lim3, `${d.efetivo}`),
        scieCriteriaLine(`Efetivo em locais de risco ${labelRisco} ≤ 400`, d.efetivoRisco <= 400, `${d.efetivoRisco}`),
        scieCriteriaLine("Majoração de 50% aplicada ao efetivo", semLocais, semLocais ? "Aplicada" : "Não aplicável")
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTVIorIX(d, label) {
  if (d.espaco === "arlivre") {
    return highestPassingCategory([
      {
        category: 1,
        pass: d.efetivo <= 1000,
        criteria: [
          scieCriteriaLine(`${label} ao ar livre`, true),
          scieCriteriaLine("Efetivo ≤ 1 000", d.efetivo <= 1000, `${d.efetivo}`)
        ]
      },
      {
        category: 2,
        pass: d.efetivo <= 15000,
        criteria: [
          scieCriteriaLine(`${label} ao ar livre`, true),
          scieCriteriaLine("Efetivo ≤ 15 000", d.efetivo <= 15000, `${d.efetivo}`)
        ]
      },
      {
        category: 3,
        pass: d.efetivo <= 40000,
        criteria: [
          scieCriteriaLine(`${label} ao ar livre`, true),
          scieCriteriaLine("Efetivo ≤ 40 000", d.efetivo <= 40000, `${d.efetivo}`)
        ]
      },
      {
        category: 4,
        pass: true,
        criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
      }
    ]);
  }

  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.pisosAbaixo === 0 && d.efetivo <= 100,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência = 0", d.pisosAbaixo === 0, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 100", d.efetivo <= 100, `${d.efetivo}`)
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.pisosAbaixo <= 1 && d.efetivo <= 1000,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 1", d.pisosAbaixo <= 1, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 1 000", d.efetivo <= 1000, `${d.efetivo}`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 28 && d.pisosAbaixo <= 2 && d.efetivo <= 5000,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 2", d.pisosAbaixo <= 2, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 5 000", d.efetivo <= 5000, `${d.efetivo}`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTVII(d) {
  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.efetivo <= 100 && d.efetivoRisco <= 50 && d.saidaIndependente === "sim",
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 100", d.efetivo <= 100, `${d.efetivo}`),
        scieCriteriaLine("Efetivo em locais de risco E ≤ 50", d.efetivoRisco <= 50, `${d.efetivoRisco}`),
        scieCriteriaLine("Saídas independentes diretas ao exterior", d.saidaIndependente === "sim", d.saidaIndependente === "sim" ? "Sim" : "Não")
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.efetivo <= 500 && d.efetivoRisco <= 200,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 500", d.efetivo <= 500, `${d.efetivo}`),
        scieCriteriaLine("Efetivo em locais de risco E ≤ 200", d.efetivoRisco <= 200, `${d.efetivoRisco}`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 28 && d.efetivo <= 1500 && d.efetivoRisco <= 800,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 1 500", d.efetivo <= 1500, `${d.efetivo}`),
        scieCriteriaLine("Efetivo em locais de risco E ≤ 800", d.efetivoRisco <= 800, `${d.efetivoRisco}`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTVIII(d) {
  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.pisosAbaixo === 0 && d.efetivo <= 100,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência = 0", d.pisosAbaixo === 0, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 100", d.efetivo <= 100, `${d.efetivo}`)
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.pisosAbaixo <= 1 && d.efetivo <= 1000,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 1", d.pisosAbaixo <= 1, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 1 000", d.efetivo <= 1000, `${d.efetivo}`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 28 && d.pisosAbaixo <= 2 && d.efetivo <= 5000,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 2", d.pisosAbaixo <= 2, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 5 000", d.efetivo <= 5000, `${d.efetivo}`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTX(d) {
  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.efetivo <= 100,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 100", d.efetivo <= 100, `${d.efetivo}`)
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.efetivo <= 500,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 500", d.efetivo <= 500, `${d.efetivo}`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 28 && d.efetivo <= 1500,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Efetivo ≤ 1 500", d.efetivo <= 1500, `${d.efetivo}`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTXI(d) {
  return highestPassingCategory([
    {
      category: 1,
      pass: d.altura <= 9 && d.pisosAbaixo === 0 && d.efetivo <= 100 && d.carga <= 5000,
      criteria: [
        scieCriteriaLine("Altura ≤ 9 m", d.altura <= 9, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência = 0", d.pisosAbaixo === 0, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 100", d.efetivo <= 100, `${d.efetivo}`),
        scieCriteriaLine("Carga de incêndio modificada ≤ 5 000 MJ/m²", d.carga <= 5000, `${d.carga} MJ/m²`)
      ]
    },
    {
      category: 2,
      pass: d.altura <= 28 && d.pisosAbaixo <= 1 && d.efetivo <= 500 && d.carga <= 50000,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 1", d.pisosAbaixo <= 1, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 500", d.efetivo <= 500, `${d.efetivo}`),
        scieCriteriaLine("Carga de incêndio modificada ≤ 50 000 MJ/m²", d.carga <= 50000, `${d.carga} MJ/m²`)
      ]
    },
    {
      category: 3,
      pass: d.altura <= 28 && d.pisosAbaixo <= 2 && d.efetivo <= 1500 && d.carga <= 150000,
      criteria: [
        scieCriteriaLine("Altura ≤ 28 m", d.altura <= 28, `${d.altura} m`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 2", d.pisosAbaixo <= 2, `${d.pisosAbaixo}`),
        scieCriteriaLine("Efetivo ≤ 1 500", d.efetivo <= 1500, `${d.efetivo}`),
        scieCriteriaLine("Carga de incêndio modificada ≤ 150 000 MJ/m²", d.carga <= 150000, `${d.carga} MJ/m²`)
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evalUTXII(d) {
  const factor = d.soArmazem === "sim" ? 10 : 1;

  if (d.espaco === "arlivre") {
    return highestPassingCategory([
      {
        category: 1,
        pass: d.carga <= 1000 * factor,
        criteria: [
          scieCriteriaLine("UT XII ao ar livre", true),
          scieCriteriaLine(`Carga de incêndio modificada ≤ ${1000 * factor} MJ/m²`, d.carga <= 1000 * factor, `${d.carga} MJ/m²`)
        ]
      },
      {
        category: 2,
        pass: d.carga <= 10000 * factor,
        criteria: [
          scieCriteriaLine("UT XII ao ar livre", true),
          scieCriteriaLine(`Carga de incêndio modificada ≤ ${10000 * factor} MJ/m²`, d.carga <= 10000 * factor, `${d.carga} MJ/m²`)
        ]
      },
      {
        category: 3,
        pass: d.carga <= 30000 * factor,
        criteria: [
          scieCriteriaLine("UT XII ao ar livre", true),
          scieCriteriaLine(`Carga de incêndio modificada ≤ ${30000 * factor} MJ/m²`, d.carga <= 30000 * factor, `${d.carga} MJ/m²`)
        ]
      },
      {
        category: 4,
        pass: true,
        criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
      }
    ]);
  }

  return highestPassingCategory([
    {
      category: 1,
      pass: d.carga <= 500 * factor && d.pisosAbaixo === 0,
      criteria: [
        scieCriteriaLine(`Carga de incêndio modificada ≤ ${500 * factor} MJ/m²`, d.carga <= 500 * factor, `${d.carga} MJ/m²`),
        scieCriteriaLine("Pisos abaixo do plano de referência = 0", d.pisosAbaixo === 0, `${d.pisosAbaixo}`),
        scieCriteriaLine("Majoração ×10 por armazém exclusivo", d.soArmazem === "sim", d.soArmazem === "sim" ? "Aplicada" : "Não aplicável")
      ]
    },
    {
      category: 2,
      pass: d.carga <= 5000 * factor && d.pisosAbaixo <= 1,
      criteria: [
        scieCriteriaLine(`Carga de incêndio modificada ≤ ${5000 * factor} MJ/m²`, d.carga <= 5000 * factor, `${d.carga} MJ/m²`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 1", d.pisosAbaixo <= 1, `${d.pisosAbaixo}`),
        scieCriteriaLine("Majoração ×10 por armazém exclusivo", d.soArmazem === "sim", d.soArmazem === "sim" ? "Aplicada" : "Não aplicável")
      ]
    },
    {
      category: 3,
      pass: d.carga <= 15000 * factor && d.pisosAbaixo <= 1,
      criteria: [
        scieCriteriaLine(`Carga de incêndio modificada ≤ ${15000 * factor} MJ/m²`, d.carga <= 15000 * factor, `${d.carga} MJ/m²`),
        scieCriteriaLine("Pisos abaixo do plano de referência ≤ 1", d.pisosAbaixo <= 1, `${d.pisosAbaixo}`),
        scieCriteriaLine("Majoração ×10 por armazém exclusivo", d.soArmazem === "sim", d.soArmazem === "sim" ? "Aplicada" : "Não aplicável")
      ]
    },
    {
      category: 4,
      pass: true,
      criteria: [scieCriteriaLine("Excede os limites da 3.ª categoria", true)]
    }
  ]);
}

function evaluateSCIECategory(data) {
  switch (data.ut) {
    case "I": return evalUTI(data);
    case "II": return evalUTII(data);
    case "III": return evalUTIII(data);
    case "IV": return evalUTIVorV(data, true);
    case "V": return evalUTIVorV(data, false);
    case "VI": return evalUTVIorIX(data, "UT VI");
    case "VII": return evalUTVII(data);
    case "VIII": return evalUTVIII(data);
    case "IX": return evalUTVIorIX(data, "UT IX");
    case "X": return evalUTX(data);
    case "XI": return evalUTXI(data);
    case "XII": return evalUTXII(data);
    default: return null;
  }
}

function getSCIEMeasures(ut, category) {
  const common = [
    {
      title: "Instruções de segurança",
      detail: "Devem existir instruções de segurança adequadas à utilização, ocupação e procedimentos de atuação."
    },
    {
      title: "Registos de segurança",
      detail: "Devem ser mantidos registos das ocorrências relevantes, manutenção, vistorias, ações de formação, exercícios e incidentes."
    },
    {
      title: "Procedimentos de prevenção",
      detail: "Devem existir procedimentos para prevenção e controlo dos riscos associados à exploração do edifício."
    }
  ];

  const cat2plus = [
    {
      title: "Plano de prevenção",
      detail: "Deve existir plano de prevenção ajustado aos riscos, meios existentes, rotinas de exploração e responsáveis."
    },
    {
      title: "Organização da segurança",
      detail: "A organização da segurança deve ser definida em função do efetivo, horário de funcionamento e risco da utilização."
    }
  ];

  const cat3plus = [
    {
      title: "Plano de emergência interno",
      detail: "Deve existir plano de emergência interno com procedimentos de alarme, alerta, evacuação e primeira intervenção."
    },
    {
      title: "Formação em SCIE",
      detail: "Os intervenientes com responsabilidades na exploração e emergência devem ter formação adequada."
    },
    {
      title: "Simulacros",
      detail: "Devem ser realizados exercícios e simulacros para testar os procedimentos de resposta."
    }
  ];

  const cat4plus = [
    {
      title: "Reforço da organização de segurança",
      detail: "A organização da segurança, equipas, treino e controlo documental exigem validação técnica mais rigorosa."
    },
    {
      title: "Validação técnica obrigatória",
      detail: "A verificação final das medidas deve ser confirmada por técnico competente."
    }
  ];

  const utSpecific = {
    IV: [{ title: "Gestão de ocupantes mais vulneráveis", detail: "Devem ser considerados procedimentos próprios para crianças e ocupantes com menor autonomia." }],
    V: [{ title: "Evacuação assistida", detail: "Devem existir procedimentos específicos para doentes, utentes dependentes e evacuação assistida." }],
    VI: [{ title: "Controlo de lotação e público", detail: "Devem ser validados procedimentos operacionais associados à lotação, acolhimento de público e evacuação." }],
    VII: [{ title: "Gestão de ocupação noturna", detail: "Devem ser considerados procedimentos de emergência adequados à ocupação noturna e dormidas." }],
    VIII: [{ title: "Afluência e gestão de público", detail: "Devem ser validados procedimentos compatíveis com grande afluência e apoio à evacuação." }],
    IX: [{ title: "Eventos e concentração de pessoas", detail: "Devem ser avaliados procedimentos operacionais em função da lotação e tipo de atividade." }],
    XI: [{ title: "Carga de incêndio documental", detail: "Devem ser considerados procedimentos ajustados à proteção do acervo e à carga de incêndio." }],
    XII: [{ title: "Procedimentos de exploração industrial/armazém", detail: "Devem ser avaliados procedimentos específicos para armazenamento, operações e riscos próprios da atividade." }]
  };

  let measures = [...common];
  if (category >= 2) measures = measures.concat(cat2plus);
  if (category >= 3) measures = measures.concat(cat3plus);
  if (category >= 4) measures = measures.concat(cat4plus);
  if (utSpecific[ut]) measures = measures.concat(utSpecific[ut]);

  return measures;
}
function renderSCIEResult(data, result) {
  const box = scieById("resultado-risco");
  if (!box) return;

  const catText = `${result.category}.ª Categoria de Risco`;
  const measures = getSCIEMeasures(data.ut, result.category);

  const enquadramento = result.category === 1
    ? {
        tipo: "Ficha de Segurança",
        texto: "Em regra, situações de 1.ª categoria tendem a enquadrar-se em Ficha de Segurança, sem prejuízo de validação técnica."
      }
    : {
        tipo: "Projeto SCIE",
        texto: "Em regra, situações de 2.ª, 3.ª ou 4.ª categoria tendem a enquadrar-se em Projeto SCIE, sem prejuízo de validação técnica."
      };

  box.className = "panel risk-result show";
  box.innerHTML = `
    <div class="risk-badge cat-${result.category}">${catText}</div>
    <h3 style="margin-top:0;">${SCIE_UT_LABELS[data.ut]}</h3>
    <p class="small-note">A categoria apresentada é a mais baixa cujos critérios foram integralmente cumpridos.</p>

    <h4 class="risk-section-title">Enquadramento documental indicativo</h4>
    <div class="panel" style="padding:16px; margin-bottom:14px;">
      <strong style="font-size:18px;">${enquadramento.tipo}</strong>
      <p style="margin:8px 0 0;">${enquadramento.texto}</p>
    </div>

    <h4 class="risk-section-title">Critérios verificados para esta categoria</h4>
    <ul class="criteria-list">
      ${result.criteria.map((item) => `
        <li class="${item.ok ? "ok" : "fail"}">
          <strong>${item.ok ? "Cumpre" : "Não cumpre"} — ${item.label}</strong>
          ${item.detail ? `<span>${item.detail}</span>` : ""}
        </li>
      `).join("")}
    </ul>

    <h4 class="risk-section-title">Medidas obrigatórias / a validar</h4>
    <ul class="measures-list">
      ${measures.map((item) => `
        <li>
          <strong>${item.title}</strong>
          <span>${item.detail}</span>
        </li>
      `).join("")}
    </ul>

    <div class="risk-actions">
      <a class="btn btn-primary" href="#contacto">Pedir análise técnica</a>
    </div>

    <p class="risk-legal-note">
      Resultado indicativo. O enquadramento final deve ser validado tecnicamente, sobretudo em utilizações mistas ou situações especiais.
    </p>
  `;
}


function calcularRiscoSCIE() {
  const data = readSCIEData();
  const validationError = validateSCIEData(data);

  if (validationError) {
    alert(validationError);
    return;
  }

  const result = evaluateSCIECategory(data);
  if (!result) {
    alert("Não foi possível calcular a categoria de risco.");
    return;
  }

  renderSCIEResult(data, result);
}

function resetSCIECalculator() {
  const ut = scieById("scie-ut");
  const fields = scieById("scie-fields");
  const result = scieById("resultado-risco");

  if (ut) ut.value = "";
  if (fields) fields.innerHTML = "";
  if (result) {
    result.className = "panel risk-result";
    result.innerHTML = "";
  }
}

function initSCIECalculator() {
  const ut = scieById("scie-ut");
  const calcBtn = scieById("scie-calculate-btn");
  const resetBtn = scieById("scie-reset-btn");

  if (!ut || !calcBtn || !resetBtn) return;

  ut.addEventListener("change", () => {
    renderSCIEFields();
    const result = scieById("resultado-risco");
    if (result) {
      result.className = "panel risk-result";
      result.innerHTML = "";
    }
  });

  calcBtn.addEventListener("click", calcularRiscoSCIE);
  resetBtn.addEventListener("click", resetSCIECalculator);
}
/* =========================================================
   CALCULADORA DE DENSIDADE DE CARGA DE INCÊNDIO
   Base legal: Despacho n.º 8954/2020
   ========================================================= */

/*
 * QUADRO I — Poder calorífico inferior (Hi)
 *
 * IMPORTANTE:
 * Hi vem diretamente do Quadro I.
 * Ci e Rai NÃO são características fixas do produto:
 *
 * Ci = coeficiente de combustibilidade, Art. 6.º
 * Rai = coeficiente de ativação, Art. 7.º
 */

const FIRELOAD_PRODUCTS = [

  { id: "acetaldeido", name: "Acetaldeído", category: "Químicos", hi: 25.1 },
  { id: "acetato-amilo", name: "Acetato de amilo", category: "Químicos", hi: 21.0 },
  { id: "acetato-polivinilo", name: "Acetato de polivinilo", category: "Plásticos", hi: 21.0 },
  { id: "acetileno", name: "Acetileno", category: "Gases", hi: 50.2 },
  { id: "acetileno-dissolvido", name: "Acetileno dissolvido", category: "Gases", hi: 16.7 },
  { id: "acetona", name: "Acetona", category: "Líquidos inflamáveis", hi: 29.3 },
  { id: "acido-acetico", name: "Ácido acético", category: "Químicos", hi: 16.7 },
  { id: "acido-benzoico", name: "Ácido benzóico", category: "Químicos", hi: 25.1 },
  { id: "acroleina", name: "Acroleína", category: "Químicos", hi: 29.3 },
  { id: "aguarras", name: "Aguarrás", category: "Líquidos inflamáveis", hi: 42.0 },
  { id: "albumina-vegetal", name: "Albumina vegetal", category: "Orgânicos", hi: 25.1 },

  { id: "alcool-alilico", name: "Álcool alílico", category: "Líquidos inflamáveis", hi: 33.5 },
  { id: "alcool-amilico", name: "Álcool amílico", category: "Líquidos inflamáveis", hi: 42.0 },
  { id: "alcool-butilico", name: "Álcool butílico", category: "Líquidos inflamáveis", hi: 33.5 },
  { id: "alcool-cetilico", name: "Álcool cetílico", category: "Líquidos combustíveis", hi: 42.0 },
  { id: "alcool-etilico", name: "Álcool etílico", category: "Líquidos inflamáveis", hi: 25.1 },
  { id: "alcool-metilico", name: "Álcool metílico", category: "Líquidos inflamáveis", hi: 21.0 },

  { id: "anilina", name: "Anilina", category: "Químicos", hi: 37.2 },
  { id: "antracite", name: "Antracite", category: "Combustíveis", hi: 33.5 },
  { id: "antracina", name: "Antracina", category: "Químicos", hi: 42.0 },

  { id: "amido", name: "Amido", category: "Orgânicos", hi: 16.7 },
  { id: "azeite", name: "Azeite", category: "Líquidos combustíveis", hi: 42.0 },

  { id: "benzaldeido", name: "Benzaldeído", category: "Químicos", hi: 33.5 },
  { id: "benzina", name: "Benzina", category: "Líquidos inflamáveis", hi: 42.0 },
  { id: "benzol", name: "Benzol", category: "Líquidos inflamáveis", hi: 42.0 },
  { id: "benzidina", name: "Benzidina", category: "Químicos", hi: 33.8 },

  { id: "butano", name: "Butano", category: "Gases", hi: 46.0 },

  { id: "cacau-po", name: "Cacau em pó", category: "Alimentares", hi: 16.7 },
  { id: "cafe", name: "Café", category: "Alimentares", hi: 16.7 },
  { id: "cafeina", name: "Cafeína", category: "Químicos", hi: 21.0 },
  { id: "calcio", name: "Cálcio", category: "Metais", hi: 4.2 },
  { id: "canfora", name: "Cânfora", category: "Químicos", hi: 37.2 },
  { id: "carbono", name: "Carbono", category: "Combustíveis", hi: 33.5 },
  { id: "cartao", name: "Cartão", category: "Celulósicos", hi: 16.7 },
  { id: "cartao-asfaltico", name: "Cartão asfáltico", category: "Celulósicos", hi: 21.0 },
  { id: "carvao", name: "Carvão", category: "Combustíveis", hi: 31.4 },
  { id: "celuloide", name: "Celuloide", category: "Plásticos", hi: 16.7 },
  { id: "celulose", name: "Celulose", category: "Celulósicos", hi: 16.7 },
  { id: "cereais", name: "Cereais", category: "Alimentares", hi: 16.7 },
  { id: "chocolate", name: "Chocolate", category: "Alimentares", hi: 25.1 },

  { id: "cicloheptano", name: "Cicloheptano", category: "Líquidos inflamáveis", hi: 46.0 },
  { id: "ciclohexano", name: "Ciclohexano", category: "Líquidos inflamáveis", hi: 46.0 },
  { id: "ciclopentano", name: "Ciclopentano", category: "Líquidos inflamáveis", hi: 46.0 },
  { id: "ciclopropano", name: "Ciclopropano", category: "Gases", hi: 50.2 },

  { id: "cloreto-polivinil", name: "Cloreto de polivinil (PVC)", category: "Plásticos", hi: 21.0 },
  { id: "cola-celulosica", name: "Cola celulósica", category: "Químicos", hi: 37.2 },
  { id: "coque-hulha", name: "Coque de hulha", category: "Combustíveis", hi: 29.3 },
  { id: "couro", name: "Couro", category: "Orgânicos", hi: 21.0 },
  { id: "creosoto-fenol", name: "Creosoto/fenol", category: "Químicos", hi: 37.2 },

  { id: "dietilamina", name: "Dietilamina", category: "Químicos", hi: 42.0 },
  { id: "dietilcetona", name: "Dietilcetona", category: "Químicos", hi: 33.5 },
  { id: "dietileter", name: "Dietileter", category: "Líquidos inflamáveis", hi: 37.2 },
  { id: "difenilos", name: "Difenilos", category: "Químicos", hi: 42.0 },
  { id: "dinamite", name: "Dinamite (75%)", category: "Explosivos", hi: 4.2 },
  { id: "dipenteno", name: "Dipenteno", category: "Líquidos inflamáveis", hi: 46.0 },

  { id: "ebonite", name: "Ebonite", category: "Elastómeros", hi: 33.5 },
  { id: "enxofre", name: "Enxofre", category: "Químicos", hi: 8.4 },
  { id: "eptano", name: "Eptano", category: "Líquidos inflamáveis", hi: 50.2 },
  { id: "eter-amilico", name: "Éter amílico", category: "Líquidos inflamáveis", hi: 42.0 },
  { id: "eter-etilico", name: "Éter etílico", category: "Líquidos inflamáveis", hi: 33.5 },
  { id: "etileno", name: "Etileno", category: "Gases", hi: 50.0 },

  { id: "fibra-coco", name: "Fibra de coco", category: "Fibras", hi: 25.1 },
  { id: "fenol", name: "Fenol", category: "Químicos", hi: 33.5 },
  { id: "fosforo", name: "Fósforo", category: "Químicos", hi: 25.1 },
  { id: "furano", name: "Furano", category: "Químicos", hi: 25.1 },
  { id: "fueloleo", name: "Fuelóleo", category: "Líquidos combustíveis", hi: 40.0 },

  { id: "gasoleo", name: "Gasóleo", category: "Líquidos combustíveis", hi: 42.0 },
  { id: "gas-natural", name: "Gás Natural", category: "Gases", hi: 25.84 },
  { id: "glicerina", name: "Glicerina", category: "Líquidos combustíveis", hi: 16.7 },
  { id: "gorduras", name: "Gorduras", category: "Líquidos combustíveis", hi: 42.0 },
  { id: "guta-percha", name: "Guta-percha / goma-guta", category: "Elastómeros", hi: 46.0 },

  { id: "farinha-trigo", name: "Farinha de trigo", category: "Alimentares", hi: 16.7 },
  { id: "heptano", name: "Heptano", category: "Líquidos inflamáveis", hi: 46.0 },
  { id: "hexametileno", name: "Hexametileno", category: "Químicos", hi: 46.0 },
  { id: "hexano", name: "Hexano", category: "Líquidos inflamáveis", hi: 46.0 },

  { id: "hidrogenio", name: "Hidrogénio", category: "Gases", hi: 142.0 },
  { id: "hidreto-magnesio", name: "Hidreto de magnésio", category: "Químicos", hi: 16.7 },
  { id: "hidreto-sodio", name: "Hidreto de sódio", category: "Químicos", hi: 8.4 },

  { id: "linho", name: "Linho", category: "Fibras", hi: 16.7 },
  { id: "linoleo", name: "Linóleo", category: "Plásticos", hi: 2.1 },
  { id: "lenha-cavacos", name: "Lenha em cavacos", category: "Madeiras", hi: 10.5 },

  { id: "madeira", name: "Madeira", category: "Madeiras", hi: 16.7 },
  { id: "magnesio", name: "Magnésio", category: "Metais", hi: 25.1 },
  { id: "malte", name: "Malte", category: "Alimentares", hi: 16.7 },
  { id: "manteiga", name: "Manteiga", category: "Alimentares", hi: 37.2 },
  { id: "metano", name: "Metano", category: "Gases", hi: 50.2 },
  { id: "monoxido-carbono", name: "Monóxido de carbono", category: "Gases", hi: 8.4 },

  { id: "nitrito-acetona", name: "Nitrito de acetona", category: "Químicos", hi: 29.3 },
  { id: "nitrocelulose", name: "Nitrocelulose", category: "Químicos", hi: 8.4 },

  { id: "octanos", name: "Octanos", category: "Líquidos inflamáveis", hi: 46.0 },
  { id: "oleo-linhaca", name: "Óleo de linhaça", category: "Líquidos combustíveis", hi: 37.2 },
  { id: "papel", name: "Papel", category: "Celulósicos", hi: 16.7 },
  { id: "parafina", name: "Parafina", category: "Combustíveis", hi: 46.0 },
  { id: "parafina-oleo", name: "Parafina / óleo de parafina", category: "Líquidos combustíveis", hi: 42.0 },
  { id: "pentanos", name: "Pentanos", category: "Líquidos inflamáveis", hi: 50.2 },
  { id: "petroleo", name: "Petróleo", category: "Líquidos combustíveis", hi: 42.0 },

  { id: "poliamida", name: "Poliamida", category: "Plásticos", hi: 29.3 },
  { id: "policarbonato", name: "Policarbonato", category: "Plásticos", hi: 29.3 },
  { id: "poliester", name: "Poliéster", category: "Plásticos", hi: 25.1 },
  { id: "polietileno", name: "Polietileno", category: "Plásticos", hi: 42.0 },
  { id: "polipropileno", name: "Polipropileno", category: "Plásticos", hi: 42.0 },
  { id: "poliestireno", name: "Poliestireno", category: "Plásticos", hi: 42.0 },
  { id: "polisobutileno", name: "Polisobutileno", category: "Plásticos", hi: 46.0 },
  { id: "politetrafluoretileno", name: "Politetrafluoretileno (PTFE / Teflon)", category: "Plásticos", hi: 4.2 },
  { id: "poliuretano", name: "Poliuretano (PUR)", category: "Plásticos", hi: 25.1 },

  { id: "propano", name: "Propano", category: "Gases", hi: 46.0 },

  { id: "rayon", name: "Rayon (fibra sintética)", category: "Fibras", hi: 16.7 },
  { id: "resina-pinho", name: "Resina de pinho", category: "Resinas", hi: 42.0 },
  { id: "resina-fenol", name: "Resina de fenol", category: "Resinas", hi: 25.1 },
  { id: "resina-ureia", name: "Resina de ureia", category: "Resinas", hi: 21.0 },
  { id: "residuos-florestais", name: "Resíduos florestais", category: "Resíduos", hi: 11.3 },
  { id: "residuos-solidos-humidade-baixa", name: "Resíduos sólidos mistos ao ar livre (<30% humidade)", category: "Resíduos", hi: 12.5 },
  { id: "residuos-solidos-humidade-media", name: "Resíduos sólidos mistos ao ar livre (30–60% humidade)", category: "Resíduos", hi: 10.5 },
  { id: "residuos-solidos-humidade-alta", name: "Resíduos sólidos mistos ao ar livre (>60% humidade)", category: "Resíduos", hi: 8.5 },

  { id: "seda", name: "Seda", category: "Têxteis", hi: 21.0 },
  { id: "sisal", name: "Sisal", category: "Fibras", hi: 16.7 },
  { id: "sodio", name: "Sódio", category: "Metais", hi: 4.2 },
  { id: "sulfureto-carbono", name: "Sulfureto de carbono", category: "Líquidos inflamáveis", hi: 12.5 },

  { id: "tabaco", name: "Tabaco", category: "Orgânicos", hi: 16.7 },
  { id: "cha", name: "Chá", category: "Alimentares", hi: 16.7 },
  { id: "tetralina", name: "Tetralina", category: "Líquidos inflamáveis", hi: 46.0 },
  { id: "tolueno", name: "Tolueno", category: "Líquidos inflamáveis", hi: 42.0 },
  { id: "triacetato", name: "Triacetato (celulose)", category: "Celulósicos", hi: 16.7 },
  { id: "turfa", name: "Turfa", category: "Combustíveis", hi: 33.5 },

  { id: "ureia", name: "Ureia", category: "Químicos", hi: 8.4 },
  { id: "viscose", name: "Viscose", category: "Fibras", hi: 16.7 },

  { id: "biodiesel", name: "Biodiesel", category: "Líquidos combustíveis", hi: 39.0 },
  { id: "leite-po", name: "Leite em pó", category: "Alimentares", hi: 16.7 },
  { id: "casca-eucalipto", name: "Casca de eucalipto", category: "Madeiras", hi: 17.5 },
  { id: "casca-outra-madeira", name: "Casca de outra madeira", category: "Madeiras", hi: 4.18 }
];


/* =========================================================
   COEFICIENTE DE COMBUSTIBILIDADE — ARTIGO 6.º
   ========================================================= */

const FIRELOAD_CI_OPTIONS = [
  {
    value: "1",
    label: "Baixo — Ci = 1,00",
    ci: 1.00
  },
  {
    value: "1.3",
    label: "Médio — Ci = 1,30",
    ci: 1.30
  },
  {
    value: "1.6",
    label: "Alto — Ci = 1,60",
    ci: 1.60
  }
];


/* =========================================================
   COEFICIENTE DE ATIVAÇÃO — ARTIGO 7.º
   ========================================================= */

const FIRELOAD_RAI_OPTIONS = [
  {
    value: "1",
    label: "Baixo — Rai = 1,00",
    rai: 1.00
  },
  {
    value: "1.5",
    label: "Médio — Rai = 1,50",
    rai: 1.50
  },
  {
    value: "2",
    label: "Alto — Rai = 2,00",
    rai: 2.00
  }
];


let fireloadItems = [];


function flById(id) {
  return document.getElementById(id);
}


function flFormatNumber(value, decimals = 2) {
  return Number(value || 0).toLocaleString("pt-PT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}


function normalizeQuantityToKg(quantity, unit) {
  if (unit === "t") return quantity * 1000;
  return quantity;
}


/* =========================================================
   PRODUTOS
   ========================================================= */

function populateFireloadProductSelect() {

  const select = flById("fl-product-select");

  if (!select) return;

  select.innerHTML = '<option value="">Selecionar produto</option>';

  FIRELOAD_PRODUCTS.forEach((product) => {

    const option = document.createElement("option");

    option.value = product.id;

    option.textContent =
      `${product.name} — Hi ${flFormatNumber(product.hi)} MJ/kg`;

    select.appendChild(option);

  });
}


/* =========================================================
   COEFICIENTES
   ========================================================= */

function populateFireloadCoefficientSelects() {

  const cSelect = flById("fl-manual-c");
  const rSelect = flById("fl-manual-r");

  if (cSelect) {

    cSelect.innerHTML =
      '<option value="">Selecionar Ci</option>';

    FIRELOAD_CI_OPTIONS.forEach(optionData => {

      const option = document.createElement("option");

      option.value = optionData.ci;

      option.textContent = optionData.label;

      cSelect.appendChild(option);

    });

  }

  if (rSelect) {

    rSelect.innerHTML =
      '<option value="">Selecionar Rai</option>';

    FIRELOAD_RAI_OPTIONS.forEach(optionData => {

      const option = document.createElement("option");

      option.value = optionData.rai;

      option.textContent = optionData.label;

      rSelect.appendChild(option);

    });

  }
}


/* =========================================================
   MODO DE ENTRADA
   ========================================================= */

function renderFireloadEntryMode() {

  const mode =
    flById("fl-entry-mode")?.value || "predefinido";

  const manual =
    flById("fl-manual-fields");

  if (!manual) return;

  if (mode === "manual") {

    manual.classList.remove("hidden");

  } else {

    manual.classList.add("hidden");

  }
}


/* =========================================================
   MODO DE CÁLCULO
   ========================================================= */

function renderFireloadMode() {

  const method =
    flById("fl-method")?.value || "";

  const note =
    flById("fl-mode-note");

  const det =
    flById("fl-deterministico");

  const prob =
    flById("fl-probabilistico");

  det?.classList.add("hidden");
  prob?.classList.add("hidden");

  if (method === "deterministico") {

    det?.classList.remove("hidden");

    if (note) {

      note.textContent =
        "Método determinístico: Qs = Σ(Mi × Hi × Ci × Rai).";

    }

  } else if (method === "probabilistico") {

    prob?.classList.remove("hidden");

    if (note) {

      note.textContent =
        "Método probabilístico: utiliza os valores estatísticos qsi/qvi do Quadro II.";

    }

  } else {

    if (note) note.textContent = "";

  }
}


/* =========================================================
   CONSTRUÇÃO DE ITEM — PRODUTO PRÉ-DEFINIDO
   ========================================================= */

function buildFireloadItemFromPreset(quantity, unit) {

  const selectedId =
    flById("fl-product-select")?.value || "";

  const product =
    FIRELOAD_PRODUCTS.find(
      p => p.id === selectedId
    );

  if (!product) {

    alert(
      "Selecione um produto da lista antes de adicionar."
    );

    return null;
  }


  const c =
    Number(flById("fl-product-c")?.value || 0);

  const r =
    Number(flById("fl-product-r")?.value || 0);


  if (c <= 0) {

    alert(
      "Selecione o coeficiente de combustibilidade Ci."
    );

    return null;
  }


  if (r <= 0) {

    alert(
      "Selecione o coeficiente de ativação Rai."
    );

    return null;
  }


  return {

    name: product.name,

    category: product.category,

    hi: product.hi,

    c: c,

    r: r,

    quantity: quantity,

    unit: unit || "kg"

  };
}


/* =========================================================
   CONSTRUÇÃO DE ITEM — MANUAL
   ========================================================= */

function buildFireloadItemFromManual(quantity, unit) {

  const name =
    flById("fl-manual-name")?.value?.trim() || "";

  const category =
    flById("fl-manual-category")?.value?.trim() ||
    "Manual";

  const hi =
    Number(
      flById("fl-manual-hi")?.value || 0
    );

  const c =
    Number(
      flById("fl-manual-c")?.value || 0
    );

  const r =
    Number(
      flById("fl-manual-r")?.value || 0
    );

  const manualUnit =
    flById("fl-manual-unit")?.value ||
    unit ||
    "kg";


  if (!name) {

    alert(
      "Introduza o nome do produto/material."
    );

    return null;
  }


  if (hi <= 0) {

    alert(
      "Introduza um valor Hi válido."
    );

    return null;
  }


  if (c <= 0) {

    alert(
      "Selecione o coeficiente Ci."
    );

    return null;
  }


  if (r <= 0) {

    alert(
      "Selecione o coeficiente Rai."
    );

    return null;
  }


  return {

    name,

    category,

    hi,

    c,

    r,

    quantity,

    unit: manualUnit

  };
}


/* =========================================================
   ADICIONAR ITEM
   ========================================================= */

function addFireloadItem() {

  const mode =
    flById("fl-entry-mode")?.value ||
    "predefinido";

  const quantity =
    Number(
      flById("fl-quantity")?.value || 0
    );

  const unit =
    flById("fl-unit")?.value ||
    "kg";


  if (quantity <= 0) {

    alert(
      "Introduza uma quantidade válida."
    );

    return;
  }


  const item =
    mode === "manual"

      ? buildFireloadItemFromManual(
          quantity,
          unit
        )

      : buildFireloadItemFromPreset(
          quantity,
          unit
        );


  if (!item) return;


  fireloadItems.push(item);

  renderFireloadItems();


  if (flById("fl-quantity")) {

    flById("fl-quantity").value = "";

  }
}


/* =========================================================
   CÁLCULO PARCIAL
   ========================================================= */

function getDeterministicPartial(item) {

  const qKg =
    normalizeQuantityToKg(
      item.quantity,
      item.unit
    );

  return (
    qKg *
    item.hi *
    item.c *
    item.r
  );
}


/* =========================================================
   TABELA DE MATERIAIS
   ========================================================= */

function renderFireloadItems() {

  const body =
    flById("fl-items-body");

  if (!body) return;


  if (!fireloadItems.length) {

    body.innerHTML = `
      <tr>
        <td colspan="8"
            style="text-align:center;opacity:.7;">
          Ainda não foram adicionados produtos.
        </td>
      </tr>
    `;

    return;
  }


  body.innerHTML =
    fireloadItems.map(
      (item, index) => {

        const partial =
          getDeterministicPartial(item);


        return `
          <tr>

            <td>
              ${item.name}
            </td>

            <td>
              <span class="fl-chip">
                ${item.category}
              </span>
            </td>

            <td>
              ${flFormatNumber(item.quantity)}
              ${item.unit}
            </td>

            <td>
              ${flFormatNumber(item.hi)}
              MJ/kg
            </td>

            <td>
              ${flFormatNumber(item.c)}
            </td>

            <td>
              ${flFormatNumber(item.r)}
            </td>

            <td>
              ${flFormatNumber(partial)}
              MJ
            </td>

            <td>

              <button
                type="button"
                class="btn btn-outline btn-small"
                onclick="removeFireloadItem(${index})">

                Remover

              </button>

            </td>

          </tr>
        `;

      }
    ).join("");
}


/* =========================================================
   REMOVER ITEM
   ========================================================= */

function removeFireloadItem(index) {

  fireloadItems.splice(
    index,
    1
  );

  renderFireloadItems();
}


/* =========================================================
   CÁLCULO DETERMINÍSTICO
   Qs = Σ(Mi × Hi × Ci × Rai)
   qs = Qs / S
   ========================================================= */

function getDeterministicCalculation(area) {

  const totalMJ =
    fireloadItems.reduce(
      (sum, item) =>
        sum +
        getDeterministicPartial(item),
      0
    );


  const density =
    totalMJ / area;


  return {

    method: "Determinístico",

    totalMJ,

    density,

    memory:

      fireloadItems.map(
        item => {

          const qKg =
            normalizeQuantityToKg(
              item.quantity,
              item.unit
            );

          const partial =
            getDeterministicPartial(
              item
            );


          return {

            title:
              item.name,

            detail:
              `${flFormatNumber(qKg)} kg × ` +
              `${flFormatNumber(item.hi)} × ` +
              `${flFormatNumber(item.c)} × ` +
              `${flFormatNumber(item.r)} = ` +
              `${flFormatNumber(partial)} MJ`

          };

        }
      )

  };
}


/* =========================================================
   CÁLCULO PROBABILÍSTICO
   ========================================================= */

function getProbabilisticCalculation(area) {

  const mode =
    flById("fl-prob-mode")?.value || "";

  const zoneArea =
    Number(
      flById("fl-prob-zone-area")?.value || 0
    );

  const height =
    Number(
      flById("fl-prob-height")?.value || 0
    );

  const q =
    Number(
      flById("fl-prob-q")?.value || 0
    );

  const c =
    Number(
      flById("fl-prob-c")?.value || 0
    );

  const r =
    Number(
      flById("fl-prob-r")?.value || 0
    );


  if (
    !mode ||
    zoneArea <= 0 ||
    q <= 0 ||
    c <= 0 ||
    r <= 0
  ) {

    alert(
      "Preencha os campos obrigatórios do cálculo probabilístico."
    );

    return null;
  }


  let totalMJ = 0;

  let formulaText = "";


  /*
   * Atividade:
   * Qs = Σ(qsi × Si × Ci × Rai)
   */

  if (mode === "atividade") {

    totalMJ =
      q *
      zoneArea *
      c *
      r;


    formulaText =
      `${flFormatNumber(q)} × ` +
      `${flFormatNumber(zoneArea)} × ` +
      `${flFormatNumber(c)} × ` +
      `${flFormatNumber(r)}`;

  }


  /*
   * Armazenamento:
   * Qs = Σ(qvi × hi × Si × Ci × Rai)
   */

  else {

    if (height <= 0) {

      alert(
        "Introduza a altura de armazenagem."
      );

      return null;
    }


    totalMJ =
      q *
      height *
      zoneArea *
      c *
      r;


    formulaText =
      `${flFormatNumber(q)} × ` +
      `${flFormatNumber(height)} × ` +
      `${flFormatNumber(zoneArea)} × ` +
      `${flFormatNumber(c)} × ` +
      `${flFormatNumber(r)}`;

  }


  const density =
    totalMJ / area;


  return {

    method: "Probabilístico",

    totalMJ,

    density,

    memory: [

      {
        title:
          "Método aplicado",

        detail:
          mode === "atividade"

            ? "Qs = Σ(qsi × Si × Ci × Rai)"

            : "Qs = Σ(qvi × hi × Si × Ci × Rai)"
      },

      {
        title:
          "Memória de cálculo",

        detail:
          `${formulaText} = ${flFormatNumber(totalMJ)} MJ`
      }

    ]

  };
}


/* =========================================================
   MEDIDAS / NOTAS
   ========================================================= */

function getGeneralMeasures() {

  return [

    {
      title: "Validação do Ci",
      detail:
        "O Ci deve ser definido de acordo com as características de combustibilidade do constituinte combustível, nos termos do artigo 6.º."
    },

    {
      title: "Validação do Rai",
      detail:
        "O Rai depende do risco de ativação associado à atividade ou armazenamento, nos termos do artigo 7.º."
    },

    {
      title: "Validação técnica",
      detail:
        "Confirmar atividade, compartimentação, materiais existentes e condições reais de exploração."
    }

  ];
}


/* =========================================================
   RESULTADO
   ========================================================= */

function renderFireloadResult(
  area,
  calculation
) {

  const box =
    flById("fl-result");

  if (!box) return;


  const measures =
    getGeneralMeasures();


  box.className =
    "panel risk-result show";


  box.innerHTML = `

    <div class="risk-badge info">
      Resultado
    </div>

    <h3 style="margin-top:0;">
      Cálculo ${calculation.method}
    </h3>


    <h4 class="risk-section-title">
      Resultado principal
    </h4>


    <ul class="criteria-list">

      <li>
        <strong>
          Carga de incêndio modificada (Qs)
        </strong>

        <span>
          ${flFormatNumber(calculation.totalMJ)}
          MJ
        </span>
      </li>


      <li>
        <strong>
          Densidade da carga de incêndio modificada (qs)
        </strong>

        <span>
          ${flFormatNumber(calculation.density)}
          MJ/m²
        </span>
      </li>


      <li>
        <strong>
          Área útil do compartimento (S)
        </strong>

        <span>
          ${flFormatNumber(area)}
          m²
        </span>
      </li>

    </ul>


    <h4 class="risk-section-title">
      Memória de cálculo
    </h4>


    <ul class="memory-list">

      ${calculation.memory.map(
        item => `

          <li>

            <strong>
              ${item.title}
            </strong>

            <span>
              ${item.detail}
            </span>

          </li>

        `
      ).join("")}

    </ul>


    <h4 class="risk-section-title">
      Notas de validação
    </h4>


    <ul class="measures-list">

      ${measures.map(
        item => `

          <li>

            <strong>
              ${item.title}
            </strong>

            <span>
              ${item.detail}
            </span>

          </li>

        `
      ).join("")}

    </ul>


    <div class="risk-actions">

      <a
        class="btn btn-primary"
        href="#contacto">

        Pedir análise técnica

      </a>

    </div>


    <p class="risk-legal-note">

      Ferramenta indicativa. O cálculo deve ser validado
      tecnicamente à luz do Despacho n.º 8954/2020
      e do enquadramento SCIE aplicável.

    </p>

  `;
}


/* =========================================================
   CÁLCULO PRINCIPAL
   ========================================================= */

function calculateFireloadProfessional() {

  const method =
    flById("fl-method")?.value || "";

  const area =
    Number(
      flById("fl-area")?.value || 0
    );


  if (!method) {

    alert(
      "Selecione o método de cálculo."
    );

    return;
  }


  if (area <= 0) {

    alert(
      "Introduza a área útil do compartimento."
    );

    return;
  }


  if (method === "deterministico") {

    if (!fireloadItems.length) {

      alert(
        "Adicione pelo menos um produto/material."
      );

      return;
    }


    const calculation =
      getDeterministicCalculation(
        area
      );


    renderFireloadResult(
      area,
      calculation
    );

    return;
  }


  const calculation =
    getProbabilisticCalculation(
      area
    );


  if (!calculation) return;


  renderFireloadResult(
    area,
    calculation
  );
}


/* =========================================================
   RESET
   ========================================================= */

function resetFireloadProfessional() {

  fireloadItems = [];

  renderFireloadItems();


  [
    "fl-method",
    "fl-area",
    "fl-entry-mode",
    "fl-product-select",
    "fl-product-c",
    "fl-product-r",
    "fl-manual-name",
    "fl-manual-category",
    "fl-manual-hi",
    "fl-manual-c",
    "fl-manual-r",
    "fl-manual-unit",
    "fl-quantity",
    "fl-unit",
    "fl-prob-mode",
    "fl-prob-preset",
    "fl-prob-zone-area",
    "fl-prob-height",
    "fl-prob-q",
    "fl-prob-c",
    "fl-prob-r"
  ].forEach(id => {

    const el =
      flById(id);

    if (!el) return;


    if (el.tagName === "SELECT") {

      el.selectedIndex = 0;

    } else {

      el.value = "";

    }

  });


  flById(
    "fl-deterministico"
  )?.classList.add("hidden");


  flById(
    "fl-probabilistico"
  )?.classList.add("hidden");


  flById(
    "fl-manual-fields"
  )?.classList.add("hidden");


  const note =
    flById("fl-mode-note");

  if (note) {

    note.textContent = "";

  }


  const result =
    flById("fl-result");


  if (result) {

    result.className =
      "panel risk-result";

    result.innerHTML = "";

  }
}


/* =========================================================
   INICIALIZAÇÃO — CALCULADORA DENSIDADE CARGA DE INCÊNDIO
   ========================================================= */

function ensureFireloadPresetCoefficients() {

  const productSelect = flById("fl-product-select");

  if (!productSelect) return;

  /*
   * Cria automaticamente os campos Ci e Rai caso
   * não existam no HTML original.
   */

  let container = document.getElementById("fl-product-coefficients");

  if (!container) {

    container = document.createElement("div");

    container.id = "fl-product-coefficients";

    container.style.display = "grid";
    container.style.gridTemplateColumns = "1fr 1fr";
    container.style.gap = "12px";
    container.style.marginTop = "12px";

    const ciWrapper = document.createElement("div");

    ciWrapper.innerHTML = `
      <label for="fl-product-c">
        Coeficiente de combustibilidade — Ci
      </label>

      <select id="fl-product-c">
        <option value="">Selecionar Ci</option>
      </select>
    `;

    const raiWrapper = document.createElement("div");

    raiWrapper.innerHTML = `
      <label for="fl-product-r">
        Coeficiente de ativação — Rai
      </label>

      <select id="fl-product-r">
        <option value="">Selecionar Rai</option>
      </select>
    `;

    container.appendChild(ciWrapper);
    container.appendChild(raiWrapper);

    /*
     * Coloca os campos imediatamente depois
     * do campo de seleção do produto.
     */
    productSelect.parentNode.insertBefore(
      container,
      productSelect.nextSibling
    );
  }

  const cSelect = flById("fl-product-c");
  const rSelect = flById("fl-product-r");

  if (cSelect) {

    cSelect.innerHTML =
      '<option value="">Selecionar Ci</option>';

    FIRELOAD_CI_OPTIONS.forEach(optionData => {

      const option = document.createElement("option");

      option.value = optionData.ci;

      option.textContent =
        optionData.label;

      cSelect.appendChild(option);

    });
  }

  if (rSelect) {

    rSelect.innerHTML =
      '<option value="">Selecionar Rai</option>';

    FIRELOAD_RAI_OPTIONS.forEach(optionData => {

      const option = document.createElement("option");

      option.value = optionData.rai;

      option.textContent =
        optionData.label;

      rSelect.appendChild(option);

    });
  }
}


/* =========================================================
   MODO DE ENTRADA
   ========================================================= */

function renderFireloadEntryMode() {

  const mode =
    flById("fl-entry-mode")?.value ||
    "predefinido";

  const manual =
    flById("fl-manual-fields");

  if (manual) {

    if (mode === "manual") {

      manual.classList.remove("hidden");

    } else {

      manual.classList.add("hidden");

    }
  }

  /*
   * No modo predefinido mostramos Ci e Rai.
   * No modo manual usamos os campos manuais.
   */

  const presetCoefficients =
    document.getElementById(
      "fl-product-coefficients"
    );

  if (presetCoefficients) {

    if (mode === "manual") {

      presetCoefficients.style.display =
        "none";

    } else {

      presetCoefficients.style.display =
        "grid";

    }
  }
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

function initFireloadCalculator() {

  if (!flById("fl-method")) {
    return;
  }

  /*
   * Produtos
   */
  populateFireloadProductSelect();

  /*
   * Campos Ci / Rai do modo manual
   */
  populateFireloadCoefficientSelects();

  /*
   * Campos Ci / Rai do modo predefinido
   */
  ensureFireloadPresetCoefficients();

  /*
   * Estado inicial
   */
  renderFireloadEntryMode();

  renderFireloadMode();

  renderFireloadItems();


  /* =======================================================
     EVENTOS
     ======================================================= */

  flById("fl-method")
    ?.addEventListener(
      "change",
      renderFireloadMode
    );


  flById("fl-entry-mode")
    ?.addEventListener(
      "change",
      renderFireloadEntryMode
    );


  flById("fl-add-item-btn")
    ?.addEventListener(
      "click",
      addFireloadItem
    );


  flById("fl-calc-btn")
    ?.addEventListener(
      "click",
      calculateFireloadProfessional
    );


  flById("fl-reset-btn")
    ?.addEventListener(
      "click",
      resetFireloadProfessional
    );

}


/*
 * Inicialização correta da calculadora.
 *
 * NÃO usar aqui initSCIECalculator().
 */
document.addEventListener(
  "DOMContentLoaded",
  initFireloadCalculator
);

const CHECK_UT_LABELS = {
  I: "UT I – Habitacional",
  II: "UT II – Estacionamentos",
  III: "UT III – Administrativos",
  IV: "UT IV – Escolares",
  V: "UT V – Hospitalares e Lares",
  VI: "UT VI – Espetáculos e reuniões públicas",
  VII: "UT VII – Hoteleiros e restauração",
  VIII: "UT VIII – Comerciais e gares de transporte",
  IX: "UT IX – Desportivos e de lazer",
  X: "UT X – Museus e galerias",
  XI: "UT XI – Bibliotecas e arquivos",
  XII: "UT XII – Industrial / Oficinas / Armazéns"
};

function checkById(id) {
  return document.getElementById(id);
}

function readCheckData() {
  return {
    ut: checkById("check-ut")?.value || "",
    area: Number(checkById("check-area")?.value || 0),
    height: Number(checkById("check-height")?.value || 0),
    effective: Number(checkById("check-effective")?.value || 0),
    pisos: Number(checkById("check-pisos")?.value || 0),
    publicUse: checkById("check-public")?.value || "",
    sleep: checkById("check-sleep")?.value || "",
    storage: checkById("check-storage")?.value || ""
  };
}

function validateCheckData(data) {
  if (!data.ut) return "Selecione a utilização-tipo.";
  if (data.area <= 0) return "Introduza a área.";
  if (data.height < 0) return "Introduza uma altura válida.";
  if (data.effective < 0) return "Introduza um efetivo válido.";
  if (data.pisos < 0) return "Introduza um número de pisos válido.";
  if (!data.publicUse) return "Indique se existe atendimento ao público.";
  if (!data.sleep) return "Indique se existe dormida / pernoita.";
  if (!data.storage) return "Indique se existe armazenamento relevante.";
  return "";
}

function buildCheckAssessment(data) {
  const outputs = [];
  const nextSteps = [];
  let level = "baixo";

  const ut = data.ut;

  if (ut === "I" && data.height <= 9 && data.pisos <= 1) {
    outputs.push("Tende para enquadramento simples da utilização habitacional.");
    nextSteps.push("Validar a categoria de risco com a calculadora SCIE.");
  } else if (ut === "I") {
    outputs.push("Tende para enquadramento habitacional com maior exigência técnica.");
    nextSteps.push("Recomenda-se análise técnica e confirmação documental.");
    level = "medio";
  }

  if (["III", "VIII", "X"].includes(ut) && data.effective <= 100 && data.height <= 9) {
    outputs.push("Pode enquadrar em situação compatível com ficha de segurança, dependendo da categoria final.");
    nextSteps.push("Confirmar categoria de risco e exigências específicas do município / processo.");
  }

  if (["IV", "V", "VI", "VII", "IX", "XI", "XII"].includes(ut)) {
    outputs.push("A utilização-tipo tende a exigir análise técnica mais cuidada.");
    nextSteps.push("Confirmar categoria de risco e medidas de autoproteção aplicáveis.");
    level = "medio";
  }

  if (data.publicUse === "sim") {
    outputs.push("A existência de público reforça a necessidade de validação do efetivo e das condições de evacuação.");
  }

  if (data.sleep === "sim") {
    outputs.push("A existência de dormida / pernoita aumenta a sensibilidade do enquadramento.");
    nextSteps.push("Validar condições específicas de evacuação, deteção e organização de segurança.");
    level = "elevado";
  }

  if (data.storage === "sim" || ["XI", "XII"].includes(ut)) {
    outputs.push("Existe probabilidade de ser relevante calcular a densidade da carga de incêndio.");
    nextSteps.push("Usar a calculadora de carga de incêndio e confirmar o impacto no enquadramento.");
    if (level !== "elevado") level = "medio";
  }

  if (data.height > 9 || data.effective > 100 || data.pisos > 1) {
    outputs.push("Os parâmetros indicam um caso com probabilidade de sair do enquadramento mais simples.");
    nextSteps.push("Confirmar se o caso exige projeto SCIE.");
    if (level !== "elevado") level = "medio";
  }

  if (data.height > 28 || data.effective > 1000 || data.storage === "sim" && ut === "XII") {
    outputs.push("Os dados apontam para maior complexidade técnica.");
    nextSteps.push("É fortemente recomendada análise técnica especializada.");
    level = "elevado";
  }

  const likelyDocs = [];
  if (level === "baixo") likelyDocs.push("Ficha de segurança ou enquadramento documental simplificado, sujeito a confirmação.");
  if (level !== "baixo") likelyDocs.push("Projeto SCIE ou verificação técnica aprofundada, sujeito a confirmação.");
  likelyDocs.push("Verificação da necessidade de medidas de autoproteção.");
  if (["XI", "XII"].includes(ut) || data.storage === "sim") likelyDocs.push("Cálculo da densidade da carga de incêndio pode ser necessário.");

  return { level, outputs, nextSteps, likelyDocs };
}

function renderCheckResult(data, assessment) {
  const box = checkById("check-result");
  if (!box) return;

  const badgeClass = assessment.level === "baixo" ? "cat-1" : assessment.level === "medio" ? "cat-3" : "cat-4";
const badgeLabel = assessment.level === "baixo"
  ? "Tendência para 1.ª / 2.ª categoria"
  : assessment.level === "medio"
  ? "Tendência para 2.ª / 3.ª categoria"
  : "Tendência para 3.ª / 4.ª categoria";

  box.className = "panel risk-result show";
  box.innerHTML = `
    <div class="risk-badge ${badgeClass}">${badgeLabel}</div>
    <h3 style="margin-top:0;">${CHECK_UT_LABELS[data.ut]}</h3>

    <h4 class="risk-section-title">Leitura preliminar</h4>
    <ul class="criteria-list">
      ${assessment.outputs.map((item) => `<li><strong>Observação</strong><span>${item}</span></li>`).join("")}
    </ul>

    <h4 class="risk-section-title">Documentação / verificação provável</h4>
    <ul class="measures-list">
      ${assessment.likelyDocs.map((item) => `<li><strong>A validar</strong><span>${item}</span></li>`).join("")}
    </ul>

    <h4 class="risk-section-title">Próximos passos</h4>
    <ul class="memory-list">
      ${assessment.nextSteps.map((item) => `<li><strong>Passo</strong><span>${item}</span></li>`).join("")}
    </ul>

    <p class="risk-legal-note">
      Ferramenta orientadora. A confirmação final depende do RJ-SCIE e do Regulamento Técnico aplicável ao caso concreto.
    </p>
  `;
}

function calculateSCIECheck() {
  const data = readCheckData();
  const error = validateCheckData(data);
  if (error) {
    alert(error);
    return;
  }

  const assessment = buildCheckAssessment(data);
  renderCheckResult(data, assessment);
}

function resetSCIECheck() {
  [
    "check-ut",
    "check-area",
    "check-height",
    "check-effective",
    "check-pisos",
    "check-public",
    "check-sleep",
    "check-storage"
  ].forEach((id) => {
    const el = checkById(id);
    if (!el) return;
    if (el.tagName === "SELECT") el.selectedIndex = 0;
    else el.value = "";
  });

  const box = checkById("check-result");
  if (box) {
    box.className = "panel risk-result";
    box.innerHTML = "";
  }
}

function initSCIECheck() {
  if (!checkById("check-calc-btn")) return;
  checkById("check-calc-btn")?.addEventListener("click", calculateSCIECheck);
  checkById("check-reset-btn")?.addEventListener("click", resetSCIECheck);
}

/* ===== EXPORTAÇÃO PDF ===== */

function buildPdfHtml(title, sourceSelector) {
  const source = document.querySelector(sourceSelector);
  if (!source) return "";

  const content = source.innerHTML;
  const now = new Date().toLocaleString("pt-PT");

  return `
    <!doctype html>
    <html lang="pt-PT">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; color:#111827; padding:28px; }
          h1, h2, h3 { margin: 0 0 12px 0; }
          .meta { margin: 0 0 18px 0; color:#4b5563; font-size:14px; }
          .panel, .pdf-box { border:1px solid #d1d5db; border-radius:12px; padding:14px; margin-bottom:14px; }
          ul { margin: 10px 0 0 18px; }
          li { margin-bottom: 8px; }
          .btn { display:none !important; }
          @media print { body { margin:0; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Lisprotec · Exportado em ${now}</div>
        <div class="pdf-box">${content}</div>
      </body>
    </html>
  `;
}

function openPrintWindow(title, sourceSelector) {
  const html = buildPdfHtml(title, sourceSelector);
  if (!html) {
    alert("Não foi encontrado conteúdo para exportar.");
    return;
  }

  const win = window.open("", "_blank");
  if (!win) {
    alert("O navegador bloqueou a janela de exportação.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}

function exportSCIEPdf() {
  const box = document.querySelector("#resultado-risco.show");
  if (!box) {
    alert("Ainda não existe resultado da categoria SCIE para exportar.");
    return;
  }
  openPrintWindow("Resultado da Categoria de Risco SCIE", "#resultado-risco");
}

function exportFireloadPdf() {
  const box = document.querySelector("#fl-result.show");
  if (!box) {
    alert("Ainda não existe resultado da carga de incêndio para exportar.");
    return;
  }
  openPrintWindow("Resultado da Carga de Incêndio", "#fl-result");
}

function exportCheckPdf() {
  const box = document.querySelector("#check-result.show");
  if (!box) {
    alert("Ainda não existe resultado do verificador de enquadramento para exportar.");
    return;
  }
  openPrintWindow("Verificador de Enquadramento SCIE", "#check-result");
}

function initPdfExports() {
  document.getElementById("export-scie-pdf-btn")?.addEventListener("click", exportSCIEPdf);
  document.getElementById("export-fireload-pdf-btn")?.addEventListener("click", exportFireloadPdf);
  document.getElementById("export-check-pdf-btn")?.addEventListener("click", exportCheckPdf);
}
function initAutoHideHeader() {
  const header = document.querySelector(".site-header, .compact-header");
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;
  const revealOffset = 10;
  const hideAfter = 120;

  function updateHeader() {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;
    const scrollingUp = currentScrollY < lastScrollY;

    if (currentScrollY <= 0) {
      header.classList.remove("header-hidden");
    } else if (scrollingDown && currentScrollY > hideAfter) {
      header.classList.add("header-hidden");
    } else if (scrollingUp && Math.abs(lastScrollY - currentScrollY) > revealOffset) {
      header.classList.remove("header-hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
}

