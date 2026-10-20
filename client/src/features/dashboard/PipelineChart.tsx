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
  Applied: '#64748B',    // Slate
  Screening: '#F59E0B',  // Amber
  Interview: '#8B5CF6',  // Violet
  Offer: '#06B6D4',      // Cyan
  Hired: '#10B981',      // Emerald
  Rejected: '#F43F5E'    // Rose
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
      className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pipeline Distribution</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Live Funnel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Distribution of active applicants across 6 recruitment stages</p>
        </div>
        <div className="text-xs text-slate-500 tabular-nums bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 font-medium">
          <span className="font-bold text-slate-900 text-sm">{total}</span> total applicants
        </div>
      </div>

      <div className="h-52 w-full pt-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Loading pipeline data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9', radius: 6 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-xl px-3.5 py-2.5 text-xs shadow-xl border border-slate-800">
                        <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: item.fill }}
                          />
                          {item.stage}
                        </div>
                        <div className="text-slate-300 mt-1 font-medium">
                          {item.count} candidate{item.count === 1 ? '' : 's'} in stage
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
