FROM node:20-slim

# Install FFmpeg and other dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Create tmp directory for file operations
RUN mkdir -p /tmp

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]