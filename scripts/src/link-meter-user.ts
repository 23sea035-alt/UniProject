import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = resolve(process.cwd(), '..', 'artifacts', 'api-server', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const METER_ID = 'WM-2024-COL-0042';

async function main() {
  // Find user with meterId matching the ESP32 meter
  const usersSnap = await db.collection('users').where('role', '==', 'user').limit(10).get();
  console.log(`Found ${usersSnap.size} user(s)\n`);

  const meterSnap = await db.collection('meters').doc(METER_ID).get();
  if (!meterSnap.exists) {
    console.error(`Meter ${METER_ID} not found`);
    process.exit(1);
  }
  const meterData = meterSnap.data()!;
  console.log(`Meter userId: ${meterData.userId}`);

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    console.log(`\nUser ${userDoc.id}: meterId=${userData.meterId}, role=${userData.role}`);

    // Link this user to the ESP32 meter
    await db.collection('users').doc(userDoc.id).update({
      meterId: METER_ID,
      updatedAt: new Date(),
    });
    console.log(`  -> Updated user meterId to ${METER_ID}`);

    // Link meter to user
    await db.collection('meters').doc(METER_ID).update({
      userId: userDoc.id,
      updatedAt: new Date(),
    });
    console.log(`  -> Updated meter userId to ${userDoc.id}`);
  }

  console.log('\nDone!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
