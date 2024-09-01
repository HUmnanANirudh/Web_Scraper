
FROM node:20-slim


RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*


ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true


WORKDIR /usr/src/app


COPY package*.json ./
RUN npm cache clean --force
RUN npm install --legacy-peer-deps


COPY . .


EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1


CMD [ "npm", "start" ]
