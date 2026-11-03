# ---------- Build ----------
FROM node:24-alpine AS builder
WORKDIR /app
ARG PRIMEUI_LICENSE_KEY=""
ENV PRIMEUI_LICENSE_KEY=$PRIMEUI_LICENSE_KEY
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
RUN node scripts/write-license.mjs && npx ng build --configuration production

# ---------- Runtime ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
