/**
 * Run this script to see exactly what fields your mobile app saves to Firebase.
 * 
 * Run with: node scripts/check-firebase-structure.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDD0qZHhg8QKaG_2l_dr1pSZQboUOB-YdQ",
  authDomain: "simple-4b447.firebaseapp.com",
  databaseURL: "https://simple-4b447-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "simple-4b447",
  storageBucket: "simple-4b447.firebasestorage.app",
  messagingSenderId: "767295346015",
  appId: "1:767295346015:web:eb4bcebc5c491ba0ddd2ea",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS_TO_CHECK = ['users', 'customers', 'accounts', 'waterUsers', 'registrations', 'members'];

console.log('\n🔍 Scanning your Firebase project: simple-4b447\n');
console.log('='.repeat(60));

for (const collName of COLLECTIONS_TO_CHECK) {
  try {
    const snap = await getDocs(query(collection(db, collName), limit(2)));
    if (!snap.empty) {
      console.log(`\n✅ FOUND COLLECTION: "${collName}" (${snap.size} document(s) fetched)`);
      snap.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`\n  📄 Document ${i + 1} — ID: ${doc.id}`);
        console.log('  Fields:');
        Object.entries(data).forEach(([key, val]) => {
          const display = typeof val === 'object' ? JSON.stringify(val) : val;
          console.log(`    ${key}: ${display}`);
        });
      });
    } else {
      console.log(`  ❌ Collection "${collName}" — empty or not found`);
    }
  } catch (e) {
    console.log(`  ❌ Collection "${collName}" — ${e.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Done! Share the output above so the portal can be fixed.\n');

process.exit(0);
