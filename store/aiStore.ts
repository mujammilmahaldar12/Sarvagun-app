import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIStore {
  // AI Mode
  isAIModeEnabled: boolean;
  toggleAIMode: () => void;
  setAIMode: (enabled: boolean) => void;
  
  // Chat State
  messages: ChatMessage[];
  isLoading: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // AI Mode State
      isAIModeEnabled: false,
      
      toggleAIMode: () => {
        set((state) => ({ isAIModeEnabled: !state.isAIModeEnabled }));
      },
      
      setAIMode: (enabled: boolean) => {
        set({ isAIModeEnabled: enabled });
      },
      
      // Chat State
      messages: [],
      isLoading: false,
      
      // Actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },
      
      clearMessages: () => {
        set({ messages: [] });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'ai-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAIModeEnabled: state.isAIModeEnabled,
        messages: state.messages,
      }),
    }
  )
);
