# ---- Base Node ----
FROM node:18-alpine AS base
RUN apk update && apk add --no-cache ffmpeg
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# ---- Dependencies ----
FROM base AS dependencies
RUN pnpm install --prod --frozen-lockfile
RUN cp -R node_modules prod_node_modules
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM dependencies AS build
COPY . .
RUN pnpm run build

# ---- Release ----
FROM base AS release
COPY --from=dependencies /app/prod_node_modules ./node_modules
COPY drizzle ./drizzle
COPY boffmedia-a39cdd7a63c7.json ./boffmedia-a39cdd7a63c7.json
COPY --from=build /app/dist ./dist
EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]