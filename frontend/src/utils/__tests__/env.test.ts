import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getEnv, 
  isDev, 
  isProd, 
  isTest, 
  getApiBaseUrl, 
  getCasBaseUrl, 
  getCasCallbackUrl, 
  getLogLevel 
} from '../env';

describe('env utils', () => {
  // 保存原始的 import.meta.env
  const originalImportMeta = { ...import.meta };
  
  beforeEach(() => {
    // 重置模拟
    vi.resetModules();
    
    // 模拟 import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {}
      }
    });
  });
  
  afterEach(() => {
    // 恢复原始的 import.meta
    vi.stubGlobal('import', originalImportMeta);
  });
  
  describe('getEnv', () => {
    it('returns the current environment from env variable', () => {
      import.meta.env.VITE_APP_ENV = 'production';
      expect(getEnv()).toBe('production');
      
      import.meta.env.VITE_APP_ENV = 'test';
      expect(getEnv()).toBe('test');
    });
    
    it('returns development as default if env variable is not set', () => {
      import.meta.env.VITE_APP_ENV = undefined;
      expect(getEnv()).toBe('development');
    });
  });
  
  describe('environment checks', () => {
    it('isDev returns true when environment is development', () => {
      import.meta.env.VITE_APP_ENV = 'development';
      expect(isDev()).toBe(true);
      expect(isProd()).toBe(false);
      expect(isTest()).toBe(false);
    });
    
    it('isProd returns true when environment is production', () => {
      import.meta.env.VITE_APP_ENV = 'production';
      expect(isDev()).toBe(false);
      expect(isProd()).toBe(true);
      expect(isTest()).toBe(false);
    });
    
    it('isTest returns true when environment is test', () => {
      import.meta.env.VITE_APP_ENV = 'test';
      expect(isDev()).toBe(false);
      expect(isProd()).toBe(false);
      expect(isTest()).toBe(true);
    });
  });
  
  describe('URL getters', () => {
    it('getApiBaseUrl returns the API base URL from env variable', () => {
      import.meta.env.VITE_API_BASE_URL = 'https://api.example.com';
      expect(getApiBaseUrl()).toBe('https://api.example.com');
    });
    
    it('getApiBaseUrl returns default value if env variable is not set', () => {
      import.meta.env.VITE_API_BASE_URL = undefined;
      expect(getApiBaseUrl()).toBe('http://localhost:8000');
    });
    
    it('getCasBaseUrl returns the CAS base URL from env variable', () => {
      import.meta.env.VITE_CAS_BASE_URL = 'https://cas.example.com';
      expect(getCasBaseUrl()).toBe('https://cas.example.com');
    });
    
    it('getCasBaseUrl returns default value if env variable is not set', () => {
      import.meta.env.VITE_CAS_BASE_URL = undefined;
      expect(getCasBaseUrl()).toBe('http://localhost:8001');
    });
    
    it('getCasCallbackUrl returns the CAS callback URL from env variable', () => {
      import.meta.env.VITE_CAS_CALLBACK_URL = 'https://app.example.com/callback';
      expect(getCasCallbackUrl()).toBe('https://app.example.com/callback');
    });
    
    it('getCasCallbackUrl returns default value if env variable is not set', () => {
      import.meta.env.VITE_CAS_CALLBACK_URL = undefined;
      expect(getCasCallbackUrl()).toBe('http://localhost:5173/cas-callback');
    });
  });
  
  describe('getLogLevel', () => {
    it('returns error level in production environment', () => {
      import.meta.env.VITE_APP_ENV = 'production';
      expect(getLogLevel()).toBe('error');
    });
    
    it('returns warn level in test environment', () => {
      import.meta.env.VITE_APP_ENV = 'test';
      expect(getLogLevel()).toBe('warn');
    });
    
    it('returns debug level in development environment', () => {
      import.meta.env.VITE_APP_ENV = 'development';
      expect(getLogLevel()).toBe('debug');
    });
    
    it('returns debug level as default if environment is unknown', () => {
      import.meta.env.VITE_APP_ENV = 'staging';
      expect(getLogLevel()).toBe('debug');
    });
  });
}); 