import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@issaquahpt.com' },
    update: {},
    create: {
      email: 'admin@issaquahpt.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  // Create clinician user
  const clinicianHash = await bcrypt.hash('clinician123!', 12);
  const clinician = await prisma.user.upsert({
    where: { email: 'clinician@issaquahpt.com' },
    update: {},
    create: {
      email: 'clinician@issaquahpt.com',
      passwordHash: clinicianHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'clinician',
    },
  });

  // Create coach user
  const coachHash = await bcrypt.hash('coach123!', 12);
  const coach = await prisma.user.upsert({
    where: { email: 'coach@issaquahpt.com' },
    update: {},
    create: {
      email: 'coach@issaquahpt.com',
      passwordHash: coachHash,
      firstName: 'Mike',
      lastName: 'Davis',
      role: 'coach',
    },
  });

  // Create parent user
  const parentHash = await bcrypt.hash('parent123!', 12);
  const parent = await prisma.user.upsert({
    where: { email: 'parent@issaquahpt.com' },
    update: {},
    create: {
      email: 'parent@issaquahpt.com',
      passwordHash: parentHash,
      firstName: 'Lisa',
      lastName: 'Wilson',
      role: 'parent',
    },
  });

  // Create clinic
  const clinic = await prisma.clinic.create({
    data: { name: 'Issaquah Physical Therapy', address: '123 Main St, Issaquah, WA 98027', phone: '(425) 555-0100' },
  });

  // Create club
  const club = await prisma.club.create({
    data: { name: 'Issaquah Soccer Club', clinicId: clinic.id },
  });

  // Create teams
  const u14 = await prisma.team.create({ data: { name: 'U14 Girls', clubId: club.id } });
  const u16 = await prisma.team.create({ data: { name: 'U16 Girls', clubId: club.id } });

  // Create athletes
  const athletes = await Promise.all([
    prisma.athlete.create({ data: { firstName: 'Emma', lastName: 'Wilson', dateOfBirth: new Date('2012-03-15'), gender: 'Female', teamId: u14.id } }),
    prisma.athlete.create({ data: { firstName: 'Sophia', lastName: 'Chen', dateOfBirth: new Date('2012-07-22'), gender: 'Female', teamId: u14.id } }),
    prisma.athlete.create({ data: { firstName: 'Olivia', lastName: 'Martinez', dateOfBirth: new Date('2010-01-10'), gender: 'Female', teamId: u16.id } }),
    prisma.athlete.create({ data: { firstName: 'Ava', lastName: 'Thompson', dateOfBirth: new Date('2010-11-30'), gender: 'Female', medicalHistory: 'Previous right ankle sprain (2024)', teamId: u16.id } }),
  ]);

  console.log(`Seeded: 4 users, 1 clinic, 1 club, 2 teams, ${athletes.length} athletes`);

  // Assign coach to club
  await prisma.coachClub.create({ data: { userId: coach.id, clubId: club.id } });

  // Assign parent to athlete (Lisa Wilson is Emma Wilson's parent)
  const [emma, sophia, olivia, ava] = athletes;
  await prisma.parentAthlete.create({ data: { userId: parent.id, athleteId: emma.id } });

  // Session 1: Emma — completed, low risk
  const session1 = await prisma.screeningSession.create({
    data: {
      athleteId: emma.id, teamId: u14.id,
      date: new Date('2026-03-10'),
      status: 'completed', riskScore: 18.5, riskCategory: 'low',
    },
  });
  await prisma.scoreRecord.createMany({
    data: [
      { sessionId: session1.id, type: 'movement', name: 'single_leg_squat', score: 15 },
      { sessionId: session1.id, type: 'movement', name: 'drop_jump_landing', score: 20 },
      { sessionId: session1.id, type: 'strength', name: 'quad_strength', valueLeft: 42, valueRight: 40 },
      { sessionId: session1.id, type: 'strength', name: 'hamstring_strength', valueLeft: 30, valueRight: 28 },
      { sessionId: session1.id, type: 'hop', name: 'single_hop_distance', valueLeft: 110, valueRight: 105 },
      { sessionId: session1.id, type: 'hop', name: 'triple_hop_distance', valueLeft: 320, valueRight: 310 },
    ],
  });

  // Session 2: Sophia — completed, moderate risk
  const session2 = await prisma.screeningSession.create({
    data: {
      athleteId: sophia.id, teamId: u14.id,
      date: new Date('2026-03-12'),
      status: 'completed', riskScore: 38.2, riskCategory: 'moderate',
    },
  });
  await prisma.scoreRecord.createMany({
    data: [
      { sessionId: session2.id, type: 'movement', name: 'single_leg_squat', score: 45 },
      { sessionId: session2.id, type: 'movement', name: 'forward_lunge', score: 30 },
      { sessionId: session2.id, type: 'movement', name: 'lateral_step_down', score: 40 },
      { sessionId: session2.id, type: 'strength', name: 'quad_strength', valueLeft: 38, valueRight: 30 },
      { sessionId: session2.id, type: 'strength', name: 'hip_abduction_strength', valueLeft: 22, valueRight: 18 },
      { sessionId: session2.id, type: 'hop', name: 'single_hop_distance', valueLeft: 95, valueRight: 80 },
    ],
  });
  await prisma.exercisePrescription.createMany({
    data: [
      { sessionId: session2.id, exerciseName: 'Goblet Squat', sets: 3, reps: 10, notes: 'Focus on knee tracking over toes' },
      { sessionId: session2.id, exerciseName: 'Single Leg Squat to Box', sets: 3, reps: 6, notes: 'Control valgus collapse' },
      { sessionId: session2.id, exerciseName: 'Single Leg Press', sets: 3, reps: 10, notes: 'Focus on weaker side' },
      { sessionId: session2.id, exerciseName: 'Clamshell with Band', sets: 3, reps: 15, notes: 'External rotation strengthening' },
    ],
  });

  // Session 3: Olivia — completed, high risk
  const session3 = await prisma.screeningSession.create({
    data: {
      athleteId: olivia.id, teamId: u16.id,
      date: new Date('2026-03-15'),
      status: 'completed', riskScore: 55.8, riskCategory: 'high',
    },
  });
  await prisma.scoreRecord.createMany({
    data: [
      { sessionId: session3.id, type: 'movement', name: 'single_leg_squat', score: 65 },
      { sessionId: session3.id, type: 'movement', name: 'drop_jump_landing', score: 70 },
      { sessionId: session3.id, type: 'movement', name: 'forward_lunge', score: 45 },
      { sessionId: session3.id, type: 'strength', name: 'quad_strength', valueLeft: 50, valueRight: 35 },
      { sessionId: session3.id, type: 'strength', name: 'hamstring_strength', valueLeft: 32, valueRight: 22 },
      { sessionId: session3.id, type: 'hop', name: 'single_hop_distance', valueLeft: 130, valueRight: 95 },
      { sessionId: session3.id, type: 'hop', name: 'timed_hop', valueLeft: 2.1, valueRight: 2.9 },
    ],
  });
  await prisma.exercisePrescription.createMany({
    data: [
      { sessionId: session3.id, exerciseName: 'Goblet Squat', sets: 3, reps: 12, notes: 'Focus on knee tracking over toes' },
      { sessionId: session3.id, exerciseName: 'Single Leg Squat to Box', sets: 3, reps: 7, notes: 'Control valgus collapse' },
      { sessionId: session3.id, exerciseName: 'Box Drop Landing', sets: 3, reps: 6, notes: 'Soft landing, knees aligned' },
      { sessionId: session3.id, exerciseName: 'Nordic Hamstring Curl', sets: 3, reps: 6, notes: 'Eccentric control' },
      { sessionId: session3.id, exerciseName: 'Single Leg Press', sets: 3, reps: 12, notes: 'Focus on weaker side' },
      { sessionId: session3.id, exerciseName: 'Single Leg Hop Progression', sets: 3, reps: 8, notes: 'Start with small hops, progress distance' },
    ],
  });

  // Session 4: Ava — completed, very high risk (history of injury)
  const session4 = await prisma.screeningSession.create({
    data: {
      athleteId: ava.id, teamId: u16.id,
      date: new Date('2026-03-18'),
      status: 'completed', riskScore: 72.4, riskCategory: 'very_high',
      notes: 'Athlete has history of right ankle sprain. Significant bilateral asymmetry observed.',
    },
  });
  await prisma.scoreRecord.createMany({
    data: [
      { sessionId: session4.id, type: 'movement', name: 'single_leg_squat', score: 75, notes: 'Notable valgus R knee' },
      { sessionId: session4.id, type: 'movement', name: 'drop_jump_landing', score: 80, notes: 'Poor landing mechanics bilateral' },
      { sessionId: session4.id, type: 'movement', name: 'lateral_step_down', score: 70 },
      { sessionId: session4.id, type: 'strength', name: 'quad_strength', valueLeft: 48, valueRight: 28 },
      { sessionId: session4.id, type: 'strength', name: 'hamstring_strength', valueLeft: 35, valueRight: 20 },
      { sessionId: session4.id, type: 'strength', name: 'hip_abduction_strength', valueLeft: 25, valueRight: 15 },
      { sessionId: session4.id, type: 'hop', name: 'single_hop_distance', valueLeft: 125, valueRight: 75 },
      { sessionId: session4.id, type: 'hop', name: 'triple_hop_distance', valueLeft: 350, valueRight: 220 },
    ],
  });
  await prisma.exercisePrescription.createMany({
    data: [
      { sessionId: session4.id, exerciseName: 'Goblet Squat', sets: 4, reps: 12, notes: 'Focus on knee tracking over toes' },
      { sessionId: session4.id, exerciseName: 'Single Leg Squat to Box', sets: 4, reps: 7, notes: 'Control valgus collapse' },
      { sessionId: session4.id, exerciseName: 'Box Drop Landing', sets: 4, reps: 6, notes: 'Soft landing, knees aligned' },
      { sessionId: session4.id, exerciseName: 'Single Leg Press', sets: 4, reps: 12, notes: 'Focus on weaker (right) side' },
      { sessionId: session4.id, exerciseName: 'Nordic Hamstring Curl', sets: 4, reps: 6, notes: 'Eccentric control' },
      { sessionId: session4.id, exerciseName: 'Single Leg Romanian Deadlift', sets: 4, reps: 12, notes: 'Hamstring and glute activation' },
      { sessionId: session4.id, exerciseName: 'Clamshell with Band', sets: 4, reps: 15, notes: 'External rotation strengthening' },
      { sessionId: session4.id, exerciseName: 'Single Leg Hop Progression', sets: 4, reps: 8, notes: 'Start with small hops, progress distance' },
      { sessionId: session4.id, exerciseName: 'Lateral Bound and Stick', sets: 4, reps: 6, notes: 'Control landing, stick for 3s' },
    ],
  });

  // Session 5: Emma — second screening (follow-up), in progress
  const session5 = await prisma.screeningSession.create({
    data: {
      athleteId: emma.id, teamId: u14.id,
      date: new Date('2026-04-10'),
      status: 'in_progress',
      notes: 'Follow-up screening — 1 month after initial',
    },
  });
  await prisma.scoreRecord.createMany({
    data: [
      { sessionId: session5.id, type: 'movement', name: 'single_leg_squat', score: 12 },
      { sessionId: session5.id, type: 'movement', name: 'drop_jump_landing', score: 18 },
    ],
  });

  console.log(`Seeded: 5 screening sessions (4 completed, 1 in-progress), scores, and prescriptions`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
