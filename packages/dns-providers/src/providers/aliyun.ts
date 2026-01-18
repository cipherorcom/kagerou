import Alidns20150109, * as $Alidns20150109 from '@alicloud/alidns20150109';
import * as $OpenApi from '@alicloud/openapi-client';
import { DNSProvider, DNSRecord, DNSProviderCredentials } from '../types';

export class AliyunProvider implements DNSProvider {
  name = 'aliyun';
  private client: Alidns20150109;

  constructor(credentials: DNSProviderCredentials) {
    const config = new $OpenApi.Config({
      accessKeyId: credentials.accessKeyId,
      accessKeySecret: credentials.accessKeySecret,
      endpoint: 'alidns.cn-hangzhou.aliyuncs.com',
    });
    this.client = new Alidns20150109(config);
  }

  private extractDomainParts(fullDomain: string): { domain: string; rr: string } {
    const parts = fullDomain.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid domain format');
    }
    
    // 假设主域名是最后两部分，如 example.com
    const domain = parts.slice(-2).join('.');
    const rr = parts.slice(0, -2).join('.') || '@';
    
    return { domain, rr };
  }

  async createRecord(domain: string, record: DNSRecord): Promise<DNSRecord> {
    const { domain: domainName, rr } = this.extractDomainParts(record.name);
    
    const request = new $Alidns20150109.AddDomainRecordRequest({
      domainName,
      RR: rr,
      type: record.type,
      value: record.value,
      TTL: record.ttl || 600,
    });

    const result = await this.client.addDomainRecord(request);
    
    return {
      id: result.body?.recordId || '',
      name: record.name,
      type: record.type,
      value: record.value,
      ttl: record.ttl,
      proxied: false, // Aliyun 不支持代理功能
    };
  }

  async updateRecord(domain: string, recordId: string, record: Partial<DNSRecord>): Promise<DNSRecord> {
    const { rr } = this.extractDomainParts(record.name || domain);
    
    const request = new $Alidns20150109.UpdateDomainRecordRequest({
      recordId,
      RR: rr,
      type: record.type,
      value: record.value,
      TTL: record.ttl,
    });

    await this.client.updateDomainRecord(request);
    
    return {
      id: recordId,
      name: record.name || domain,
      type: record.type!,
      value: record.value!,
      ttl: record.ttl,
      proxied: false, // Aliyun 不支持代理功能
    };
  }

  async deleteRecord(domain: string, recordId: string): Promise<void> {
    const request = new $Alidns20150109.DeleteDomainRecordRequest({
      recordId,
    });
    await this.client.deleteDomainRecord(request);
  }

  async getRecord(domain: string, recordId: string): Promise<DNSRecord> {
    const request = new $Alidns20150109.DescribeDomainRecordInfoRequest({
      recordId,
    });
    
    const result = await this.client.describeDomainRecordInfo(request);
    const r = result.body;
    
    if (!r) {
      throw new Error('Record not found');
    }
    
    return {
      id: r.recordId || '',
      name: `${r.RR || ''}.${r.domainName || ''}`,
      type: (r.type as any) || 'A',
      value: r.value || '',
      ttl: r.TTL,
      proxied: false, // Aliyun 不支持代理功能
    };
  }

  async listRecords(domain: string, type?: string): Promise<DNSRecord[]> {
    const request = new $Alidns20150109.DescribeDomainRecordsRequest({
      domainName: domain,
      typeKeyWord: type,
    });
    
    const result = await this.client.describeDomainRecords(request);
    
    if (!result.body?.domainRecords?.record) {
      return [];
    }
    
    return result.body.domainRecords.record.map(r => ({
      id: r?.recordId || '',
      name: `${r?.RR || ''}.${r?.domainName || ''}`,
      type: (r?.type as any) || 'A',
      value: r?.value || '',
      ttl: r?.TTL,
      proxied: false, // Aliyun 不支持代理功能
    }));
  }

  async listDomains(): Promise<string[]> {
    try {
      const request = new $Alidns20150109.DescribeDomainsRequest({
        pageNumber: 1,
        pageSize: 100, // 获取前100个域名
      });
      
      const result = await this.client.describeDomains(request);
      
      if (!result.body?.domains?.domain) {
        return [];
      }
      
      return result.body.domains.domain.map(d => d?.domainName || '').filter(name => name);
    } catch (error) {
      console.error('Failed to list domains from Aliyun:', error);
      return [];
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const request = new $Alidns20150109.DescribeDomainsRequest({
        pageNumber: 1,
        pageSize: 1,
      });
      await this.client.describeDomains(request);
      return true;
    } catch {
      return false;
    }
  }
}
