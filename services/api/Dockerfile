FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Env (overridable at runtime)
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
