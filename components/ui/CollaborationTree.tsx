// CollaborationTree.tsx - Professional Organizational Chart
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
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
  peers = [],
  topManagement,
}: CollaborationTreeProps) {
  const theme = useTheme();

  const EmployeeCard = ({ employee, isYou = false, level }: { employee: Employee; isYou?: boolean; level: 'ceo' | 'manager' | 'you' | 'team' }) => {
    const cardColor = level === 'ceo' ? '#8B5CF6' : level === 'manager' ? '#3B82F6' : isYou ? theme.primary : '#10B981';
    
    return (
      <View style={[styles.card, { borderColor: cardColor, backgroundColor: theme.surface }]}>
        {isYou && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `${theme.primary}10` }]} />
        )}
        
        <View style={styles.cardHeader}>
          <View style={[styles.roleBadge, { backgroundColor: cardColor }]}>
            <Ionicons 
              name={level === 'ceo' ? 'shield' : level === 'manager' ? 'people' : level === 'you' ? 'star' : 'person'} 
              size={12} 
              color="#FFF" 
            />
          </View>
        </View>

        <View style={styles.cardBody}>
          <Avatar
            name={employee.name}
            source={employee.profile_picture ? { uri: employee.profile_picture } : undefined}
            size={isYou ? 60 : 50}
          />
          
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.text }, isYou && styles.cardNameHighlight]} numberOfLines={2}>
              {employee.name}
            </Text>
            <Text style={[styles.cardTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {employee.designation}
            </Text>
            <View style={[styles.deptBadge, { backgroundColor: `${cardColor}15` }]}>
              <Text style={[styles.deptText, { color: cardColor }]} numberOfLines={1}>
                {employee.department}
              </Text>
            </View>
            {isYou && (
              <View style={[styles.youBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const Connector = ({ type = 'vertical', width = 2 }: { type?: 'vertical' | 'horizontal'; width?: number }) => (
    <View style={[
      type === 'vertical' ? styles.vLine : styles.hLine,
      { backgroundColor: theme.border, width: type === 'horizontal' ? width : 2 }
    ]} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.orgChart}>
        
        {/* TOP LEVEL - CEO */}
        {topManagement && (
          <View style={styles.level}>
            <EmployeeCard employee={topManagement} level="ceo" />
            {manager && <Connector />}
          </View>
        )}

        {/* LEVEL 2 - MANAGER */}
        {manager && (
          <View style={styles.level}>
            <EmployeeCard employee={manager} level="manager" />
            <Connector />
          </View>
        )}

        {/* LEVEL 3 - YOU */}
        <View style={styles.level}>
          <EmployeeCard employee={currentUser} isYou level="you" />
          {teamMembers.length > 0 && (
            <>
              <Connector />
              {teamMembers.length > 1 && (
                <View style={styles.tJunction}>
                  <Connector type="horizontal" width={(teamMembers.length - 1) * 160} />
                </View>
              )}
            </>
          )}
        </View>

        {/* LEVEL 4 - TEAM */}
        {teamMembers.length > 0 && (
          <View style={styles.teamLevel}>
            {teamMembers.map((member) => (
              <View key={member.id} style={styles.teamMember}>
                {teamMembers.length > 1 && <Connector />}
                <EmployeeCard employee={member} level="team" />
              </View>
            ))}
          </View>
        )}

        {/* EMPTY STATE */}
        {!manager && teamMembers.length === 0 && !topManagement && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No hierarchy data available
            </Text>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '100%',
  },
  orgChart: {
    alignItems: 'center',
    width: '100%',
  },
  level: {
    alignItems: 'center',
  },
  
  // PROFESSIONAL CARD DESIGN
  card: {
    width: 140,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    position: 'absolute',
    top: -8,
    right: 12,
    zIndex: 10,
  },
  roleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  cardBody: {
    alignItems: 'center',
    gap: 8,
  },
  cardInfo: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  cardNameHighlight: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  deptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  deptText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  youBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // CONNECTORS
  vLine: {
    width: 2,
    height: 40,
    marginVertical: 2,
  },
  hLine: {
    height: 2,
    marginHorizontal: 2,
  },
  tJunction: {
    alignItems: 'center',
  },

  // TEAM LEVEL
  teamLevel: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  teamMember: {
    alignItems: 'center',
  },

  // EMPTY STATE
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
