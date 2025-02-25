FROM node:latest AS build

RUN apt update -y && apt upgrade -y

WORKDIR /school

RUN git clone https://github.com/CodeByAmrit/school.git .

RUN npm install -g pm2 && npm install

COPY google-credentials.json ./google-credentials.json
COPY captcha.json ./captcha.json
COPY .env ./.env

CMD ["pm2-runtime", "start", "app.js"]
