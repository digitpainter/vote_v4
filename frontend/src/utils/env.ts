/**
 * 环境配置工具
 * 提供获取环境变量的函数
 */

// 当前环境
export const getEnv = (): string => {
  return import.meta.env.VITE_APP_ENV || 'development';
};

// 是否为开发环境
export const isDev = (): boolean => {
  return getEnv() === 'development';
};

// 是否为生产环境
export const isProd = (): boolean => {
  return getEnv() === 'production';
};

// 是否为测试环境
export const isTest = (): boolean => {
  return getEnv() === 'test';
};

// API基础URL
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

// CAS基础URL
export const getCasBaseUrl = (): string => {
  return import.meta.env.VITE_CAS_BASE_URL || 'http://localhost:8001';
};

// CAS回调URL
export const getCasCallbackUrl = (): string => {
  return import.meta.env.VITE_CAS_CALLBACK_URL || 'http://localhost:5173/cas-callback';
};

// 日志级别
export const getLogLevel = (): string => {
  if (isProd()) return 'error';
  if (isTest()) return 'warn';
  return 'debug'; // 开发环境
}; 