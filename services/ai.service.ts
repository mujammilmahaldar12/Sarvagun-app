/**
 * AI Service
 * Handles AI chat functionality using OpenAI-compatible API
 */

import api from './api';

// AI Response interface
export interface AIResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Chat context for better responses
export interface ChatContext {
  userRole?: string;
  userName?: string;
  department?: string;
  companyContext?: string;
}

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  default: `You are Sarvagun AI, a helpful workplace assistant for the Sarvagun enterprise app. 
You help employees with:
- HR queries (leave policies, attendance, team info)
- Project management (task tracking, deadlines, updates)
- Event information and scheduling
- Finance queries (expenses, reimbursements)
- General workplace guidance

Be concise, friendly, and professional. If you don't know something specific to the company, 
say so and suggest they contact HR or their manager.`,

  hr: `You are Sarvagun AI, specializing in HR assistance. Help with:
- Leave policies and applications
- Attendance tracking
- Employee onboarding
- Team management
- Performance reviews
Be empathetic and accurate with HR policies.`,

  projects: `You are Sarvagun AI, a project management assistant. Help with:
- Task prioritization
- Deadline management
- Status updates
- Team collaboration
- Sprint planning
Be action-oriented and help break down complex tasks.`,
};

class AIService {
  private apiEndpoint = '/ai/chat/';
  
  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(
    message: string,
    conversationHistory: { role: string; content: string }[] = [],
    context?: ChatContext
  ): Promise<AIResponse> {
    try {
      // Build system prompt based on context
      let systemPrompt = SYSTEM_PROMPTS.default;
      
      if (context?.userRole) {
        systemPrompt += `\n\nUser Info: ${context.userName || 'Employee'}, Role: ${context.userRole}`;
        if (context.department) {
          systemPrompt += `, Department: ${context.department}`;
        }
      }

      // Prepare messages for API
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: message },
      ];

      const response = await api.post<any>(this.apiEndpoint, {
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const data = (response as any)?.data ?? response;
      
      return {
        id: data.id || `ai_${Date.now()}`,
        content: data.content || data.message || data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.',
        model: data.model || 'sarvagun-ai',
        usage: data.usage,
      };
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      // Return a fallback response
      return {
        id: `error_${Date.now()}`,
        content: this.getOfflineResponse(message),
        model: 'offline-fallback',
      };
    }
  }

  /**
   * Get a quick response for common queries (offline fallback)
   */
  private getOfflineResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Leave related
    if (lowerMessage.includes('leave') || lowerMessage.includes('vacation') || lowerMessage.includes('time off')) {
      return `For leave-related queries, please:
1. Go to the Leave module in the app
2. Check your leave balance
3. Apply for leave through the system
4. Your manager will be notified for approval

For urgent leaves, contact HR directly.`;
    }
    
    // Attendance related
    if (lowerMessage.includes('attendance') || lowerMessage.includes('check in') || lowerMessage.includes('check out')) {
      return `Your attendance can be managed in the HR module:
1. Go to HR → Attendance
2. Check in/out using the attendance feature
3. View your attendance history

Note: Make sure to check in when you arrive and check out when you leave.`;
    }
    
    // Task related
    if (lowerMessage.includes('task') || lowerMessage.includes('project') || lowerMessage.includes('deadline')) {
      return `For task management:
1. Go to Projects module
2. View your assigned tasks
3. Update task status as you progress
4. Check deadlines in the calendar view

Need to add a new task? Use the Quick Add button on the home screen.`;
    }
    
    // Events related
    if (lowerMessage.includes('event') || lowerMessage.includes('meeting') || lowerMessage.includes('calendar')) {
      return `For events and meetings:
1. Go to Events module
2. View upcoming events
3. RSVP to events you want to attend
4. Add events to your calendar

Team meetings are usually scheduled through the calendar.`;
    }
    
    // Greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello! 👋 I'm Sarvagun AI, your workplace assistant.

I can help you with:
• Leave & attendance queries
• Project & task management
• Event information
• Finance & expenses
• General workplace questions

How can I assist you today?`;
    }
    
    // Default response
    return `I'm currently in offline mode but I can still help with basic queries.

Try asking about:
• Leave policies
• Attendance
• Tasks & projects
• Events & meetings

For complex queries, please ensure you're connected to the internet or contact your manager/HR directly.`;
  }

  /**
   * Get suggested prompts based on context
   */
  getSuggestedPrompts(userRole?: string): string[] {
    const commonPrompts = [
      'How do I apply for leave?',
      'Show me my pending tasks',
      'What events are coming up?',
      'How can I check my attendance?',
    ];

    const roleSpecificPrompts: Record<string, string[]> = {
      intern: [
        'How does the internship evaluation work?',
        'Who should I report my daily updates to?',
        'What are my learning goals this week?',
      ],
      employee: [
        'How do I submit expenses?',
        'What\'s my leave balance?',
        'How to request a team meeting?',
      ],
      manager: [
        'Show team attendance summary',
        'Pending leave approvals',
        'Team performance overview',
      ],
      hr: [
        'Employee onboarding checklist',
        'Pending leave requests',
        'Attendance report generation',
      ],
    };

    const rolePrompts = roleSpecificPrompts[userRole?.toLowerCase() || 'employee'] || [];
    
    return [...rolePrompts.slice(0, 2), ...commonPrompts.slice(0, 2)];
  }
}

export const aiService = new AIService();
export default aiService;
