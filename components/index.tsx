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
export type { TableColumn } from './ui/AppTable';
export { default as SearchBar } from './ui/SearchBar';
export { default as FloatingActionButton } from './ui/FloatingActionButton';
export { default as StatusBadge } from './ui/StatusBadge';
export type { StatusType } from './ui/StatusBadge';
export { default as KPICard } from './ui/KPICard';
export { default as DatePicker } from './ui/DatePicker';
export { default as ThemedDatePicker } from './ui/ThemedDatePicker';
export { default as DropdownField } from './ui/DropdownField';
export { default as CelebrationAnimation } from './ui/CelebrationAnimation';

// Standardized UI Components (Professional Design System)
export { FormField } from './ui/FormField';
export { EmptyState } from './ui/EmptyState';
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

// Enhanced Loading & Error States
export { default as LoadingState } from './ui/LoadingState';
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
