FROM node:20-slim

# Install FFmpeg and other dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/renderer/package*.json ./
COPY apps/renderer/tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy shared package
COPY packages/shared/ ./packages/shared/

# Install shared package dependencies and build it
WORKDIR /app/packages/shared
RUN npm install && npm run build

# Go back to main app directory
WORKDIR /app

# Copy source code
COPY apps/renderer/src/ ./src/

# Create symlink to shared package in node_modules
RUN ln -sf /app/packages/shared /app/node_modules/@vr-reels/shared

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create tmp directory for file operations
RUN mkdir -p /tmp

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]