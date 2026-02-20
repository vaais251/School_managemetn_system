import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, Calculator, Receipt, CreditCard } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DefineFeeStructureForm } from "@/components/finance/define-fee-structure-form";
import { GenerateVouchersForm } from "@/components/finance/generate-vouchers-form";
import { VoucherDataTable } from "@/components/finance/voucher-data-table";

export default async function FinanceDashboard() {
    const session = await auth();
    if (!session || (session.user.role !== "FEE_DEPT" && session.user.role !== "SUPER_ADMIN")) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTitle>Unauthorized</AlertTitle>
                    <AlertDescription>You do not have permission to view the Finance module.</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Fetch necessary data
    const classes = await prisma.class.findMany({
        include: { feeStructure: true }
    });

    const recentVouchers = await prisma.feeVoucher.findMany({
        take: 50,
        orderBy: { month: 'desc' },
        include: {
            student: {
                include: { class: true }
            }
        }
    });

    // Summary calculations
    const totalUnpaid = recentVouchers.filter(v => v.status === "UNPAID").length;
    const totalPaid = recentVouchers.filter(v => v.status === "PAID").length;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Fee Department Portal</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid (Recent)</CardTitle>
                        <CreditCard className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPaid}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Unpaid (Defaulters)</CardTitle>
                        <Receipt className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{totalUnpaid}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="vouchers" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="vouchers">
                        <Receipt className="h-4 w-4 mr-2" />
                        Manage Vouchers
                    </TabsTrigger>
                    <TabsTrigger value="generation">
                        <Calculator className="h-4 w-4 mr-2" />
                        Bulk Generation
                    </TabsTrigger>
                    <TabsTrigger value="structure">
                        <InfoIcon className="h-4 w-4 mr-2" />
                        Fee Structure
                    </TabsTrigger>
                </TabsList>

                {/* 
                  * VOUCHER TRACKING
                  */}
                <TabsContent value="vouchers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Vouchers</CardTitle>
                            <CardDescription>
                                Track and collect fees from students.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <VoucherDataTable data={recentVouchers as any} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 
                  * BULK GENERATION
                  */}
                <TabsContent value="generation" className="space-y-4">
                    <Card className="max-w-xl">
                        <CardHeader>
                            <CardTitle>Generate Bulk Vouchers</CardTitle>
                            <CardDescription>
                                Accurately generates fee vouchers for an entire class based on their tuition, hostel needs, and beneficiary status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GenerateVouchersForm classes={classes as any} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 
                  * FEE STRUCTURE
                  */}
                <TabsContent value="structure" className="space-y-4">
                    <Card className="max-w-xl">
                        <CardHeader>
                            <CardTitle>Define Fee Structure</CardTitle>
                            <CardDescription>
                                Set the baseline Monthly Tuition and Hostel Fees for a specific Grade.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DefineFeeStructureForm classes={classes as any} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
