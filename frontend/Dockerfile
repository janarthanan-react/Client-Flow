# Stage 1: Build Frontend
FROM node:20-alpine AS build
WORKDIR /app

# Copy root package.json for workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --workspace=frontend

# Copy frontend source code
COPY frontend/ ./frontend/

# Build production bundle
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
