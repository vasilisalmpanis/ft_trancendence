#!/bin/sh

set -e 

echo "${0}: running migrations."
python manage.py makemigrations --merge
python manage.py migrate --noinput

# Starting the server
echo "${0}: starting the server."
python manage.py runserver 0.0.0.0:8000