// CollaborationTree.tsx - Advanced Organizational Hierarchy Visualization
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Badge } from '../core/Badge';
import { useTheme } from '../../hooks/useTheme';
import type { Employee } from '../../types/user';
import { LinearGradient } from 'expo-linear-gradient';

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

  // Render individual employee node with enhanced styling
  const renderEmployeeNode = (
    employee: Employee,
    level: 'top' | 'middle' | 'bottom',
    isHighlight: boolean = false
  ) => {
    return (
      <View style={styles.nodeContainer}>
        {isHighlight && (
          <LinearGradient
            colors={[`${theme.primary}20`, `${theme.primary}05`]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <View 
          style={[
            styles.nodeCard,
            { 
              backgroundColor: theme.surface,
              borderColor: isHighlight ? theme.primary : theme.border,
              borderWidth: isHighlight ? 3 : 1.5,
            }
          ]}
        >
          <View style={styles.nodeContent}>
            {/* Avatar with level badge */}
            <View style={styles.avatarContainer}>
              <Avatar
                name={employee.name}
                size={isHighlight ? 72 : 60}
                source={employee.profile_picture ? { uri: employee.profile_picture } : undefined}
              />
              
              {/* Level indicator badge */}
              <View 
                style={[
                  styles.levelBadge,
                  { 
                    backgroundColor: 
                      level === 'top' ? '#FFD700' : 
                      level === 'middle' ? theme.primary : 
                      '#10b981' 
                  }
                ]}
              >
                <Text style={styles.levelBadgeText}>
                  {level === 'top' ? '👑' : level === 'middle' ? '⭐' : '👥'}
                </Text>
              </View>
            </View>

            {/* Employee details */}
            <View style={styles.nodeDetails}>
              <Text 
                style={[
                  styles.nodeName, 
                  { color: theme.text },
                  isHighlight && styles.highlightedName
                ]}
                numberOfLines={2}
              >
                {employee.name}
              </Text>
              
              <Text 
                style={[styles.nodeDesignation, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {employee.designation}
              </Text>
              
              <Text 
                style={[styles.nodeDepartment, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {employee.department}
              </Text>

              {/* "You" badge */}
              {isHighlight && (
                <View style={styles.youBadgeContainer}>
                  <Badge variant="filled" color={theme.primary} size="small">
                    You
                  </Badge>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render connecting lines
  const renderConnector = (type: 'vertical' | 'horizontal') => {
    const lineColor = theme.border;
    
    if (type === 'vertical') {
      return (
        <View style={[styles.verticalLine, { backgroundColor: lineColor }]} />
      );
    }
    
    return (
      <View style={[styles.horizontalLine, { backgroundColor: lineColor }]} />
    );
  };

  // Empty state
  if (!manager && teamMembers.length === 0 && peers.length === 0 && !topManagement) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="git-network-outline" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.text }]}>
          No Team Hierarchy Available
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          Team structure will appear here once configured
        </Text>
      </View>
    );
  }

  // Full organizational hierarchy tree (like the image reference)
  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.treeContainer}
    >
      <View style={styles.hierarchyWrapper}>
        
        {/* LEVEL 1: Top Management - CEO */}
        {topManagement && (
          <>
            {renderEmployeeNode(topManagement, 'top')}
            {manager && <View style={[styles.verticalConnector, { backgroundColor: theme.border }]} />}
          </>
        )}

        {/* LEVEL 2: Manager */}
        {manager && (
          <>
            {renderEmployeeNode(manager, 'middle')}
            <View style={[styles.verticalConnector, { backgroundColor: theme.border }]} />
          </>
        )}

        {/* LEVEL 3: Current User (You) */}
        {renderEmployeeNode(currentUser, 'middle', true)}
        
        {/* Connectors to team members */}
        {teamMembers.length > 0 && (
          <>
            <View style={[styles.verticalConnector, { backgroundColor: theme.border }]} />
            
            {/* T-connector for multiple team members */}
            {teamMembers.length > 1 && (
              <View style={[styles.horizontalConnector, { 
                backgroundColor: theme.border,
                width: Math.max((teamMembers.length - 1) * 240, 200)
              }]} />
            )}
          </>
        )}

        {/* LEVEL 4: Direct Reports (Team Members) - Horizontal Layout */}
        {teamMembers.length > 0 && (
          <View style={styles.teamRow}>
            {teamMembers.map((member, index) => (
              <View key={member.id} style={styles.teamMemberColumn}>
                {/* Vertical line from T-connector to each member */}
                <View style={[styles.branchLine, { backgroundColor: theme.border }]} />
                
                {/* Team member node */}
                {renderEmployeeNode(member, 'bottom')}
                
                {/* Department box under team member */}
                <View style={[styles.verticalConnector, { backgroundColor: theme.border, height: 16 }]} />
                <View style={[styles.departmentBox, { 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border 
                }]}>
                  <Text style={[styles.departmentText, { color: theme.text }]} numberOfLines={1}>
                    {member.department || 'Department'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Container styles
  treeContainer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: '100%',
  },
  hierarchyWrapper: {
    alignItems: 'center',
  },
  
  // Node styles
  nodeContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
  },
  nodeCard: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeContent: {
    padding: 20,
    gap: 14,
    alignItems: 'center',
  },
  
  // Avatar styles
  avatarContainer: {
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  levelBadgeText: {
    fontSize: 15,
  },
  
  // Node text styles
  nodeDetails: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  highlightedName: {
    fontSize: 17,
    fontWeight: '800',
  },
  nodeDesignation: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
  nodeDepartment: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  youBadgeContainer: {
    marginTop: 8,
  },
  
  // Connector styles (proper T-shape like the image)
  verticalConnector: {
    width: 3,
    height: 50,
    borderRadius: 1.5,
    marginVertical: 0,
  },
  horizontalConnector: {
    height: 3,
    borderRadius: 1.5,
    marginVertical: -1.5,
  },
  branchLine: {
    width: 3,
    height: 50,
    borderRadius: 1.5,
  },
  
  // Team members row (horizontal layout like the image)
  teamRow: {
    flexDirection: 'row',
    gap: 80,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 0,
  },
  teamMemberColumn: {
    alignItems: 'center',
  },
  
  // Department boxes under team members
  departmentBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Empty state
  emptyState: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
  },
});
