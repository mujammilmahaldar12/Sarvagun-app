import "./disable-logs";
import "./global.css";
import { Slot } from "expo-router";
import { View, Text } from "react-native";
import React from "react";

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6D376D', marginBottom: 10 }}>Sarvagun</Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 10 }}>
            Something went wrong. Please restart the app.
          </Text>
          {__DEV__ && (
            <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              Error: {String((this.state as any).error)}
            </Text>
          )}
        </View>
      );
    }

    return (this.props as any).children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Slot />
      </View>
    </ErrorBoundary>
  );
}
