# ---- Stage 1: Build ----
FROM node:lts-slim AS build

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    npm install -g pm2 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /school

# Copy dependency files
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy the rest of the application
COPY . .

# ---- Stage 2: Runtime ----
FROM node:lts-slim
WORKDIR /school

RUN npm install -g pm2

# Copy built app from previous stage
COPY --from=build /school /school


EXPOSE 4000

# Use bin/www as PM2 entrypoint
CMD ["pm2-runtime", "bin/www"]


