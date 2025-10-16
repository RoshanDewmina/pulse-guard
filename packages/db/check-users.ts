import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
        memberships: {
          include: {
            org: true
          }
        }
      }
    });
    
    console.log('\n📊 Database Status:');
    console.log(`   Total users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Users found:');
      users.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.name || user.email}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log(`      Accounts: ${user.accounts.length} (${user.accounts.map(a => a.provider).join(', ')})`);
        console.log(`      Organizations: ${user.memberships.length}`);
        if (user.memberships.length > 0) {
          user.memberships.forEach(m => {
            console.log(`         - ${m.org.name} (${m.role})`);
          });
        }
      });
    } else {
      console.log('   No users in database ✅');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
