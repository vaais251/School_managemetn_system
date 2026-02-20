"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markVoucherPaid } from "@/actions/finance";

interface Voucher {
    id: string;
    studentId: string;
    month: string;
    amount: string | number;
    fineAmount: string | number | null;
    status: "PAID" | "UNPAID";
    student: {
        name: string;
        registrationId: string;
        class: {
            name: string;
        };
    };
}

interface Props {
    data: Voucher[];
}

export function VoucherDataTable({ data }: Props) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleMarkPaid = async (id: string) => {
        setLoadingId(id);
        const res = await markVoucherPaid(id);
        setLoadingId(null);

        if (res.success) toast.success(res.message);
        else toast.error(res.message);
    };

    if (data.length === 0) {
        return <p className="text-muted-foreground text-sm py-4">No vouchers generated yet.</p>;
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Voucher ID</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((voucher) => {
                        const amount = Number(voucher.amount) + (voucher.fineAmount ? Number(voucher.fineAmount) : 0);
                        return (
                            <TableRow key={voucher.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {voucher.id.split('-')[0]}...
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{voucher.student.name}</div>
                                    <div className="text-xs text-muted-foreground">{voucher.student.registrationId}</div>
                                </TableCell>
                                <TableCell>{voucher.student.class.name}</TableCell>
                                <TableCell>{format(new Date(voucher.month), "MMM yyyy")}</TableCell>
                                <TableCell className="text-right font-medium">
                                    Rs. {amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={voucher.status === "PAID" ? "default" : "destructive"}>
                                        {voucher.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={voucher.status === "PAID" || loadingId === voucher.id}
                                        onClick={() => handleMarkPaid(voucher.id)}
                                        className={voucher.status === "UNPAID" ? "text-green-600 border-green-200 hover:bg-green-50" : ""}
                                    >
                                        {loadingId === voucher.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <><CheckCircle className="h-4 w-4 mr-1" /> Mark Paid</>
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
