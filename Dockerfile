FROM node

WORKDIR /usr/app/server

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

COPY .env ./dist
WORKDIR /usr/app/server/dist

EXPOSE 3001

CMD node app.js