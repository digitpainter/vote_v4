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
  name: string;
  role: UserRole;
  token: string;
}