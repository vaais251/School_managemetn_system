"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface Props {
    classes: { id: string; name: string }[];
    totalCount: number;
    filteredCount: number;
}

export function StudentFilters({ classes, totalCount, filteredCount }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value === null || value === "") {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (value: string) => {
        startTransition(() => {
            router.push(`${pathname}?${createQueryString({ q: value || null })}`);
        });
    };

    const handleClassFilter = (value: string) => {
        startTransition(() => {
            router.push(
                `${pathname}?${createQueryString({ class: value === "all" ? null : value })}`
            );
        });
    };

    const handleClear = () => {
        startTransition(() => {
            router.push(pathname);
        });
    };

    const hasFilters = searchParams.has("q") || searchParams.has("class");

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:max-w-xl">
                {/* Search Box */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, ID or email..."
                        defaultValue={searchParams.get("q") ?? ""}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Class Filter */}
                <Select
                    defaultValue={searchParams.get("class") ?? "all"}
                    onValueChange={handleClassFilter}
                >
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                            </SelectItem>
                        ))}
                        <SelectItem value="unassigned">Unassigned (RFL)</SelectItem>
                    </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasFilters && (
                    <Button variant="ghost" onClick={handleClear} className="shrink-0">
                        <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Count indicator */}
            <p className={`text-sm shrink-0 ${isPending ? "text-muted-foreground animate-pulse" : "text-muted-foreground"}`}>
                Showing <span className="font-semibold text-slate-700">{filteredCount}</span> of{" "}
                <span className="font-semibold text-slate-700">{totalCount}</span> students
            </p>
        </div>
    );
}
