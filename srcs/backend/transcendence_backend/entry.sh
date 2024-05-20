#!/bin/sh

bg=0
while getopts "b:" opt; do
  case ${opt} in
    b )
      bg=1
      ;;
  esac
done

export DJANGO_SETTINGS_MODULE=transcendence_backend.settings
if [ $bg -eq 0 ]; then
    echo "${0}: running migrations."
    python3 manage.py makemigrations chat
    python3 manage.py makemigrations pong
    python3 manage.py makemigrations users
    python3 manage.py makemigrations tournament
    python3 manage.py makemigrations stats
    python3 manage.py migrate --noinput
    exec daphne --bind 0.0.0.0 -p 8000 transcendence_backend.asgi:application
else
    echo "${0}: starting background workers pong_runner and tournament_runner."
    exec python3 manage.py runworker pong_runner tournament_runner
fi