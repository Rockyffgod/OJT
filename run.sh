#!/bin/bash
set -e

print_usage() {
    echo "Usage: $0 [command]"
    echo "  dev         - Start both frontend and backend"
    echo "  frontend    - Start frontend dev server only"
    echo "  backend     - Start backend dev server only"
    echo "  build       - Build frontend for production"
    echo "  migrate     - Run Django database migrations"
    echo "  setup       - Install dependencies for both"
}

KARMA_DIR="$(dirname "$0")/Karma"
BACKEND_DIR="$(dirname "$0")/backend"

case "${1:-dev}" in
    dev)
        echo "Starting frontend..."
        cd "$KARMA_DIR" && npm run dev &
        echo "Starting backend..."
        cd "$BACKEND_DIR" && ../venv/bin/python3 manage.py runserver 0.0.0.0:8000 &
        wait
        ;;
    frontend)
        cd "$KARMA_DIR" && npm run dev
        ;;
    backend)
        cd "$BACKEND_DIR" && ../venv/bin/python3 manage.py runserver 0.0.0.0:8000
        ;;
    build)
        cd "$KARMA_DIR" && npm run build
        ;;
    migrate)
        cd "$BACKEND_DIR" && ../venv/bin/python3 manage.py migrate
        ;;
    setup)
        echo "Installing frontend dependencies..."
        cd "$KARMA_DIR" && npm install
        echo "Backend dependencies already in venv"
        cd "$BACKEND_DIR" && ../venv/bin/python3 manage.py migrate
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        echo "Unknown command: $1"
        print_usage
        exit 1
        ;;
esac
