FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV PORT=3000
ENV REACT_APP_API_URL=http://localhost:5000

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 