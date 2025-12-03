// ═══════════════════════════════════════════════════════════════════
// 🎯 CORE COMPONENTS (Phase 1 - Unified & Optimized)
// ═══════════════════════════════════════════════════════════════════

/**
 * Button - UNIFIED MASTER COMPONENT ⭐
 * Consolidates 5 button components with micro-animations
 * USE THIS for all new development
 */
export { Button } from './core/Button';
export type { ButtonProps, IconAnimationType } from './core/Button';

// Core Input Components
export { Input } from './core/Input';
export type { InputProps } from './core/Input';

// Core Table Components
export { Table } from './core/Table';
export type { TableColumn, TableProps } from './core/Table';

// Core Form Components
export { Select } from './core/Select';
export type { SelectProps, SelectOption } from './core/Select';

export { Card } from './core/Card';
export type { CardProps } from './core/Card';

export { Badge } from './core/Badge';
export type { BadgeProps } from './core/Badge';

export { FAB } from './core/FAB';
export type { FABProps } from './core/FAB';

export { DatePicker } from './core/DatePicker';
export type { DatePickerProps } from './core/DatePicker';

export { Calendar } from './core/Calendar';
export type { CalendarProps } from './core/Calendar';

export { KPICard } from './core/KPICard';
export type { KPICardProps } from './core/KPICard';

export { EmptyState } from './core/EmptyState';
export type { EmptyStateProps } from './core/EmptyState';

export { LoadingState } from './core/LoadingState';
export type { LoadingStateProps } from './core/LoadingState';

export { ActionSheet } from './core/ActionSheet';
export type { ActionSheetProps, ActionSheetAction } from './core/ActionSheet';

export { NotificationBell } from './notifications/NotificationBell';

// Network Status Components
export { NetworkStatusBanner, NetworkStatusIndicator, SyncStatusCard } from './layout/NetworkStatusBanner';

// Real-time Collaboration Components
export { PresenceIndicator, OnlineUsersList } from './ui/PresenceIndicator';
export { TypingIndicator, MiniTypingIndicator } from './ui/TypingIndicator';
export { 
  ActiveUsersIndicator, 
  LiveEditingIndicator, 
  ViewingIndicator, 
  RealtimeUpdateBadge 
} from './ui/CollaborationIndicators';

export { FilterBar } from './core/FilterBar';
export type { FilterBarProps, FilterConfig, FilterOption, ActiveFilters } from './core/FilterBar';

// ═══════════════════════════════════════════════════════════════════
// 🌟 GLASS MORPHISM COMPONENTS (New - iPhone/Uber Style)
// ═══════════════════════════════════════════════════════════════════

export { GlassCard, GlassKPICard } from './ui/GlassCard';
export { QuickActionButton } from './ui/QuickActionButton';
export { MiniChart } from './ui/MiniChart';
export { PerformanceChart } from './ui/PerformanceChart';
export { ActivityTimeline } from './ui/ActivityTimeline';
export { GoalCard } from './ui/GoalCard';

// ═══════════════════════════════════════════════════════════════════
// 📐 LAYOUT COMPONENTS
// ═══════════════════════════════════════════════════════════════════

export { default as ModuleHeader } from './layout/ModuleHeader';
export { default as TabBar } from './layout/TabBar';
export type { Tab } from './layout/TabBar';
export { default as Header } from './layout/Header';
export { default as OnboardingTour } from './layout/OnboardingTour';
export type { OnboardingStep } from './layout/OnboardingTour';

// ═══════════════════════════════════════════════════════════════════
// 🎨 UI COMPONENTS (Active)
// ═══════════════════════════════════════════════════════════════════

export { default as AppTable } from './ui/AppTable';
export { default as SearchBar } from './ui/SearchBar';
export { default as FloatingActionButton } from './ui/FloatingActionButton';
export { default as StatusBadge } from './ui/StatusBadge';
export type { StatusType } from './ui/StatusBadge';
// KPICard is already exported from './core/KPICard' at line 40
export { default as ThemedDatePicker } from './ui/ThemedDatePicker';
export { default as DropdownField } from './ui/DropdownField';
export { default as CelebrationAnimation } from './ui/CelebrationAnimation';

// Standardized UI Components (Professional Design System)
export { FormField } from './ui/FormField';
// EmptyState is already exported from './core/EmptyState' at line 41
export { Skeleton, SkeletonText, SkeletonCircle } from './ui/Skeleton';
export { Avatar } from './ui/Avatar';
export { ListItem } from './ui/ListItem';
export { Chip } from './ui/Chip';
export { BottomSheet } from './ui/BottomSheet';
export { Toast, useToast } from './ui/Toast';
export type { ToastType } from './ui/Toast';

// Profile & Professional Development Components
export { ProfileStats } from './ui/ProfileStats';
export type { ProfileStatsProps } from './ui/ProfileStats';
export { SkillsDisplay } from './ui/SkillsDisplay';
export type { SkillsDisplayProps } from './ui/SkillsDisplay';
export { CertificationCard } from './ui/CertificationCard';
export type { CertificationCardProps } from './ui/CertificationCard';
export { CollaborationTree } from './ui/CollaborationTree';
export type { CollaborationTreeProps } from './ui/CollaborationTree';

// Events & Module Components
export { InfoRow } from './ui/InfoRow';
export { FormSection } from './ui/FormSection';
export { EventCard } from './ui/EventCard';
export { LeadCard } from './ui/LeadCard';
export { VenueCard } from './ui/VenueCard';
export { ClientCard } from './ui/ClientCard';

// Enhanced Loading & Error States
// LoadingState is already exported from './core/LoadingState' at line 44
export { ErrorBoundary, ErrorFallback, InlineError } from './ui/ErrorBoundary';
export type { ErrorFallbackProps } from './ui/ErrorBoundary';

// Primitives (for advanced usage)
export { default as AnimatedPressable } from './ui/AnimatedPressable';
export type { AnimatedPressableProps } from './ui/AnimatedPressable';
export { default as RippleEffect } from './ui/RippleEffect';
export type { RippleEffectProps } from './ui/RippleEffect';

// ═══════════════════════════════════════════════════════════════════
// ⚠️ DEPRECATED COMPONENTS (Phase 1 - Will be removed)
// ═══════════════════════════════════════════════════════════════════

/**
 * @deprecated Use unified Button component from '@/components/core/Button'
 * This component will be removed in Phase 1 cleanup
 * 
 * Migration:
 * ```tsx
 * // Old
 * import { AnimatedButton } from '@/components';
 * <AnimatedButton title="Submit" variant="primary" onPress={...} />
 * 
 * // New
 * import { Button } from '@/components';
 * <Button title="Submit" variant="primary" onPress={...} />
 * ```
 */
export { AnimatedButton } from './ui/AnimatedButton';
export type { AnimatedButtonProps } from './ui/AnimatedButton';

/**
 * @deprecated Use unified Button component from '@/components/core/Button'
 * This component will be removed in Phase 1 cleanup
 */
export { default as PrimaryButton } from './ui/PrimaryButton';

/**
 * @deprecated Use unified Button component from '@/components/core/Button'
 * This component will be removed in Phase 1 cleanup
 */
export { default as AppButton } from './ui/AppButton';

/**
 * @deprecated Use unified Button component from '@/components/core/Button'
 * This component will be removed in Phase 1 cleanup
 */
export { default as ActionButton } from './ui/ActionButton';

/**
 * @deprecated Use unified FormField component instead
 * This component will be removed in Phase 1 cleanup
 */
export { default as AppInput } from './ui/AppInput';

/**
 * @deprecated Use unified Button component from '@/components/core/Button'
 * Legacy Button.tsx from ui/ folder - replaced by core/Button.tsx
 */
export { Button as LegacyButton } from './ui/Button';
