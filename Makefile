up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

dev:
	npm run dev

db-shell:
	docker compose exec postgres psql -U budgetly -d budgetly

redis-shell:
	docker compose exec redis redis-cli

migrate:
	npx prisma migrate dev

seed:
	npx prisma db seed

studio:
	npx prisma studio

test:
	npm test

lint:
	npm run lint

type-check:
	npx tsc --noEmit
