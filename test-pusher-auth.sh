#!/bin/bash

# Test Pusher Beams Auth Endpoint
# Replace YOUR_AUTH_TOKEN with an actual user token from localStorage

echo "🧪 Testing Pusher Beams Auth Endpoint..."
echo ""

# Test endpoint
curl -X POST http://localhost:8000/notifications/pusher-beams-auth \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${VITE_SDK_API_KEY:-your_sdk_api_key}" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -v

echo ""
echo ""
echo "Expected response:"
echo '{"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."}'
echo ""
echo "If you get 403 Invalid JWT issuer, the backend is not using beamsClient.generateToken(userId)"

