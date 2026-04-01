# Use Node.js 22 (Bookworm)
FROM node:22-bookworm-slim

# Create app directory
WORKDIR /usr/src/app

# Install build dependencies for sqlite3 (if needed)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD [ "npm", "run", "dev" ]
