# ---- Stage 1: Build ----
FROM node:lts-alpine AS build

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /school

# Copy dependency files and install
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy the rest of the application files
COPY . .

# ---- Stage 2: Runtime ----
FROM node:lts-alpine

WORKDIR /school

# Set production environment
ENV NODE_ENV=production

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built app from previous stage
COPY --from=build /school/node_modules ./node_modules
COPY --from=build /school/package.json ./
COPY --from=build /school/bin ./bin
COPY --from=build /school/public ./public
COPY --from=build /school/views ./views
COPY --from=build /school/router ./router
COPY --from=build /school/services ./services
COPY --from=build /school/middleware ./middleware
COPY --from=build /school/models ./models
COPY --from=build /school/components ./components
COPY --from=build /school/app.js ./

# Install pm2 globally
RUN npm install -g pm2

# Change ownership to the new user
RUN chown -R appuser:appgroup /school
USER appuser

EXPOSE 4000

# Use bin/www as PM2 entrypoint
CMD ["pm2-runtime", "bin/www"]
