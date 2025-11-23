/**
 * Debug Events Data - Temporary file to inspect API response
 * Delete this file after debugging
 */
import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useEvents } from '@/store/eventsStore';
import { useTheme } from '@/hooks/useTheme';

export default function DebugEventsScreen() {
  const { theme } = useTheme();
  const { events, loading, error, fetch } = useEvents();

  useEffect(() => {
    fetch(true); // Force fresh fetch
  }, []);

  useEffect(() => {
    if (events && events.length > 0) {
      console.log('='.repeat(80));
      console.log('🔍 DEBUG EVENTS DATA');
      console.log('='.repeat(80));
      console.log('\nTotal events:', events.length);
      console.log('\nFirst event full structure:');
      console.log(JSON.stringify(events[0], null, 2));
      console.log('\nAll event keys:');
      console.log(Object.keys(events[0]));
      console.log('\nField analysis:');
      console.log('- event.name:', events[0].name);
      console.log('- event.event_name:', (events[0] as any).event_name);
      console.log('- event.title:', (events[0] as any).title);
      console.log('- event.client:', events[0].client);
      console.log('- event.client?.name:', events[0].client?.name);
      console.log('- event.client_name:', (events[0] as any).client_name);
      console.log('- event.venue:', events[0].venue);
      console.log('- event.venue?.name:', events[0].venue?.name);
      console.log('- event.venue_name:', (events[0] as any).venue_name);
      console.log('- event.status:', events[0].status);
      console.log('- event.start_date:', events[0].start_date);
      console.log('- event.end_date:', events[0].end_date);
      console.log('='.repeat(80));
    }
  }, [events]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Events Debug Data</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Check console for detailed output
        </Text>
      </View>

      {loading && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.section}>
          <Text style={[styles.error, { color: theme.error }]}>Error: {error}</Text>
        </View>
      )}

      {events && events.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Total Events: {events.length}
          </Text>

          {events.slice(0, 3).map((event, index) => (
            <View key={event.id} style={[styles.eventCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.eventTitle, { color: theme.primary }]}>
                Event {index + 1} (ID: {event.id})
              </Text>
              
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Name:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {event.name || 'NULL'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>event_name:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {(event as any).event_name || 'NULL'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Client:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {typeof event.client === 'object' 
                    ? JSON.stringify(event.client, null, 2)
                    : String(event.client || 'NULL')}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Client Name:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {event.client?.name || (event as any).client_name || 'NULL'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Venue:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {typeof event.venue === 'object' 
                    ? JSON.stringify(event.venue, null, 2)
                    : String(event.venue || 'NULL')}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Status:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {event.status || 'NULL'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Dates:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {event.start_date || 'NULL'} → {event.end_date || 'NULL'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>All Keys:</Text>
                <Text style={[styles.value, { color: theme.text, fontSize: 10 }]}>
                  {Object.keys(event).join(', ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
