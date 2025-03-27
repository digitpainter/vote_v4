export enum UserRole {
  UNDERGRADUATE = "undergraduate",
  GRADUATE = "graduate",
  PHD = "phd",
  TEACHER = "teacher"
}

export enum AdminType {
    SCHOOL = "school",
    COLLEGE = "college"
}

export interface User {
  staff_id: string;
  username: string;
  role: UserRole;
  token: string;
  admin_type?: AdminType;
  admin_college_id?: string;
}