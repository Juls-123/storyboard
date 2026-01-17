import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // 1. Create Cases
    const case1 = await prisma.case.create({
        data: {
            id: 'C-001',
            title: 'Operation NIGHTFALL',
            status: 'active',
            lead: 'Deckard.R',
            summary: 'Investigation into unauthorized transfers.',
        }
    });

    const case2 = await prisma.case.create({
        data: {
            id: 'C-002',
            title: 'Project CHIMERA',
            status: 'dormant',
            lead: 'Connor.S',
            summary: 'Anomalies in power grid logs.',
        }
    });

    console.log("Created Cases:", case1.id, case2.id);

    // 2. Create Nodes for Case 1
    const person = await prisma.node.create({
        data: {
            caseId: case1.id,
            type: 'person',
            label: 'Robert Deckard',
            detail: 'Lead Detective',
            x: 250,
            y: 100
        }
    });

    const loc = await prisma.node.create({
        data: {
            caseId: case1.id,
            type: 'location',
            label: 'Safehouse 4',
            detail: 'Sector 7 Slums',
            x: 550,
            y: 100
        }
    });

    const evidence = await prisma.node.create({
        data: {
            caseId: case1.id,
            type: 'evidence',
            label: 'Encrypted Drive',
            detail: 'Recovered at scene',
            x: 400,
            y: 300
        }
    });

    console.log("Created Nodes for C-001");

    // 3. Create Edges
    await prisma.edge.create({
        data: {
            caseId: case1.id,
            sourceId: person.id,
            targetId: loc.id,
            label: 'Surveilled'
        }
    });

    await prisma.edge.create({
        data: {
            caseId: case1.id,
            sourceId: person.id,
            targetId: evidence.id,
            label: 'Possesses'
        }
    });

    console.log("Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
