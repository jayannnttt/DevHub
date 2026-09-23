FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Set environment defaults
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "index.js"]
