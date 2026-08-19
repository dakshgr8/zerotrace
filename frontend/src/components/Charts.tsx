import React from 'react';
import { TelemetryDataPoint } from '../types';

interface TelemetryChartProps {
  dataPoints: TelemetryDataPoint[];
  height?: number;
}

export const TelemetryComparisonChart: React.FC<TelemetryChartProps> = ({
  dataPoints,
  height = 200,
}) => {
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-white rounded-2xl border-2 border-[#1E293B] text-xs text-[#64748B] font-display font-bold shadow-pop-xs"
        style={{ height }}
      >
        No telemetry time-series points available
      </div>
    );
  }

  const maxPower = Math.max(
    ...dataPoints.map((p) => Math.max(p.scada_active_power_mw, p.grid_export_power_mw, 10))
  );

  const width = 600;
  const paddingX = 35;
  const paddingY = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Build SVG path strings
  const getCoordinates = (val: number, idx: number) => {
    const x = paddingX + (idx / Math.max(1, dataPoints.length - 1)) * graphWidth;
    const y = height - paddingY - (val / (maxPower * 1.15)) * graphHeight;
    return { x, y };
  };

  const scadaPath = dataPoints.reduce((acc, pt, idx) => {
    const { x, y } = getCoordinates(pt.scada_active_power_mw, idx);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const gridPath = dataPoints.reduce((acc, pt, idx) => {
    const { x, y } = getCoordinates(pt.grid_export_power_mw, idx);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const scadaArea = `${scadaPath} L ${paddingX + graphWidth} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <div className="w-full bg-[#FFFDF5] rounded-2xl border-2 border-[#1E293B] p-3.5 overflow-hidden shadow-pop-xs">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="scadaPopGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
          const y = height - paddingY - frac * graphHeight;
          const powerVal = ((frac * maxPower * 1.15)).toFixed(0);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#64748B"
                fontFamily="JetBrains Mono"
                fontWeight="700"
              >
                {powerVal}
              </text>
            </g>
          );
        })}

        {/* Baseline Axis */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="#1E293B"
          strokeWidth="2"
        />

        {/* SCADA Area fill */}
        <path d={scadaArea} fill="url(#scadaPopGradient)" />

        {/* SCADA Generation line (Violet) */}
        <path
          d={scadaPath}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Grid Export line (Mint) */}
        <path
          d={gridPath}
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points dots on SCADA curve */}
        {dataPoints.map((pt, idx) => {
          if (idx % 3 !== 0 && idx !== dataPoints.length - 1) return null;
          const { x, y } = getCoordinates(pt.scada_active_power_mw, idx);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              fill="#FBBF24"
              stroke="#1E293B"
              strokeWidth="2"
            />
          );
        })}

        {/* Legend */}
        <g transform={`translate(${width - 260}, 16)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#8B5CF6" strokeWidth="3" />
          <text x="24" y="3.5" fontSize="10" fill="#1E293B" fontWeight="800" fontFamily="Outfit">
            Inverter Output (MW)
          </text>
          
          <line x1="135" y1="0" x2="153" y2="0" stroke="#10B981" strokeWidth="2.5" strokeDasharray="5 4" />
          <text x="159" y="3.5" fontSize="10" fill="#047857" fontWeight="800" fontFamily="Outfit">
            Grid Meter (MW)
          </text>
        </g>
      </svg>
    </div>
  );
};

interface RiskGaugeProps {
  score: number;
  size?: number;
  label?: string;
  isAnomaly?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 80, label: customLabel, isAnomaly }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const effectiveAnomaly = isAnomaly !== undefined ? isAnomaly : score >= 60;
  const effectiveScore = effectiveAnomaly && score < 60 ? 75 : score;
  const strokeDashoffset = circumference - (effectiveScore / 100) * circumference;

  let strokeColor = '#10B981'; // Mint Safe
  let badgeClass = 'pop-badge-mint';
  let label = customLabel || 'Low Risk';

  if (effectiveAnomaly) {
    strokeColor = '#F472B6'; // Hot Pink Anomaly
    badgeClass = 'pop-badge-pink';
    label = customLabel || 'Anomaly';
  } else if (score >= 25) {
    strokeColor = '#FBBF24'; // Amber Warning
    badgeClass = 'pop-badge-yellow';
    label = customLabel || 'Review Needed';
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-black text-base text-[#1E293B] leading-none">
            {effectiveScore.toFixed(0)}
          </span>
          <span className="text-[9px] text-[#64748B] font-display font-bold uppercase mt-0.5">Risk</span>
        </div>
      </div>

      <span className={`${badgeClass} text-[10px]`}>
        {label}
      </span>
    </div>
  );
};
