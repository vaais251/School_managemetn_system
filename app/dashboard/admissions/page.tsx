import { RegisterStudentForm } from "@/components/admissions/register-student-form";

export default function AdmissionsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admissions Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <RegisterStudentForm />
                </div>
                <div className="col-span-3">
                    {/* Future content like recent admissions or stats */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold leading-none tracking-tight mb-2">Instructions</h3>
                        <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                            <li>Hostel requirement forces enrollment into the MRA program.</li>
                            <li>Beneficiary status grants free tuition.</li>
                            <li>A temporary password will be generated upon successful registration. Please share it securely with the student.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
