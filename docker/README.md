# SnackRapido Docker Setup

This directory contains Docker configuration for the SnackRapido microservices architecture.

## Services Included

- **MongoDB**: Primary database with geospatial indexing
- **Redis**: Caching and pub/sub messaging
- **RabbitMQ**: Message broker for microservices communication
- **Mongo Express**: Web-based MongoDB admin interface
- **Redis Commander**: Web-based Redis admin interface

## Quick Start

1. **Start all services:**
   ```bash
   cd Food-Delivery-WebApp
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f [service-name]
   ```

4. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Service URLs

- **MongoDB**: `mongodb://admin:password123@localhost:27017/snackrapido`
- **Redis**: `redis://:redis123@localhost:6379`
- **RabbitMQ Management**: http://localhost:15672 (admin/rabbit123)
- **Mongo Express**: http://localhost:8081 (admin/admin123)
- **Redis Commander**: http://localhost:8082

## Environment Configuration

1. Copy `docker/config.env` to `.env` in the project root
2. Update the configuration values as needed
3. Make sure to change default passwords in production

## Database Initialization

The MongoDB container automatically runs initialization scripts from `docker/mongodb/init/` to:
- Create the `snackrapido` database
- Set up collections with proper indexes
- Configure geospatial indexes for location-based queries

## Data Persistence

All data is persisted using Docker volumes:
- `mongodb_data`: MongoDB data
- `redis_data`: Redis data
- `rabbitmq_data`: RabbitMQ data

## Troubleshooting

### Port Conflicts
If you get port conflicts, check what's running on:
- 27017 (MongoDB)
- 6379 (Redis)
- 5672 (RabbitMQ)
- 15672 (RabbitMQ Management)
- 8081 (Mongo Express)
- 8082 (Redis Commander)

### Reset Everything
To completely reset all data:
```bash
docker-compose down -v
docker-compose up -d
```

### Check Service Health
```bash
# MongoDB
docker exec snackrapido-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec snackrapido-redis redis-cli ping

# RabbitMQ
docker exec snackrapido-rabbitmq rabbitmq-diagnostics ping
```









