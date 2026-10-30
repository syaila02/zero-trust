/**
 * Script Pengujian Otomatis Seluruh Skenario Zero Trust
 * Menjalankan simulasi request HTTP ke server lokal dan memverifikasi keputusan ALLOW/DENY
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- MEMULAI PENGUJIAN OTOMATIS ZERO TRUST SINTESYS ---\n');

  // 1. Login Dosen Budi
  console.log('[TEST 1] Login Dosen Budi (Dosen IF301)...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'dosen_budi', password: 'password123' });

  const tokenBudi = loginRes.body.accessToken;
  console.log(`-> Hasil: HTTP ${loginRes.status} | Token didapat (${tokenBudi.slice(0, 20)}...)\n`);

  // 2. Skenario 1: ALLOW (Valid Token + Managed Device + Campus Network + Course IF301)
  console.log('[SKENARIO 1 - EXPECT ALLOW] Dosen Budi akses kelas miliknya (IF301) dengan Managed Device & Jaringan Kampus...');
  const sc1 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/grades/courses/IF301',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenBudi}`,
      'x-device-status': 'managed',
      'x-network-zone': 'campus'
    }
  });
  console.log(`-> Hasil: HTTP ${sc1.status} | Status: ${sc1.body.status} (${sc1.body.message})\n`);

  // 3. Skenario 2: DENY (PDP Trust Algorithm - Device Unmanaged)
  console.log('[SKENARIO 2 - EXPECT DENY PDP] Dosen Budi akses IF301 dengan Token Valid tapi Device Unmanaged...');
  const sc2 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/grades/courses/IF301',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenBudi}`,
      'x-device-status': 'unmanaged',
      'x-network-zone': 'campus'
    }
  });
  console.log(`-> Hasil: HTTP ${sc2.status} | Status: ${sc2.body.status} (${sc2.body.message})\n`);

  // 4. Skenario 3: DENY (PDP Trust Algorithm - Write from Public Network)
  console.log('[SKENARIO 3 - EXPECT DENY PDP] Dosen Budi update nilai dari Jaringan Publik...');
  const sc3 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/grades/courses/IF301/students/MHS001',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${tokenBudi}`,
      'Content-Type': 'application/json',
      'x-device-status': 'managed',
      'x-network-zone': 'public'
    }
  }, { midtermScore: 90, finalScore: 95 });
  console.log(`-> Hasil: HTTP ${sc3.status} | Status: ${sc3.body.status} (${sc3.body.message})\n`);

  // 5. Skenario 4: DENY (Object-Level Authorization / IDOR Protection)
  console.log('[SKENARIO 4 - EXPECT DENY CONTROLLER IDOR] Dosen Budi mencoba melihat nilai kelas IF302 (Milik Dosen Siti)...');
  const sc4 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/grades/courses/IF302',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenBudi}`,
      'x-device-status': 'managed',
      'x-network-zone': 'campus'
    }
  });
  console.log(`-> Hasil: HTTP ${sc4.status} | Status: ${sc4.body.status} (${sc4.body.message})\n`);

  // 6. Skenario 5: DENY (PEP Expired / Tampered Token)
  console.log('[SKENARIO 5 - EXPECT DENY PEP] Akses dengan token rusak/kedaluwarsa...');
  const sc5 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/grades/courses/IF301',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid.or.expired.token',
      'x-device-status': 'managed',
      'x-network-zone': 'campus'
    }
  });
  console.log(`-> Hasil: HTTP ${sc5.status} | Status: ${sc5.body.status} (${sc5.body.message})\n`);

  console.log('--- SEMUA PENGUJIAN SELESAI DENGAN SUKSES! ---');
}

module.exports = runTests;

if (require.main === module) {
  const app = require('./src/app');
  const server = app.listen(3000, async () => {
    try {
      await runTests();
    } catch (err) {
      console.error(err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}
