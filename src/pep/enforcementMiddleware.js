const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const policyEngine = require('../pdp/policyEngine');

/**
 * POLICY ENFORCEMENT POINT (PEP) - Gatekeeper Middleware
 * Berdasarkan NIST SP 800-207 (Data Plane Gatekeeper)
 * 
 * Bertugas mencegat (intercept) setiap paket/request yang masuk,
 * memverifikasi Short-Lived Token secara eksplisit, mengekstrak konteks,
 * dan meneruskan keputusan akhir dari PDP ke klien.
 */
function zeroTrustPEP(resourceType) {
  return (req, res, next) => {
    console.log(`\n[PEP-INSPECTION] Intercepting request to: ${req.method} ${req.originalUrl}`);

    // LANGKAH 1: Explicit Identity Verification (Short-Lived Token Check)
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'DENY',
        pepDecision: 'BLOCKED_AT_PEP',
        error: 'Authentication Required',
        message: 'Akses ditolak oleh PEP: Header Authorization Bearer Token tidak ditemukan.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decodedUser;

    try {
      // Verifikasi integritas kriptografis dan masa berlaku Short-Lived Token
      decodedUser = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        status: 'DENY',
        pepDecision: 'BLOCKED_AT_PEP',
        error: isExpired ? 'Token Expired' : 'Invalid Token',
        message: isExpired
          ? 'Short-Lived Token telah kedaluwarsa. Silakan otentikasi ulang sesuai prinsip Zero Trust.'
          : 'Token kriptografi tidak valid atau telah dirusak (tampered).'
      });
    }

    // LANGKAH 2: Ekstraksi Atribut Kontekstual Lingkungan (Observable Signals)
    // Dalam implementasi produksi, parameter ini didapat dari MDM, mTLS, atau EDR agent.
    // Untuk simulasi pengujian Postman, dibaca via custom headers.
    const context = {
      deviceStatus: (req.headers['x-device-status'] || 'unmanaged').toLowerCase(),
      networkZone: (req.headers['x-network-zone'] || 'public').toLowerCase(),
      clientIp: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    const action = req.method === 'GET' ? 'READ' : 'WRITE';

    console.log(`[PEP-CONTEXT] Subject: ${decodedUser.username} (${decodedUser.role})`);
    console.log(`[PEP-CONTEXT] Device Status: ${context.deviceStatus} | Network: ${context.networkZone}`);

    // LANGKAH 3: Delegasi Evaluasi ke Policy Decision Point (PDP)
    const evaluation = policyEngine.evaluateAccess({
      subject: decodedUser,
      resource: resourceType,
      action: action,
      context: context
    });

    console.log(`[PEP-PDP-DECISION] Verdict: ${evaluation.decision} | Trust Score: ${evaluation.trustScore}/100`);

    // LANGKAH 4: Enforcement (Penegakan Keputusan Kebijakan)
    if (evaluation.decision !== 'ALLOW') {
      return res.status(403).json({
        status: 'DENY',
        pepDecision: 'ENFORCED_BLOCK',
        trustScore: evaluation.trustScore,
        violations: evaluation.violations,
        message: `Akses diblokir oleh Zero Trust PDP Engine: ${evaluation.reason}`
      });
    }

    // Keputusan ALLOW: Lampirkan identitas terverifikasi & konteks ke request object
    req.user = decodedUser;
    req.securityContext = {
      ...context,
      trustScore: evaluation.trustScore,
      verifiedAt: evaluation.evaluatedAt
    };

    next();
  };
}

module.exports = zeroTrustPEP;
