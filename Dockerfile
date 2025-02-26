# Use a smaller base image
FROM node:20-alpine AS build

# Install dependencies and tools
RUN apk add --no-cache git && \
    npm install -g pm2

# Set working directory
WORKDIR /school

# Clone repo (Only if needed)
RUN git clone --depth 1 https://github.com/CodeByAmrit/school.git . || \
    (cd school && git pull)

# Install Node.js dependencies
RUN npm install --omit=dev && npm cache clean --force

# Use a lightweight runtime image
FROM node:20-alpine

# Set working directory
WORKDIR /school

# Install PM2 in the runtime container
RUN npm install -g pm2

# Copy necessary files from the build stage
COPY --from=build /school /school
COPY google-credentials.json ./google-credentials.json
COPY captcha.json ./captcha.json
COPY .env ./.env

# Expose necessary port
EXPOSE 3000

# Start the application with PM2 and bin/www
CMD ["pm2-runtime", "start", "bin/www"]
