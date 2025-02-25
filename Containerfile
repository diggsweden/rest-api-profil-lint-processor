# SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
#
# SPDX-License-Identifier: EUPL-1.2

FROM cgr.dev/chainguard/node AS packages
ENV NODE_ENV=staging

WORKDIR /app

COPY --chown=node:node ["./","./"]

RUN npm install --omit-dev
RUN npm install ts-node typescript --omit-dev 
ENTRYPOINT ["npm", "start", "--"]