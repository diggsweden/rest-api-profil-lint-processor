FROM node:lts-slim AS packages
ENV NODE_ENV=staging

WORKDIR /app

COPY --chown=node:node ["./","./"]

#RUN npm config set strict-ssl false 
RUN npm install --omit=dev --verbose
RUN npm install ts-node typescript --omit=dev  --verbose
ENTRYPOINT ["npm", "start", "--"]