const moment = require('moment');
const userModel = require('./models/userModel'); // Adjust path if necessary

async function cleanupExpiredAccounts() {
    try {
        // Get the current time
        const currentTime = moment().toDate();

        // Find users with expired activation tokens
        const users = await userModel.findUsersWithExpiredActivationTokens(currentTime);

        if (users.length > 0) {
            // Delete users with expired tokens
            await Promise.all(users.map(user => userModel.deleteUser(user.id)));
            console.log(`Deleted ${users.length} users with expired activation tokens.`);
        } else {
            console.log('No expired activation tokens found.');
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Run cleanup function
cleanupExpiredAccounts();
