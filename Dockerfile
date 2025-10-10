# ---- Stage 1: Build ----
FROM node:lts-slim AS build

# Install build tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    npm install -g pm2 && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /school

# Copy package files first to leverage caching
COPY package*.json ./

# Install dependencies (omit dev for production)
RUN npm install --omit=dev && npm cache clean --force

# Copy the rest of the application
COPY . .

# ---- Stage 2: Runtime ----
FROM node:lts-slim

WORKDIR /school

# Install pm2 for process management
RUN npm install -g pm2

# Copy built app from the build stage
COPY --from=build /school /school

# Expose app port
EXPOSE 3000

# Start the application
CMD ["pm2-runtime", "start", "app"]
