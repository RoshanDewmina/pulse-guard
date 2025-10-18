import { prisma } from './index';

/**
 * Migration script to mark existing users as having completed onboarding
 * Run this after adding the onboardingCompleted field to ensure existing users
 * who already have organizations are not forced through onboarding again
 */
async function migrateExistingUsers() {
  try {
    console.log('🔄 Starting migration for existing users...');

    // Get all users who have organization memberships
    const usersWithOrgs = await prisma.user.findMany({
      where: {
        Membership: {
          some: {},
        },
        onboardingCompleted: false,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (usersWithOrgs.length === 0) {
      console.log('✅ No users need migration - all existing users already marked as onboarded');
      return;
    }

    console.log(`📊 Found ${usersWithOrgs.length} users with organizations to migrate`);

    // Update all these users to mark onboarding as completed
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: usersWithOrgs.map((u) => u.id),
        },
      },
      data: {
        onboardingCompleted: true,
      },
    });

    console.log(`✅ Successfully migrated ${result.count} users`);
    console.log('📝 Updated users:');
    usersWithOrgs.forEach((u) => console.log(`   - ${u.email}`));
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingUsers()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });


