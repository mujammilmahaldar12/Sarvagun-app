import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe token storage utilities
export const storeToken = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    // Silent error - don't crash the app
  }
};

export const getToken = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

export const removeToken = async (key: string): Promise<void> => {
  try {
    console.log(`🗑️ Storage: Removing token '${key}'...`);
    await AsyncStorage.removeItem(key);
    console.log(`✅ Storage: Token '${key}' removed successfully`);
  } catch (error) {
    console.log(`❌ Storage: Error removing token '${key}':`, error);
    // Silent error
  }
};

export const clearAllTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['access', 'refresh', 'user']);
  } catch (error) {
    // Silent error
  }
};

// Safe data storage
export const storeData = async (key: string, data: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    // Silent error
  }
};

export const getData = async (key: string): Promise<any> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    return null;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // Silent error
  }
};