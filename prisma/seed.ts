import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Database Seeding Initiated (PostgreSQL compatible)...');

  // 1. Clear existing database
  await prisma.auditLog.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.otpVerification.deleteMany({});
  await prisma.campusConnection.deleteMany({});
  await prisma.clubMembership.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.careerRecommendation.deleteMany({});
  await prisma.studentSkill.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.careerProfile.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcementTarget.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.eventRegistration.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.attendanceSession.deleteMany({});
  await prisma.classSchedule.deleteMany({});
  await prisma.facultySubject.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.classSection.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.academicYear.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.college.deleteMany({});

  const passwordHash = await bcrypt.hash('203santhosh@', 10);

  // 2. Create College
  const college = await prisma.college.create({
    data: {
      name: 'Apex Institute of Technology',
      code: 'AIT',
      email: 'info@apex.edu',
      phone: '+919988776655',
      address: 'Tech Innovation Hill, Sector 62, Bangalore',
      website: 'https://apex.edu',
      timezone: 'Asia/Kolkata'
    }
  });

  // 3. Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      collegeId: college.id,
      name: '2026-2027',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-05-30'),
      isActive: true
    }
  });

  // 4. Create Departments
  const deptCSE = await prisma.department.create({ data: { name: 'Computer Science & Engineering', code: 'CSE', collegeId: college.id } });
  const deptAIML = await prisma.department.create({ data: { name: 'CSE – Artificial Intelligence & Machine Learning', code: 'AI & ML', collegeId: college.id } });
  const deptCYBER = await prisma.department.create({ data: { name: 'CSE – Cyber Security', code: 'CYBER', collegeId: college.id } });
  const deptCSBS = await prisma.department.create({ data: { name: 'Computer Science & Business Systems', code: 'CSBS', collegeId: college.id } });
  const deptAIDS = await prisma.department.create({ data: { name: 'Artificial Intelligence & Data Science', code: 'AI & DS', collegeId: college.id } });
  const deptECE = await prisma.department.create({ data: { name: 'Electronics & Communication Engineering', code: 'ECE', collegeId: college.id } });
  const deptVLSI = await prisma.department.create({ data: { name: 'Electronics Engineering – VLSI Design & Technology', code: 'VLSI', collegeId: college.id } });
  const deptEEE = await prisma.department.create({ data: { name: 'Electrical & Electronics Engineering', code: 'EEE', collegeId: college.id } });
  const deptME = await prisma.department.create({ data: { name: 'Mechanical Engineering', code: 'ME', collegeId: college.id } });
  const deptAERO = await prisma.department.create({ data: { name: 'Aeronautical Engineering', code: 'AERO', collegeId: college.id } });
  const deptAGRI = await prisma.department.create({ data: { name: 'Agricultural Engineering', code: 'AGRI', collegeId: college.id } });
  const deptBIOMED = await prisma.department.create({ data: { name: 'Biomedical Engineering', code: 'BIOMED', collegeId: college.id } });
  const deptBIOTECH = await prisma.department.create({ data: { name: 'Biotechnology', code: 'BIOTECH', collegeId: college.id } });
  const deptMBA = await prisma.department.create({ data: { name: 'Master of Business Administration', code: 'MBA', collegeId: college.id } });
  const deptMCA = await prisma.department.create({ data: { name: 'Master of Computer Applications', code: 'MCA', collegeId: college.id } });
  const deptSH = await prisma.department.create({ data: { name: 'Science & Humanities', code: 'S&H', collegeId: college.id } });

  const depts = [
    deptCSE, deptAIML, deptCYBER, deptCSBS, deptAIDS, deptECE,
    deptVLSI, deptEEE, deptME, deptAERO, deptAGRI, deptBIOMED,
    deptBIOTECH, deptMBA, deptMCA, deptSH
  ];

  // 5. Create Skills
  const skillsData = [
    { name: 'JavaScript', category: 'Software' },
    { name: 'TypeScript', category: 'Software' },
    { name: 'Python', category: 'Software' },
    { name: 'React', category: 'Software' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'Redis', category: 'Database' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'IoT Programming', category: 'Hardware' },
    { name: 'MATLAB', category: 'Academic' },
    { name: 'AutoCAD', category: 'Mechanical' }
  ];

  const skills: any[] = [];
  for (const s of skillsData) {
    const skill = await prisma.skill.create({ data: s });
    skills.push(skill);
  }

  // 6. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'intasiabranding@gmail.com',
      phoneNumber: '+919999999999',
      passwordHash: passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    }
  });
  await prisma.admin.create({ data: { userId: adminUser.id } });

  // 7. Create Courses
  const courseCSE = await prisma.course.create({
    data: { name: 'B.Tech Computer Science', code: 'CS-BTECH', collegeId: college.id, departmentId: deptCSE.id, duration: 4 }
  });
  const courseECE = await prisma.course.create({
    data: { name: 'B.Tech Electronics & Comm', code: 'EC-BTECH', collegeId: college.id, departmentId: deptECE.id, duration: 4 }
  });
  const courseME = await prisma.course.create({
    data: { name: 'B.Tech Mechanical Eng', code: 'ME-BTECH', collegeId: college.id, departmentId: deptME.id, duration: 4 }
  });

  // 8. Create Subjects
  const subjectsData = [
    { name: 'Data Structures & Algorithms', code: 'CS301', credits: 4, sem: 3, course: courseCSE, dept: deptCSE },
    { name: 'Database Management Systems', code: 'CS302', credits: 3, sem: 3, course: courseCSE, dept: deptCSE },
    { name: 'Web Application Development', code: 'CS303', credits: 4, sem: 5, course: courseCSE, dept: deptCSE },
    { name: 'Microcontrollers & IoT', code: 'EC301', credits: 4, sem: 5, course: courseECE, dept: deptECE },
    { name: 'Digital Signal Processing', code: 'EC302', credits: 3, sem: 3, course: courseECE, dept: deptECE },
    { name: 'Thermodynamics & Heat Transfer', code: 'ME301', credits: 4, sem: 3, course: courseME, dept: deptME },
    { name: 'Computer Aided Design (CAD)', code: 'ME302', credits: 3, sem: 5, course: courseME, dept: deptME }
  ];

  const subjects: any[] = [];
  for (const s of subjectsData) {
    const subj = await prisma.subject.create({
      data: {
        collegeId: college.id,
        courseId: s.course.id,
        departmentId: s.dept.id,
        code: s.code,
        name: s.name,
        credits: s.credits,
        semester: s.sem
      }
    });
    subjects.push(subj);
  }

  // 9. Create 20 Faculty Members
  const facultyNames = [
    { name: 'Dr. Evelyn Martinez', email: 'evelyn.m@campus.os', phone: '+919876543211', desig: 'Professor & Head', dept: deptCSE },
    { name: 'Prof. Alistair Vance', email: 'alistair.v@campus.os', phone: '+919876543212', desig: 'Associate Professor', dept: deptCSE },
    { name: 'Dr. Marcus Sterling', email: 'marcus.s@campus.os', phone: '+919876543213', desig: 'Assistant Professor', dept: deptCSE },
    { name: 'Dr. Clara Oswald', email: 'clara.o@campus.os', phone: '+919876543214', desig: 'Assistant Professor', dept: deptCSE },
    
    { name: 'Dr. Helena Shaw', email: 'helena.s@campus.os', phone: '+919876543216', desig: 'Professor & Head', dept: deptECE },
    { name: 'Dr. Arthur Pendelton', email: 'arthur.p@campus.os', phone: '+919876543217', desig: 'Assistant Professor', dept: deptECE },
    { name: 'Prof. Serena Vance', email: 'serena.v@campus.os', phone: '+919876543218', desig: 'Associate Professor', dept: deptECE },
    
    { name: 'Prof. Raymond Holt', email: 'raymond.h@campus.os', phone: '+919876543221', desig: 'Professor & Head', dept: deptME },
    { name: 'Dr. Charles Boyle', email: 'charles.b@campus.os', phone: '+919876543222', desig: 'Assistant Professor', dept: deptME },
    { name: 'Dr. Amy Santiago', email: 'amy.s@campus.os', phone: '+919876543223', desig: 'Associate Professor', dept: deptME }
  ];

  const faculties: any[] = [];
  let facIndex = 1;
  for (const f of facultyNames) {
    const user = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        phoneNumber: f.phone,
        passwordHash,
        role: 'FACULTY',
        avatarUrl: `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=${facIndex}`
      }
    });
    const faculty = await prisma.faculty.create({
      data: {
        userId: user.id,
        collegeId: college.id,
        facultyId: `FAC${1000 + facIndex}`,
        departmentId: f.dept.id,
        designation: f.desig
      }
    });
    faculties.push(faculty);
    facIndex++;
  }

  // 10. Create Class Sections
  const classSections: any[] = [];
  const rooms = ['Block A-101', 'Block A-302', 'Block B-204', 'Block C-102'];
  
  // Link Subjects and Sections
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    const deptFaculties = faculties.filter(f => f.departmentId === subject.departmentId);
    const faculty = deptFaculties[i % deptFaculties.length];

    const sectionName = `Section A`;
    const course = subject.code.startsWith('CS') ? courseCSE : subject.code.startsWith('EC') ? courseECE : courseME;

    const classSec = await prisma.classSection.create({
      data: {
        collegeId: college.id,
        departmentId: subject.departmentId,
        academicYearId: academicYear.id,
        courseId: course.id,
        year: subject.semester <= 2 ? 1 : subject.semester <= 4 ? 2 : subject.semester <= 6 ? 3 : 4,
        semester: subject.semester,
        section: 'A',
        room: rooms[i % rooms.length],
        facultyId: faculty.id
      }
    });
    classSections.push(classSec);

    // Assign Faculty to subject in Section
    await prisma.facultySubject.create({
      data: {
        facultyId: faculty.id,
        subjectId: subject.id,
        classSectionId: classSec.id,
        academicYearId: academicYear.id
      }
    });

    // Create a schedule
    await prisma.classSchedule.create({
      data: {
        classSectionId: classSec.id,
        subjectId: subject.id,
        facultyId: faculty.id,
        dayOfWeek: (i % 5) + 1, // Mon-Fri
        startTime: '09:00',
        endTime: '10:30',
        room: classSec.room
      }
    });
  }

  // 11. Create 100 Students
  const firstNames = ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Emma', 'Olivia', 'Ava', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Evelyn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Rodriguez', 'Wilson', 'Thomas', 'Taylor', 'Moore', 'White', 'Harris', 'Martin'];

  const students: any[] = [];
  
  // Test student account
  const testUser = await prisma.user.create({
    data: {
      name: 'Aiden Vance',
      email: 'aiden@campus.os',
      phoneNumber: '+919876543210',
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
    }
  });

  const testStudent = await prisma.student.create({
    data: {
      userId: testUser.id,
      collegeId: college.id,
      studentId: 'STU9001',
      departmentId: deptCSE.id,
      academicYearId: academicYear.id,
      year: 3,
      semester: 5,
      section: 'A',
      admissionYear: 2024
    }
  });
  students.push(testStudent);

  // Seed Career Profile for Aiden Vance
  const initialRoadmap = [
    { id: 1, title: 'Learn Modern JavaScript (ES6+)', status: 'COMPLETED', desc: 'Promises, Async/Await, Destructuring.' },
    { id: 2, title: 'React UI Development', status: 'COMPLETED', desc: 'Hooks, virtual DOM, component lifecycles.' },
    { id: 3, title: 'Backend Design with Express', status: 'IN_PROGRESS', desc: 'REST APIs, Middleware, and JSON tokens.' },
    { id: 4, title: 'PostgreSQL Relational Storage', status: 'NOT_STARTED', desc: 'Normalization, foreign keys, indexing.' }
  ];
  const initialRecs = [
    'Complete the Express REST API backend sandbox projects.',
    'Review DB Index designs to optimize loading filters.'
  ];
  await prisma.careerProfile.create({
    data: {
      studentId: testStudent.id,
      targetRole: 'Full Stack Developer',
      experienceLevel: 'ENTRY',
      careerReadinessScore: 78,
      resumeUrl: 'https://apex.edu/resumes/aiden_vance.pdf'
    }
  });
  await prisma.careerRecommendation.create({
    data: {
      studentId: testStudent.id,
      targetRole: 'Full Stack Developer',
      recommendations: JSON.stringify(initialRecs),
      skillGaps: JSON.stringify(['Node.js', 'PostgreSQL', 'Docker']),
      roadmap: JSON.stringify(initialRoadmap),
      projects: JSON.stringify(['Task SaaS Dashboard', 'AI Code Reviewer']),
      generatedBy: 'FALLBACK',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Bulk student seeding
  for (let i = 1; i < 100; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    const name = `${fName} ${lName}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@apex.edu`;
    const phone = `+9198765${String(10000 + i)}`;
    const studentId = `STU${1000 + i}`;
    
    // Distribute across departments
    const dept = depts[i % depts.length];
    const year = (i % 4) + 1;
    const semester = (year * 2) - 1; // 1, 3, 5, 7

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber: phone,
        role: 'STUDENT',
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=${i}`
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        collegeId: college.id,
        studentId,
        departmentId: dept.id,
        academicYearId: academicYear.id,
        year,
        semester,
        section: 'A',
        admissionYear: 2027 - year
      }
    });

    students.push(student);
  }

  // Enroll students in their respective class sections
  console.log('🌱 Enrolling students in class sections...');
  for (const student of students) {
    const eligibleSections = classSections.filter(cs => {
      return cs.departmentId === student.departmentId && cs.semester === student.semester;
    });

    for (const sec of eligibleSections) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classSectionId: sec.id,
          academicYearId: academicYear.id
        }
      });
    }
  }

  // 12. Create Attendance Sessions and Records (800+ marked items)
  console.log('🌱 Generating attendance records...');
  const dates = ['2026-08-01', '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-08'];
  let recordsCount = 0;

  for (const sec of classSections) {
    const enrolls = await prisma.enrollment.findMany({ where: { classSectionId: sec.id } });
    if (enrolls.length === 0) continue;

    // Find assigned subject for this section
    const facSub = await prisma.facultySubject.findFirst({ where: { classSectionId: sec.id } });
    if (!facSub) continue;

    for (const date of dates) {
      const session = await prisma.attendanceSession.create({
        data: {
          classSectionId: sec.id,
          subjectId: facSub.subjectId,
          facultyId: facSub.facultyId,
          date,
          startTime: '09:00',
          endTime: '10:30'
        }
      });

      for (const e of enrolls) {
        // 88% Present, 10% Absent, 2% Late
        const rand = Math.random();
        const status = rand < 0.10 ? 'ABSENT' : rand < 0.12 ? 'LATE' : 'PRESENT';

        await prisma.attendanceRecord.create({
          data: {
            attendanceSessionId: session.id,
            studentId: e.studentId,
            status,
            markedBy: facSub.facultyId
          }
        });
        recordsCount++;
      }
    }
  }
  console.log(`🌱 Created ${recordsCount} attendance record lines.`);

  // 13. Create Materials
  console.log('🌱 Publishing learning nodes...');
  for (let i = 0; i < classSections.length; i++) {
    const sec = classSections[i];
    const facSub = await prisma.facultySubject.findFirst({ where: { classSectionId: sec.id } });
    if (!facSub) continue;

    await prisma.material.create({
      data: {
        collegeId: college.id,
        subjectId: facSub.subjectId,
        facultyId: facSub.facultyId,
        classSectionId: sec.id,
        title: `Lecture Slide ${i + 1}: Introduction to Syllabus`,
        description: 'Covers the primary academic objectives, references, and evaluation methodologies.',
        category: 'PDF',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'intro_slides.pdf',
        fileSize: 1048576, // 1MB
        mimeType: 'application/pdf'
      }
    });
  }

  // 14. Create Assignments and Submissions
  console.log('🌱 Creating assignments...');
  for (let i = 0; i < classSections.length; i++) {
    const sec = classSections[i];
    const facSub = await prisma.facultySubject.findFirst({ where: { classSectionId: sec.id } });
    if (!facSub) continue;

    const assignment = await prisma.assignment.create({
      data: {
        subjectId: facSub.subjectId,
        facultyId: facSub.facultyId,
        classSectionId: sec.id,
        title: `Homework 1: Problem Solving Set`,
        description: 'Complete the numeric exercises outlined in the attached lab document. Submit as a single PDF.',
        deadline: '2026-08-25T23:59',
        maxMarks: 100
      }
    });

    // Create mock submission for the test student
    const enrollTest = await prisma.enrollment.findUnique({
      where: { studentId_classSectionId: { studentId: testStudent.id, classSectionId: sec.id } }
    });

    if (enrollTest) {
      const rand = Math.random();
      const isGraded = rand > 0.5;

      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: testStudent.id,
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          status: isGraded ? 'GRADED' : 'SUBMITTED',
          marks: isGraded ? 90 : null,
          feedback: isGraded ? 'Well explained diagrams and correct proofs.' : null,
          gradedAt: isGraded ? new Date() : null,
          gradedBy: isGraded ? facSub.facultyId : null
        }
      });
    }
  }

  // 15. Create Events
  console.log('🌱 Scheduling campus events...');
  const events = [
    { title: 'National Hackathon: DevForge 2026', slug: 'devforge-2026', desc: 'Join the 36-hour coding sprint to solve university SaaS problems. Cash prizes up to $5000.', cap: 200, cat: 'HACKATHON' },
    { title: 'Generative AI & LLM Systems Seminar', slug: 'ai-seminar-2026', desc: 'Understanding attention mechanisms, prompt engineering pipelines, and fine-tuning local models.', cap: 120, cat: 'SEMINAR' },
    { title: 'IEEE Robotics Drone Race League', slug: 'drone-race-2026', desc: 'Showcase obstacle navigation algorithms on quadcopters.', cap: 80, cat: 'CLUB' }
  ];

  for (const e of events) {
    const event = await prisma.event.create({
      data: {
        collegeId: college.id,
        title: e.title,
        slug: e.slug,
        description: e.desc,
        category: e.cat,
        organizerId: adminUser.id,
        venue: 'Campus Innovation Center, Block D',
        startDateTime: new Date('2026-08-20T10:00:00'),
        endDateTime: new Date('2026-08-21T18:00:00'),
        registrationDeadline: new Date('2026-08-19T23:59:00'),
        capacity: e.cap,
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'
      }
    });

    // Register test student for the hackathon
    if (e.slug === 'devforge-2026') {
      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          studentId: testStudent.id,
          status: 'REGISTERED'
        }
      });
    }
  }

  // 16. Create System Announcements
  await prisma.announcement.create({
    data: {
      collegeId: college.id,
      authorId: adminUser.id,
      title: 'Autumn Mid-Term Examinations Timetable',
      content: 'Official exam schedules for B.Tech semesters III, V, and VII have been finalized. Exams commence August 24th, 2026. Hall tickets will be downloadable next week.',
      category: 'EXAM',
      priority: 'HIGH'
    }
  });

  // 17. Seed initial notification
  await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'SYSTEM',
      title: 'Profile Synchronized',
      message: 'Your Aiden Vance student profile has been connected with the Apex Institute database registry.'
    }
  });

  console.log('🌱 Database Seeding Completed Successfully! 🌟');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
