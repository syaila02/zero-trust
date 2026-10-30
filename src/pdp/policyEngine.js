/**
 * POLICY DECISION POINT (PDP) - Policy Engine
 * Berdasarkan NIST SP 800-207 Section 3.3 (Trust Algorithm)
 * 
 * PDP bertugas menerima permintaan akses dari PEP (Policy Enforcement Point),
 * mengevaluasi kredensial subjek bersama atribut kontekstual lingkungan,
 * dan menghasilkan keputusan biner: ALLOW atau DENY.
 */

class PolicyDecisionPoint {
  /**
   * Menghitung Trust Score dan mengevaluasi kebijakan dinamis
   * @param {Object} params
   * @param {Object} params.subject - Informasi user dari token (id, role, username)
   * @param {string} params.resource - Resource yang diakses (misal: 'GRADES_VIEW', 'GRADES_UPDATE')
   * @param {string} params.action - Aksi HTTP ('READ' | 'WRITE')
   * @param {Object} params.context - Atribut kontekstual (device_status, network_zone, client_ip)
   */
  evaluateAccess({ subject, resource, action, context }) {
    const { deviceStatus, networkZone } = context;
    let trustScore = 100;
    const violations = [];

    // 1. Evaluasi Atribut Subjek (Role Clearance)
    if (subject.role !== 'DOSEN' && resource.startsWith('GRADES_')) {
      violations.push("Subject Clearance Violation: Hanya role 'DOSEN' yang berhak mengelola nilai akademik.");
      trustScore -= 50;
    }

    // 2. Evaluasi Postur Perangkat (Device Posture Context)
    // Standar NIST SP 800-207: Continuous Diagnostics and Mitigation (CDM)
    if (deviceStatus !== 'managed') {
      violations.push("Device Trust Violation: Perangkat berstatus 'unmanaged' (tidak terdaftar di MDM/Endpoint Compliance). Akses data nilai ditolak.");
      trustScore -= 40;
    }

    // 3. Evaluasi Lingkungan Jaringan & Sensitivitas Aksi (Network Context & Action Sensitivity)
    // Modifikasi data nilai (WRITE) memiliki ambang batas risiko lebih ketat (High Risk Action)
    if (action === 'WRITE' && networkZone !== 'campus') {
      violations.push("Network Context Violation: Modifikasi nilai mahasiswa hanya diizinkan dari jaringan terpercaya ('campus' / Intranet Terenkripsi).");
      trustScore -= 30;
    }

    // Ambang Batas Minimal Trust Score untuk mengizinkan akses (Trust Threshold = 80)
    const TRUST_THRESHOLD = 80;
    const isAllowed = violations.length === 0 && trustScore >= TRUST_THRESHOLD;

    return {
      decision: isAllowed ? 'ALLOW' : 'DENY',
      trustScore: Math.max(0, trustScore),
      violations,
      reason: isAllowed
        ? "Access Granted: Trust Algorithm satisfied all contextual and subject requirements."
        : violations.join(" | "),
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = new PolicyDecisionPoint();
