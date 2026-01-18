-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "quota" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dns_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dns_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dns_accounts" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dns_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "available_domains" (
    "id" TEXT NOT NULL,
    "dnsAccountId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "available_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dnsAccountId" TEXT NOT NULL,
    "availableDomainId" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "recordType" TEXT NOT NULL DEFAULT 'A',
    "value" TEXT NOT NULL,
    "providerRecordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ttl" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dns_providers_name_key" ON "dns_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "available_domains_dnsAccountId_domain_key" ON "available_domains"("dnsAccountId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "domains_subdomain_availableDomainId_key" ON "domains"("subdomain", "availableDomainId");

-- CreateIndex
CREATE INDEX "domains_userId_idx" ON "domains"("userId");

-- CreateIndex
CREATE INDEX "domains_status_idx" ON "domains"("status");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_logs_userId_idx" ON "api_logs"("userId");

-- CreateIndex
CREATE INDEX "api_logs_createdAt_idx" ON "api_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "dns_accounts" ADD CONSTRAINT "dns_accounts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "dns_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "available_domains" ADD CONSTRAINT "available_domains_dnsAccountId_fkey" FOREIGN KEY ("dnsAccountId") REFERENCES "dns_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_dnsAccountId_fkey" FOREIGN KEY ("dnsAccountId") REFERENCES "dns_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_availableDomainId_fkey" FOREIGN KEY ("availableDomainId") REFERENCES "available_domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default DNS providers
INSERT INTO "dns_providers" ("id", "name", "displayName", "isActive", "configSchema", "createdAt") VALUES
('clrh1x2y40000qr8v4k5j6l7m', 'cloudflare', 'Cloudflare', true, '{"type":"object","required":["apiToken"],"properties":{"apiToken":{"type":"string","description":"Cloudflare API Token"}}}', CURRENT_TIMESTAMP),
('clrh1x2y40001qr8v9n3p2q4r', 'aliyun', '阿里云 DNS', true, '{"type":"object","required":["accessKeyId","accessKeySecret"],"properties":{"accessKeyId":{"type":"string","description":"Access Key ID"},"accessKeySecret":{"type":"string","description":"Access Key Secret"}}}', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;