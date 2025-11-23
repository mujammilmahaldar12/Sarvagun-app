// SkillsDisplay.tsx - Professional Skills Display with Proficiency Levels
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

  const categoryIcons = {
    technical: '⚙️',
    soft: '🤝',
    domain: '📊',
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
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <Card key={category} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryIcon}>{categoryIcons[category as keyof typeof categoryIcons]}</Text>
            <Text style={[styles.categoryTitle, { color: theme.text }]}>
              {categoryLabels[category as keyof typeof categoryLabels]}
            </Text>
            <Badge 
              label={`${categorySkills.length}`} 
              variant="subtle"
            />
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
      ))}
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
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  skillsList: {
    gap: 16,
  },
  skillItem: {
    gap: 8,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  skillMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearsText: {
    fontSize: 12,
    fontWeight: '400',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
