# SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
#
# SPDX-License-Identifier: CC0-1.0

FROM node:22.20.0-slim@sha256:d943bf20249f8b92eff6f605362df2ee9cf2d6ce2ea771a8886e126ec8714f08 AS build
WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund --ignore-scripts

COPY . .

RUN npm run build

RUN npm prune --omit=dev

FROM node:22.20.0-slim@sha256:d943bf20249f8b92eff6f605362df2ee9cf2d6ce2ea771a8886e126ec8714f08 AS runtime
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
