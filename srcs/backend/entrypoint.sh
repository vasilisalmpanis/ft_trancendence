#!/bin/sh

set -e 

poetry install --no-root
source .venv/bin/activate
cd transcendence_backend

echo "${0}: running migrations."
python3 manage.py makemigrations chat
python3 manage.py makemigrations pong
python3 manage.py makemigrations users
python3 manage.py makemigrations tournament
python3 manage.py makemigrations stats
python3 manage.py migrate --noinput
echo "argument: " $1
export DJANGO_SETTINGS_MODULE=transcendence_backend.settings
python3 manage.py runworker pong_runner tournament_runner &
# Starting the server
echo "${0}: starting the server."
python3 manage.py runserver 0.0.0.0:8000

# Daphne server
# daphne --bind 0.0.0.0 -p 8000 transcendence_backend.asgi:application