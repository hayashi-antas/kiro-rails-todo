# Makefile for Passkey Todo Board development

.PHONY: setup build up down logs shell db-setup db-migrate db-seed test test-watch clean restart status

# Setup development environment
setup:
	docker-compose build
	docker-compose run --rm web bundle install
	docker-compose run --rm web npm install
	make db-setup

# Build Docker images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View logs for specific service
logs-web:
	docker-compose logs -f web

logs-db:
	docker-compose logs -f db

# Check service status
status:
	docker-compose ps

# Open shell in web container
shell:
	docker-compose exec web bash

# Database setup (create and migrate)
db-setup:
	docker-compose run --rm web bundle exec rails db:prepare

# Run database migrations
db-migrate:
	docker-compose run --rm web bundle exec rails db:migrate

# Seed database
db-seed:
	docker-compose run --rm web bundle exec rails db:seed

# Reset database (drop, create, migrate, seed)
db-reset:
	docker-compose run --rm web bundle exec rails db:drop db:create db:migrate db:seed

# Run tests
test:
	docker-compose run --rm web bundle exec rspec

# Run frontend tests
test-frontend:
	docker-compose run --rm web npm test

# Run tests in watch mode
test-watch:
	docker-compose run --rm web bundle exec rspec --format documentation

# Run console
console:
	docker-compose exec web bundle exec rails console

# Install dependencies
install:
	docker-compose run --rm web bundle install
	docker-compose run --rm web npm install

# Clean up containers and volumes
clean:
	docker-compose down -v
	docker system prune -f

# Full reset (clean + setup)
reset: clean setup