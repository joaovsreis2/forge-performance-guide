#!/bin/sh
set -e

if [ "${WAIT_FOR_DATABASE:-true}" = "true" ]; then
  python manage.py wait_for_database --timeout "${DATABASE_WAIT_TIMEOUT:-60}"
fi

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  python manage.py migrate --noinput
fi

if [ "${RUN_COLLECTSTATIC:-false}" = "true" ]; then
  python manage.py collectstatic --noinput
fi

exec "$@"
