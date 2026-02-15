#!/bin/bash
# init-letsencrypt.sh
# Run this ONCE on the OCI VM to obtain the initial SSL certificate.
# After this, the certbot container in docker-compose handles auto-renewal.

set -e

DOMAIN="picklepro.duckdns.org"
EMAIL="jayy2kok@gmail.com"  # Used for renewal notifications
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== PicklePro SSL Certificate Setup ==="

# Step 1: Create required directories
echo "[1/4] Creating directories..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Step 2: Download recommended TLS parameters
echo "[2/4] Downloading TLS parameters..."
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > ./certbot/conf/options-ssl-nginx.conf
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > ./certbot/conf/ssl-dhparams.pem

# Step 3: Create a temporary self-signed certificate so nginx can start
echo "[3/4] Creating temporary self-signed certificate..."
mkdir -p ./certbot/conf/live/$DOMAIN
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
  -keyout ./certbot/conf/live/$DOMAIN/privkey.pem \
  -out ./certbot/conf/live/$DOMAIN/fullchain.pem \
  -subj "/CN=$DOMAIN"

# Start nginx with the temporary cert
echo "  Starting nginx..."
docker compose -f $COMPOSE_FILE up -d nginx-proxy

# Step 4: Request the real certificate from Let's Encrypt
echo "[4/4] Requesting Let's Encrypt certificate..."

# Delete the temporary certificate
rm -rf ./certbot/conf/live/$DOMAIN

# Request the real one
docker compose -f $COMPOSE_FILE run --rm --entrypoint "certbot" certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

# Reload nginx with the real certificate
echo "Reloading nginx..."
docker compose -f $COMPOSE_FILE exec nginx-proxy nginx -s reload

echo ""
echo "=== Done! SSL certificate installed for $DOMAIN ==="
echo "Now run: docker compose -f $COMPOSE_FILE up -d"
