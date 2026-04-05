#!/bin/bash
# Quick start script for local development

set -e

echo "Starting Knowledge Terrarium MCP Server (dev mode)"
echo ""

if [ -z "$TERRARIUM_API_KEY" ]; then
  echo "Error: TERRARIUM_API_KEY environment variable is not set"
  echo ""
  echo "Set your API key:"
  echo "  export TERRARIUM_API_KEY=your-key-here"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "API Key loaded: ${TERRARIUM_API_KEY:0:10}..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

echo "Starting server..."
npm run dev
