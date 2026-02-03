#!/bin/bash

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
    echo "PostgreSQL is not ready... waiting..."
    sleep 2
done
echo "PostgreSQL is ready!"

echo "Initializing database..."
# python init_db_postgres.py

echo "Starting FastAPI application..."
echo "Using port: ${PORT:-3001}"
uvicorn index:app --host 0.0.0.0 --port "${PORT:-3001}"
