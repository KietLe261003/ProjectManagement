#!/bin/bash

# Pre-build script to ensure proper directory permissions
FRONTEND_DIR="../todo/public/frontend"

# Create directory if it doesn't exist
mkdir -p "$FRONTEND_DIR"

# Set proper permissions
chmod -R 755 "$FRONTEND_DIR" 2>/dev/null || true

# Remove assets directory to avoid conflicts
rm -rf "$FRONTEND_DIR/assets" 2>/dev/null || true

echo "Pre-build setup completed"
