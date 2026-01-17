import Cloudflare from 'cloudflare';
import { DNSProvider, DNSRecord, DNSProviderCredentials } from '../types';

export class CloudflareProvider implements DNSProvider {
  name = 'cloudflare';
  private client: Cloudflare;
  private zoneCache: Map<string, string> = new Map();

  constructor(credentials: DNSProviderCredentials) {
    this.client = new Cloudflare({
      apiToken: credentials.apiToken,
    });
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
    
    const result = await this.client.dns.records.create({
      zone_id: zoneId,
      name: record.name,
      type: record.type,
      content: record.value,
      ttl: record.ttl || 300,
      priority: record.priority,
    });

    return {
      id: result.id,
      name: result.name,
      type: result.type as any,
      value: result.content,
      ttl: result.ttl,
    };
  }

  async updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<DNSRecord> {
    const zoneId = await this.getZoneId(domain);
    
    const result = await this.client.dns.records.update(recordId, {
      zone_id: zoneId,
      name: record.name,
      type: record.type,
      content: record.value,
      ttl: record.ttl,
      priority: record.priority,
    });

    return {
      id: result.id,
      name: result.name,
      type: result.type as any,
      value: result.content,
      ttl: result.ttl,
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
      name: result.name,
      type: result.type as any,
      value: result.content,
      ttl: result.ttl,
    };
  }

  async listRecords(domain: string, type?: string): Promise<DNSRecord[]> {
    const zoneId = await this.getZoneId(domain);
    
    const result = await this.client.dns.records.list({
      zone_id: zoneId,
      type: type as any,
    });

    return result.result.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type as any,
      value: r.content,
      ttl: r.ttl,
    }));
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
