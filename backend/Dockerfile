FROM node:18-alpine

WORKDIR /app


COPY package*.json ./

RUN npm install --only=production

COPY server.js ./
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY data/ ./data/

ENV NODE_ENV=production
ENV PORT=8001

EXPOSE 8001

CMD ["node", "server.js"]
