# Base Stage
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# Dependencies Stage
FROM base AS dependencies
RUN npm ci

# Build Stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 4000
CMD ["npm", "run", "start"]
