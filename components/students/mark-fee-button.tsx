"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markVoucherPaid, markVoucherUnpaid } from "@/actions/finance";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
    voucherId: string;
    status: "PAID" | "UNPAID";
}

export function MarkFeeButton({ voucherId, status }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            const result = status === "PAID"
                ? await markVoucherUnpaid(voucherId)
                : await markVoucherPaid(voucherId);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    if (status === "PAID") {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 hover:bg-red-50 hover:text-red-700 text-green-700 font-medium bg-green-50 border border-green-200 shadow-sm transition-colors"
                onClick={handleToggle}
                disabled={isPending}
                title="Click to mark as Unpaid"
            >
                {isPending ? "..." : (
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> PAID</span>
                )}
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 hover:bg-green-50 hover:text-green-700 text-red-700 font-medium bg-red-50 border border-red-200 shadow-sm transition-colors"
            onClick={handleToggle}
            disabled={isPending}
            title="Click to mark as Paid"
        >
            {isPending ? "..." : (
                <span className="flex items-center gap-1.5"><XCircle className="h-4 w-4" /> UNPAID</span>
            )}
        </Button>
    );
}
