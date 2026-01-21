FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

RUN npm install -g serve

EXPOSE 3010

CMD ["serve", "-s", "build", "-l", "3010"]