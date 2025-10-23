import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.bankingDetails.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuários de exemplo
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        address: 'Rua das Flores, 123, São Paulo, SP',
        profilePicture: 'https://via.placeholder.com/150/0000FF/808080?text=JS',
        bankingDetails: {
          create: {
            bankCode: '001',
            agencyNumber: '1234',
            accountNumber: '567890',
            accountType: 'checking',
          },
        },
      },
      include: {
        bankingDetails: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        address: 'Av. Paulista, 456, São Paulo, SP',
        profilePicture: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=MS',
        bankingDetails: {
          create: {
            bankCode: '237',
            agencyNumber: '5678',
            accountNumber: '123456',
            accountType: 'savings',
          },
        },
      },
      include: {
        bankingDetails: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        address: 'Rua Augusta, 789, São Paulo, SP',
        bankingDetails: {
          create: {
            bankCode: '341',
            agencyNumber: '9012',
            accountNumber: '345678',
            accountType: 'checking',
          },
        },
      },
      include: {
        bankingDetails: true,
      },
    }),
  ]);

  console.log('✅ Seed concluído com sucesso!');
  console.log(`📊 Criados ${users.length} usuários:`);
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`);
  });
}

main()
  .catch(e => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });