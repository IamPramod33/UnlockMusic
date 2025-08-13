import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Polygon } from 'react-native-svg';

type Props = {
  width?: number | string; // allow '100%'
  height?: number;
  textColor?: string;
  barColor?: string;
  barCount?: number;
};

export default function PitchIntroDiagram({ width = '100%', height = 120, textColor = '#0f172a', barColor = '#93c5fd', barCount = 5 }: Props) {
  const dim = useWindowDimensions();
  // Compute a canvas width that adapts to screen; cap for readability
  const canvasW = typeof width === 'number' ? width : Math.min(Math.max(280, dim.width - 32), 420);
  const padding = 16;
  const innerW = canvasW - padding * 2;
  const innerH = height - padding * 2;
  const isNarrow = canvasW < 420;
  const barGap = isNarrow ? 4 : 6;
  const minBarW = isNarrow ? 10 : 18;
  const maxBarW = isNarrow ? 18 : 28;
  // Prefer fewer bars on narrow screens
  const desiredBars = isNarrow ? Math.min(4, barCount ?? 4) : (barCount ?? 5);
  const maxBars = Math.max(3, Math.floor((innerW + barGap) / (minBarW + barGap)));
  const bars = Math.min(desiredBars, maxBars);
  // Cap bar width so they don't stretch across full width on small screens
  let barW = Math.min(maxBarW, (innerW - barGap * (bars - 1)) / bars);
  const totalBarsW = bars * barW + barGap * (bars - 1);
  const startX = padding + Math.max(0, (innerW - totalBarsW) / 2);

  return (
    <View>
      <Svg width={typeof width === 'number' ? width : '100%'} height={height} viewBox={`0 0 ${canvasW} ${height}`}>
        {Array.from({ length: bars }).map((_, i) => {
          const t = bars > 1 ? i / (bars - 1) : 0;
          const h = Math.max(20, innerH * (0.25 + 0.7 * t));
          const x = startX + i * (barW + barGap);
          const y = height - padding - h;
          return <Rect key={`bar-${i}`} x={x} y={y} width={barW} height={h} rx={4} fill={barColor} />;
        })}

        <Line x1={padding - 4} y1={height - padding} x2={canvasW - padding + 4} y2={height - padding} stroke={textColor} strokeWidth={1} />

        <Line x1={padding} y1={padding + 6} x2={canvasW - padding - 18} y2={padding + 6} stroke={textColor} strokeWidth={1.5} />
        <Polygon points={`${canvasW - padding - 18},${padding + 6} ${canvasW - padding - 26},${padding + 2} ${canvasW - padding - 26},${padding + 10}`} fill={textColor} />
        <SvgText x={(padding + (canvasW - padding - 18)) / 2} y={padding + 4} fontSize={12} fill={textColor} textAnchor="middle">
          higher pitch →
        </SvgText>

        <SvgText x={padding} y={height - padding + 16} fontSize={12} fill={textColor}>
          low
        </SvgText>
        <SvgText x={canvasW - padding} y={height - padding + 16} fontSize={12} fill={textColor} textAnchor="end">
          high
        </SvgText>
      </Svg>
    </View>
  );
}


