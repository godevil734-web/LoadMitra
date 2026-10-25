import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

async function runAdminVerification() {
  console.log('===========================================================');
  console.log('   RouteWise Phase 2: Admin Dashboard Integration Tests    ');
  console.log('===========================================================');
  console.log(`Target Backend: ${BASE_URL}\n`);

  let authToken = null;
  let testLeadId = null;

  try {
    // 1. Verify Unauthenticated Protection (Requirement 10)
    console.log('[Test 1] Testing unauthenticated access protection...');
    const unauthRes = await fetch(`${BASE_URL}/api/admin/stats`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('✓ Pass: Unauthenticated access properly rejected (401 Unauthorized).\n');

    // 2. Verify Authentication Rejection on Bad Credentials (Requirement 10)
    console.log('[Test 2] Testing authentication rejection with invalid credentials...');
    const badLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong-password-xyz' }),
    });
    if (badLoginRes.status !== 401) {
      throw new Error(`Expected 401 for invalid password, got ${badLoginRes.status}`);
    }
    console.log('✓ Pass: Invalid credentials properly rejected (401 Unauthorized).\n');

    // 3. Verify Successful Admin Login & Token Generation (Requirement 10)
    console.log('[Test 3] Testing valid admin login...');
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'routewise-admin-2026';

    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPass }),
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      throw new Error('Login response missing token or success flag');
    }
    authToken = loginData.token;
    console.log(`✓ Pass: Admin authenticated successfully. Issued signed token.\n`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    // 4. Verify Summary Metrics from MongoDB (Requirement 2)
    console.log('[Test 4] Testing real summary metrics aggregation (/api/admin/stats)...');
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, { headers: authHeaders });
    if (statsRes.status !== 200) {
      throw new Error(`Stats endpoint failed with status ${statsRes.status}`);
    }
    const statsData = await statsRes.json();
    console.log('✓ Pass: Metrics retrieved from MongoDB Atlas:');
    console.log(`  - Total Registrations: ${statsData.stats.totalRegistrations}`);
    console.log(`  - Shippers: ${statsData.stats.shippersCount}`);
    console.log(`  - Transporters: ${statsData.stats.transportersCount}`);
    console.log(`  - Status Breakdown:`, statsData.stats.byStatus, '\n');

    // 5. Verify Pagination & Registrations Table Feed (Requirement 3 & 5)
    console.log('[Test 5] Testing paginated registrations listing (/api/admin/registrations)...');
    const listRes = await fetch(`${BASE_URL}/api/admin/registrations?page=1&limit=2`, {
      headers: authHeaders,
    });
    if (listRes.status !== 200) {
      throw new Error(`List endpoint failed with status ${listRes.status}`);
    }
    const listData = await listRes.json();
    if (!listData.pagination || !Array.isArray(listData.data)) {
      throw new Error('Malformed pagination or data array in registrations response');
    }
    console.log(`✓ Pass: Paginated query returned page ${listData.pagination.page} of ${listData.pagination.totalPages} (Total: ${listData.pagination.totalCount} records).\n`);

    if (listData.data.length > 0) {
      testLeadId = listData.data[0].id;
    }

    // 6. Verify Filtering by Role, Status, and Search (Requirement 4)
    console.log('[Test 6] Testing filtering & search query params...');
    const filterRes = await fetch(
      `${BASE_URL}/api/admin/registrations?role=SHIPPER&status=ALL&search=Gorakhpur`,
      { headers: authHeaders }
    );
    if (filterRes.status !== 200) {
      throw new Error(`Filter request failed with status ${filterRes.status}`);
    }
    const filterData = await filterRes.json();
    console.log(`✓ Pass: Filter by role=SHIPPER & search='Gorakhpur' matched ${filterData.data.length} records.\n`);

    // 7. Verify Registration Details View by ID (Requirement 6)
    if (testLeadId) {
      console.log(`[Test 7] Testing registration details view (/api/admin/registrations/${testLeadId})...`);
      const detailRes = await fetch(`${BASE_URL}/api/admin/registrations/${testLeadId}`, {
        headers: authHeaders,
      });
      if (detailRes.status !== 200) {
        throw new Error(`Detail view failed with status ${detailRes.status}`);
      }
      const detailData = await detailRes.json();
      console.log(`✓ Pass: Retrieved full details for lead: ${detailData.data.contactName} (${detailData.data.role} on ${detailData.data.route}).\n`);

      // 8. Verify Status Update & Admin Notes (Requirement 7 & 8)
      console.log(`[Test 8] Testing status update endpoint (/api/admin/registrations/${testLeadId}/status)...`);
      const updateRes = await fetch(`${BASE_URL}/api/admin/registrations/${testLeadId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'CONTACTED',
          adminNotes: 'Automated Phase 2 Verification: Coordinator reached out to confirm return vehicle availability.',
        }),
      });
      if (updateRes.status !== 200) {
        throw new Error(`Status update failed with status ${updateRes.status}`);
      }
      const updateData = await updateRes.json();
      if (updateData.data.status !== 'CONTACTED') {
        throw new Error(`Expected status CONTACTED, got ${updateData.data.status}`);
      }
      console.log(`✓ Pass: Updated status to: ${updateData.data.status}`);
      console.log(`  Notes: "${updateData.data.adminNotes}"\n`);
    }

    // 9. Verify Invalid Status Validation
    console.log('[Test 9] Testing input validation on status update (invalid status string)...');
    if (testLeadId) {
      const invalidStatusRes = await fetch(`${BASE_URL}/api/admin/registrations/${testLeadId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'INVALID_STATUS_CODE' }),
      });
      if (invalidStatusRes.status !== 400) {
        throw new Error(`Expected 400 Bad Request for invalid status, got ${invalidStatusRes.status}`);
      }
      console.log('✓ Pass: Invalid status rejected with 400 Bad Request.\n');
    }

    // 10. Verify Public Registration Pipeline is Fully Preserved (Requirement 11)
    console.log('[Test 10] Testing public registration flow is preserved and reflected in admin stats...');
    const publicShipperRes = await fetch(`${BASE_URL}/api/pilot/shipper-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'SHIPPER',
        contactName: 'Anil Gupta Phase2 Test',
        businessName: 'Gupta Steel Traders',
        phone: '9822334455',
        email: 'anil@guptasteel.local',
        primaryRoute: 'Lucknow to Kanpur',
        cargoCategory: 'Industrial Goods',
        shipmentFrequency: 'Weekly',
        consentGranted: true,
      }),
    });
    if (publicShipperRes.status !== 201) {
      throw new Error(`Public registration failed with status ${publicShipperRes.status}`);
    }
    const publicData = await publicShipperRes.json();
    console.log(`✓ Pass: Public registration submitted successfully (ID: ${publicData.data.id}).`);

    // Verify it appears in admin list
    const checkAdminRes = await fetch(`${BASE_URL}/api/admin/registrations?search=Anil%20Gupta`, {
      headers: authHeaders,
    });
    const checkAdminData = await checkAdminRes.json();
    const foundInAdmin = checkAdminData.data.some((d) => d.id === publicData.data.id);
    if (!foundInAdmin) {
      throw new Error('New registration was not immediately accessible in admin listing');
    }
    console.log(`✓ Pass: Newly submitted lead immediately verified in Admin Dashboard query.\n`);

    // 11. Verify Add Admin Account (POST /api/admin/users)
    console.log('[Test 11] Testing creation of a new administrator account...');
    const testAdminUsername = `ops_lead_${Date.now()}`;
    const testAdminPassword = 'TempAdminPassword123!';
    const createAdminRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        username: testAdminUsername,
        password: testAdminPassword,
        name: 'Regional Operations Manager',
        role: 'ADMIN',
      }),
    });
    if (createAdminRes.status !== 201) {
      throw new Error(`Failed to create admin account, status ${createAdminRes.status}`);
    }
    const createAdminData = await createAdminRes.json();
    const createdAdminId = createAdminData.data.id;
    console.log(`✓ Pass: Admin account created for "${testAdminUsername}" (ID: ${createdAdminId}).\n`);

    // 12. Verify List Admin Accounts (GET /api/admin/users)
    console.log('[Test 12] Testing admin team listing...');
    const listAdminsRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders });
    if (listAdminsRes.status !== 200) {
      throw new Error(`Failed to list admin users, status ${listAdminsRes.status}`);
    }
    const listAdminsData = await listAdminsRes.json();
    const adminFound = listAdminsData.data.some((u) => u.username === testAdminUsername);
    if (!adminFound) {
      throw new Error('Created admin user not found in team list');
    }
    console.log(`✓ Pass: Team list contains ${listAdminsData.data.length} administrators, verified new user.\n`);

    // 13. Verify Authentication with the New Admin Account
    console.log('[Test 13] Testing login with newly created administrator credentials...');
    const newAdminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testAdminUsername, password: testAdminPassword }),
    });
    if (newAdminLoginRes.status !== 200) {
      throw new Error(`Login with new admin account failed, status ${newAdminLoginRes.status}`);
    }
    const newAdminLoginData = await newAdminLoginRes.json();
    if (!newAdminLoginData.token) {
      throw new Error('No token returned for newly created admin');
    }
    console.log(`✓ Pass: Newly created admin logged in successfully with valid role (${newAdminLoginData.user.role}).\n`);

    // 14. Verify Admin Status Toggle and Cleanup
    console.log('[Test 14] Testing admin account deactivation and cleanup...');
    const toggleRes = await fetch(`${BASE_URL}/api/admin/users/${createdAdminId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isActive: false }),
    });
    if (toggleRes.status !== 200) {
      throw new Error(`Failed to update admin status, status ${toggleRes.status}`);
    }
    console.log('✓ Pass: Admin account successfully deactivated.');

    const deleteRes = await fetch(`${BASE_URL}/api/admin/users/${createdAdminId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (deleteRes.status !== 200) {
      throw new Error(`Failed to delete admin account, status ${deleteRes.status}`);
    }
    console.log('✓ Pass: Admin account successfully cleaned up.\n');

    console.log('===========================================================');
    console.log('   ALL 14 PHASE 2 & ADMIN TEAM MANAGEMENT TESTS PASSED    ');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Admin Verification Test Failed:', error.message);
    process.exit(1);
  }
}

runAdminVerification();

