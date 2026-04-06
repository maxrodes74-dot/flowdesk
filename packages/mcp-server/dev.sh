#!/bin/bash
# Quick start script for local development

set -e

echo "🚀 Starting ScopePad MCP Server (dev mode)"
echo ""

if [ -z "$SCOPEPAD_API_KEY" ]; then
  echo "❌ Error: SCOPEPAD_API_KEY environment variable is not set"
  echo ""
  echo "Set your API key:"
  echo "  export SCOPEPAD_API_KEY=sp_..."
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✓ API Key loaded: ${SCOPEPAD_API_KEY:0:10}..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

echo "📝 Starting server..."
npm run dev

# If you want to test tool calls, you can use something like:
# echo '{"jsonrpc":"2.0","id":1,"method":"call_tool","params":{"name":"list_documents"}}' | node dist/index.js
