const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const crypto = require('crypto');

async function createAdmin() {
    const usersFile = 'users.json';
    const adminUser = {
        id: crypto.randomUUID(),
        username: 'Ntando',
        email: 'admin@ntando.app',
        password: await bcrypt.hash('Ntando', 12),
        domainExtension: '.app',
        subdomain: 'admin-ntando-app',
        isPremium: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        sites: [],
        security: {
            loginAttempts: 0,
            lockedUntil: null,
            twoFactorEnabled: false
        }
    };

    try {
        // Read existing users
        let users = {};
        try {
            const usersData = await fs.readFile(usersFile, 'utf8');
            users = JSON.parse(usersData);
        } catch (error) {
            // File doesn't exist or is empty
        }

        // Add admin user
        users[adminUser.id] = adminUser;
        await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
        
        // Create user directory
        const usersDir = 'users';
        const userDir = `${usersDir}/${adminUser.subdomain}`;
        await fs.mkdir(userDir, { recursive: true });

        console.log('✅ Admin user created successfully!');
        console.log(`📝 Username: ${adminUser.username}`);
        console.log(`🔑 Password: Ntando`);
        console.log(`🌐 Subdomain: ${adminUser.subdomain}`);
        console.log(`🎯 Dashboard: https://3000-4d1fdc03-5c2a-4b61-a022-6e331ade4689.sandbox-service.public.prod.myninja.ai/dashboard`);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
}

createAdmin();