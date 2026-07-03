const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const http = require("http");
const pino = require("pino");

let qrAtual = "";
let conectado = false;

// =====================================
// SERVIDOR WEB (Monitoramento do Render)
// =====================================
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  
  if (conectado) {
    res.end("<h1>✅ O robô do Mosteiro está conectado e operando de forma estável!</h1>");
    return;
  }
  if (!qrAtual) {
    res.end("<h1>⏳ Aguarde... Gerando o QR Code na nuvem. Atualize a página em breve.</h1>");
    return;
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrAtual)}`;
  res.end(`
    <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
      <h2>🌿 Conexão do Robô do Mosteiro (Versão Leve) 🌿</h2>
      <p>Abra o WhatsApp no celular, vá em <b>Aparelhos Conectados</b> e escaneie o código abaixo:</p>
      <div style="margin: 20px 0;">
        <img src="${qrUrl}" alt="QR Code WhatsApp" style="border: 10px solid white; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);" />
      </div>
      <script>setTimeout(() => { location.reload(); }, 20000);</script>
    </div>
  `);
});
server.listen(PORT, "0.0.0.0");

// =====================================
// INICIALIZAÇÃO DO ROBÔ
// =====================================
async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_mosteiro");
  
  // 🔹 Puxa a versão mais atualizada do WhatsApp Web para não ser rejeitado
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📡 Usando WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // 🔹 Desativa o aviso amarelo (vamos imprimir manualmente)
    browser: ['Robo Mosteiro', 'Chrome', '1.0.0'] // 🔹 Disfarce para o WhatsApp aceitar a conexão
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    // 🔹 Imprime o QR Code limpo sem os avisos antigos
    if (qr) {
      qrAtual = qr;
      console.log("📲 Novo QR Code gerado! Abra a página web ou escaneie abaixo:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      conectado = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const deviaReiniciar = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`⚠️ Conexão fechada. Código de erro: ${statusCode}`);
      
      if (deviaReiniciar) {
        console.log("⏳ Aguardando 5 segundos para tentar reconectar...");
        // 🔹 Pausa de 5 segundos quebra o loop infinito e acalma o servidor
        setTimeout(iniciarBot, 5000); 
      } else {
        console.log("❌ O celular foi desconectado manualmente. Precisaremos ler o QR Code de novo.");
      }
    } else if (connection === "open") {
      conectado = true;
      qrAtual = "";
      console.log("✅ Robô do Mosteiro conectado com sucesso e 100% estável!");
    }
  });

  // =====================================
  // FLUXO DE RESPOSTAS (FUNIL)
  // =====================================
  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const remetente = msg.key.remoteJid;
      if (remetente.endsWith("@g.us")) return;

      const textoOriginal = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      const texto = textoOriginal.trim().toLowerCase();

      await sock.sendPresenceUpdate("composing", remetente);
      await new Promise(res => setTimeout(res, 2000));

      if (/^(menu|oi|olá|ola|bom dia|boa tarde|boa noite|pax)$/i.test(texto)) {
        const hora = new Date().getHours();
        let saudacao = "PAX!";
        if (hora >= 5 && hora < 12) saudacao = "Bom dia! PAX!";
        else if (hora >= 12 && hora < 18) saudacao = "Boa tarde! PAX!";
        else saudacao = "Boa noite! PAX!";

        await sock.sendMessage(remetente, {
          text: `${saudacao} 🌿\n\nVocê está em contato com o atendimento automático do *Mosteiro da Transfiguração*.\n\nPara que eu possa te ajudar melhor, digite o número da opção desejada:\n\n*1* - Horários de Missas e Ofícios\n*2* - Como fazer um Retiro\n*3* - Enviar um Pedido de Oração\n*4* - Localização e Contato\n*5* - Falar com um irmão (Atendimento Humano)`
        });
      } 
      else if (texto === "1") {
        await sock.sendMessage(remetente, {
          text: "⛪ *Nossos Horários de Celebrações:*\n\n• *Domingos:* Missa conventual às 10h.\n• *Dias da semana:* Ofício Divino e Missas nos horários habituais da comunidade.\n\n_(Caso queira confirmar um horário específico, digite *5* para falar conosco)._"
        });
      } 
      else if (texto === "2") {
        await sock.sendMessage(remetente, {
          text: "🏡 *Retiros no Mosteiro:*\n\nA nossa hospedaria está aberta para aqueles que buscam um período de silêncio, reflexão e oração.\n\nPara consultar a disponibilidade de datas, valores das diárias e fazer sua reserva, por favor, digite *5* para que um dos irmãos te atenda diretamente."
        });
      } 
      else if (texto === "3") {
        await sock.sendMessage(remetente, {
          text: "🙏 *Pedidos de Oração:*\n\nEscreva seu pedido na próxima mensagem. Nós o levaremos às nossas intenções durante o Ofício Divino e a Santa Missa.\n\nQue o Senhor te abençoe!"
        });
      } 
      else if (texto === "4") {
        await sock.sendMessage(remetente, {
          text: "📍 *Localização e Contato:*\n\n• *Endereço:* Rod. Pedro Eroles, Km 41,5 - Taboão, Mogi das Cruzes - SP, 08772-720.\n\nPara receber o link do mapa de localização para GPS, digite *5*."
        });
      } 
      else if (texto === "5") {
        await sock.sendMessage(remetente, {
          text: "🤝 *Atendimento Humano:*\n\nEntendido! Um dos irmãos lerá sua mensagem em breve para te responder pessoalmente. Por favor, aguarde um momento."
        });
      }
    } catch (err) {
      console.error("Erro ao processar mensagem:", err);
    }
  });
}

iniciarBot();