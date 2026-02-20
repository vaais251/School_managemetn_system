import { PrismaClient, ProgramType, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seed...");

    // 1. Clean Database
    await prisma.feedback.deleteMany();
    await prisma.survey.deleteMany();
    await prisma.staffEvaluation.deleteMany();
    await prisma.rFLAcademicRecord.deleteMany();
    await prisma.studentMark.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.disbursement.deleteMany();
    await prisma.feeVoucher.deleteMany();
    await prisma.feeStructure.deleteMany();
    await prisma.programEnrollment.deleteMany();
    await prisma.teacherAssignment.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.class.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 2. Create Staff Users
    const roles: { role: Role, email: string, name: string }[] = [
        { role: 'SUPER_ADMIN', email: 'admin@mrt.edu', name: 'Principal Jane Doe' },
        { role: 'SECTION_HEAD', email: 'head@mrt.edu', name: 'Mr. Section Head' },
        { role: 'FEE_DEPT', email: 'finance@mrt.edu', name: 'Ms. Finance Manager' },
        { role: 'TRUST_MANAGER', email: 'trust@mrt.edu', name: 'Trustee John Smith' },
        { role: 'TEACHER', email: 'teacher1@mrt.edu', name: 'Albus Dumbledore' },
        { role: 'TEACHER', email: 'teacher2@mrt.edu', name: 'Severus Snape' },
    ];

    const staffUsers = [];
    for (const r of roles) {
        const u = await prisma.user.create({
            data: {
                email: r.email,
                password: hashedPassword,
                role: r.role,
                isActive: true,
            }
        });
        // Mock a basic name for staff in evaluations
        // Wait, User model doesn't have a 'name' field natively, it's just email.
        // But for later we'll identify them by email
        staffUsers.push(u);
    }
    const [_, __, ___, ____, t1, t2] = staffUsers; // T1 and T2 are teachers

    console.log(`Created ${staffUsers.length} staff members.`);

    // 3. Create Classes & Subjects
    const grade9 = await prisma.class.create({ data: { name: "Grade 9" } });
    const grade10 = await prisma.class.create({ data: { name: "Grade 10" } });

    const math = await prisma.subject.create({ data: { name: "Mathematics" } });
    const physics = await prisma.subject.create({ data: { name: "Physics" } });
    const english = await prisma.subject.create({ data: { name: "English" } });

    await prisma.teacherAssignment.createMany({
        data: [
            { teacherId: t1.id, classId: grade9.id, subjectId: math.id },
            { teacherId: t1.id, classId: grade10.id, subjectId: physics.id },
            { teacherId: t2.id, classId: grade9.id, subjectId: english.id },
            { teacherId: t2.id, classId: grade10.id, subjectId: english.id },
        ]
    });

    console.log("Created 2 classes, 3 subjects, and 4 teacher assignments.");

    // 4. Create Students
    // 15 Students: 7 MRHSS, 4 MRA, 4 RFL. 3 isBeneficiary=true
    const studentData = [
        { name: "Alice Adams", type: ProgramType.MRHSS, reqClass: grade9, isBen: true },
        { name: "Bob Brown", type: ProgramType.MRHSS, reqClass: grade9, isBen: false },
        { name: "Charlie Clark", type: ProgramType.MRHSS, reqClass: grade10, isBen: true },
        { name: "Diana Davis", type: ProgramType.MRHSS, reqClass: grade10, isBen: false },
        { name: "Evan Edwards", type: ProgramType.MRHSS, reqClass: grade9, isBen: false },
        { name: "Fiona Foster", type: ProgramType.MRHSS, reqClass: grade10, isBen: true },
        { name: "George Green", type: ProgramType.MRHSS, reqClass: grade9, isBen: false },

        { name: "Hannah Hall", type: ProgramType.MRA, reqClass: grade9, isBen: false, hostel: true },
        { name: "Ian Irving", type: ProgramType.MRA, reqClass: grade10, isBen: false, hostel: true },
        { name: "Jack Jones", type: ProgramType.MRA, reqClass: grade9, isBen: false, hostel: true },
        { name: "Kelly King", type: ProgramType.MRA, reqClass: grade10, isBen: false, hostel: true },

        // RFL students don't need a school "class" usually since they are university students
        // But the schema allows classId to be optional.
        { name: "Liam Lewis", type: ProgramType.RFL, isBen: false },
        { name: "Mia Moore", type: ProgramType.RFL, isBen: false },
        { name: "Noah Nelson", type: ProgramType.RFL, isBen: false },
        { name: "Olivia Owens", type: ProgramType.RFL, isBen: false },
    ];

    let counter = 1;
    for (const st of studentData) {
        const pword = await bcrypt.hash('password123', 10);

        // 1. Create User
        const u = await prisma.user.create({
            data: {
                email: `student${counter}@mrt.edu`,
                password: pword,
                role: 'STUDENT',
                isActive: true,
            }
        });

        // 2. Create Profile
        const profile = await prisma.studentProfile.create({
            data: {
                userId: u.id,
                registrationId: `REG-2026-${String(counter).padStart(3, '0')}`,
                name: st.name,
                isBeneficiary: st.isBen || false,
                needsHostel: ('hostel' in st && st.hostel) ? true : false,
                classId: 'reqClass' in st ? st.reqClass.id : null,
                guardianInfo: {
                    name: `Guardian of ${st.name}`,
                    relationship: "Parent",
                    phone: `555-010${counter}`,
                    address: "123 School District, City, Country"
                }
            }
        });

        // 3. Create Enrollment
        await prisma.programEnrollment.create({
            data: {
                studentId: profile.id,
                type: st.type,
                status: 'ACTIVE'
            }
        });

        // 4. Create dummy fee voucher for MRHSS / MRA
        if (st.type !== ProgramType.RFL) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);

            await prisma.feeVoucher.create({
                data: {
                    studentId: profile.id,
                    month: startOfMonth,
                    amount: ('hostel' in st && st.hostel) ? 3500 : 2000,
                    status: (counter % 3 === 0) ? 'UNPAID' : 'PAID', // Some paid, some unpaid
                    fineAmount: (counter % 3 === 0) ? 50 : 0
                }
            });

            // Add dummy marks
            await prisma.studentMark.create({
                data: {
                    studentId: profile.id,
                    classId: st.reqClass.id,
                    subjectId: math.id,
                    examTitle: "Midterms 2026",
                    marksObtained: Math.floor(Math.random() * 50) + 50,
                    totalMarks: 100,
                }
            });
            await prisma.attendance.create({
                data: {
                    studentId: profile.id,
                    date: new Date(),
                    status: 'PRESENT'
                }
            });
        }

        // 5. Create RFL structure for RFL profiles
        if (st.type === ProgramType.RFL) {
            await prisma.rFLAcademicRecord.create({
                data: {
                    studentId: profile.id,
                    universityName: "National University",
                    degree: "BSc Computer Science",
                    currentSemester: Math.floor(Math.random() * 8) + 1,
                    gpa: (Math.random() * (4.0 - 2.5) + 2.5)
                }
            });

            await prisma.disbursement.create({
                data: {
                    studentId: profile.id,
                    purpose: "Spring Tuition 2026",
                    amount: 5000,
                    transactionDate: new Date(),
                }
            });
        }

        counter++;
    }

    console.log("Created 15 students alongside User profiles, Enrollments, and Financial / Academic data.");
    console.log("Seeding complete! Admin access -> admin@mrt.edu | password123");
}

main()
    .catch((e) => {
        console.error("Error during seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
