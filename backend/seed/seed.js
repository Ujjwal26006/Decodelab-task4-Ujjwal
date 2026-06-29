'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');

const Course = require('../models/Course');
const Testimonial = require('../models/Testimonial');
const FAQ = require('../models/FAQ');

// ── Seed Data ──────────────────────────────────────────────────────────────

const courses = [
  {
    title: 'Web Development',
    slug: 'web-development',
    description: 'Master HTML, CSS, JavaScript, and modern frameworks to build production-grade web applications from scratch.',
    duration: '12 Weeks',
    price: 8999,
    category: 'Development',
    level: 'Beginner to Advanced',
    image: 'assets/course-web-dev.svg',
    topics: ['HTML5 & CSS3', 'JavaScript ES6+', 'Node.js', 'REST APIs', 'Git & Deployment'],
    seats: 30,
  },
  {
    title: 'Data Science',
    slug: 'data-science',
    description: 'Learn data wrangling, statistical analysis, and machine learning pipelines using Python and industry-standard libraries.',
    duration: '14 Weeks',
    price: 11999,
    category: 'Data',
    level: 'Intermediate',
    image: 'assets/course-data-science.svg',
    topics: ['Pandas & NumPy', 'Data Visualization', 'Statistics', 'Scikit-learn', 'SQL'],
    seats: 25,
  },
  {
    title: 'Python Programming',
    slug: 'python-programming',
    description: 'Go from zero to confident Python developer. Covers core language features, OOP, file I/O, APIs, and automation scripting.',
    duration: '8 Weeks',
    price: 5999,
    category: 'Programming',
    level: 'Beginner',
    image: 'assets/course-python.svg',
    topics: ['Python Basics', 'OOP', 'File Handling', 'APIs', 'Automation'],
    seats: 40,
  },
  {
    title: 'Java Development',
    slug: 'java-development',
    description: 'Build robust backend systems and enterprise applications using Java, Spring Boot, and industry-standard design patterns.',
    duration: '16 Weeks',
    price: 12999,
    category: 'Development',
    level: 'Intermediate to Advanced',
    image: 'assets/course-java.svg',
    topics: ['Core Java', 'Spring Boot', 'JPA & Hibernate', 'Microservices', 'Testing'],
    seats: 20,
  },
  {
    title: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'Design intuitive, accessible digital products using user research, wireframing, prototyping, and Figma.',
    duration: '10 Weeks',
    price: 7999,
    category: 'Design',
    level: 'Beginner to Intermediate',
    image: 'assets/course-uiux.svg',
    topics: ['Design Thinking', 'Wireframing', 'Figma', 'Usability Testing', 'Design Systems'],
    seats: 25,
  },
  {
    title: 'Machine Learning',
    slug: 'machine-learning',
    description: 'Implement supervised and unsupervised learning algorithms, neural networks, and end-to-end ML pipelines with real datasets.',
    duration: '18 Weeks',
    price: 14999,
    category: 'AI',
    level: 'Advanced',
    image: 'assets/course-ml.svg',
    topics: ['Regression & Classification', 'Neural Networks', 'Deep Learning', 'Model Deployment', 'MLOps'],
    seats: 15,
  },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    course: 'Web Development',
    review: "SkillForge's curriculum is exceptionally practical. Within three months I landed a junior developer role at a product startup. The mentors don't just teach — they prepare you for real code reviews.",
    avatar: 'PS',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    course: 'Data Science',
    review: 'I came in as an analyst with zero machine learning exposure. The structured progression from statistics to Scikit-learn to real project work made the transition feel natural, not overwhelming.',
    avatar: 'AM',
    rating: 5,
  },
  {
    name: 'Sunita Rao',
    course: 'UI/UX Design',
    review: 'The portfolio projects alone were worth the price. Every assignment is aligned to what design teams actually look for — not theoretical exercises. I had three interviews within weeks of graduating.',
    avatar: 'SR',
    rating: 5,
  },
  {
    name: 'Vikram Nair',
    course: 'Machine Learning',
    review: 'Best decision I made for my career. The ML program covers deployment and MLOps, which most courses skip entirely. My capstone project is now running in production at my company.',
    avatar: 'VN',
    rating: 5,
  },
  {
    name: 'Ananya Iyer',
    course: 'Python Programming',
    review: 'I finished this course in six weeks while working full time. The pacing is well-thought-out and the instructors respond to doubts quickly. I automated three workflows at work the very next day.',
    avatar: 'AI',
    rating: 4,
  },
];

const faqs = [
  {
    question: 'Do I need prior experience to enroll?',
    answer: 'Most of our courses start from the fundamentals. The course detail page clearly marks the experience level required — Beginner, Intermediate, or Advanced — so you can choose the right starting point.',
    order: 1,
  },
  {
    question: 'Are the courses live or self-paced?',
    answer: 'All courses are live, cohort-based, and scheduled on weekday evenings so you can learn while working. Recordings are available for up to 30 days after each session.',
    order: 2,
  },
  {
    question: 'What is the refund policy?',
    answer: 'We offer a full refund within the first seven days if you decide the course is not right for you — no questions asked. After that, we do not issue refunds, but you may transfer your seat to the next cohort once.',
    order: 3,
  },
  {
    question: 'Will I receive a certificate on completion?',
    answer: 'Yes. Every learner who completes all assignments and the final capstone project receives a verified digital certificate. It includes a unique credential ID you can share on LinkedIn or with employers.',
    order: 4,
  },
  {
    question: 'How does the placement support work?',
    answer: 'Our placement team helps you prepare your resume, portfolio, and LinkedIn profile. We also conduct mock interviews, share curated job leads, and connect you directly with our hiring partners.',
    order: 5,
  },
  {
    question: 'Can I pay in installments?',
    answer: 'Yes. We offer a two-installment plan for all courses — 60% at enrollment and 40% after the third week. Contact us via the form below and our team will set it up within 24 hours.',
    order: 6,
  },
  {
    question: 'How large are the cohorts?',
    answer: 'We deliberately keep cohort sizes small — between 15 and 40 students depending on the course — so every learner gets meaningful attention from mentors during live sessions and doubt-clearing calls.',
    order: 7,
  },
  {
    question: 'Is there a free trial or demo class?',
    answer: 'Yes. We offer a free one-hour demo session for every course. Register via the contact form and our team will schedule it within 48 hours. No credit card required.',
    order: 8,
  },
];

// ── Seed Runner ────────────────────────────────────────────────────────────

async function seed() {
  try {
    await connectDatabase();
    console.log('\n🌱 Starting seed...\n');

    // Clear existing seed collections
    await Promise.all([
      Course.deleteMany({}),
      Testimonial.deleteMany({}),
      FAQ.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing courses, testimonials, FAQs');

    // Insert fresh data
    const insertedCourses = await Course.insertMany(courses);
    console.log(`✅ Inserted ${insertedCourses.length} courses`);

    const insertedTestimonials = await Testimonial.insertMany(testimonials);
    console.log(`✅ Inserted ${insertedTestimonials.length} testimonials`);

    const insertedFaqs = await FAQ.insertMany(faqs);
    console.log(`✅ Inserted ${insertedFaqs.length} FAQs`);

    console.log('\n✅ Seed complete.\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

seed();

// NOTE: The lines below are appended to seed.js.
// They are kept as a separate exportable function so the original seed still works independently.
// To seed modules+lessons, run: node seed/seedLessons.js
