export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(200).json({
      ok: true,
      message: "API funcional"
    });

  }

  const data = req.body;
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {

  const data = req.body;

  // ===== TÍTULO =====

  let titulo =
    "Proposta Comercial";

  if (
    data.services.includes(
      "Projeto SCIE"
    )
  ) {
    titulo =
      "Proposta para Projeto SCIE";
  }

  if (
    data.services.includes(
      "Medidas de Autoproteção"
    )
  ) {
    titulo =
      "Proposta para Medidas de Autoproteção";
  }

  // ===== HTML =====

  const html = `
  <html>

  <head>

    <style>

      body {
        font-family: Arial;
        padding: 40px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      td, th {
        border: 1px solid #ccc;
        padding: 10px;
      }

    </style>

  </head>

  <body>

    <h1>${titulo}</h1>

    <h2>Identificação do Projeto</h2>

    <p>
      <strong>Projeto:</strong>
      ${data.empresa}
    </p>

    <p>
      <strong>Proponente:</strong>
      ${data.nome}
    </p>

    <p>
      <strong>Email:</strong>
      ${data.email}
    </p>

    <p>
      <strong>Data:</strong>
      ${new Date().toLocaleDateString()}
    </p>

    <h2>Preço</h2>

    <table>

      <tr>
        <th>Serviço</th>
        <th>Valor</th>
      </tr>

      ${data.items.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.price}€</td>
        </tr>
      `).join("")}

    </table>

    <h2>
      Total:
      ${data.total}€
    </h2>

  </body>

  </html>
  `;

  // ===== PUPPETEER =====

  const browser =
    await puppeteer.launch({

      args: chromium.args,

      executablePath:
        await chromium.executablePath(),

      headless: chromium.headless,
    });

  const page =
    await browser.newPage();

  await page.setContent(html);

  const pdf =
    await page.pdf({
      format: "A4"
    });

  await browser.close();

  // ===== RESPOSTA =====

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.send(pdf);
}
