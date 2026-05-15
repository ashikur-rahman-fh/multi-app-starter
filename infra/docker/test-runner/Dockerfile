FROM python:3.12-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends libpq-dev gcc curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /workspace

COPY apps/backend/requirements.txt apps/backend/requirements-dev.txt /tmp/backend/
RUN pip install --no-cache-dir -r /tmp/backend/requirements.txt -r /tmp/backend/requirements-dev.txt

COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
COPY apps/frontend-main/package.json apps/frontend-main/
COPY apps/frontend-admin/package.json apps/frontend-admin/
COPY packages/shared/package.json packages/shared/

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

COPY . .

CMD ["bash", "infra/scripts/test/test-runner.sh"]
