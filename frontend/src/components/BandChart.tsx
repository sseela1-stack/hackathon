import React from 'react';
import { MonteCarloBand } from '../api/investingApi';
import styles from './BandChart.module.css';

interface BandChartProps {
  bands: MonteCarloBand[];
  width?: number;
  height?: number;
  targetAmount?: number;
}

/**
 * Accessible SVG band chart for Monte Carlo percentile visualization
 */
export const BandChart: React.FC<BandChartProps> = ({
  bands,
  width = 800,
  height = 300,
  targetAmount,
}) => {
  const padding = 50;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Calculate value range
  const allValues = bands.flatMap((b) => [b.p10, b.p25, b.p50, b.p75, b.p90]);
  if (targetAmount) allValues.push(targetAmount);
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;

  // Scale functions
  const xScale = (month: number) => padding + (month / (bands.length - 1)) * chartWidth;
  const yScale = (value: number) =>
    height - padding - ((value - minValue) / valueRange) * chartHeight;

  // Generate path for each percentile
  const generatePath = (accessor: (b: MonteCarloBand) => number) =>
    bands
      .map((band, index) => {
        const x = xScale(band.month);
        const y = yScale(accessor(band));
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');

  const p10Path = generatePath((b) => b.p10);
  const p25Path = generatePath((b) => b.p25);
  const p50Path = generatePath((b) => b.p50);
  const p75Path = generatePath((b) => b.p75);
  const p90Path = generatePath((b) => b.p90);

  // Generate filled areas
  const area10_90 =
    p10Path +
    ' ' +
    bands
      .slice()
      .reverse()
      .map((band) => {
        const x = xScale(band.month);
        const y = yScale(band.p90);
        return `L ${x} ${y}`;
      })
      .join(' ') +
    ' Z';

  const area25_75 =
    p25Path +
    ' ' +
    bands
      .slice()
      .reverse()
      .map((band) => {
        const x = xScale(band.month);
        const y = yScale(band.p75);
        return `L ${x} ${y}`;
      })
      .join(' ') +
    ' Z';

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: height - padding - ratio * chartHeight,
    value: minValue + ratio * valueRange,
  }));

  // X-axis ticks
  const totalYears = Math.ceil(bands.length / 12);
  const xTicks = Array.from({ length: totalYears + 1 }, (_, i) => ({
    x: xScale(Math.min(i * 12, bands.length - 1)),
    label: `${i}y`,
  }));

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Monte Carlo simulation showing percentile bands over ${bands.length} months`}
      className={styles.chart}
    >
      {/* Grid lines */}
      {yTicks.map((tick, idx) => (
        <line
          key={`grid-${idx}`}
          x1={padding}
          y1={tick.y}
          x2={width - padding}
          y2={tick.y}
          stroke="#e0e0e0"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick, idx) => (
        <text
          key={`y-label-${idx}`}
          x={padding - 10}
          y={tick.y + 5}
          fontSize="12"
          fill="#666"
          textAnchor="end"
        >
          ${Math.round(tick.value / 1000)}k
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((tick, idx) => (
        <text
          key={`x-label-${idx}`}
          x={tick.x}
          y={height - padding + 20}
          fontSize="12"
          fill="#666"
          textAnchor="middle"
        >
          {tick.label}
        </text>
      ))}

      {/* Target amount line */}
      {targetAmount && (
        <>
          <line
            x1={padding}
            y1={yScale(targetAmount)}
            x2={width - padding}
            y2={yScale(targetAmount)}
            stroke="#4CAF50"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
          <text
            x={width - padding - 5}
            y={yScale(targetAmount) - 5}
            fontSize="12"
            fill="#4CAF50"
            fontWeight="bold"
            textAnchor="end"
          >
            Target: ${(targetAmount / 1000).toFixed(0)}k
          </text>
        </>
      )}

      {/* 10th-90th percentile band (wider, lighter) */}
      <path d={area10_90} fill="rgba(33, 150, 243, 0.1)" />

      {/* 25th-75th percentile band (narrower, darker) */}
      <path d={area25_75} fill="rgba(33, 150, 243, 0.2)" />

      {/* Percentile lines */}
      <path d={p10Path} fill="none" stroke="#2196F3" strokeWidth="1" opacity="0.4" />
      <path d={p25Path} fill="none" stroke="#2196F3" strokeWidth="1.5" opacity="0.6" />
      <path d={p50Path} fill="none" stroke="#2196F3" strokeWidth="2.5" />
      <path d={p75Path} fill="none" stroke="#2196F3" strokeWidth="1.5" opacity="0.6" />
      <path d={p90Path} fill="none" stroke="#2196F3" strokeWidth="1" opacity="0.4" />

      {/* Legend */}
      <g transform={`translate(${width - padding - 120}, ${padding + 10})`}>
        <rect x="0" y="0" width="110" height="85" fill="white" opacity="0.9" rx="4" />
        <text x="10" y="18" fontSize="12" fontWeight="bold" fill="#333">
          Percentiles
        </text>
        <line x1="10" y1="28" x2="30" y2="28" stroke="#2196F3" strokeWidth="1" opacity="0.4" />
        <text x="35" y="31" fontSize="11" fill="#666">
          10th / 90th
        </text>
        <line x1="10" y1="43" x2="30" y2="43" stroke="#2196F3" strokeWidth="1.5" opacity="0.6" />
        <text x="35" y="46" fontSize="11" fill="#666">
          25th / 75th
        </text>
        <line x1="10" y1="58" x2="30" y2="58" stroke="#2196F3" strokeWidth="2.5" />
        <text x="35" y="61" fontSize="11" fill="#666">
          50th (median)
        </text>
        <rect x="10" y="68" width="90" height="12" fill="rgba(33, 150, 243, 0.2)" />
        <text x="13" y="77" fontSize="9" fill="#333">
          Mid 50% range
        </text>
      </g>

      {/* Axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#333"
        strokeWidth="2"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#333"
        strokeWidth="2"
      />
    </svg>
  );
};
