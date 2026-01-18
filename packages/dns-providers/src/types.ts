export interface DNSRecord {
  id?: string;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME';
  value: string;
  ttl?: number;
  proxied?: boolean; // 是否启用代理（仅 Cloudflare 支持）
}

export interface DNSProviderCredentials {
  [key: string]: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

export interface DNSProvider {
  name: string;
  
  // 基础操作
  createRecord(domain: string, record: DNSRecord): Promise<DNSRecord>;
  updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<DNSRecord>;
  deleteRecord(domain: string, recordId: string): Promise<void>;
  getRecord(domain: string, recordId: string): Promise<DNSRecord>;
  listRecords(domain: string, type?: string): Promise<DNSRecord[]>;
  
  // 域名管理
  listDomains?(): Promise<string[]>;
  
  // 验证与健康检查
  validateCredentials(): Promise<boolean>;
  getQuotaInfo?(): Promise<QuotaInfo>;
}

export interface DNSProviderConfig {
  type: string;
  credentials: DNSProviderCredentials;
}
