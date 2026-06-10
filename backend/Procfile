web: gunicorn config.wsgi:application --workers 4 --timeout 120
release: python manage.py migrate --noinput
