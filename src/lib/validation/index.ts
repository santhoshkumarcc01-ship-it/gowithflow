import { z } from 'zod';

export const SendOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN'])
});

export const VerifyOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  otp: z.string().length(6),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  facultyId: z.string().optional()
});

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const SubmitAttendanceSchema = z.object({
  classSectionId: z.string().uuid(),
  subjectId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  startTime: z.string(), // HH:MM
  endTime: z.string(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'])
  }))
});

export const CreateMaterialSchema = z.object({
  subjectId: z.string().uuid(),
  classSectionId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(['NOTE', 'PDF', 'VIDEO', 'LAB', 'REFERENCE', 'ASSIGNMENT', 'OTHER']),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string()
});

export const SubmitAssignmentSchema = z.object({
  fileUrl: z.string().url()
});

export const GradeSubmissionSchema = z.object({
  marks: z.number().int().nonnegative(),
  feedback: z.string().optional()
});

export const CreateEventSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  category: z.enum(['WORKSHOP', 'HACKATHON', 'SEMINAR', 'CONFERENCE', 'PLACEMENT', 'CLUB', 'SPORTS', 'CULTURAL', 'ACADEMIC', 'OTHER']),
  venue: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  registrationDeadline: z.string(),
  capacity: z.number().int().positive()
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(3),
  content: z.string(),
  category: z.enum(['ACADEMIC', 'EXAM', 'PLACEMENT', 'EVENTS', 'GENERAL']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  departmentId: z.string().uuid().optional(),
  classSectionId: z.string().uuid().optional()
});
