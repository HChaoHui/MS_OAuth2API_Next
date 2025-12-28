# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

# Copy frontend package files
COPY web/MS_OAuth2API_Next_Web/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY web/MS_OAuth2API_Next_Web/ ./

# Build frontend (skip type-check for faster builds)
RUN npm run build-only

# Production stage for backend
FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install backend dependencies (production only)
RUN npm install --omit=dev

# Copy backend source code
COPY config ./config
COPY controllers ./controllers
COPY middlewares ./middlewares
COPY routes ./routes
COPY services ./services
COPY utils ./utils
COPY main.js ./

# Copy built frontend assets to public directory
RUN mkdir -p public
COPY --from=frontend-builder /app/web/dist ./public

# Create logs directory with proper permissions
RUN mkdir -p logs && chmod 755 logs

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=13000

# Expose port
EXPOSE 13000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:13000/ || exit 1

# Start command
CMD ["node", "main.js"]
