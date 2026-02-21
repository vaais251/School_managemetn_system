"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface DisbursementHistoryProps {
    disbursements: {
        id: string;
        amount: string | number;
        purpose: string;
        transactionDate: Date;
        description: string | null;
        student: {
            name: string;
            registrationId: string;
            rflRecord: {
                universityName: string;
            } | null;
        };
    }[];
}

export function DisbursementHistoryTable({ disbursements }: DisbursementHistoryProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredDisbursements = disbursements.filter((d) => {
        const query = searchQuery.toLowerCase();
        return (
            d.student.name.toLowerCase().includes(query) ||
            d.student.registrationId.toLowerCase().includes(query) ||
            d.purpose.toLowerCase().includes(query) ||
            (d.student.rflRecord?.universityName?.toLowerCase().includes(query) ?? false)
        );
    });

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by student, ID, or purpose..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>University / Details</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead className="text-right">Amount (Rs.)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDisbursements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No disbursements found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDisbursements.map((d) => (
                                <TableRow key={d.id} className="hover:bg-amber-50/50">
                                    <TableCell className="whitespace-nowrap text-sm text-slate-500">
                                        {format(new Date(d.transactionDate), "MMM dd, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{d.student.name}</div>
                                        <div className="text-xs text-slate-500 font-mono">{d.student.registrationId}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-700">
                                            {d.student.rflRecord?.universityName || <span className="text-muted-foreground italic">N/A</span>}
                                        </div>
                                        {d.description && (
                                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]" title={d.description}>
                                                {d.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                            {d.purpose}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-amber-700">
                                        {Number(d.amount).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
