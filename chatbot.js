// =====================================
// CONFIGURAÇÃO DO CLIENTE (VERSÃO DOCKER EVASÃO)
// =====================================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    // Força o uso do User-Agent mais comum possível do Chrome estável
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-component-update',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process', // Evita que abas quebrem no Linux
    ],
  },
});