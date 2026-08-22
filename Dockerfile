# AquaTrack API - production container
# Build context must be the REPO ROOT (workspace layout is required for pnpm)

FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# Copy the whole workspace (pnpm install needs every package.json)
COPY . .

RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

WORKDIR /app/artifacts/api-server
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/artifacts/api-server/node_modules ./node_modules
COPY --from=build /app/artifacts/api-server/package.json ./
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
