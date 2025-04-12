import { AdminType } from './auth';

export enum AdminActionType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  VIEW = "view",
  EXPORT = "export",
  OTHER = "other"
}

export interface AdminLog {
  id: number;
  admin_id: string;
  admin_name: string;
  admin_type: string;
  action_type: AdminActionType;
  resource_type: string;
  resource_id?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminLogQuery {
  skip?: number;
  limit?: number;
  admin_id?: string;
  action_type?: AdminActionType;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
} 