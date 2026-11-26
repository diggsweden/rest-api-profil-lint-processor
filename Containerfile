# SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
#
# SPDX-License-Identifier: CC0-1.0

FROM node:26.13.1-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc AS build
WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund --ignore-scripts

COPY . .

RUN npm run build && \
    npm prune --omit=dev

FROM node:26.13.1-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

COPY --from=build /app/document ./document
COPY --from=build /app/locales ./locales
COPY --from=build /app/README.md ./README.md
COPY --from=build /app/GUIDELINES.md ./GUIDELINES.md
COPY --from=build /app/rap-lp-openapi.yaml ./rap-lp-openapi.yaml
COPY --from=build /app/urlValidationConfig.cjs ./urlValidationConfig.cjs

RUN chown -R node:node /app
USER node

ENTRYPOINT ["node", "dist/app.js"]
