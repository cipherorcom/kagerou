import { DNSProvider, DNSProviderConfig } from './types';
import { CloudflareProvider } from './providers/cloudflare';
import { AliyunProvider } from './providers/aliyun';

export class DNSProviderFactory {
  static create(config: DNSProviderConfig): DNSProvider {
    switch (config.type.toLowerCase()) {
      case 'cloudflare':
        return new CloudflareProvider(config.credentials);
      
      case 'aliyun':
      case 'aliyundns':
        return new AliyunProvider(config.credentials);
      
      default:
        throw new Error(`Unsupported DNS provider: ${config.type}`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['cloudflare', 'aliyun'];
  }
}
