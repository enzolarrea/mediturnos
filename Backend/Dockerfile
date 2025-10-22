# Imagen base oficial de PHP con Apache
FROM php:8.2-apache

# Instalar extensiones necesarias (mysqli y pdo_mysql)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copiar los archivos del proyecto al directorio web
COPY . /var/www/html/

# Dar permisos de lectura
RUN chown -R www-data:www-data /var/www/html

# Exponer el puerto web
EXPOSE 80

# Iniciar Apache
CMD ["apache2-foreground"]
