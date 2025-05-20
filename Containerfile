# SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
#
# SPDX-License-Identifier: CC0-1.0

FROM node:22.15.1-slim@sha256:ec318fe0dc46b56bcc1ca42a202738aeb4f3e347a7b4dd9f9f1df12ea7aa385a AS packages
ENV NODE_ENV=staging

WORKDIR /app

COPY --chown=node:node ["./","./"]

#RUN npm config set strict-ssl false 
RUN npm install --omit=dev --verbose
RUN npm install ts-node typescript --omit=dev  --verbose
ENTRYPOINT ["npm", "start", "--"]