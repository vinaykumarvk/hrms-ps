# PrimeSoft HRMS — standalone Cloud Run image (SPA + in-process API kernel).
# Multi-stage: build the API (tsc) and SPA (vite), then run a slim Node server.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Build the API to dist/apps/api and the SPA to dist/apps/web.
# VITE_ENABLE_DEMO_LOGIN opts this demo build into the local demo credential.
ENV VITE_ENABLE_DEMO_LOGIN=true
RUN npm run build \
 && node node_modules/vite/bin/vite.js build --config apps/web/vite.config.ts \
 && npm prune --omit=dev

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/db ./apps/api/db
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server.mjs ./server.mjs
EXPOSE 8080
CMD ["node", "server.mjs"]
