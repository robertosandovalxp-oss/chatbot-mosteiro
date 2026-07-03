FROM node:20-slim

# Instala o Git necessário para baixar o Baileys
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "chatbot.js"]