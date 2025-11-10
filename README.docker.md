# Docker Deployment Guide

This guide explains how to deploy the full-stack application using Docker Compose.

## Prerequisites

- Docker Engine 20.10.0 or higher
- Docker Compose V2 or higher

## Quick Start

1. **Copy the environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your configuration:**

   - Change `MYSQL_ROOT_PASSWORD` to a secure password
   - Update `JWT_SECRET` with a strong secret key (minimum 32 characters)
   - Adjust other settings as needed

3. **Build and start all services:**

   ```bash
   docker-compose up -d
   ```

4. **Check service status:**

   ```bash
   docker-compose ps
   ```

5. **View logs:**

   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f mysql
   ```

## Service URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3030/api
- **MySQL:** localhost:3306

## Database Setup

The MySQL database will be automatically created with the credentials from your `.env` file.

### Run Database Migrations

After the services are running, execute migrations:

```bash
# Access the backend container
docker-compose exec backend sh

# Run migrations
npm run db:push

# Optionally, seed the database
npm run seed

# Exit the container
exit
```

## Available Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### Rebuild Services

```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### View Logs

```bash
# Follow logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 frontend
```

### Execute Commands in Containers

```bash
# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Access MySQL shell
docker-compose exec mysql mysql -u nestjs -p
```

## Development vs Production

### Development Mode

For development with hot-reload, modify the `docker-compose.yml`:

```yaml
backend:
  command: npm run start:dev
  volumes:
    - ./backend:/app
    - /app/node_modules

frontend:
  command: npm run dev
  volumes:
    - ./frontend:/app
    - /app/node_modules
    - /app/.next
```

### Production Mode

The default configuration is optimized for production with:

- Multi-stage Docker builds for smaller images
- Health checks for all services
- Automatic restarts on failure
- Optimized Node.js production builds

## Environment Variables

### Required Variables

- `MYSQL_ROOT_PASSWORD`: MySQL root password
- `DATABASE_NAME`: Database name
- `DATABASE_USER`: Database user
- `DATABASE_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT tokens

### Optional Variables

- `NODE_ENV`: Environment mode (default: production)
- `BACKEND_PORT`: Backend port (default: 3030)
- `FRONTEND_PORT`: Frontend port (default: 3000)
- `DATABASE_PORT`: MySQL port (default: 3306)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `NEXT_PUBLIC_API_URL`: API URL for frontend (default: http://localhost:3030)
- `ENABLE_AUDIT_LOGGING`: Enable audit logs (default: true)
- `JWT_EXPIRATION`: JWT token expiration (default: 24h)

## Troubleshooting

### Services won't start

```bash
# Check service logs
docker-compose logs

# Check service status
docker-compose ps
```

### Database connection errors

```bash
# Verify MySQL is healthy
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Verify database credentials in .env file
```

### Port conflicts

If ports 3000, 3030, or 3306 are already in use:

1. Update the port mappings in `.env`
2. Restart services: `docker-compose up -d`

### Clear all data and restart

```bash
# Stop services and remove volumes
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Backup and Restore

### Backup Database

```bash
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD nestjs > backup.sql
```

### Restore Database

```bash
docker-compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD nestjs < backup.sql
```

## Security Considerations

1. **Change default passwords** in the `.env` file
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Don't commit `.env`** files to version control
4. **Update MySQL root password** regularly
5. **Use environment-specific configurations** for staging/production

## Performance Optimization

1. **Adjust MySQL configuration** based on available resources
2. **Configure connection pooling** in the backend
3. **Use CDN** for static assets in production
4. **Enable caching** where appropriate
5. **Monitor resource usage**: `docker stats`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
