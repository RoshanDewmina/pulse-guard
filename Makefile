.PHONY: setup dev clean docker-up docker-down migrate seed install build

# Setup: Install dependencies and start infrastructure
setup: install docker-up
	@echo "Waiting for services to be ready..."
	@sleep 5
	@$(MAKE) migrate
	@$(MAKE) seed
	@echo "✅ Setup complete! Run 'make dev' to start development."

# Install dependencies
install:
	@echo "Installing dependencies with Bun..."
	@bun install

# Start Docker services
docker-up:
	@echo "Starting Docker services..."
	@docker compose up -d
	@echo "✅ Docker services started"

# Stop Docker services
docker-down:
	@echo "Stopping Docker services..."
	@docker compose down
	@echo "✅ Docker services stopped"

# Run database migrations
migrate:
	@echo "Running Prisma migrations..."
	@cd packages/db && bun run migrate
	@echo "✅ Migrations complete"

# Generate Prisma client
generate:
	@echo "Generating Prisma client..."
	@cd packages/db && bun run generate
	@echo "✅ Prisma client generated"

# Seed database
seed:
	@echo "Seeding database..."
	@cd packages/db && bun run seed
	@echo "✅ Database seeded"

# Start development servers
dev:
	@echo "Starting development servers..."
	@bun run dev

# Build all apps
build:
	@echo "Building all apps..."
	@bun run build

# Clean everything (stop docker, remove volumes)
clean: docker-down
	@echo "Removing Docker volumes..."
	@docker compose down -v
	@echo "✅ Clean complete"

# Reset: Clean and setup from scratch
reset: clean setup
	@echo "✅ Reset complete"

