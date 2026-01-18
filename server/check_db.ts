
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Database State...');

    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);
    if (userCount > 0) {
        const users = await prisma.user.findMany();
        console.log('Users:', users.map(u => `${u.name} (${u.role}) - ${u.id}`));
    }

    const caseCount = await prisma.case.count();
    console.log(`Cases: ${caseCount}`);

    if (caseCount > 0) {
        const cases = await prisma.case.findMany({ include: { owner: true } });
        console.log('Cases:', cases.map(c => `${c.title} (Owner: ${c.owner?.name})`));
    }

    const entityCount = await prisma.entity.count();
    console.log(`Entities: ${entityCount}`);

    const involvementCount = await prisma.caseInvolvement.count();
    console.log(`Involvements: ${involvementCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
