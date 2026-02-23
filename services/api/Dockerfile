# ---------- deps ----------
FROM node:25.6.1-alpine3.23 AS deps
WORKDIR /app

# Install only dependencies first (better cache)
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- runtime ----------
FROM node:25.6.1-alpine3.23
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules + source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 4000
CMD ["node", "index.js"]
