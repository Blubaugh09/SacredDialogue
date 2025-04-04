#!/bin/bash

# Biblical Character Dialogue Application Setup Script

echo "Setting up Biblical Character Dialogue Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js to continue."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit .env file with your API key if you want to use AI integration."
fi

# Run the development server
echo "Starting development server on port 3004..."
PORT=3004 npm start 