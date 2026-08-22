# AquaTrack API - production container (pnpm-safe)
# Build context: repo root

FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# Copy everything needed for install
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/

# Install only api-server deps (including workspace deps)
RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

# Copy source and build
COPY artifacts/api-server ./artifacts/api-server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Final stage: install production deps fresh (avoids pnpm symlink issues)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy built dist + package.json
COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/artifacts/api-server/package.json ./

# Install ONLY production deps (pnpm creates proper node_modules)
RUN corepack enable && corepack prepare pnpm@10 --activate \
    && pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]