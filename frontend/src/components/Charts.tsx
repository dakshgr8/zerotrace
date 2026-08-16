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
        className="w-full flex items-center justify-center bg-slate-50/60 rounded-xl border border-slate-200/80 text-xs text-slate-400 font-medium"
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
    <div className="w-full bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="scadaTrustGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
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
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#94A3B8"
                fontFamily="JetBrains Mono"
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
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* SCADA Area fill */}
        <path d={scadaArea} fill="url(#scadaTrustGradient)" />

        {/* SCADA Generation line (Indigo) */}
        <path
          d={scadaPath}
          fill="none"
          stroke="#4F46E5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Grid Export line (Emerald) */}
        <path
          d={gridPath}
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="4 3"
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
              r="3.5"
              fill="#FFFFFF"
              stroke="#4F46E5"
              strokeWidth="2"
            />
          );
        })}

        {/* Legend */}
        <g transform={`translate(${width - 240}, 16)`}>
          <line x1="0" y1="0" x2="16" y2="0" stroke="#4F46E5" strokeWidth="2.5" />
          <text x="22" y="3.5" fontSize="10" fill="#334155" fontWeight="600" fontFamily="Plus Jakarta Sans">
            Plant Output (MW)
          </text>
          
          <line x1="120" y1="0" x2="136" y2="0" stroke="#10B981" strokeWidth="2" strokeDasharray="4 3" />
          <text x="142" y="3.5" fontSize="10" fill="#334155" fontWeight="600" fontFamily="Plus Jakarta Sans">
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
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 80 }) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#10B981'; // Emerald Safe
  let bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Low Risk';

  if (score >= 60) {
    strokeColor = '#EF4444'; // Rose Red Anomaly
    bgBadge = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Severe Anomaly';
  } else if (score >= 25) {
    strokeColor = '#F59E0B'; // Amber Warning
    bgBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Review Needed';
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
          <span className="font-display font-extrabold text-base text-slate-900 leading-none">
            {score.toFixed(0)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Risk</span>
        </div>
      </div>

      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bgBadge}`}>
        {label}
      </span>
    </div>
  );
};
