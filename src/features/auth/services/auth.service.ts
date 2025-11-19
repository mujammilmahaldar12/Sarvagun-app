import { apiClient } from "@lib/api";
import { LoginRequest, LoginResponse, User } from "../types/auth.types";
import { saveToken, saveUser, removeToken, getToken, getUser } from "@lib/storage";

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/hr/auth/login/",
      credentials
    );

    // Add full_name computed field
    if (response.user) {
      response.user.full_name = `${response.user.first_name} ${response.user.last_name}`.trim();
    }

    // Save tokens and user to secure storage
    await saveToken(response.access, response.refresh);
    await saveUser(response.user);

    return response;
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post("/hr/auth/logout/", { refresh: refreshToken });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear local storage, even if API call fails
      await removeToken();
    }
  }

  /**
   * Get current user details
   */
  async getCurrentUser(): Promise<User> {
    const user = await apiClient.get<User>("/hr/auth/me/");
    
    // Add full_name computed field
    if (user) {
      user.full_name = `${user.first_name} ${user.last_name}`.trim();
    }
    
    return user;
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await getToken("access");
    return !!token;
  }

  /**
   * Get stored user from local storage
   */
  async getStoredUser(): Promise<User | null> {
    return await getUser();
  }

  /**
   * Change password
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<void> {
    await apiClient.post("/hr/auth/change-password/", data);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await apiClient.post<{ access: string }>(
      "/hr/auth/refresh/",
      { refresh: refreshToken }
    );
    await saveToken(response.access);
    return response.access;
  }
}

export const authService = new AuthService();
