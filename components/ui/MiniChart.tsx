/**
 * MiniChart - Small chart component for KPI cards
 */
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useThemeStore } from '@/store/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MiniChartProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  color,
  height = 40,
  width = SCREEN_WIDTH / 2 - 60,
}) => {
  const { isDark } = useThemeStore();

  if (!data || data.length < 2) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Generate smooth curve path
  const generatePath = () => {
    const step = width / (data.length - 1);
    let path = '';

    data.forEach((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        const prevX = (index - 1) * step;
        const prevY = height - ((data[index - 1] - min) / range) * height;
        const cpX = (prevX + x) / 2;
        path += ` Q ${cpX} ${prevY}, ${x} ${y}`;
      }
    });

    return path;
  };

  // Generate filled area path
  const generateAreaPath = () => {
    const linePath = generatePath();
    const lastX = width;
    return `${linePath} L ${lastX} ${height} L 0 ${height} Z`;
  };

  return (
    <View style={[styles.container, { height, width }]}>
      <Svg height={height} width={width}>
        <Defs>
          <SvgGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </SvgGradient>
        </Defs>
        
        {/* Filled area */}
        <Path
          d={generateAreaPath()}
          fill="url(#gradient)"
        />
        
        {/* Line */}
        <Path
          d={generatePath()}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
