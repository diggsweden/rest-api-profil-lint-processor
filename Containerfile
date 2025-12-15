# SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
#
# SPDX-License-Identifier: CC0-1.0

FROM node:24.11.0-slim AS build
WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund --ignore-scripts

COPY . .

RUN npm run build && \
    npm prune --omit=dev

FROM node:24.11.0-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

COPY --from=build /app/document ./document
COPY --from=build /app/README.md ./README.md
COPY --from=build /app/GUIDELINES.md ./GUIDELINES.md

RUN chown -R node:node /app
USER node

ENTRYPOINT ["node", "dist/app.js"]
