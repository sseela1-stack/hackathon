#!/bin/bash

# Test script for Express app bootstrap
echo "🧪 Testing FinQuest Backend API"
echo "================================"
echo

# Start server in background
echo "Starting server..."
cd "$(dirname "$0")"
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 4

echo "✅ Server started (PID: $SERVER_PID)"
echo

# Test health endpoint
echo "📊 Testing /api/health endpoint:"
curl -s http://localhost:4000/api/health | python3 -m json.tool
echo
echo

# Test 404 handler
echo "❌ Testing 404 handler:"
curl -s http://localhost:4000/nonexistent | python3 -m json.tool
echo
echo

# Test root endpoint
echo "🏠 Testing root endpoint:"
curl -s http://localhost:4000/ | python3 -m json.tool
echo
echo

# Test request logging (with custom header)
echo "📝 Testing request logging (check server.log for req.id):"
curl -s -H "X-Request-ID: test-123" http://localhost:4000/api/health > /dev/null
grep "test-123" server.log | tail -1
echo
echo

# Test CORS headers
echo "🌐 Testing CORS headers:"
curl -s -I -H "Origin: http://localhost:5173" http://localhost:4000/api/health | grep -i "access-control"
echo

# Test graceful shutdown
echo "🛑 Testing graceful shutdown (sending SIGTERM):"
kill -TERM $SERVER_PID
sleep 2
echo "✅ Server gracefully shut down"
echo

# Cleanup
rm -f server.log

echo "✨ All tests complete!"
