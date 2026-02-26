# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# pnpm 활성화
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app

# 의존성 설치에 필요한 파일만 먼저 복사 (캐시 활용)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 각 패키지의 package.json 복사 (실제 소스 없이 의존성 트리 구성)
COPY apps/playground/package.json ./apps/playground/
COPY packages/core/package.json ./packages/core/
COPY packages/ui-kit/package.json ./packages/ui-kit/
COPY packages/image/package.json ./packages/image/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# 의존성 설치 (frozen lockfile)
RUN pnpm install --frozen-lockfile

# 소스 전체 복사
COPY . .

# playground 빌드 (vite가 workspace 패키지를 alias로 직접 번들링)
RUN pnpm --filter @jikjo/playground build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# 빌드 결과물 복사
COPY --from=builder /app/apps/playground/dist /usr/share/nginx/html

# SPA 라우팅: 모든 경로를 index.html로 fallback
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
