FROM php:8.4-cli-alpine

WORKDIR /var/www/html

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    curl \
    git \
    bash \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    mariadb-client \
    && docker-php-ext-install pdo pdo_mysql mbstring bcmath zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs

# Set permissions for Laravel storage and bootstrap/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

# Run migrations, link storage, and start server
CMD ["sh", "-c", "php artisan storage:link && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
