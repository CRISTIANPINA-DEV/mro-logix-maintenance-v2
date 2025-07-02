// Database migration script to convert quantity from String to Int
// Run this before applying the Prisma schema changes

const { PrismaClient } = require('@prisma/client');

async function migrateQuantityToInt() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting quantity migration from String to Int...');
    
    // First, fetch all stock inventory records
    const records = await prisma.stockInventory.findMany({
      select: {
        id: true,
        quantity: true,
        partNo: true,
        serialNo: true
      }
    });
    
    console.log(`Found ${records.length} stock inventory records to migrate.`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        // Try to parse the quantity as an integer
        const quantityInt = parseInt(record.quantity) || 0;
        
        // For now, just log what we would update
        // (The actual database update will happen through Prisma migration)
        console.log(`Record ${record.id} (${record.partNo}): "${record.quantity}" -> ${quantityInt}`);
        
        if (isNaN(quantityInt) || quantityInt < 0) {
          console.warn(`Warning: Invalid quantity "${record.quantity}" for record ${record.id}. Setting to 0.`);
        }
        
        successCount++;
      } catch (error) {
        console.error(`Error processing record ${record.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration simulation complete: ${successCount} success, ${errorCount} errors`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the output above for any quantity conversion issues');
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npx prisma generate');
    console.log('4. Test the application with the new quantity system');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateQuantityToInt();