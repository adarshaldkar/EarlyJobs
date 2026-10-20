import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { HIRING_STAGES, HiringStage } from '../../types';

interface PipelineChartProps {
  stageCounts: Record<HiringStage, number> | undefined;
  isLoading: boolean;
}

const STAGE_BAR_COLORS: Record<HiringStage, string> = {
  Applied: '#78716C',    // Stone
  Screening: '#0284C7',  // Sky
  Interview: '#D97706',  // Amber
  Offer: '#7C3AED',      // Purple
  Hired: '#059669',      // Emerald
  Rejected: '#E11D48'    // Rose
};

export const PipelineChart: React.FC<PipelineChartProps> = ({ stageCounts, isLoading }) => {
  const data = HIRING_STAGES.map((stage) => ({
    stage,
    count: stageCounts?.[stage] ?? 0,
    fill: STAGE_BAR_COLORS[stage]
  }));

  const total = Object.values(stageCounts || {}).reduce((acc, c) => acc + c, 0);

  return (
    <div
      data-testid="pipeline-funnel-card"
      className="p-4 rounded border border-subtle bg-surface shadow-none"
    >
      <div className="flex items-center justify-between pb-3 border-b border-subtle mb-3">
        <div>
          <h3 className="text-xs font-semibold text-ink-primary">Pipeline Distribution</h3>
          <p className="text-[11px] text-ink-secondary">Candidates by hiring stage</p>
        </div>
        <div className="text-xs text-ink-secondary tabular-nums">
          <span className="font-semibold text-ink-primary">{total}</span> Total in Pipeline
        </div>
      </div>

      <div className="h-44 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-ink-secondary">
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 11, fill: '#78716C' }}
                axisLine={{ stroke: '#E7E5E4' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#78716C' }}
                axisLine={{ stroke: '#E7E5E4' }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-surface border border-subtle rounded p-2 text-xs shadow-sm">
                        <div className="font-semibold text-ink-primary">{item.stage}</div>
                        <div className="text-ink-secondary">
                          {item.count} candidate{item.count === 1 ? '' : 's'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.stage} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
