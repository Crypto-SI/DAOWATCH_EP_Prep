#!/bin/bash

# Print header
echo "====================================="
echo "DAO Watch Automation Tool - Prototype"
echo "====================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

echo "Building and starting Docker containers..."
docker-compose up --build -d

echo ""
echo "====================================="
echo "Prototype is now running!"
echo "====================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
echo "To view logs:"
echo "docker-compose logs -f"
echo ""
echo "To stop the prototype:"
echo "docker-compose down"
echo ""
echo "NOTE: Initial startup may take a few minutes while Docker builds the images."
echo "=====================================" 