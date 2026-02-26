import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@sentinelsec.local';
    const password = 'Admin@1234';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { role: 'ADMIN', password: hashedPassword },
        create: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log('Admin user created/updated:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role:     ${user.role}`);
    console.log(`  ID:       ${user.id}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
