import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed do banco de dados de transações...');

  await prisma.transaction.deleteMany();

  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        fromUserId: '123e4567-e89b-12d3-a456-426614174000',
        toUserId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 150.75,
        description: 'Transferência para João Silva',
        status: 'COMPLETED',
        type: 'TRANSFER',
        externalReference: 'ext-ref-001',
        processedAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        fromUserId: '123e4567-e89b-12d3-a456-426614174001',
        toUserId: '123e4567-e89b-12d3-a456-426614174002',
        amount: 89.50,
        description: 'Pagamento de serviços',
        status: 'PENDING',
        type: 'TRANSFER',
        externalReference: 'ext-ref-002',
      },
    }),
    prisma.transaction.create({
      data: {
        fromUserId: '123e4567-e89b-12d3-a456-426614174002',
        toUserId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 250.00,
        description: 'Reembolso',
        status: 'PROCESSING',
        type: 'TRANSFER',
        externalReference: 'ext-ref-003',
      },
    }),
  ]);

  console.log('✅ Seed concluído com sucesso!');
  console.log(`📊 Criadas ${transactions.length} transações:`);
  transactions.forEach(transaction => {
    console.log(`  - ${transaction.description} (${transaction.status}) - R$ ${transaction.amount}`);
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