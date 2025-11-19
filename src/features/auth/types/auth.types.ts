// User types matching Django CustomUser model
export type UserRole = "employee" | "admin" | "hr" | "manager" | "intern" | "mukadam";

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string; // Combined first_name + last_name
  category: UserRole;
  designation: string;
  photo: string | null;
  mobileno: string;
  alpha_id: string;
  is_paid: boolean;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: User;
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
