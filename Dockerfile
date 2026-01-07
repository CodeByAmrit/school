FROM node:lts-alpine
WORKDIR /school

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev \
  && npm cache clean --force

# Copy application source
COPY . .

# Create non-root user
RUN addgroup -S appgroup \
  && adduser -S appuser -G appgroup \
  && chown -R appuser:appgroup /school

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 5000

# Start the app
CMD ["node", "bin/www"]