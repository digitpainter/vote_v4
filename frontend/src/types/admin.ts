export enum AdminType {
  SCHOOL = "school",
  COLLEGE = "college"
}

export interface Admin {
  id: number;
  stuff_id: string;
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
  created_at: string;
}

export interface AdminCreate {
  stuff_id: string;
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
}

export interface AdminUpdate {
  admin_type: AdminType;
  college_id?: string;
  college_name?: string;
} 