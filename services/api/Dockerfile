# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Force production deps
ENV NODE_ENV=production
ENV npm_config_production=true

COPY package*.json ./

# Install ONLY production deps
RUN npm ci --omit=dev

# Safety check: fail build if jest is present
RUN test ! -d node_modules/jest && test ! -d node_modules/@jest

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 4000
CMD ["node", "index.js"]
