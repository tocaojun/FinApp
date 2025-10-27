#!/bin/bash

echo "Stopping all backend processes..."
pkill -9 -f "nodemon.*backend"
pkill -9 -f "ts-node.*backend"
sleep 2

echo "Starting backend service..."
cd /Users/caojun/code/FinApp/backend
npm run dev
