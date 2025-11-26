// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? "http://192.168.1.132:8000/api" : "https://api.manager.blingsquare.in/api",
  TIMEOUT: 30000,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: "Sarvagun",
  VERSION: "1.0.0",
  THEME_STORAGE_KEY: "@sarvagun_theme",
};

// Pagination
export const PAGINATION = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
