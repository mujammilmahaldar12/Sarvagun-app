import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalActivity {
  id: string;
  type: 'leave' | 'project' | 'event' | 'finance' | 'hr' | 'other';
  title: string;
  description: string;
  timestamp: string; // ISO format
  related_id?: string | number;
  metadata?: any; // Additional data if needed
}

const ACTIVITIES_STORAGE_KEY = '@recent_activities';
const MAX_ACTIVITIES = 50; // Keep last 50 activities

class ActivityStorageService {
  /**
   * Add a new activity to local storage
   */
  async addActivity(activity: Omit<LocalActivity, 'id' | 'timestamp'>): Promise<void> {
    try {
      const activities = await this.getAllActivities();
      
      const newActivity: LocalActivity = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      
      // Add to beginning of array (most recent first)
      const updatedActivities = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);
      
      await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updatedActivities));
      console.log('✅ Activity added to local storage:', newActivity.title);
    } catch (error) {
      console.error('❌ Error adding activity to storage:', error);
    }
  }

  /**
   * Get all stored activities
   */
  async getAllActivities(): Promise<LocalActivity[]> {
    try {
      const data = await AsyncStorage.getItem(ACTIVITIES_STORAGE_KEY);
      if (!data) return [];
      
      const activities = JSON.parse(data) as LocalActivity[];
      return activities;
    } catch (error) {
      console.error('❌ Error retrieving activities from storage:', error);
      return [];
    }
  }

  /**
   * Get recent activities (limited)
   */
  async getRecentActivities(limit: number = 10): Promise<LocalActivity[]> {
    try {
      const activities = await this.getAllActivities();
      return activities.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting recent activities:', error);
      return [];
    }
  }

  /**
   * Clear all activities
   */
  async clearActivities(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVITIES_STORAGE_KEY);
      console.log('✅ All activities cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing activities:', error);
    }
  }

  /**
   * Remove old activities (older than specified days)
   */
  async removeOldActivities(daysOld: number = 30): Promise<void> {
    try {
      const activities = await this.getAllActivities();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const filteredActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate > cutoffDate;
      });
      
      await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(filteredActivities));
      console.log(`✅ Removed activities older than ${daysOld} days`);
    } catch (error) {
      console.error('❌ Error removing old activities:', error);
    }
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(type: LocalActivity['type']): Promise<LocalActivity[]> {
    try {
      const activities = await this.getAllActivities();
      return activities.filter(activity => activity.type === type);
    } catch (error) {
      console.error('❌ Error getting activities by type:', error);
      return [];
    }
  }
}

export const activityStorage = new ActivityStorageService();
