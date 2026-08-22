/**
 * Seed Government Officer into Firebase Auth + Firestore
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = resolve(process.cwd(), '..', 'artifacts', 'api-server', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const OFFICERS = [
  {
    email: 'admin@waterboard.gov.lk',
    password: 'admin123',
    name: 'System Administrator',
    badgeNumber: 'NWSDB-ADM-001',
    department: 'Information Technology',
    role: 'SUPER_ADMIN',
    phone: '+94111234567',
  },
  {
    email: 'somarathna.kp@waterboard.gov.lk',
    password: 'gov@water2026',
    name: 'K.P. Somarathna',
    badgeNumber: 'NWSDB-OFF-002',
    department: 'Water Distribution',
    role: 'OFFICER',
    phone: '+94771234567',
  },
  {
    email: 'wickrama.ar@waterboard.gov.lk',
    password: 'supervisor123',
    name: 'A.R. Wickramasinghe',
    badgeNumber: 'NWSDB-SUP-003',
    department: 'Regional Operations',
    role: 'SUPERVISOR',
    phone: '+94761234567',
  },
];

async function main() {
  console.log('Seeding government officers...\n');

  for (const officer of OFFICERS) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(officer.email);
        console.log(`  Auth user already exists: ${officer.email} (${userRecord.uid})`);
      } catch {
        userRecord = await auth.createUser({
          email: officer.email,
          password: officer.password,
          displayName: officer.name,
          emailVerified: true,
        });
        console.log(`  Created auth user: ${officer.email} (${userRecord.uid})`);
      }

      await db.collection('governmentOfficers').doc(userRecord.uid).set({
        uid: userRecord.uid,
        name: officer.name,
        email: officer.email,
        badgeNumber: officer.badgeNumber,
        department: officer.department,
        role: officer.role,
        phone: officer.phone,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  Created officer profile: ${officer.name} (${officer.role})`);
      console.log(`  Email: ${officer.email}`);
      console.log(`  Password: ${officer.password}\n`);
    } catch (err: any) {
      console.error(`  Failed for ${officer.email}:`, err.message);
    }
  }

  console.log('Done! Officers can now log in at the web portal.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
