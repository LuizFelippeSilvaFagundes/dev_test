# Usa uma imagem base do Node.js
FROM node:14

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências para o container
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código para o container
COPY . .

# Expõe a porta usada pela aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
