/**
 * Script to delete ALL users and devices from Pusher Beams
 * Run this to start completely fresh
 * 
 * Usage: node clear-all-pusher-users.js
 */

const PushNotifications = require('@pusher/push-notifications-server');

const beamsClient = new PushNotifications({
  instanceId: 'a99bec59-b4a1-4182-bac9-c44b18e91162',
  secretKey: '09D06C51222B176EBA5A4E8C949B1E10AAEE5CD59C11ED2E5B401B97F84E76E8',
});

async function clearAllUsers() {
  console.log('🧹 Clearing all users from Pusher Beams...');
  console.log('Instance ID:', 'a99bec59-b4a1-4182-bac9-c44b18e91162');
  console.log('');

  try {
    // Note: Pusher Beams doesn't have a "delete all" API
    // You need to delete users individually
    
    // Option 1: If you have a list of user IDs
    const userIds = [
      'd9e01a44-366e-4275-abde-227a550145f4',
      // Add all your user IDs here
    ];

    console.log(`Found ${userIds.length} users to delete`);

    for (const userId of userIds) {
      try {
        await beamsClient.deleteUser(userId);
        console.log(`✅ Deleted user: ${userId}`);
      } catch (error) {
        if (error.message.includes('not found')) {
          console.log(`⚠️  User not found: ${userId} (already deleted)`);
        } else {
          console.error(`❌ Failed to delete ${userId}:`, error.message);
        }
      }
    }

    console.log('');
    console.log('✅ All users cleared!');
    console.log('🎉 You can now start fresh with the new instance');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
clearAllUsers();

