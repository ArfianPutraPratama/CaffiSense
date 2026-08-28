#!/bin/sh
set -e

# 1. Ensure required storage and cache directories exist
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/app/public
mkdir -p /var/www/html/storage/logs

# 2. Ensure permissions
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# 3. Ensure .env exists if not provided
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

# 4. Create storage symlink safely
php artisan storage:link || true

# 5. Run database migrations safely
php artisan migrate --force || true

# 6. Execute server
exec php artisan serve --host=0.0.0.0 --port=8000
