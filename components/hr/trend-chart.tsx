"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface Props {
    data: {
        date: string;
        score: number;
        staff: string;
    }[];
}

export function HRTrendChart({ data }: Props) {
    // If data is empty, reverse chronological order passed from server needs reversing to show timeline correctly
    const chartData = [...data].reverse();

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No evaluation data available.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={chartData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                    itemStyle={{ color: '#3b82f6' }}
                    formatter={(value: any, name: any, props: any) => [`${value}/5.0`, props.payload.staff]}
                />
                <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
