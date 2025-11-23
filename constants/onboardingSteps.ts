/**
 * Onboarding Tour Steps Configuration
 * Centralized configuration for first-time user tutorial
 */
import type { OnboardingStep } from '@/components/layout/OnboardingTour';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Sarvagun! 👋',
    description: 'Your all-in-one platform for HR, Finance, Events, Projects, and Leave Management. Let\'s take a quick tour!',
    icon: 'home',
    position: 'center',
  },
  {
    id: 'hr-module',
    title: 'HR Management 👥',
    description: 'Manage your team, track attendance, view employee profiles, and handle payroll efficiently all in one place.',
    icon: 'people',
    position: 'center',
  },
  {
    id: 'finance-module',
    title: 'Finance & Accounting 💰',
    description: 'Track expenses, manage budgets, generate financial reports, and keep your finances organized.',
    icon: 'cash',
    position: 'center',
  },
  {
    id: 'events-module',
    title: 'Event Management 📅',
    description: 'Plan and organize company events, meetings, and celebrations. Send invitations and track RSVPs with ease.',
    icon: 'calendar',
    position: 'center',
  },
  {
    id: 'projects-module',
    title: 'Project Tracking 📊',
    description: 'Monitor project progress, assign tasks to team members, and collaborate efficiently to meet deadlines.',
    icon: 'briefcase',
    position: 'center',
  },
  {
    id: 'leave-module',
    title: 'Leave Management ⏰',
    description: 'Apply for leave, check your leave balance, and manage team leave requests with automated approval workflows.',
    icon: 'time',
    position: 'center',
  },
  {
    id: 'quick-actions',
    title: 'Quick Add Button ⚡',
    description: 'Tap the center button in the navigation bar anytime to quickly create events, tasks, or submit requests.',
    icon: 'add-circle',
    position: 'bottom',
  },
  {
    id: 'notifications',
    title: 'Stay Updated 🔔',
    description: 'Get real-time notifications for important updates, approvals, and reminders. Never miss a thing!',
    icon: 'notifications',
    position: 'top',
  },
  {
    id: 'get-started',
    title: 'You\'re All Set! 🎉',
    description: 'That\'s it! You\'re ready to explore. Tap anywhere to start using Sarvagun and boost your productivity.',
    icon: 'rocket',
    position: 'center',
  },
];
