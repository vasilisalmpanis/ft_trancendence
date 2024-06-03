#!/bin/sh

export DJANGO_SETTINGS_MODULE=transcendence_backend.settings
echo "${0}: running migrations."
python3 manage.py makemigrations chat
python3 manage.py makemigrations pong
python3 manage.py makemigrations users
python3 manage.py makemigrations tournament
python3 manage.py makemigrations stats
python3 manage.py migrate --noinput
python3 manage.py runworker pong_runner tournament_runner &
exec daphne --bind 0.0.0.0 -p 8000 transcendence_backend.asgi:application