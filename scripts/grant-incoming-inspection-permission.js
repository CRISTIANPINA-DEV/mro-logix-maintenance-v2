// Script to grant incoming inspection permissions to a user
// This solves the "Permission denied" error when creating incoming inspections

const { PrismaClient } = require('@prisma/client');

async function grantIncomingInspectionPermission() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking user permissions for incoming inspections...');
    
    // Get all users and their permissions
    const users = await prisma.user.findMany({
      include: {
        permissions: true
      }
    });
    
    console.log(`Found ${users.length} users in the system.`);
    
    for (const user of users) {
      console.log(`\nUser: ${user.firstName} ${user.lastName} (${user.email})`);
      
      if (user.permissions && user.permissions.length > 0) {
        const permission = user.permissions[0];
        console.log(`  Current canAddIncomingInspections: ${permission.canAddIncomingInspections}`);
        
        if (!permission.canAddIncomingInspections) {
          console.log(`  Granting canAddIncomingInspections permission...`);
          
          await prisma.userPermission.update({
            where: { id: permission.id },
            data: {
              canAddIncomingInspections: true,
              canViewIncomingInspections: true, // Also ensure they can view
            }
          });
          
          console.log(`  ✅ Permission granted!`);
        } else {
          console.log(`  ✅ Already has permission`);
        }
      } else {
        console.log(`  Creating new permission record...`);
        
        await prisma.userPermission.create({
          data: {
            userId: user.id,
            canViewFlightRecords: true,
            canAddFlightRecords: true,
            canExportFlightRecords: true,
            canEditFlightRecords: true,
            canExportPdfFlightRecords: true,
            canDeleteFlightRecords: true,
            canViewStockInventory: true,
            canGenerateStockReport: true,
            canAddStockItem: true,
            canGenerateStockPdf: true,
            canDeleteStockRecord: true,
            canViewIncomingInspections: true,
            canAddIncomingInspections: true, // Grant the permission
            canDeleteIncomingInspections: true,
            canConfigureTemperatureRanges: true,
            canAddTemperatureRecord: true,
            canDeleteTemperatureRecord: true,
            canSeeAuditManagement: true,
          }
        });
        
        console.log(`  ✅ Full permissions created!`);
      }
    }
    
    console.log('\n🎉 Permission update complete!');
    console.log('Users should now be able to create incoming inspections.');
    
  } catch (error) {
    console.error('Error updating permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
grantIncomingInspectionPermission();