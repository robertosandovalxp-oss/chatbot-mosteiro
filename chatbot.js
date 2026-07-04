const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");
const http = require("http");
const pino = require("pino");

let conectado = false;
let codigoPareamento = "";

// =====================================
// ⚠️ COLOQUE O NÚMERO DO WHATSAPP DO MOSTEIRO ABAIXO (Apenas números)
// Exemplo: 55 (Brasil) + 11 (DDD) + 999999999 (Número)
// =====================================
const NUMERO_BOT = "551125002858"; 

// =====================================
// SERVIDOR WEB (Exibe o Código de 8 Dígitos)
// =====================================
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  
  if (conectado) {
    res.end("<div style='text-align:center; margin-top:50px; font-family:sans-serif;'><h1>✅ O robô do Mosteiro está conectado e operando!</h1></div>");
    return;
  }
  
  if (codigoPareamento) {
    res.end(`
      <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        <h2>🌿 Conexão do Robô do Mosteiro 🌿</h2>
        <p>Não usaremos mais QR Code. Siga os passos no celular do Mosteiro:</p>
        <ol style="display: inline-block; text-align: left;">
          <li>Abra o WhatsApp e vá em <b>Aparelhos Conectados</b></li>
          <li>Toque em <b>Conectar um aparelho</b></li>
          <li>Na tela da câmera, toque em <b>Conectar com número de telefone</b> (na parte de baixo)</li>
          <li>Digite o código abaixo:</li>
        </ol>
        <h1 style="font-size: 50px; letter-spacing: 5px; color: #128C7E;">${codigoPareamento}</h1>
        <script>setTimeout(() => { location.reload(); }, 15000);</script>
      </div>
    `);
    return;
  }

  res.end("<div style='text-align:center; margin-top:50px; font-family:sans-serif;'><h1>⏳ Gerando código de emparelhamento... Atualize em instantes.</h1></div>");
});
server.listen(PORT, "0.0.0.0");

// =====================================
// INICIALIZAÇÃO DO ROBÔ
// =====================================
async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_mosteiro");
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false
  });

  // 🔹 SOLICITA O CÓDIGO DE EMPARELHAMENTO SE NÃO ESTIVER LOGADO
  if (!sock.authState.creds.me) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(NUMERO_BOT);
        // Formata o código para ficar bonito na tela (XXXX-XXXX)
        codigoPareamento = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`📲 CÓDIGO DE CONEXÃO GERADO: ${codigoPareamento}`);
      } catch (err) {
        console.error("❌ Erro ao gerar código de pareamento:", err);
      }
    }, 3000);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "close") {
      conectado = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const deviaReiniciar = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`⚠️ Conexão fechada. Código: ${statusCode}`);
      if (deviaReiniciar) {
        setTimeout(iniciarBot, 5000); 
      }
    } else if (connection === "open") {
      conectado = true;
      codigoPareamento = "";
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