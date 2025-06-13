# SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
#
# SPDX-License-Identifier: CC0-1.0

FROM node:22.20.0-slim@sha256:d943bf20249f8b92eff6f605362df2ee9cf2d6ce2ea771a8886e126ec8714f08 AS packages
ENV NODE_ENV=staging

WORKDIR /app

COPY --chown=node:node ["./","./"]

#RUN npm config set strict-ssl false 
RUN npm install --omit=dev --verbose
RUN npm install ts-node typescript --omit=dev  --verbose
ENTRYPOINT ["npm", "start", "--"]
