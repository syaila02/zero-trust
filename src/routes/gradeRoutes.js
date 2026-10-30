const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const zeroTrustPEP = require('../pep/enforcementMiddleware');

/**
 * Seluruh endpoint nilai akademik diproteksi oleh PEP (Policy Enforcement Point).
 * Parameter 'GRADES_MANAGEMENT' mendefinisikan target resource clearance pada PDP.
 */
router.use(zeroTrustPEP('GRADES_MANAGEMENT'));

// Mengambil nilai per mata kuliah (Menerapkan Object-Level Authorization di Controller)
router.get('/courses/:courseId', gradeController.getCourseGrades);

// Memperbarui nilai mahasiswa dalam mata kuliah (Menerapkan Object-Level Authorization di Controller)
router.put('/courses/:courseId/students/:studentId', gradeController.updateStudentGrade);

module.exports = router;
