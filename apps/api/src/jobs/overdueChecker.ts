import cron from 'node-cron';
import { prisma } from '../config/prisma';

export const startOverdueChecker = (): void => {
  // Runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await prisma.task.updateMany({
        where: {
          dueDate: { lt: new Date() },
          isOverdue: false,
          status: { not: 'DONE' },
        },
        data: { isOverdue: true },
      });

      if (result.count > 0) {
        console.log(`⏰ Overdue checker: flagged ${result.count} task(s) as overdue`);
      }
    } catch (err) {
      console.error('❌ Overdue checker error:', err);
    }
  });

  console.log('⏰ Overdue checker started (runs every 15 minutes)');
};
