# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm i --omit=dev

COPY . .

# Build-time variable for CRA
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine
# Replace default nginx website
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
