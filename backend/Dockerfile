# ---------- Build ----------
FROM node:24-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Schema must be present before `npm ci` — postinstall runs `prisma generate`.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma/
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src/
RUN npm run build

RUN npm prune --omit=dev

# ---------- Runtime ----------
FROM node:24-alpine AS runner
RUN apk add --no-cache openssl dumb-init
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY run.sh ./run.sh

RUN chmod +x ./run.sh && chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./run.sh"]
