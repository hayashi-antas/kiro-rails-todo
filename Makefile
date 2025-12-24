# Makefile for Passkey Todo Board development

.PHONY: setup build up down logs shell db-setup db-migrate db-seed test clean

# Setup development environment
setup:
	docker-compose build
	docker-compose run --rm web bundle install
	docker-compose run --rm web npm install

# Build Docker images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Open shell in web container
shell:
	docker-compose exec web bash

# Database setup
db-setup:
	docker-compose run --rm web bundle exec rails db:create db:migrate

# Run database migrations
db-migrate:
	docker-compose run --rm web bundle exec rails db:migrate

# Seed database
db-seed:
	docker-compose run --rm web bundle exec rails db:seed

# Run tests
test:
	docker-compose run --rm web bundle exec rspec

# Clean up containers and volumes
clean:
	docker-compose down -v
	docker system prune -f