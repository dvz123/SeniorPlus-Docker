# Arquivo: ./frontend/Dockerfile

# Estágio 1: Construção (compilação do React/Node.js)
FROM node:20-alpine AS build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN npm run build 

# Estágio 2: Execução (serviço do Nginx para servir o conteúdo estático)
FROM nginx:alpine
# COPIA O ARQUIVO DE CONFIGURAÇÃO DO NGINX PARA O LOCAL CORRETO
COPY ./nginx.conf /etc/nginx/conf.d/default.conf 

# Copia os arquivos compilados do React para a pasta do Nginx
COPY --from=build /app/build /usr/share/nginx/html 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]