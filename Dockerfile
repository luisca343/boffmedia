# ---- Base Node ----
FROM node:18-alpine AS base
RUN apk update && apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./

# ---- Dependencies ----
FROM base AS dependencies
RUN npm install --only=production
RUN cp -R node_modules prod_node_modules
RUN npm install

# ---- Build ----
FROM dependencies AS build
COPY . .
RUN npm run build
RUN npm run drizzle:migrate

# ---- Release ----
FROM base AS release
COPY --from=dependencies /app/prod_node_modules ./node_modules
COPY boffmedia-a39cdd7a63c7.json ./boffmedia-a39cdd7a63c7.json
COPY --from=build /app/dist ./dist
EXPOSE 3000

CMD ["npm", "run", "start:prod"]