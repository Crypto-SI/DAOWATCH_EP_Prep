FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV PORT=5000
ENV NODE_ENV=development

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"] 