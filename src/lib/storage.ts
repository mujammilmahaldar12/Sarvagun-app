import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@sarvagun_access_token";
const REFRESH_TOKEN_KEY = "@sarvagun_refresh_token";
const USER_KEY = "@sarvagun_user";

// Token management
export const saveToken = async (
  accessToken: string,
  refreshToken?: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    // Silent error
  }
};

export const getToken = async (type: "access" | "refresh" = "access"): Promise<string | null> => {
  try {
    const key = type === "access" ? TOKEN_KEY : REFRESH_TOKEN_KEY;
    return await AsyncStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  } catch (error) {
    // Silent error
  }
};

// User data management
export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    // Silent error
  }
};

export const getUser = async (): Promise<any | null> => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

// Generic storage functions
export const storage = {
  set: async (key: string, value: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      // Silent error
    }
  },

  get: async <T>(key: string): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      return null;
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Silent error
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      // Silent error
    }
  },
};
