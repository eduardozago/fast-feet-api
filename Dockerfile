ARG NODE_VERSION=24.16.0
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ARG PNPM_VERSION=11.3.0
RUN npm install -g pnpm@$PNPM_VERSION

RUN pnpm install --frozen-lockfile

COPY tsconfig*.json ./
COPY prisma ./prisma

RUN pnpm prisma generate

COPY . .

RUN pnpm run build

FROM build AS migration

CMD ["pnpm", "prisma", "migrate", "deploy"]

FROM build AS prune

RUN pnpm prune --prod

FROM node:${NODE_VERSION}-alpine AS runtime

WORKDIR /usr/src/app

COPY --from=prune --chown=node:node /usr/src/app/dist ./dist
COPY --from=prune --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=prune --chown=node:node /usr/src/app/package.json ./
COPY --from=prune --chown=node:node /usr/src/app/prisma ./prisma

ENV PORT=8080

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "dist/src/main"]
