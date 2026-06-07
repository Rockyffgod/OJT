#!/bin/bash
set -e
cd "$(dirname "$0")"

print_usage() {
    echo "Usage: $0 [command]"
    echo "  dev       - Start development server (default)"
    echo "  build     - Build for production"
    echo "  preview   - Preview production build"
    echo "  lint      - Run linter"
    echo "  typecheck - Run TypeScript type checking"
    echo "  setup     - Install dependencies only"
}

case "${1:-dev}" in
    dev)
        echo "Starting development server..."
        npm install --silent
        npm run dev
        ;;
    build)
        echo "Building for production..."
        npm install --silent
        npm run build
        ;;
    preview)
        echo "Previewing production build..."
        npm run preview
        ;;
    lint)
        echo "Running linter..."
        npm run lint
        ;;
    typecheck)
        echo "Running TypeScript type check..."
        npm run typecheck
        ;;
    setup)
        echo "Installing dependencies..."
        npm install
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
