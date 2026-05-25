import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {

  // ===== TESTE API =====

  if (req.method !== "POST") {

    return res.status(200).json({
      ok: true,
      message: "API funcional"
    });

  }

  // ===== DADOS =====

  const data = req.body;
  console.log(data);

  // ===== TÍTULO =====

  let titulo =
    "Proposta Comercial";

 if (
  (data.services || []).includes(
    "Projeto SCIE"
  )
) {
  titulo =
    "Projeto de Segurança Contra Incêndio";
}

if (
  (data.services || []).includes(
    "Medidas de Autoproteção"
  )
) {
  titulo =
    "Medidas de Autoproteção";
}

  // ===== NÚMERO PROPOSTA =====

  const numeroProposta =
    Math.floor(
      1000 + Math.random() * 9000
    );

  // ===== LER TEMPLATE =====

  const filePath =
    path.join(
      process.cwd(),
      "templates",
      "proposta.html"
    );

  let html =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  // ===== TABELA PREÇOS =====

  const tabela =
    data.items.map(item => `
      <tr>
        <td>${item.label}</td>
        <td>${item.price}€</td>
      </tr>
    `).join("");

  // ===== TIPO SERVIÇO =====

  const tipoServico =
    data.services.join(", ");

  // ===== SUBSTITUIR VARIÁVEIS =====

  html = html

    .replaceAll(
      "{{NUMERO_PROPOSTA}}",
      numeroProposta
    )

    .replaceAll(
      "{{TITULO}}",
      titulo
    )

    .replaceAll(
      "{{NOME_PROJETO}}",
      data.empresa || ""
    )

    .replaceAll(
      "{{MORADA}}",
      data.morada || ""
    )

    .replaceAll(
      "{{NOME}}",
      data.nome || ""
    )

    .replaceAll(
      "{{EMAIL}}",
      data.email || ""
    )

    .replaceAll(
      "{{DATA}}",
      new Date().toLocaleDateString()
    )

    .replaceAll(
      "{{TIPO_SERVICO}}",
      tipoServico
    )

    .replaceAll(
      "{{TABELA_PRECOS}}",
      tabela
    )

    .replaceAll(
      "{{TOTAL}}",
      data.total
    );

  // ===== PUPPETEER =====

 const browser =
  await puppeteer.launch({

    args: [
      ...chromium.args,
      "--hide-scrollbars",
      "--disable-web-security"
    ],

    defaultViewport:
      chromium.defaultViewport,

    executablePath:
  await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar"
  ),

    headless: true,

    ignoreHTTPSErrors: true,
});

 const page =
  await browser.newPage();

await page.setContent(html, {
  waitUntil: "networkidle0"
});

const pdf =
  await page.pdf({

    format: "A4",

    printBackground: true,

    preferCSSPageSize: true
});

await browser.close();


// ===== RESPOSTA =====

res.setHeader(
  "Content-Type",
  "application/pdf"
);

res.setHeader(
  "Content-Disposition",
  "attachment; filename=proposta.pdf"
);

res.status(200).end(pdf);
