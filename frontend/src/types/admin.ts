export enum AdminType {
  SCHOOL = "school",
  COLLEGE = "college"
}

export enum ApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface Admin {
  id: number;
  stuff_id: string;
  name: string;
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
  created_at: string;
}

export interface AdminCreate {
  stuff_id: string;
  name: string;
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
}

export interface AdminUpdate {
  name?: string;
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
}

// 管理员申请相关类型
export interface AdminApplication {
  id: number;
  staff_id: string;
  username: string;
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
  reason: string;
  status: ApplicationStatus;
  reviewer_id?: string;
  review_comment?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminApplicationCreate {
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
  reason: string;
}

export interface AdminApplicationUpdate {
  status: ApplicationStatus;
  review_comment?: string;
} 