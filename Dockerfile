# Step 1: Use an official Node.js runtime as a parent image
FROM node:20-slim

# Step 2: Install necessary packages including Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Step 3: Set environment variables for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Step 4: Set the working directory
WORKDIR /usr/src/app

# Step 5: Clear npm cache and install Node.js dependencies
COPY package*.json ./
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Step 6: Bundle the app source code
COPY . .

# Step 7: Expose the port the app runs on
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Step 8: Define the command to run the app
CMD [ "npm", "start" ]
