import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Path, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface LineData { label: string; value: number; }
interface SimpleLineChartProps {
  data: LineData[];
  height?: number;
  width?: number;
  lineColor?: string;
  showDots?: boolean;
  filled?: boolean;
}

export function SimpleLineChart({ data, height = 140, width = 320, lineColor, showDots = true, filled = true }: SimpleLineChartProps) {
  const colors = useColors();
  const color = lineColor || colors.primary;
  const max = Math.max(...data.map(d => d.value), 0.1);
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  const pad = { top: 12, bottom: 10, left: 12, right: 12 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  if (data.length < 2) return null;

  const pts = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * cw,
    y: height - pad.bottom - ((d.value - min) / range) * ch,
  }));

  const polyPts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = filled
    ? `M ${pts[0].x.toFixed(1)},${(height - pad.bottom).toFixed(1)} ` +
      pts.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(1)},${(height - pad.bottom).toFixed(1)} Z`
    : '';

  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom}
          stroke={colors.border} strokeWidth={1} />
        {filled && areaPath ? <Path d={areaPath} fill={color} opacity={0.12} /> : null}
        <Polyline points={polyPts} fill="none" stroke={color} strokeWidth={2.5}
          strokeLinejoin="round" strokeLinecap="round" />
        {showDots && pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
      </Svg>
    </View>
  );
}
