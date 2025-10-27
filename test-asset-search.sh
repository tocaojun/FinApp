#!/bin/bash

echo "Testing asset search API..."

# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testapi@finapp.com","password":"testapi123"}' | jq -r '.data.tokens.accessToken')

echo "Token: ${TOKEN:0:50}..."

# Test asset search
echo ""
echo "Searching for assets with type ID: 19e336b0-e790-429b-b2c0-8136090eb06e"
curl -s "http://localhost:8000/api/assets/search?assetTypeId=19e336b0-e790-429b-b2c0-8136090eb06e&isActive=true&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
