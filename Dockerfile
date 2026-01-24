# 生产环境单镜像 Dockerfile
# 将 API 和 Web 打包到一个镜像中，使用 Nginx 作为反向代理

FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat

# 构建阶段 - API
FROM base AS api-builder
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/dns-providers/package*.json ./packages/dns-providers/

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN cd packages/database && npx prisma generate

# 构建 API
RUN cd apps/api && npm run build

# 构建阶段 - Web
FROM base AS web-builder
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建 Web 应用
RUN cd apps/web && npm run build

# 生产阶段 - 合并镜像
FROM nginx:alpine AS production

# 安装 Node.js 和 PM2
RUN apk add --no-cache nodejs npm
RUN npm install -g pm2

# 创建应用用户
RUN addgroup -g 1001 -S kagerou
RUN adduser -S kagerou -u 1001

# 创建应用目录
WORKDIR /app

# 复制 API 构建结果
COPY --from=api-builder --chown=kagerou:kagerou /app/apps/api/dist ./api/
COPY --from=api-builder --chown=kagerou:kagerou /app/packages ./packages/
COPY --from=api-builder --chown=kagerou:kagerou /app/node_modules ./node_modules/
COPY --from=api-builder --chown=kagerou:kagerou /app/package*.json ./

# 复制 Web 构建结果
COPY --from=web-builder --chown=kagerou:kagerou /app/apps/web/.next/standalone ./web/
COPY --from=web-builder --chown=kagerou:kagerou /app/apps/web/.next/static ./web/apps/web/.next/static/
COPY --from=web-builder --chown=kagerou:kagerou /app/apps/web/public ./web/apps/web/public/

# 创建 PM2 配置文件
COPY --chown=kagerou:kagerou <<EOF /app/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'kagerou-api',
      script: './api/index.js',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      log_file: '/var/log/pm2/api.log'
    },
    {
      name: 'kagerou-web',
      script: './web/server.js',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      error_file: '/var/log/pm2/web-error.log',
      out_file: '/var/log/pm2/web-out.log',
      log_file: '/var/log/pm2/web.log'
    }
  ]
};
EOF

# 创建 Nginx 配置
COPY --chown=root:root <<EOF /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    client_max_body_size 20M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    upstream api {
        server 127.0.0.1:3001;
    }

    upstream web {
        server 127.0.0.1:3000;
    }

    server {
        listen 80;
        server_name _;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API 代理
        location /api/ {
            proxy_pass http://api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 86400;
        }

        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            proxy_pass http://web;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 前端代理
        location / {
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 86400;
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# 创建启动脚本
COPY --chown=root:root <<EOF /docker-entrypoint.sh
#!/bin/sh
set -e

# 创建日志目录
mkdir -p /var/log/pm2
chown -R kagerou:kagerou /var/log/pm2

# 等待数据库连接
if [ -n "\$DATABASE_URL" ]; then
    echo "等待数据库连接..."
    until su kagerou -c "cd /app && node -e \"
const { PrismaClient } = require('./packages/database/src/index.js');
const prisma = new PrismaClient();
prisma.\\\$connect().then(() => {
  console.log('数据库连接成功');
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
\"" > /dev/null 2>&1; do
        echo "等待数据库就绪..."
        sleep 2
    done
    
    echo "运行数据库初始化..."
    su kagerou -c "cd /app/packages/database && npx prisma db push"
    
    echo "初始化数据库数据..."
    su kagerou -c "cd /app && node scripts/init-database.js"
fi

# 启动 PM2 进程管理器
echo "启动应用服务..."
su kagerou -c "cd /app && pm2 start ecosystem.config.js --no-daemon" &

# 等待应用启动
sleep 5

# 启动 Nginx
echo "启动 Nginx..."
exec nginx -g 'daemon off;'
EOF

RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# 设置入口点
ENTRYPOINT ["/docker-entrypoint.sh"]