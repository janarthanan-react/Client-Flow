# Stage 1: Build Backend
FROM node:20-alpine AS build
WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --workspace=backend

# Copy backend files and Prisma schema
COPY backend/ ./backend/

# Generate Prisma Client & compile TypeScript
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --workspace=backend --omit=dev

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "dist/server.js"]
