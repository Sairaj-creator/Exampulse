import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { connectDatabase } from "../config/db.js";
import {
  User,
  Batch,
  Subject,
  Question,
  Exam,
  Attempt,
} from "../models/index.js";
import { hashPassword } from "../utils/passwords.js";
import { gradeAttempt } from "../services/gradingService.js";

export async function runSeed({ reset = false } = {}) {
  console.log(`Starting seed process (reset=${reset})...`);

  if (reset) {
    console.log("Clearing existing data...");
    await Attempt.deleteMany({});
    await Exam.deleteMany({});
    await Question.deleteMany({});
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Batch.deleteMany({});
    console.log("Existing collections cleared.");
  }

  // 1. Seed Batches
  const defaultBatches = [
    { name: "CSE-A 2026", year: 2026 },
    { name: "CSE-B 2026", year: 2026 },
    { name: "IT-A 2026", year: 2026 },
  ];

  const batches = [];
  for (const b of defaultBatches) {
    let batch = await Batch.findOne({ name: b.name });
    if (!batch) {
      batch = await Batch.create(b);
      console.log(`Created batch: ${batch.name}`);
    }
    batches.push(batch);
  }

  // 2. Seed Subjects
  const defaultSubjects = [
    {
      name: "Database Management Systems",
      code: "CS301",
      description:
        "Relational databases, SQL, normalization, transactions, and indexing.",
    },
    {
      name: "Operating Systems",
      code: "CS302",
      description:
        "Processes, threads, CPU scheduling, synchronization, and virtual memory.",
    },
    {
      name: "Data Structures & Algorithms",
      code: "CS201",
      description:
        "Linear and non-linear data structures, searching, sorting, dynamic programming.",
    },
    {
      name: "Computer Networks",
      code: "CS303",
      description:
        "OSI and TCP/IP models, routing, switching, DNS, and transport protocols.",
    },
  ];

  const subjects = [];
  for (const s of defaultSubjects) {
    let subject = await Subject.findOne({ code: s.code });
    if (!subject) {
      subject = await Subject.create(s);
      console.log(`Created subject: ${subject.name} (${subject.code})`);
    }
    subjects.push(subject);
  }

  // 3. Seed Admin
  const adminPassword = await hashPassword("Admin@123");
  let admin = await User.findOne({ email: "admin@exampulse.dev" });
  if (!admin) {
    admin = await User.create({
      name: "System Administrator",
      email: "admin@exampulse.dev",
      passwordHash: adminPassword,
      role: "admin",
      isActive: true,
    });
    console.log(`Created admin user: ${admin.email}`);
  }

  // 4. Seed Demo Teachers
  const teacherPassword = await hashPassword("Teacher@123");
  const teacherData = [
    { name: "Dr. Alan Turing", email: "teacher1@exampulse.dev" },
    { name: "Prof. Grace Hopper", email: "teacher2@exampulse.dev" },
    { name: "Dr. Donald Knuth", email: "teacher3@exampulse.dev" },
  ];

  const teachers = [];
  for (const t of teacherData) {
    let teacher = await User.findOne({ email: t.email });
    if (!teacher) {
      teacher = await User.create({
        name: t.name,
        email: t.email,
        passwordHash: teacherPassword,
        role: "teacher",
        isActive: true,
      });
      console.log(`Created teacher: ${teacher.email}`);
    }
    teachers.push(teacher);
  }

  // 5. Seed Demo Students (multiple candidates for analytics)
  const studentPassword = await hashPassword("Student@123");
  const namedStudents = [
    {
      name: "Alex Mercer",
      email: "student@exampulse.dev",
      rollNumber: "CS26001",
      batch: batches[0],
    },
    {
      name: "Beatrice Potter",
      email: "student2@exampulse.dev",
      rollNumber: "CS26002",
      batch: batches[0],
    },
    {
      name: "Chris Evans",
      email: "student3@exampulse.dev",
      rollNumber: "CS26003",
      batch: batches[0],
    },
    {
      name: "Diana Prince",
      email: "student4@exampulse.dev",
      rollNumber: "CS26004",
      batch: batches[1],
    },
    {
      name: "Evan Wright",
      email: "student5@exampulse.dev",
      rollNumber: "CS26005",
      batch: batches[1],
    },
  ];
  const generatedStudents = Array.from({ length: 55 }, (_, index) => {
    const number = index + 6;
    return {
      name: `Demo Student ${String(number).padStart(2, "0")}`,
      email: `student${number}@exampulse.dev`,
      rollNumber: `EX26${String(number).padStart(3, "0")}`,
      batch: batches[(number - 1) % batches.length],
    };
  });
  const studentData = [...namedStudents, ...generatedStudents];

  const students = [];
  for (const s of studentData) {
    let student = await User.findOne({ email: s.email });
    if (!student) {
      student = await User.create({
        name: s.name,
        email: s.email,
        passwordHash: studentPassword,
        role: "student",
        batchId: s.batch._id,
        rollNumber: s.rollNumber,
        isActive: true,
      });
      console.log(`Created student: ${student.email}`);
    }
    students.push(student);
  }

  // 6. Seed Question Bank for Teacher 1 (DBMS)
  const dbmsQuestions = [
    {
      subjectId: subjects[0]._id,
      topic: "Indexing",
      type: "single",
      text: "Which index type is best suited for equality and range queries on multiple ordered attributes in BSON/relational databases?",
      options: [
        { key: "A", text: "Hash Index" },
        { key: "B", text: "Compound B-Tree Index" },
        { key: "C", text: "Bitmap Index" },
        { key: "D", text: "Spatial R-Tree Index" },
      ],
      correctKeys: ["B"],
      explanation:
        "Compound B-Tree indexes maintain sorted order across multiple keys, efficiently serving equality and range searches.",
      difficulty: "medium",
      defaultMarks: 2,
      createdBy: teachers[0]._id,
    },
    {
      subjectId: subjects[0]._id,
      topic: "Indexing",
      type: "truefalse",
      text: "An index will always improve both read query execution performance and write transaction throughput.",
      options: [
        { key: "A", text: "True" },
        { key: "B", text: "False" },
      ],
      correctKeys: ["B"],
      explanation:
        "While indexes accelerate reads, every insert, update, and delete incurs write overhead to maintain the index structures.",
      difficulty: "easy",
      defaultMarks: 2,
      createdBy: teachers[0]._id,
    },
    {
      subjectId: subjects[0]._id,
      topic: "Transactions",
      type: "multiple",
      text: "Which of the following properties are essential guarantees of ACID compliance in transaction processing?",
      options: [
        { key: "A", text: "Atomicity" },
        { key: "B", text: "Consistency" },
        { key: "C", text: "Availability" },
        { key: "D", text: "Durability" },
      ],
      correctKeys: ["A", "B", "D"],
      explanation:
        "ACID stands for Atomicity, Consistency, Isolation, and Durability. Availability is part of the CAP theorem.",
      difficulty: "medium",
      defaultMarks: 2,
      createdBy: teachers[0]._id,
    },
    {
      subjectId: subjects[0]._id,
      topic: "Transactions",
      type: "single",
      text: "In the Two-Phase Locking (2PL) protocol, what characterizes the shrinking phase?",
      options: [
        { key: "A", text: "The transaction may obtain new shared locks only" },
        {
          key: "B",
          text: "The transaction may release locks but cannot acquire any new locks",
        },
        { key: "C", text: "The transaction aborts immediately" },
        { key: "D", text: "All write locks convert into intent locks" },
      ],
      correctKeys: ["B"],
      explanation:
        "Once a transaction releases a single lock in 2PL, it enters the shrinking phase and is strictly forbidden from acquiring new locks.",
      difficulty: "hard",
      defaultMarks: 2,
      createdBy: teachers[0]._id,
    },
    {
      subjectId: subjects[0]._id,
      topic: "Normalization",
      type: "single",
      text: "A relation is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y, X is a:",
      options: [
        { key: "A", text: "Candidate Key" },
        { key: "B", text: "Foreign Key" },
        { key: "C", text: "Super Key" },
        { key: "D", text: "Composite Attribute" },
      ],
      correctKeys: ["C"],
      explanation:
        "BCNF eliminates all redundancy from functional dependencies by requiring the determinant X to be a super key.",
      difficulty: "medium",
      defaultMarks: 2,
      createdBy: teachers[0]._id,
    },
  ];

  const questions = [];
  for (const qData of dbmsQuestions) {
    let q = await Question.findOne({
      text: qData.text,
      createdBy: teachers[0]._id,
    });
    if (!q) {
      q = await Question.create(qData);
    }
    questions.push(q);
  }

  // 7. Seed Past & Ended Exams with Realistic Submissions for Analytics
  let midtermExam = await Exam.findOne({
    title: "DBMS Midterm Examination 2026",
    createdBy: teachers[0]._id,
  });

  const now = new Date();
  const pastStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const pastEnd = new Date(pastStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours window

  if (!midtermExam) {
    midtermExam = await Exam.create({
      title: "DBMS Midterm Examination 2026",
      description:
        "Mid-semester evaluation covering Indexing, Transactions, and Normalization.",
      instructions:
        "Answer all questions. Each question is worth 2 marks. Standard duration is 45 minutes.",
      subjectId: subjects[0]._id,
      createdBy: teachers[0]._id,
      batchIds: [batches[0]._id, batches[1]._id],
      startTime: pastStart,
      endTime: pastEnd,
      durationMinutes: 45,
      passPercentage: 50,
      negativeMarking: { enabled: false, penaltyFraction: 0 },
      shuffleQuestions: false,
      shuffleOptions: false,
      reviewPolicy: "immediate",
      status: "published",
      totalMarks: 10,
      questions: questions.map((q) => ({
        sourceQuestionId: q._id,
        type: q.type,
        text: q.text,
        options: q.options,
        correctKeys: q.correctKeys,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.defaultMarks,
      })),
      publishedAt: pastStart,
    });
    console.log(`Created exam: ${midtermExam.title}`);
  }

  // 8. Seed Graded Student Attempts on Midterm Exam
  const examQuestions = midtermExam.questions;
  const examRules = {
    negativeMarking: midtermExam.negativeMarking,
    passPercentage: midtermExam.passPercentage,
    totalMarks: midtermExam.totalMarks,
  };

  // Student 1 (Alex): High scorer (8/10, 80%), 1200s, 0 tab switches
  const student1AttemptExists = await Attempt.findOne({
    examId: midtermExam._id,
    studentId: students[0]._id,
  });
  if (!student1AttemptExists) {
    const s1Answers = [
      { questionId: examQuestions[0]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[1]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[2]._id, selectedKeys: ["A", "B", "D"] }, // Correct (2)
      { questionId: examQuestions[3]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[4]._id, selectedKeys: ["A"] }, // Wrong (0)
    ];
    const s1Start = new Date(pastStart.getTime() + 10 * 60 * 1000);
    const s1Submit = new Date(s1Start.getTime() + 1200 * 1000);
    const s1Result = gradeAttempt({
      examQuestions,
      answers: s1Answers,
      rules: examRules,
      startedAt: s1Start,
      submittedAt: s1Submit,
      expiresAt: new Date(s1Start.getTime() + 45 * 60 * 1000),
    });

    await Attempt.create({
      examId: midtermExam._id,
      studentId: students[0]._id,
      subjectId: subjects[0]._id,
      teacherId: teachers[0]._id,
      batchId: batches[0]._id,
      examTitle: midtermExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: s1Start,
      expiresAt: new Date(s1Start.getTime() + 45 * 60 * 1000),
      submittedAt: s1Submit,
      answers: s1Answers,
      tabSwitchCount: 0,
      result: s1Result,
    });
  }

  // Student 2 (Beatrice): 6/10 (60%), 1500s, 1 tab switch
  const student2AttemptExists = await Attempt.findOne({
    examId: midtermExam._id,
    studentId: students[1]._id,
  });
  if (!student2AttemptExists) {
    const s2Answers = [
      { questionId: examQuestions[0]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[1]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[2]._id, selectedKeys: ["A", "B", "D"] }, // Correct (2)
      { questionId: examQuestions[3]._id, selectedKeys: ["C"] }, // Wrong (0)
      { questionId: examQuestions[4]._id, selectedKeys: ["A"] }, // Wrong (0)
    ];
    const s2Start = new Date(pastStart.getTime() + 15 * 60 * 1000);
    const s2Submit = new Date(s2Start.getTime() + 1500 * 1000);
    const s2Result = gradeAttempt({
      examQuestions,
      answers: s2Answers,
      rules: examRules,
      startedAt: s2Start,
      submittedAt: s2Submit,
      expiresAt: new Date(s2Start.getTime() + 45 * 60 * 1000),
    });

    await Attempt.create({
      examId: midtermExam._id,
      studentId: students[1]._id,
      subjectId: subjects[0]._id,
      teacherId: teachers[0]._id,
      batchId: batches[0]._id,
      examTitle: midtermExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: s2Start,
      expiresAt: new Date(s2Start.getTime() + 45 * 60 * 1000),
      submittedAt: s2Submit,
      answers: s2Answers,
      tabSwitchCount: 1,
      result: s2Result,
    });
  }

  // Student 3 (Chris): Low scorer (2/10, 20% - At Risk), 800s, 4 tab switches (Flagged)
  const student3AttemptExists = await Attempt.findOne({
    examId: midtermExam._id,
    studentId: students[2]._id,
  });
  if (!student3AttemptExists) {
    const s3Answers = [
      { questionId: examQuestions[0]._id, selectedKeys: ["A"] }, // Wrong (0)
      { questionId: examQuestions[1]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[2]._id, selectedKeys: ["C"] }, // Wrong (0)
      { questionId: examQuestions[3]._id, selectedKeys: ["A"] }, // Wrong (0)
      { questionId: examQuestions[4]._id, selectedKeys: [] }, // Unanswered (0)
    ];
    const s3Start = new Date(pastStart.getTime() + 20 * 60 * 1000);
    const s3Submit = new Date(s3Start.getTime() + 800 * 1000);
    const s3Result = gradeAttempt({
      examQuestions,
      answers: s3Answers,
      rules: examRules,
      startedAt: s3Start,
      submittedAt: s3Submit,
      expiresAt: new Date(s3Start.getTime() + 45 * 60 * 1000),
    });

    await Attempt.create({
      examId: midtermExam._id,
      studentId: students[2]._id,
      subjectId: subjects[0]._id,
      teacherId: teachers[0]._id,
      batchId: batches[0]._id,
      examTitle: midtermExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: s3Start,
      expiresAt: new Date(s3Start.getTime() + 45 * 60 * 1000),
      submittedAt: s3Submit,
      answers: s3Answers,
      tabSwitchCount: 4,
      result: s3Result,
    });
  }

  // Student 4 (Diana, Batch B): Perfect score (10/10, 100%), 1100s, 0 tab switches
  const student4AttemptExists = await Attempt.findOne({
    examId: midtermExam._id,
    studentId: students[3]._id,
  });
  if (!student4AttemptExists) {
    const s4Answers = [
      { questionId: examQuestions[0]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[1]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[2]._id, selectedKeys: ["A", "B", "D"] }, // Correct (2)
      { questionId: examQuestions[3]._id, selectedKeys: ["B"] }, // Correct (2)
      { questionId: examQuestions[4]._id, selectedKeys: ["C"] }, // Correct (2)
    ];
    const s4Start = new Date(pastStart.getTime() + 5 * 60 * 1000);
    const s4Submit = new Date(s4Start.getTime() + 1100 * 1000);
    const s4Result = gradeAttempt({
      examQuestions,
      answers: s4Answers,
      rules: examRules,
      startedAt: s4Start,
      submittedAt: s4Submit,
      expiresAt: new Date(s4Start.getTime() + 45 * 60 * 1000),
    });

    await Attempt.create({
      examId: midtermExam._id,
      studentId: students[3]._id,
      subjectId: subjects[0]._id,
      teacherId: teachers[0]._id,
      batchId: batches[1]._id,
      examTitle: midtermExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: s4Start,
      expiresAt: new Date(s4Start.getTime() + 45 * 60 * 1000),
      submittedAt: s4Submit,
      answers: s4Answers,
      tabSwitchCount: 0,
      result: s4Result,
    });
  }

  // 9. Rich analytics history: five more ended exams over ten weeks.
  // Combined with the midterm above this produces six chronological exams.
  const historicalSpecs = [
    { title: "DBMS Foundations Diagnostic", daysAgo: 70 },
    { title: "DBMS Indexing Quiz", daysAgo: 56 },
    { title: "DBMS Transactions Quiz", daysAgo: 42 },
    { title: "DBMS Normalization Quiz", daysAgo: 28 },
    { title: "DBMS Revision Assessment", daysAgo: 14 },
  ];
  const historicalExams = [];

  for (const spec of historicalSpecs) {
    let exam = await Exam.findOne({
      title: spec.title,
      createdBy: teachers[0]._id,
    });
    if (!exam) {
      const startTime = new Date(
        now.getTime() - spec.daysAgo * 24 * 60 * 60 * 1000,
      );
      exam = await Exam.create({
        title: spec.title,
        description: "Historical assessment used for performance analytics.",
        instructions: "Answer all questions. Results contribute to analytics.",
        subjectId: subjects[0]._id,
        createdBy: teachers[0]._id,
        batchIds: batches.map((batch) => batch._id),
        startTime,
        endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
        durationMinutes: 45,
        passPercentage: 50,
        negativeMarking: { enabled: false, penaltyFraction: 0 },
        shuffleQuestions: false,
        shuffleOptions: false,
        reviewPolicy: "after_end",
        status: "published",
        questions: questions.map((question) => ({
          sourceQuestionId: question._id,
          type: question.type,
          text: question.text,
          options: question.options,
          correctKeys: question.correctKeys,
          explanation: question.explanation,
          topic: question.topic,
          difficulty: question.difficulty,
          marks: question.defaultMarks,
        })),
        publishedAt: startTime,
      });
      console.log(`Created historical exam: ${exam.title}`);
    }
    historicalExams.push(exam);
  }

  const wrongSelection = (question) => {
    const wrongOption = question.options.find(
      (option) => !question.correctKeys.includes(option.key),
    );
    return wrongOption ? [wrongOption.key] : [];
  };

  async function seedAttemptsForExam(exam, examIndex, isFinalExam = false) {
    const assignedBatchIds = new Set(
      exam.batchIds.map((batchId) => batchId.toString()),
    );
    const existingStudentIds = new Set(
      (await Attempt.find({ examId: exam._id }).select("studentId").lean()).map(
        (attempt) => attempt.studentId.toString(),
      ),
    );
    const documents = [];

    students.forEach((student, studentIndex) => {
      if (existingStudentIds.has(student._id.toString())) return;
      if (!assignedBatchIds.has(student.batchId.toString())) return;

      // Roughly ten percent are absent, while the named demo student has a
      // complete six-exam trend for the dashboard walkthrough.
      if (studentIndex !== 0 && (studentIndex * 7 + examIndex * 3) % 10 === 0) {
        return;
      }

      const demoTrend = [1, 2, 2, 3, 4, 4];
      const baseSkill = 1 + (studentIndex % 5);
      const progression = examIndex >= 3 ? 1 : 0;
      const correctTarget =
        studentIndex === 0
          ? demoTrend[examIndex]
          : Math.min(5, Math.max(0, baseSkill + progression - 1));
      const answers = exam.questions.map((question, questionIndex) => ({
        questionId: question._id,
        selectedKeys:
          questionIndex < correctTarget
            ? [...question.correctKeys]
            : wrongSelection(question),
      }));

      const startedAt = new Date(
        exam.startTime.getTime() + (5 + (studentIndex % 10)) * 60 * 1000,
      );
      const timeTakenSeconds = Math.min(
        2600,
        780 + (studentIndex % 8) * 150 + examIndex * 35,
      );
      const expiresAt = new Date(startedAt.getTime() + 45 * 60 * 1000);
      const timedOut = isFinalExam && studentIndex % 9 === 0;
      const submittedAt = timedOut
        ? expiresAt
        : new Date(startedAt.getTime() + timeTakenSeconds * 1000);
      const result = gradeAttempt({
        examQuestions: exam.questions,
        answers,
        rules: {
          negativeMarking: exam.negativeMarking,
          passPercentage: exam.passPercentage,
          totalMarks: exam.totalMarks,
        },
        startedAt,
        submittedAt,
        expiresAt,
      });

      documents.push({
        examId: exam._id,
        studentId: student._id,
        subjectId: exam.subjectId,
        teacherId: exam.createdBy,
        batchId: student.batchId,
        examTitle: exam.title,
        status: "submitted",
        submitReason: timedOut ? "timeout" : "manual",
        startedAt,
        expiresAt,
        submittedAt,
        answers,
        tabSwitchCount:
          studentIndex % 20 === 0 ? 4 : studentIndex % 7 === 0 ? 2 : 0,
        result,
      });
    });

    if (documents.length) {
      await Attempt.insertMany(documents);
      console.log(`Created ${documents.length} attempts for ${exam.title}`);
    }
  }

  for (let index = 0; index < historicalExams.length; index += 1) {
    await seedAttemptsForExam(historicalExams[index], index);
  }
  await seedAttemptsForExam(midtermExam, historicalExams.length, true);

  // 10. Complete the demo lifecycle with live, upcoming, and draft exams.
  const lifecycleSpecs = [
    {
      title: "DBMS Analytics Live Check",
      status: "published",
      startTime: new Date(now.getTime() - 15 * 60 * 1000),
      endTime: new Date(now.getTime() + 60 * 60 * 1000),
    },
    {
      title: "DBMS Upcoming Assessment",
      status: "published",
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
    },
    {
      title: "DBMS Draft Practice Exam",
      status: "draft",
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 50 * 60 * 60 * 1000),
    },
  ];

  for (const spec of lifecycleSpecs) {
    const existing = await Exam.findOne({
      title: spec.title,
      createdBy: teachers[0]._id,
    });
    if (existing) continue;
    await Exam.create({
      title: spec.title,
      description: "Seeded assessment for the complete exam lifecycle demo.",
      subjectId: subjects[0]._id,
      createdBy: teachers[0]._id,
      batchIds: batches.map((batch) => batch._id),
      startTime: spec.startTime,
      endTime: spec.endTime,
      durationMinutes: 45,
      passPercentage: 50,
      negativeMarking: { enabled: false, penaltyFraction: 0 },
      shuffleQuestions: true,
      shuffleOptions: true,
      reviewPolicy: "after_end",
      status: spec.status,
      questions: questions.map((question) => ({
        sourceQuestionId: question._id,
        type: question.type,
        text: question.text,
        options: question.options,
        correctKeys: question.correctKeys,
        explanation: question.explanation,
        topic: question.topic,
        difficulty: question.difficulty,
        marks: question.defaultMarks,
      })),
      publishedAt: spec.status === "published" ? now : null,
    });
    console.log(`Created ${spec.status} exam: ${spec.title}`);
  }

  console.log("Seed completed successfully!");
  return {
    batches,
    subjects,
    admin,
    teachers,
    students,
    exam: midtermExam,
    historicalExams,
  };
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  try {
    const env = loadEnv();
    await connectDatabase(env.MONGO_URI);
    const reset = process.argv.includes("--reset");
    await runSeed({ reset });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}
