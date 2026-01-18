import Cloudflare from 'cloudflare';
import { DNSProvider, DNSRecord, DNSProviderCredentials } from '../types';

export class CloudflareProvider implements DNSProvider {
  name = 'cloudflare';
  private client: Cloudflare;
  private zoneCache: Map<string, string> = new Map();

  constructor(credentials: DNSProviderCredentials) {
    console.log('CloudflareProvider constructor called with credentials:', {
      hasApiToken: !!credentials.apiToken,
      hasApiKey: !!credentials.apiKey,
      hasEmail: !!credentials.email,
      useGlobalKey: credentials.useGlobalKey,
      credentialKeys: Object.keys(credentials)
    });

    // 支持两种认证方式：
    // 1. API Token (推荐)
    // 2. Global API Key + Email
    if (credentials.apiToken) {
      // 使用API Token
      console.log('Using Cloudflare API Token authentication');
      this.client = new Cloudflare({
        apiToken: credentials.apiToken,
      });
    } else if (credentials.apiKey && credentials.email) {
      // 使用Global API Key
      console.log('Using Cloudflare Global API Key authentication');
      
      // 根据 Cloudflare SDK 文档，Global API Key 需要使用 apiKey 和 apiEmail 参数
      this.client = new Cloudflare({
        apiKey: credentials.apiKey,
        apiEmail: credentials.email,
      });
    } else {
      console.error('Invalid Cloudflare credentials provided:', credentials);
      throw new Error('Cloudflare credentials must include either apiToken or (apiKey + email)');
    }
  }

  private async getZoneId(domain: string): Promise<string> {
    if (this.zoneCache.has(domain)) {
      return this.zoneCache.get(domain)!;
    }

    const zones = await this.client.zones.list({
      name: domain,
    });

    if (!zones.result || zones.result.length === 0) {
      throw new Error(`Zone not found for domain: ${domain}`);
    }

    const zoneId = zones.result[0].id;
    this.zoneCache.set(domain, zoneId);
    return zoneId;
  }

  async createRecord(domain: string, record: DNSRecord): Promise<DNSRecord> {
    const zoneId = await this.getZoneId(domain);
    
    const createParams: any = {
      zone_id: zoneId,
      name: record.name,
      type: record.type,
      content: record.value,
      ttl: record.ttl || 300,
    };

    // 对于支持代理的记录类型，添加 proxied 参数
    if (['A', 'AAAA', 'CNAME'].includes(record.type) && record.proxied !== undefined) {
      createParams.proxied = record.proxied;
    }
    
    const result = await this.client.dns.records.create(createParams);

    return {
      id: result.id,
      name: result.name || record.name,
      type: result.type as any,
      value: String(result.content),
      ttl: result.ttl,
      proxied: (result as any).proxied || false,
    };
  }

  async updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<DNSRecord> {
    const zoneId = await this.getZoneId(domain);
    
    const updateParams: any = {
      zone_id: zoneId,
    };

    if (record.name) updateParams.name = record.name;
    if (record.type) updateParams.type = record.type;
    if (record.value) updateParams.content = record.value;
    if (record.ttl) updateParams.ttl = record.ttl;
    
    // 对于支持代理的记录类型，添加 proxied 参数
    if (record.type && ['A', 'AAAA', 'CNAME'].includes(record.type) && record.proxied !== undefined) {
      updateParams.proxied = record.proxied;
    }
    
    const result = await this.client.dns.records.update(recordId, updateParams);

    return {
      id: result.id,
      name: result.name || record.name || '',
      type: result.type as any,
      value: String(result.content),
      ttl: result.ttl,
      proxied: (result as any).proxied || false,
    };
  }

  async deleteRecord(domain: string, recordId: string): Promise<void> {
    const zoneId = await this.getZoneId(domain);
    await this.client.dns.records.delete(recordId, { zone_id: zoneId });
  }

  async getRecord(domain: string, recordId: string): Promise<DNSRecord> {
    const zoneId = await this.getZoneId(domain);
    const result = await this.client.dns.records.get(recordId, { zone_id: zoneId });

    return {
      id: result.id,
      name: result.name || '',
      type: result.type as any,
      value: String(result.content),
      ttl: result.ttl,
      proxied: (result as any).proxied || false,
    };
  }

  async listRecords(domain: string, type?: string): Promise<DNSRecord[]> {
    const zoneId = await this.getZoneId(domain);
    
    const result = await this.client.dns.records.list({
      zone_id: zoneId,
      type: type as any,
    });

    return result.result?.map(r => ({
      id: r.id,
      name: r.name || '',
      type: r.type as any,
      value: String(r.content),
      ttl: r.ttl,
      proxied: (r as any).proxied || false,
    })) || [];
  }

  async listDomains(): Promise<string[]> {
    try {
      console.log('Cloudflare: Calling zones.list()...');
      const zones = await this.client.zones.list();
      console.log('Cloudflare: zones.list() response:', {
        resultCount: zones.result?.length || 0,
      });
      
      const domains = zones.result?.map(zone => zone.name || '').filter(name => name) || [];
      console.log('Cloudflare: Extracted domains:', domains);
      return domains;
    } catch (error) {
      console.error('Cloudflare: Failed to list domains:', error);
      // 返回空数组而不是抛出错误，这样用户界面可以显示"没有域名"
      return [];
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.client.user.get();
      return true;
    } catch {
      return false;
    }
  }
}
