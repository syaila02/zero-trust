/**
 * Mock Database untuk Sistem Informasi Akademik 'Sintesys'
 */

const users = [
  {
    id: 'DOSEN001',
    username: 'dosen_budi',
    password: 'password123',
    name: 'Dr. Budi Santoso, M.Kom.',
    role: 'DOSEN',
    // Dosen Budi hanya mengampu mata kuliah IF301
    assignedCourses: ['IF301']
  },
  {
    id: 'DOSEN002',
    username: 'dosen_siti',
    password: 'password123',
    name: 'Dr. Siti Aminah, M.T.',
    role: 'DOSEN',
    // Dosen Siti hanya mengampu mata kuliah IF302
    assignedCourses: ['IF302']
  },
  {
    id: 'MHS001',
    username: 'mahasiswa_andi',
    password: 'password123',
    name: 'Andi Pratama',
    role: 'MAHASISWA',
    enrolledCourses: ['IF301', 'IF302']
  }
];

const courses = [
  {
    id: 'IF301',
    name: 'Pemrograman Web Lanjut',
    credits: 3,
    lecturerId: 'DOSEN001'
  },
  {
    id: 'IF302',
    name: 'Keamanan Informasi & Kriptografi',
    credits: 3,
    lecturerId: 'DOSEN002'
  }
];

const grades = [
  {
    id: 'GRD-101',
    courseId: 'IF301',
    studentId: 'MHS001',
    studentName: 'Andi Pratama',
    midtermScore: 85,
    finalScore: 90,
    letterGrade: 'A'
  },
  {
    id: 'GRD-102',
    courseId: 'IF302',
    studentId: 'MHS001',
    studentName: 'Andi Pratama',
    midtermScore: 78,
    finalScore: 82,
    letterGrade: 'B+'
  }
];

module.exports = {
  users,
  courses,
  grades
};
