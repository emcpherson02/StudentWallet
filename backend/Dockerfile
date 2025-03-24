FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create src directory if it doesn't exist
RUN mkdir -p src

# Make sure all necessary directories are created and files are in place
RUN mkdir -p src/models src/services src/controllers src/routes src/middleware src/config src/utils

EXPOSE 3001

CMD ["npm", "run", "dev"]