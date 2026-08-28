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

# 3. Ensure .env exists with MySQL settings
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Force correct DB connection and credentials in .env
sed -i "s/DB_CONNECTION=.*/DB_CONNECTION=${DB_CONNECTION:-mysql}/" /var/www/html/.env
sed -i "s/DB_HOST=.*/DB_HOST=${DB_HOST:-tugasweb-db}/" /var/www/html/.env
sed -i "s/DB_PORT=.*/DB_PORT=${DB_PORT:-3306}/" /var/www/html/.env
sed -i "s/DB_DATABASE=.*/DB_DATABASE=${DB_DATABASE:-cafficheck}/" /var/www/html/.env
sed -i "s/DB_USERNAME=.*/DB_USERNAME=${DB_USERNAME:-root}/" /var/www/html/.env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD:-rootpassword}/" /var/www/html/.env
grep -q "DB_COLLATION" /var/www/html/.env && sed -i 's/DB_COLLATION=.*/DB_COLLATION=utf8mb4_unicode_ci/' /var/www/html/.env || echo "DB_COLLATION=utf8mb4_unicode_ci" >> /var/www/html/.env
grep -q "DB_CHARSET" /var/www/html/.env && sed -i 's/DB_CHARSET=.*/DB_CHARSET=utf8mb4/' /var/www/html/.env || echo "DB_CHARSET=utf8mb4" >> /var/www/html/.env

# 4. Clear cached configuration to ensure MySQL is used
php artisan config:clear || true

# 5. Create storage symlink safely
php artisan storage:link || true

# 6. Run database migrations safely
php artisan migrate --force || true

# 7. Seed initial admin/user account if missing
php artisan tinker --execute="if(!App\Models\User::where('email','arfian.23001@mhs.unesa.ac.id')->exists()){ App\Models\User::create(['name'=>'pian','email'=>'arfian.23001@mhs.unesa.ac.id','password'=>Illuminate\Support\Facades\Hash::make('password123')]); }" || true

# 8. Execute server
exec php artisan serve --host=0.0.0.0 --port=8000
