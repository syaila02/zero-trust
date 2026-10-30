const { courses, grades } = require('../data/db');

/**
 * Controller Manajemen Nilai Akademik
 * Menerapkan OBJECT-LEVEL AUTHORIZATION untuk mencegah kerentanan IDOR
 * (Insecure Direct Object Reference / Broken Object Level Authorization)
 */

/**
 * Mengambil daftar nilai mahasiswa per kelas/mata kuliah
 * Route: GET /api/grades/courses/:courseId
 */
function getCourseGrades(req, res) {
  const { courseId } = req.params;
  const user = req.user; // Diisi oleh PEP middleware setelah otentikasi & PDP lolos

  console.log(`\n[OBJECT-AUTH-CHECK] Subjek ${user.username} (${user.id}) mengakses Mata Kuliah: ${courseId}`);

  // 1. Verifikasi keberadaan objek Course
  const course = courses.find(c => c.id.toUpperCase() === courseId.toUpperCase());
  if (!course) {
    return res.status(404).json({
      status: 'NOT_FOUND',
      message: `Mata kuliah dengan ID ${courseId} tidak ditemukan dalam sistem.`
    });
  }

  // 2. OBJECT-LEVEL AUTHORIZATION CHECK (Mencegah IDOR)
  // Periksa apakah ID Dosen yang terautentikasi adalah dosen pengampu kelas ini
  const isAssigned = user.assignedCourses && user.assignedCourses.includes(course.id);
  if (!isAssigned) {
    console.warn(`[IDOR-ALERT] Dosen ${user.id} mencoba mengakses nilai mata kuliah ${course.id} yang bukan miliknya!`);
    
    return res.status(403).json({
      status: 'DENY',
      securityCheck: 'OBJECT_LEVEL_AUTHORIZATION_FAILED',
      violationType: 'IDOR_PREVENTED',
      message: `Otorisasi Level Objek Gagal: Dosen [${user.name}] (${user.id}) tidak memiliki hak otoritas atas mata kuliah [${course.name}] (${course.id}).`,
      details: {
        requestedResource: course.id,
        userAuthorizedResources: user.assignedCourses
      }
    });
  }

  // Jika otorisasi level objek lolos, ambil data spesifik objek tersebut
  const courseGrades = grades.filter(g => g.courseId === course.id);

  return res.json({
    status: 'ALLOW',
    securityCheck: 'OBJECT_LEVEL_AUTHORIZATION_PASSED',
    message: `Data nilai mata kuliah ${course.name} berhasil diambil.`,
    data: {
      course: {
        id: course.id,
        name: course.name,
        lecturerId: course.lecturerId
      },
      grades: courseGrades
    },
    auditContext: req.securityContext
  });
}

/**
 * Mengubah nilai mahasiswa dalam kelas
 * Route: PUT /api/grades/courses/:courseId/students/:studentId
 */
function updateStudentGrade(req, res) {
  const { courseId, studentId } = req.params;
  const { midtermScore, finalScore } = req.body;
  const user = req.user;

  console.log(`\n[OBJECT-AUTH-CHECK] Dosen ${user.id} mengubah nilai mahasiswa ${studentId} pada mata kuliah: ${courseId}`);

  // 1. Object-Level Check: Apakah dosen mengampu course ini?
  const isAssigned = user.assignedCourses && user.assignedCourses.includes(courseId.toUpperCase());
  if (!isAssigned) {
    return res.status(403).json({
      status: 'DENY',
      securityCheck: 'OBJECT_LEVEL_AUTHORIZATION_FAILED',
      violationType: 'IDOR_PREVENTED',
      message: `Akses ditolak: Dosen ${user.id} tidak berhak mengubah nilai pada mata kuliah ${courseId}.`
    });
  }

  // 2. Object-Level Check: Apakah record nilai untuk mahasiswa tersebut ada di kelas ini?
  const targetGrade = grades.find(
    g => g.courseId === courseId.toUpperCase() && g.studentId.toUpperCase() === studentId.toUpperCase()
  );

  if (!targetGrade) {
    return res.status(404).json({
      status: 'NOT_FOUND',
      message: `Record nilai untuk mahasiswa ${studentId} pada mata kuliah ${courseId} tidak ditemukan.`
    });
  }

  // Lakukan pembaruan nilai
  if (midtermScore !== undefined) targetGrade.midtermScore = Number(midtermScore);
  if (finalScore !== undefined) targetGrade.finalScore = Number(finalScore);

  const average = ((targetGrade.midtermScore || 0) + (targetGrade.finalScore || 0)) / 2;
  targetGrade.letterGrade = average >= 85 ? 'A' : average >= 75 ? 'B' : average >= 65 ? 'C' : 'D';

  return res.json({
    status: 'ALLOW',
    message: `Nilai mahasiswa ${targetGrade.studentName} (${studentId}) berhasil diperbarui.`,
    updatedGrade: targetGrade,
    auditContext: req.securityContext
  });
}

module.exports = {
  getCourseGrades,
  updateStudentGrade
};
