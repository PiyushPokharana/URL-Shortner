FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup -S nodejs && adduser -S appuser -G nodejs
USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://0.0.0.0:' + (process.env.PORT || '4000') + '/api/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1));"

CMD ["npm", "start"]
