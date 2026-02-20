"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const PIE_COLORS = { 'PAID': '#10b981', 'UNPAID': '#f43f5e' };

export function DashboardCharts({ metrics }: { metrics: any }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Enrollment vs Capacity</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.studentsVsCapacity} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <YAxis tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                            <Legend />
                            <Bar dataKey="enrolled" name="Enrolled" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="capacity" name="Capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Financial Collection</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={metrics.financialCollection}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="total"
                                nameKey="status"
                                label
                            >
                                {metrics.financialCollection.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.status as keyof typeof PIE_COLORS] || '#cbd5e1'} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} contentStyle={{ borderRadius: '8px' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>RFL Disbursement Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.rflVolume} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <XAxis type="number" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <YAxis dataKey="purpose" type="category" width={100} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                            <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                {metrics.rflVolume.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
