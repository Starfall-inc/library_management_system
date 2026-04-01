FROM node:18-slim

RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

# Force sqlite3 to compile from source instead of downloading a prebuilt binary
RUN npm_config_build_from_source=true npm install --omit=dev

COPY . .

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["npm", "run", "dev"]