'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');

const Course  = require('../models/Course');
const Module  = require('../models/Module');
const Lesson  = require('../models/Lesson');

async function seedLessons() {
  await connectDatabase();
  console.log('\n🌱 Seeding modules and lessons...\n');

  await Module.deleteMany({});
  await Lesson.deleteMany({});
  console.log('🗑️  Cleared modules and lessons');

  const courses = await Course.find().lean();
  if (!courses.length) {
    console.error('❌ No courses found. Run npm run seed first.');
    process.exit(1);
  }

  // Template: 3 modules × 4 lessons each per course
  const moduleTemplates = [
    {
      title: 'Getting Started',
      description: 'Introduction and environment setup.',
      order: 1,
      lessons: [
        { title: 'Course Overview',          duration: '5 min',  type: 'video',   order: 1 },
        { title: 'Setting Up Your Environment', duration: '15 min', type: 'video', order: 2 },
        { title: 'Core Concepts Introduction',  duration: '10 min', type: 'reading', order: 3 },
        { title: 'Quick Check Quiz',            duration: '5 min',  type: 'quiz',    order: 4 },
      ],
    },
    {
      title: 'Core Skills',
      description: 'Hands-on practical skills development.',
      order: 2,
      lessons: [
        { title: 'Fundamental Techniques',    duration: '20 min', type: 'video',   order: 1 },
        { title: 'Practical Exercises',       duration: '30 min', type: 'video',   order: 2 },
        { title: 'Deep Dive Reading',         duration: '15 min', type: 'reading', order: 3 },
        { title: 'Skills Assessment Quiz',    duration: '10 min', type: 'quiz',    order: 4 },
      ],
    },
    {
      title: 'Advanced Application',
      description: 'Real-world project and capstone work.',
      order: 3,
      lessons: [
        { title: 'Advanced Patterns',         duration: '25 min', type: 'video',   order: 1 },
        { title: 'Industry Best Practices',   duration: '20 min', type: 'reading', order: 2 },
        { title: 'Capstone Project',          duration: '60 min', type: 'project', order: 3 },
        { title: 'Final Assessment',          duration: '15 min', type: 'quiz',    order: 4 },
      ],
    },
  ];

  let totalModules = 0;
  let totalLessons = 0;

  for (const course of courses) {
    for (const modTemplate of moduleTemplates) {
      const mod = await Module.create({
        courseId:    course._id,
        title:       `${modTemplate.title}`,
        description: modTemplate.description,
        order:       modTemplate.order,
      });
      totalModules++;

      for (const lessonTemplate of modTemplate.lessons) {
        await Lesson.create({
          courseId:    course._id,
          moduleId:    mod._id,
          title:       lessonTemplate.title,
          description: `${lessonTemplate.title} for ${course.title}`,
          duration:    lessonTemplate.duration,
          type:        lessonTemplate.type,
          order:       lessonTemplate.order,
        });
        totalLessons++;
      }
    }
    console.log(`✅ Seeded ${course.title}: 3 modules, 12 lessons`);
  }

  console.log(`\n✅ Seed complete: ${totalModules} modules, ${totalLessons} lessons\n`);

  await mongoose.connection.close();
  process.exit(0);
}

seedLessons().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
