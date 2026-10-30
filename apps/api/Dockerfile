# The API runs on Playwright's image: it ships the Chromium that prints books to PDF.
FROM mcr.microsoft.com/playwright:v1.64.1-noble
RUN npm install -g pnpm@12.4.1
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter @wishbook/api... \
 && pnpm --filter @wishbook/api build
WORKDIR /app/apps/api
ENV NODE_ENV=production PORT=4000 STORAGE_DIR=/data/storage
EXPOSE 4000
# Apply the Prisma schema, then serve.
CMD ["sh", "-c", "pnpm exec prisma db push --skip-generate && node dist/main.js"]
