# --- Build stage ---
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies for all workspaces
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm install

# Copy full source
COPY backend/ backend/
COPY frontend/ frontend/

# Build both packages
RUN npm run build --workspace=backend
RUN npm run build --workspace=frontend

# --- Runtime stage ---
FROM node:24-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/.env ./backend/.env

RUN npm install --omit=dev --prefix backend

# Expose backend port (adjust as needed)
EXPOSE 3000

# Default command to start backend
CMD ["node", "backend/dist/index.js"]
