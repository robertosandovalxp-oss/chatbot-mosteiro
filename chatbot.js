// =====================================
// IMPORTAÇÕES
// =====================================
const qrcode = require("qrcode-terminal");
const { Client, NoAuth } = require("whatsapp-web.js");
const http = require("http");

// Variável global para guardar o QR Code em formato de texto/imagem
let qrAtual = "";
let conectado = false;

// =====================================
// SERVIDOR WEB (Exibe o QR Code legível na internet)
// =====================================
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  
  if (conectado) {
    res.end("<h1>✅ O robô do Mosteiro já está conectado e operando!</h1>");
    return;
  }

  if (!qrAtual) {
    res.end("<h1>⏳ Aguarde um instante... O robô está gerando o QR Code na nuvem. Atualize a página em alguns segundos.</h1>");
    return;
  }

  // Gera uma página simples com o QR Code formatado corretamente usando uma API gratuita
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrAtual)}`;
  
  res.end(`
    <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
      <h2>🌿 Conexão do Robô do Mosteiro 🌿</h2>
      <p>Abra o WhatsApp no celular, vá em <b>Aparelhos Conectados</b> e escaneie o código abaixo:</p>
      <div style="margin: 20px 0;">
        <img src="${qrUrl}" alt="QR Code WhatsApp" style="border: 10px solid white; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);" />
      </div>
      <p><i>A página atualiza o código automaticamente se ele expirar.</i></p>
      <script>
        setTimeout(() => { location.reload(); }, 20000);
      </script>
    </div>
  `);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`📡 Servidor de monitoramento ativo na porta ${PORT}`);
});

// =====================================
// CONFIGURAÇÃO DO CLIENTE
// =====================================
const client = new Client({
  authStrategy: new NoAuth(), 
  puppeteer: {
    headless: true,
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
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-session-crashed-bubble',
      '--disable-infobars'
    ],
  },
});

// =====================================
// CAPTURA DO QR CODE
// =====================================
client.on("qr", (qr) => {
  qrAtual = qr; // Salva o código para exibir na página web
  console.log("📲 QR Code gerado em texto (veja a página web para escanear):");
  qrcode.generate(qr, { small: true });
});

// =====================================
// WHATSAPP CONECTADO
// =====================================
client.on("ready", () => {
  conectado = true;
  console.log("✅ Tudo certo! O robô do Mosteiro está conectado e estável na nuvem.");
});

client.on("disconnected", (reason) => {
  conectado = false;
  console.log("⚠️ Desconectado:", reason);
});

// INICIALIZA O SISTEMA
client.initialize();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// =====================================
// FUNIL DE ATENDIMENTO DO MOSTEIRO
// =====================================
client.on("message", async (msg) => {
  try {
    if (!msg.from || msg.from.endsWith("@g.us")) return;
    const chat = await msg.getChat();
    if (chat.isGroup) return; 

    const texto = msg.body ? msg.body.trim().toLowerCase() : "";

    const simularDigitando = async () => {
      await delay(1500);
      await chat.sendStateTyping();
      await delay(2000);
    };

    if (/^(menu|oi|olá|ola|bom dia|boa tarde|boa noite|pax)$/i.test(texto)) {
      await simularDigitando();
      const hora = new Date().getHours();
      let saudacao = "PAX!";
      if (hora >= 5 && hora < 12) saudacao = "Bom dia! PAX!";
      else if (hora >= 12 && hora < 18) saudacao = "Boa tarde! PAX!";
      else saudacao = "Boa noite! PAX!";

      await client.sendMessage(msg.from,
        `${saudacao} 🌿\n\n` +
        `Você está em contato com o atendimento automático do *Mosteiro da Transfiguração*.\n\n` +
        `Para que eu possa te ajudar melhor, digite o número da opção desejada:\n\n` +
        `*1* - Horários de Missas e Ofícios\n` +
        `*2* - Como fazer um Retiro\n` +
        `*3* - Enviar um Pedido de Oração\n` +
        `*4* - Localização e Contato\n` +
        `*5* - Falar com um irmão (Atendimento Humano)`
      );
      return;
    }

    if (texto === "1") {
      await simularDigitando();
      await client.sendMessage(msg.from, 
        "⛪ *Nossos Horários de Celebrações:*\n\n" +
        "• *Domingos:* Missa conventual às 10h.\n" +
        "• *Dias da semana:* Ofício Divino e Missas nos horários habituais da comunidade.\n\n" +
        "_(Caso queira confirmar um horário específico, digite *5* para falar conosco)._"
      );
    } 
    else if (texto === "2") {
      await simularDigitando();
      await client.sendMessage(msg.from, 
        "🏡 *Retiros no Mosteiro:*\n\n" +
        "A nossa hospedaria está aberta para aqueles que buscam um período de silêncio, reflexão e oração.\n\n" +
        "Para consultar a disponibilidade de datas, valores das diárias e fazer sua reserva, por favor, digite *5* para que um dos irmãos te atenda diretamente."
      );
    } 
    else if (texto === "3") {
      await simularDigitando();
      await client.sendMessage(msg.from, 
        "🙏 *Pedidos de Oração:*\n\n" +
        "Escreva seu pedido na próxima mensagem. Nós o levaremos às nossas intenções durante o Ofício Divino e a Santa Missa.\n\n" +
        "Que o Senhor te abençoe!"
      );
    } 
    else if (texto === "4") {
      await simularDigitando();
      await client.sendMessage(msg.from, 
        "📍 *Localização e Contato:*\n\n" +
        "• *Endereço:* Rod. Pedro Eroles, Km 41,5 - Taboão, Mogi das Cruzes - SP, 08772-720.\n\n" +
        "Para receber o link do mapa de localização para GPS, digite *5*."
      );
    } 
    else if (texto === "5") {
      await simularDigitando();
      await client.sendMessage(msg.from, 
        "🤝 *Atendimento Humano:*\n\n" +
        "Entendido! Um dos irmãos lerá sua mensagem em breve para te responder pessoalmente. Por favor, aguarde um momento."
      );
    }
  } catch (error) {
    console.error("❌ Erro no processamento:", error);
  }
});