.PHONY: help build up down logs restart shell backend-shell frontend-shell db-shell migrate makemigrations collectstatic createsuperuser test backend-test frontend-test lint backend-lint frontend-lint clean install-hooks

# Default environment file
ENV_FILE ?= .env

# Help command
help: ## Display this help message
	@echo "Zazzle Development Commands:"
	@echo "============================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development setup and management
install-hooks: ## Install pre-commit hooks
	pre-commit install

build: ## Build all Docker containers
	docker-compose --env-file $(ENV_FILE) build

up: ## Start all services
	docker-compose --env-file $(ENV_FILE) up -d

down: ## Stop all services
	docker-compose --env-file $(ENV_FILE) down

restart: ## Restart all services
	docker-compose --env-file $(ENV_FILE) restart

logs: ## View logs from all services
	docker-compose --env-file $(ENV_FILE) logs -f

logs-backend: ## View backend logs
	docker-compose --env-file $(ENV_FILE) logs -f backend

logs-frontend: ## View frontend logs
	docker-compose --env-file $(ENV_FILE) logs -f frontend

logs-db: ## View database logs
	docker-compose --env-file $(ENV_FILE) logs -f db

# Shell access
shell: backend-shell ## Access backend Django shell (alias for backend-shell)

backend-shell: ## Access backend Django shell
	docker-compose --env-file $(ENV_FILE) exec backend python manage.py shell

frontend-shell: ## Access frontend container shell
	docker-compose --env-file $(ENV_FILE) exec frontend sh

db-shell: ## Access PostgreSQL shell
	docker-compose --env-file $(ENV_FILE) exec db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2)

# Django management
migrate: ## Run Django migrations
	docker-compose --env-file $(ENV_FILE) exec backend python manage.py migrate

makemigrations: ## Create Django migrations
	docker-compose --env-file $(ENV_FILE) exec backend python manage.py makemigrations

collectstatic: ## Collect static files
	docker-compose --env-file $(ENV_FILE) exec backend python manage.py collectstatic --noinput

createsuperuser: ## Create Django superuser
	docker-compose --env-file $(ENV_FILE) exec backend python manage.py createsuperuser

# Testing
test: backend-test frontend-test ## Run all tests

backend-test: ## Run backend tests
	docker-compose --env-file $(ENV_FILE) exec backend python manage.py test

frontend-test: ## Run frontend tests
	docker-compose --env-file $(ENV_FILE) exec frontend npm test

# Linting and formatting
lint: backend-lint frontend-lint ## Run all linting

backend-lint: ## Run backend linting (ruff, black, mypy)
	docker-compose --env-file $(ENV_FILE) exec backend ruff check .
	docker-compose --env-file $(ENV_FILE) exec backend black --check .
	docker-compose --env-file $(ENV_FILE) exec backend mypy .

frontend-lint: ## Run frontend linting (eslint, prettier)
	docker-compose --env-file $(ENV_FILE) exec frontend npm run lint
	docker-compose --env-file $(ENV_FILE) exec frontend npm run type-check

backend-format: ## Format backend code
	docker-compose --env-file $(ENV_FILE) exec backend black .
	docker-compose --env-file $(ENV_FILE) exec backend ruff check --fix .

frontend-format: ## Format frontend code
	docker-compose --env-file $(ENV_FILE) exec frontend npm run format

# Cleanup
clean: ## Clean up Docker containers and volumes
	docker-compose --env-file $(ENV_FILE) down -v
	docker system prune -f
	docker volume prune -f

clean-build: ## Clean and rebuild everything
	make clean
	make build
	make up

# Database operations
db-reset: ## Reset database (WARNING: This will delete all data!)
	docker-compose --env-file $(ENV_FILE) down -v
	docker-compose --env-file $(ENV_FILE) up -d db
	sleep 5
	make migrate
	make createsuperuser

db-backup: ## Create database backup
	docker-compose --env-file $(ENV_FILE) exec db pg_dump -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) > backup_$$(date +%Y%m%d_%H%M%S).sql

# Development workflow
dev-setup: ## Complete development setup
	cp .env.example .env
	make install-hooks
	make build
	make up
	sleep 10
	make migrate
	@echo "Setup complete! Access the application at:"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "Admin: http://localhost:8000/admin"

# Production commands
prod-build: ## Build for production
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production services
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker-compose -f docker-compose.prod.yml down

# Monitoring
status: ## Show status of all services
	docker-compose --env-file $(ENV_FILE) ps

# Package management
backend-requirements: ## Update backend requirements
	docker-compose --env-file $(ENV_FILE) exec backend pip freeze > requirements.txt

frontend-deps: ## Show frontend dependencies
	docker-compose --env-file $(ENV_FILE) exec frontend npm list --depth=0