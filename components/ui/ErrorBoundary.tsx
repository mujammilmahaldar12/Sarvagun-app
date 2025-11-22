import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { AnimatedButton } from './AnimatedButton';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableConsoleLog?: boolean;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  resetError?: () => void;
  isFullScreen?: boolean;
}

// Default error fallback component  
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  isFullScreen = false,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[
      isFullScreen ? styles.fullScreenContainer : styles.container,
      { backgroundColor: theme.background }
    ]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${theme.error || '#EF4444'}15` }]}>
          <Ionicons 
            name="warning" 
            size={iconSizes.xl} 
            color={theme.error || '#EF4444'} 
          />
        </View>

        {/* Error Message */}
        <Text style={[styles.title, { color: theme.text }]}>
          Something went wrong
        </Text>
        
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
        </Text>

        {/* Error Details (Development only) */}
        {__DEV__ && error && (
          <View style={[styles.errorDetails, getCardStyle(theme.surface, 'sm', 'md')]}>
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              Error Details (Development)
            </Text>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              {error.name}: {error.message}
            </Text>
            {error.stack && (
              <Text style={[styles.stackTrace, { color: theme.textTertiary }]}>
                {error.stack}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {resetError && (
            <AnimatedButton
              title="Try Again"
              onPress={resetError}
              variant="primary"
              fullWidth={isFullScreen}
              leftIcon="refresh"
              accessibilityLabel="Try to recover from error"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export { ErrorFallback };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.enableConsoleLog !== false) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          isFullScreen={true}
        />
      );
    }

    return this.props.children;
  }
}

// Inline error component for non-critical errors
interface InlineErrorProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message = "Something went wrong",
  onRetry,
  compact = false,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[
      compact ? styles.compactError : styles.inlineError,
      getCardStyle(theme.surface, 'sm', 'md'),
      { borderColor: theme.error || '#EF4444', borderWidth: 1 }
    ]}>
      <View style={styles.inlineContent}>
        <Ionicons 
          name="warning" 
          size={iconSizes.sm} 
          color={theme.error || '#EF4444'}
        />
        <Text style={[
          compact ? styles.compactErrorText : styles.inlineErrorText,
          { color: theme.textSecondary }
        ]}>
          {message}
        </Text>
      </View>
      
      {onRetry && (
        <AnimatedButton
          title={compact ? "Retry" : "Try Again"}
          onPress={onRetry}
          variant="ghost"
          size={compact ? "sm" : "md"}
          leftIcon="refresh"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    padding: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...getTypographyStyle('2xl', 'bold'),
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...getTypographyStyle('base', 'medium'),
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  errorDetails: {
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  errorTitle: {
    ...getTypographyStyle('lg', 'semibold'),
    marginBottom: spacing.sm,
  },
  errorText: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: spacing.md,
  },
  stackTrace: {
    ...getTypographyStyle('xs', 'regular'),
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actions: {
    width: '100%',
    maxWidth: 250,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  compactError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  inlineErrorText: {
    ...getTypographyStyle('sm', 'medium'),
    flex: 1,
  },
  compactErrorText: {
    ...getTypographyStyle('xs', 'medium'),
    flex: 1,
  },
});