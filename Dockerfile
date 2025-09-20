FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
RUN npm install -g serve

EXPOSE 8088

# Just specify the port; serve will bind to 0.0.0.0 automatically in Docker
CMD ["serve", "-s", "dist", "-l", "8088"]