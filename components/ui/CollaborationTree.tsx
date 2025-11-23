// CollaborationTree.tsx - Clean Team Hierarchy
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { useTheme } from '../../hooks/useTheme';
import type { Employee } from '../../types/user';

export interface CollaborationTreeProps {
  currentUser: Employee;
  manager?: Employee;
  teamMembers?: Employee[];
  peers?: Employee[];
  topManagement?: Employee;
}

export function CollaborationTree({
  currentUser,
  manager,
  teamMembers = [],
  topManagement,
}: CollaborationTreeProps) {
  const theme = useTheme();
  
  const [expandedSections, setExpandedSections] = useState({
    top: true,
    manager: true,
    team: true,
  });

  const toggle = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const PersonCard = ({ person, role, isYou = false }: { person: Employee; role: string; isYou?: boolean }) => {
    const roleColors: Record<string, string> = {
      CEO: '#8B5CF6',
      Manager: '#3B82F6',
      You: theme.primary,
      Team: '#10B981',
    };
    const color = roleColors[role];
    
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderLeftColor: color }]}>
        <Avatar
          name={person.name}
          source={person.profile_picture ? { uri: person.profile_picture } : undefined}
          size={48}
        />
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {person.name}
            </Text>
            {isYou && (
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={[styles.title, { color: theme.textSecondary }]} numberOfLines={1}>
            {person.designation}
          </Text>
          <Text style={[styles.dept, { color: theme.textSecondary }]} numberOfLines={1}>
            {person.department}
          </Text>
        </View>
        <View style={[styles.roleIcon, { backgroundColor: color }]}>
          <Ionicons name={role === 'CEO' ? 'shield' : role === 'Manager' ? 'briefcase' : role === 'You' ? 'star' : 'person'} size={16} color="#FFF" />
        </View>
      </View>
    );
  };

  const Section = ({ title, icon, color, expanded, onToggle, children }: any) => (
    <View style={styles.section}>
      <Pressable onPress={onToggle} style={[styles.sectionHeader, { backgroundColor: `${color}10` }]}>
        <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={20} color={color} />
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </Pressable>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );

  return (
    <View style={styles.container}>
      
      {topManagement && (
        <Section
          title="Top Management"
          icon="shield-checkmark"
          color="#8B5CF6"
          expanded={expandedSections.top}
          onToggle={() => toggle('top')}
        >
          <View style={styles.withLine}>
            <View style={[styles.verticalLine, { backgroundColor: '#8B5CF6' }]} />
            <View style={styles.content}>
              <PersonCard person={topManagement} role="CEO" />
            </View>
          </View>
        </Section>
      )}

      {manager && (
        <Section
          title="Reports To"
          icon="arrow-up-circle"
          color="#3B82F6"
          expanded={expandedSections.manager}
          onToggle={() => toggle('manager')}
        >
          <View style={styles.withLine}>
            <View style={[styles.verticalLine, { backgroundColor: '#3B82F6' }]} />
            <View style={styles.content}>
              <PersonCard person={manager} role="Manager" />
            </View>
          </View>
        </Section>
      )}

      <View style={[styles.youSection, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}30` }]}>
        <Text style={[styles.youLabel, { color: theme.primary }]}>YOUR POSITION</Text>
        <PersonCard person={currentUser} role="You" isYou />
      </View>

      {teamMembers.length > 0 && (
        <Section
          title={`Team (${teamMembers.length})`}
          icon="people"
          color="#10B981"
          expanded={expandedSections.team}
          onToggle={() => toggle('team')}
        >
          <View style={styles.withLine}>
            <View style={[styles.verticalLine, { backgroundColor: '#10B981' }]} />
            <View style={styles.content}>
              {teamMembers.map((member, i) => (
                <View key={member.id}>
                  <PersonCard person={member} role="Team" />
                  {i < teamMembers.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                </View>
              ))}
            </View>
          </View>
        </Section>
      )}

      {!manager && !topManagement && teamMembers.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No team data</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  sectionContent: {
    gap: 8,
  },
  
  // YouTube-style vertical line
  withLine: {
    flexDirection: 'row',
    gap: 16,
    paddingLeft: 4,
  },
  verticalLine: {
    width: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  
  youSection: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    gap: 8,
  },
  youLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
  dept: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  divider: {
    height: 1,
    marginVertical: 8,
  },
  
  empty: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
