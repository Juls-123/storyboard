
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing existing users...');
    await prisma.caseMember.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Seeding default users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
        { name: 'Director Vance', email: 'vance@ncis.gov', password: hashedPassword, role: 'OWNER', isVerified: true },
        { name: 'Special Agent Gibbs', email: 'gibbs@ncis.gov', password: hashedPassword, role: 'INVESTIGATOR', isVerified: true },
        { name: 'Analyst McGee', email: 'mcgee@ncis.gov', password: hashedPassword, role: 'ANALYST', isVerified: true }
    ];

    for (const u of users) {
        await prisma.user.create({ data: u });
    }

    console.log('Seed complete. Default password is "password123"');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
