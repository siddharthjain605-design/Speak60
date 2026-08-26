import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { TrendPoint } from '../../lib/analytics';
import { Card, SectionTitle } from '../ui';

export default function TrendChart({
  title, data, dataKey, color = '#a78bfa', suffix = '',
}: {
  title: string;
  data: TrendPoint[];
  dataKey: keyof TrendPoint;
  color?: string;
  suffix?: string;
}) {
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(d) => `D${d}`} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} width={36} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
              labelFormatter={(d) => `Day ${d}`}
              formatter={(v) => [`${v}${suffix}`, title]}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
