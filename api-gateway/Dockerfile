# Base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the source code
COPY . .

# Expose the gateway port
EXPOSE 3000

# Start the gateway
CMD ["node", "src/index.js"]
