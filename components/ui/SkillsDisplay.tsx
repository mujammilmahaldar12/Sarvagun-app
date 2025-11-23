// SkillsDisplay.tsx - Professional Skills Display with Proficiency Levels
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../core/Badge';
import { Progress } from '../core/Progress';
import { Card } from '../core/Card';
import type { Skill } from '../../types/user';
import { useTheme } from '../../hooks/useTheme';
import { getSkillLevelLabel, getSkillLevelColor } from '../../utils/profileMockData';

export interface SkillsDisplayProps {
  skills: Skill[];
  showYearsExperience?: boolean;
  compact?: boolean;
}

export function SkillsDisplay({ 
  skills, 
  showYearsExperience = true,
  compact = false 
}: SkillsDisplayProps) {
  const { theme } = useTheme();

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const categoryLabels = {
    technical: 'Technical Skills',
    soft: 'Soft Skills',
    domain: 'Domain Expertise',
  };

  const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    technical: 'code-slash',
    soft: 'people',
    domain: 'business',
  };

  const categoryColors = {
    technical: '#3b82f6',
    soft: '#10b981',
    domain: '#8b5cf6',
  };

  if (compact) {
    // Compact view - just chips
    return (
      <View style={styles.compactContainer}>
        {skills.map((skill) => (
          <Badge
            key={skill.id}
            label={skill.name}
            variant="outlined"
            color={getSkillLevelColor(skill.level)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Object.entries(groupedSkills).map(([category, categorySkills]) => {
        const catColor = categoryColors[category as keyof typeof categoryColors];
        return (
          <Card key={category} style={styles.categoryCard}>
            <View style={[styles.categoryHeader, { backgroundColor: `${catColor}10` }]}>
              <View style={[styles.categoryIconContainer, { backgroundColor: catColor }]}>
                <Ionicons 
                  name={categoryIcons[category]} 
                  size={18} 
                  color="#FFF" 
                />
              </View>
              <Text style={[styles.categoryTitle, { color: theme.text }]}>
                {categoryLabels[category as keyof typeof categoryLabels]}
              </Text>
              <View style={[styles.countBadge, { backgroundColor: catColor }]}>
                <Text style={styles.countText}>{categorySkills.length}</Text>
              </View>
            </View>

          <View style={styles.skillsList}>
            {categorySkills.map((skill) => (
              <View key={skill.id} style={styles.skillItem}>
                <View style={styles.skillHeader}>
                  <Text style={[styles.skillName, { color: theme.text }]}>
                    {skill.name}
                  </Text>
                  <View style={styles.skillMeta}>
                    {showYearsExperience && skill.years_experience !== undefined && skill.years_experience > 0 && (
                      <Text style={[styles.yearsText, { color: theme.textSecondary }]}>
                        {skill.years_experience === 0 
                          ? '< 1 yr' 
                          : `${skill.years_experience.toFixed(1)} yr${skill.years_experience !== 1 ? 's' : ''}`
                        }
                      </Text>
                    )}
                    <Badge
                      label={getSkillLevelLabel(skill.level)}
                      variant="outlined"
                      color={getSkillLevelColor(skill.level)}
                    />
                  </View>
                </View>
                
                <Progress
                  value={skill.level * 20}
                  size="sm"
                  color={getSkillLevelColor(skill.level)}
                  showPercentage={false}
                />
              </View>
            ))}
          </View>
        </Card>
      );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    marginRight: 0,
  },
  categoryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  skillsList: {
    gap: 14,
    padding: 14,
    paddingTop: 0,
  },
  skillItem: {
    gap: 6,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  skillMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yearsText: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
