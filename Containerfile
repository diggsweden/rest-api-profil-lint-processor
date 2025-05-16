# SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
#
# SPDX-License-Identifier: CC0-1.0

FROM node:22.15.0-slim@sha256:557e52a0fcb928ee113df7e1fb5d4f60c1341dbda53f55e3d815ca10807efdce AS packages
ENV NODE_ENV=staging

WORKDIR /app

COPY --chown=node:node ["./","./"]

#RUN npm config set strict-ssl false 
RUN npm install --omit=dev --verbose
RUN npm install ts-node typescript --omit=dev  --verbose
ENTRYPOINT ["npm", "start", "--"]