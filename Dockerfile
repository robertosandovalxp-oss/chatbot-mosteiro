FROM ghcr.io/puppeteer/puppeteer:22.6.0

# Define a pasta de trabalho dentro do servidor
WORKDIR /app

# Copia os arquivos de configuração
COPY package*.json ./

# Instala as dependências como administrador do contêiner
USER root
RUN npm ci

# Copia o restante do código do chatbot
COPY . .

# Comando para ligar o robô
CMD ["node", "chatbot.js"]