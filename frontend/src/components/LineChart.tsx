import React from 'react';
import { PortfolioSnapshot } from '../api/investingApi';
import styles from './LineChart.module.css';

interface LineChartProps {
  data: PortfolioSnapshot[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  highlightTrades?: number[]; // Month indices with trades
}

/**
 * Accessible SVG line chart for portfolio values over time
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 800,
  height = 300,
  showGrid = true,
  highlightTrades = [],
}) => {
  const padding = 50;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Calculate value range
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;

  // Scale functions
  const xScale = (month: number) => padding + (month / (data.length - 1)) * chartWidth;
  const yScale = (value: number) =>
    height - padding - ((value - minValue) / valueRange) * chartHeight;

  // Generate path
  const pathData = data
    .map((snapshot, index) => {
      const x = xScale(snapshot.month);
      const y = yScale(snapshot.value);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Area fill path
  const areaData =
    pathData +
    ` L ${xScale(data[data.length - 1].month)} ${height - padding}` +
    ` L ${padding} ${height - padding}` +
    ' Z';

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: height - padding - ratio * chartHeight,
    value: minValue + ratio * valueRange,
  }));

  // X-axis ticks (every 12 months)
  const totalYears = Math.ceil(data.length / 12);
  const xTicks = Array.from({ length: totalYears + 1 }, (_, i) => ({
    x: xScale(i * 12),
    label: `${i}y`,
  }));

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Portfolio performance chart showing growth from $${Math.round(data[0].value).toLocaleString()} to $${Math.round(data[data.length - 1].value).toLocaleString()} over ${data.length} months`}
      className={styles.chart}
    >
      {/* Grid lines */}
      {showGrid &&
        yTicks.map((tick, idx) => (
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

      {/* Area fill */}
      <path d={areaData} fill="rgba(33, 150, 243, 0.15)" />

      {/* Line path */}
      <path d={pathData} fill="none" stroke="#2196F3" strokeWidth="2.5" />

      {/* Trade markers */}
      {highlightTrades.map((month) => {
        const snapshot = data.find((d) => d.month === month);
        if (!snapshot) return null;

        const x = xScale(snapshot.month);
        const y = yScale(snapshot.value);

        return (
          <g key={`trade-${month}`}>
            <circle cx={x} cy={y} r="6" fill="#FF9800" stroke="white" strokeWidth="2" />
            <title>Rebalancing at month {month}</title>
          </g>
        );
      })}

      {/* Data points (every 12 months + start/end) */}
      {data.map((snapshot, index) => {
        if (index % 12 !== 0 && index !== data.length - 1) return null;

        const x = xScale(snapshot.month);
        const y = yScale(snapshot.value);

        return (
          <circle
            key={`point-${index}`}
            cx={x}
            cy={y}
            r="4"
            fill="#2196F3"
            stroke="white"
            strokeWidth="2"
            tabIndex={0}
            role="button"
            aria-label={`Month ${snapshot.month}: $${Math.round(snapshot.value).toLocaleString()}`}
            className={styles.chartPoint}
          >
            <title>
              Month {snapshot.month}: ${Math.round(snapshot.value).toLocaleString()}
            </title>
          </circle>
        );
      })}

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
