#!/bin/bash

echo "========================================"
echo "Employee Management System - Setup"
echo "========================================"
echo ""

echo "Installing Backend Dependencies..."
cd server
npm install
cd ..
echo ""

echo "Installing Frontend Dependencies..."
cd client
npm install
cd ..
echo ""

echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Make sure MongoDB is running"
echo "2. Open a terminal and run: cd server && npm run dev"
echo "3. Open another terminal and run: cd client && npm run dev"
echo "4. (Optional) Seed demo data: cd server && node scripts/seed.js"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo ""
