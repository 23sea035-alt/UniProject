import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface BarData { label: string; value: number; }
interface SimpleBarChartProps {
  data: BarData[];
  height?: number;
  width?: number;
  barColor?: string;
  highlightLast?: boolean;
}

export function SimpleBarChart({ data, height = 160, width = 320, barColor, highlightLast = false }: SimpleBarChartProps) {
  const colors = useColors();
  const color = barColor || colors.primary;
  const max = Math.max(...data.map(d => d.value), 0.1);
  const pad = { top: 12, bottom: 28, left: 8, right: 8 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const bw = Math.max(4, (cw / data.length) - 4);
  const gap = cw / data.length;

  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom}
          stroke={colors.border} strokeWidth={1} />
        {data.map((d, i) => {
          const bh = Math.max(2, (d.value / max) * ch);
          const x = pad.left + i * gap + (gap - bw) / 2;
          const y = height - pad.bottom - bh;
          const isLast = highlightLast && i === data.length - 1;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={bw} height={bh} rx={3}
                fill={isLast ? colors.accent : color}
                opacity={isLast ? 1 : 0.75} />
              {data.length <= 12 && (
                <SvgText x={x + bw / 2} y={height - 8} textAnchor="middle"
                  fontSize="9" fill={colors.mutedForeground}>{d.label}</SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
