# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /school

# Install all dependencies and build CSS
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /school

# Set production environment
ENV NODE_ENV=production

# Copy only necessary files from the builder stage
COPY --from=builder /school/package*.json ./
COPY --from=builder /school/node_modules ./node_modules
COPY --from=builder /school/bin ./bin
COPY --from=builder /school/app.js ./
COPY --from=builder /school/router ./router
COPY --from=builder /school/routes ./routes
COPY --from=builder /school/components ./components
COPY --from=builder /school/middleware ./middleware
COPY --from=builder /school/models ./models
COPY --from=builder /school/services ./services
COPY --from=builder /school/views ./views
COPY --from=builder /school/public ./public
COPY --from=builder /school/config ./config

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD [ "wget", "-q", "--spider", "http://localhost:5000/health" ]

# Start the app
CMD ["node", "bin/www"]
