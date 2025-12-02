#!/bin/bash

# SnackRapido Docker Setup Script
# This script helps manage the Docker services for SnackRapido

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to start services
start_services() {
    print_status "Starting SnackRapido services..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp docker/config.env .env
        print_warning "Please update .env file with your actual configuration values"
    fi
    
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    check_service_health
    
    print_success "All services started successfully!"
    print_status "Service URLs:"
    echo "  - MongoDB: mongodb://admin:password123@localhost:27017/snackrapido"
    echo "  - Redis: redis://:redis123@localhost:6379"
    echo "  - RabbitMQ Management: http://localhost:15672 (admin/rabbit123)"
    echo "  - Mongo Express: http://localhost:8081 (admin/admin123)"
    echo "  - Redis Commander: http://localhost:8082"
}

# Function to stop services
stop_services() {
    print_status "Stopping SnackRapido services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting SnackRapido services..."
    docker-compose down
    docker-compose up -d
    print_success "Services restarted"
}

# Function to check service health
check_service_health() {
    print_status "Checking service health..."
    
    # Check MongoDB
    if docker exec snackrapido-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB is healthy"
    else
        print_error "MongoDB is not responding"
    fi
    
    # Check Redis
    if docker exec snackrapido-redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_error "Redis is not responding"
    fi
    
    # Check RabbitMQ
    if docker exec snackrapido-rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; then
        print_success "RabbitMQ is healthy"
    else
        print_error "RabbitMQ is not responding"
    fi
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Function to reset everything
reset_all() {
    print_warning "This will delete all data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Resetting all data..."
        docker-compose down -v
        docker-compose up -d
        print_success "Reset complete"
    else
        print_status "Reset cancelled"
    fi
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose ps
}

# Main script logic
case "$1" in
    start)
        check_docker
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        check_docker
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    health)
        check_service_health
        ;;
    reset)
        check_docker
        reset_all
        ;;
    *)
        echo "SnackRapido Docker Management Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|health|reset}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status"
        echo "  logs    - Show logs (optionally specify service name)"
        echo "  health  - Check service health"
        echo "  reset   - Reset all data (WARNING: deletes all data)"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs mongodb"
        echo "  $0 health"
        exit 1
        ;;
esac











