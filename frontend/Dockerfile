FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3007

CMD ["npm", "run", "dev", "--", "--port", "3007", "--host", "0.0.0.0"]
