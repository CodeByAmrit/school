# Use a smaller base image
FROM node:20-alpine AS build

# Install dependencies and tools
RUN apk add --no-cache python3 make g++ && npm install -g pm2

# Set working directory
WORKDIR /school

# Copy everything from local machine (Coolify will mount repo here)
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .

# Use a lightweight runtime image
FROM node:20-alpine

WORKDIR /school
RUN npm install -g pm2

COPY --from=build /school /school

# Copy secrets (if you want them inside image, not recommended for security)
# Better: use Coolify's secrets/volumes
COPY google-credentials.json ./google-credentials.json
COPY captcha.json ./captcha.json
COPY .env ./.env

EXPOSE 3000
CMD ["pm2-runtime", "start", "bin/www"]
