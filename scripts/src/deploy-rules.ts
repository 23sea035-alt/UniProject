import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = resolve(process.cwd(), '..', 'artifacts', 'api-server', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const PROJECT_ID = serviceAccount.project_id;

async function main() {
  const cert = admin.credential.cert(serviceAccount);
  const token = await cert.getAccessToken();
  const accessToken = token.access_token;
  const rulesPath = resolve(process.cwd(), '..', 'artifacts', 'web application', 'firestore.rules');
  const rulesContent = readFileSync(rulesPath, 'utf-8');

  // Step 1: Create new ruleset
  console.log('Step 1: Creating new ruleset...');
  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          files: [{
            name: 'firestore.rules',
            content: rulesContent,
          }],
        },
      }),
    }
  );
  const createData = await createRes.json();
  if (!createRes.ok) {
    console.error('Failed to create ruleset:', JSON.stringify(createData, null, 2));
    process.exit(1);
  }
  const newRulesetName = createData.name;
  console.log(`  Created: ${newRulesetName}`);

  // Step 2: Update release to point to new ruleset
  console.log('\nStep 2: Updating release to use new ruleset...');
  const updateRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore?updateMask=rulesetName`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        release: {
          name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
          rulesetName: newRulesetName,
        },
      }),
    }
  );
  const updateData = await updateRes.json();
  if (!updateRes.ok) {
    console.error('Failed to update release:', JSON.stringify(updateData, null, 2));
    process.exit(1);
  }
  console.log(`  Updated: ${updateData.name}`);
  console.log(`  Ruleset: ${updateData.rulesetName}`);
  console.log(`  Updated at: ${updateData.updateTime}`);

  console.log('\n✅ Firestore security rules deployed successfully!');
  console.log('   The web app can now read Firestore data.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
