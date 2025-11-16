import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  SafeAreaView,
  StatusBar,
} from 'react-native';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeArea?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  safeArea = true,
  backgroundColor = '#fff',
  style,
  contentContainerStyle,
}) => {
  const Container = safeArea ? SafeAreaView : View;
  const Content = scrollable ? ScrollView : View;

  return (
    <Container style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <Content
        style={scrollable ? undefined : styles.content}
        contentContainerStyle={
          scrollable
            ? [styles.scrollContent, contentContainerStyle]
            : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Content>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
