import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Candidate, HiringStage } from '../models/Candidate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in server/.env');
  process.exit(1);
}

interface SeedRecord {
  name: string;
  email: string;
  phone: string;
  position: string;
  experienceYears: number;
  skills: string[];
  resumeUrl: string;
  notes: string;
  rating?: number;
  tags?: string[];
  stage: HiringStage;
  stageHistory: {
    from: HiringStage | null;
    to: HiringStage;
    changedAt: Date;
    notes?: string;
  }[];
}

export const SEED_CANDIDATES: SeedRecord[] = [
  // 1. Applied (10 candidates)
  {
    name: 'Aarav Patel',
    email: 'aarav.patel@example.com',
    phone: '+91 98201 12345',
    position: 'Full Stack Engineer',
    experienceYears: 3,
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
    resumeUrl: 'https://github.com/aaravpatel/resume/raw/main/cv.pdf',
    notes: 'Submitted via EarlyJobs careers portal. Strong open-source contributions.',
    rating: 4,
    tags: ["Top Talent","Referral"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'Application received' }]
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98450 67890',
    position: 'Frontend Developer',
    experienceYears: 2,
    skills: ['React', 'Tailwind CSS', 'Next.js', 'JavaScript'],
    resumeUrl: 'https://priyasharma.dev/resume.pdf',
    notes: 'Strong portfolio demonstrating clean UI/UX components.',
    rating: 5,
    tags: ["Design Mindset","Immediate Joiner"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Application received' }]
  },
  {
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@example.com',
    phone: '+91 97654 32109',
    position: 'Backend Developer',
    experienceYears: 4,
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker'],
    resumeUrl: 'https://drive.google.com/file/d/sample-rohan/view',
    notes: 'Backend API specialist with fintech experience.',
    rating: 4,
    tags: ["Fintech Exp","High Priority"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 1), notes: 'Application received' }]
  },
  {
    name: 'Neha Verma',
    email: 'neha.verma@example.com',
    phone: '+91 91234 56789',
    position: 'Full Stack Engineer',
    experienceYears: 2,
    skills: ['React', 'Python', 'FastAPI', 'MongoDB'],
    resumeUrl: 'https://nehaverma.io/cv.pdf',
    notes: 'Graduated from NIT Trichy, worked on edtech startups.',
    rating: 4,
    tags: ["NIT Alum","Fast Learner"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 4), notes: 'Application received' }]
  },
  {
    name: 'Vikram Joshi',
    email: 'vikram.joshi@example.com',
    phone: '+91 99887 76655',
    position: 'DevOps Engineer',
    experienceYears: 5,
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'],
    resumeUrl: 'https://vikramjoshi.net/resume.pdf',
    notes: 'Certified AWS Solutions Architect.',
    rating: 5,
    tags: ["AWS Certified","Top Talent"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 5), notes: 'Application received' }]
  },
  {
    name: 'Ananya Gupta',
    email: 'ananya.gupta@example.com',
    phone: '+91 98765 11223',
    position: 'UI/UX Designer & Frontend',
    experienceYears: 3,
    skills: ['Figma', 'React', 'CSS Modules', 'Design Systems'],
    resumeUrl: 'https://behance.net/ananyagupta/resume.pdf',
    notes: 'Demonstrated exceptional Ashby/Linear-like design sensibilities.',
    rating: 5,
    tags: ["Design Leader","Portfolio Star"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'Application received' }]
  },
  {
    name: 'Karan Mehra',
    email: 'karan.mehra@example.com',
    phone: '+91 94455 66778',
    position: 'Mobile Developer',
    experienceYears: 3,
    skills: ['React Native', 'TypeScript', 'Redux', 'iOS/Android'],
    resumeUrl: 'https://karanmehra.dev/cv.pdf',
    notes: 'Shipped 3 consumer apps on Google Play Store.',
    rating: 3,
    tags: ["Mobile Specialist"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 6), notes: 'Application received' }]
  },
  {
    name: 'Shreya Nair',
    email: 'shreya.nair@example.com',
    phone: '+91 93322 11009',
    position: 'QA Automation Engineer',
    experienceYears: 4,
    skills: ['Playwright', 'Jest', 'Cypress', 'TypeScript'],
    resumeUrl: 'https://shreyanair.qa/resume.pdf',
    notes: 'Deep experience writing robust E2E test suites.',
    rating: 4,
    tags: ["Immediate Joiner"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 1), notes: 'Application received' }]
  },
  {
    name: 'Aditya Kulkarni',
    email: 'aditya.kulkarni@example.com',
    phone: '+91 92211 44332',
    position: 'Data Engineer',
    experienceYears: 3,
    skills: ['Python', 'SQL', 'MongoDB Aggregation', 'Kafka'],
    resumeUrl: 'https://adityak.dev/resume.pdf',
    notes: 'Pipeline data modeling and transformation specialist.',
    rating: 5,
    tags: ["Ex-FAANG","High Priority"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Application received' }]
  },
  {
    name: 'Divya Iyer',
    email: 'divya.iyer@example.com',
    phone: '+91 91100 99887',
    position: 'Product Manager',
    experienceYears: 5,
    skills: ['Agile', 'Jira', 'User Research', 'Product Analytics'],
    resumeUrl: 'https://divyaiyer.pm/cv.pdf',
    notes: 'Previous founder of an early-stage SaaS product.',
    rating: 4,
    tags: ["Referral","Top Talent"],
    stage: 'Applied',
    stageHistory: [{ from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 7), notes: 'Application received' }]
  },

  // 2. Screening (8 candidates)
  {
    name: 'Siddharth Rao',
    email: 'siddharth.rao@example.com',
    phone: '+91 98111 22334',
    position: 'Senior Frontend Engineer',
    experienceYears: 5,
    skills: ['React', 'TypeScript', 'Performance', 'Web Vitals'],
    resumeUrl: 'https://siddharthrao.dev/resume.pdf',
    notes: 'Recruiter screened on phone. Demonstrated deep React reconciliation mastery.',
    rating: 4,
    tags: ["Strong Communicator","Top Talent"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 8), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 6), notes: 'Passed resume filter' }
    ]
  },
  {
    name: 'Sneha Sengupta',
    email: 'sneha.s@example.com',
    phone: '+91 97222 33445',
    position: 'Backend Developer',
    experienceYears: 3,
    skills: ['Node.js', 'Microservices', 'Redis', 'RabbitMQ'],
    resumeUrl: 'https://snehas.me/cv.pdf',
    notes: 'Initial phone screen passed. Scheduled for technical interview.',
    rating: 5,
    tags: ["Ex-FAANG","System Design"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 5), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Phone screening positive' }
    ]
  },
  {
    name: 'Arjun Nambiar',
    email: 'arjun.nambiar@example.com',
    phone: '+91 96333 44556',
    position: 'Full Stack Engineer',
    experienceYears: 4,
    skills: ['Next.js', 'Node.js', 'Prisma', 'Tailwind CSS'],
    resumeUrl: 'https://arjunn.dev/resume.pdf',
    notes: 'High problem-solving aptitude. Solid GitHub portfolio.',
    rating: 4,
    tags: ["Immediate Joiner"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 7), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 4), notes: 'Screening review' }
    ]
  },
  {
    name: 'Meera Chawla',
    email: 'meera.chawla@example.com',
    phone: '+91 95444 55667',
    position: 'Frontend Developer',
    experienceYears: 2,
    skills: ['React', 'CSS/SCSS', 'Jest', 'Accessibility (a11y)'],
    resumeUrl: 'https://meerac.com/resume.pdf',
    notes: 'Passionate about accessible web software and semantic HTML.',
    rating: 4,
    tags: ["Referral","High Priority"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 6), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'Screening complete' }
    ]
  },
  {
    name: 'Harish Sundaram',
    email: 'harish.s@example.com',
    phone: '+91 94555 66778',
    position: 'DevOps Engineer',
    experienceYears: 4,
    skills: ['Docker', 'Kubernetes', 'Helm', 'Prometheus'],
    resumeUrl: 'https://harishs.cloud/cv.pdf',
    notes: 'Clear communication during screening call. Ready for tech round.',
    rating: 4,
    tags: ["Fast Learner"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 9), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 5), notes: 'Screening passed' }
    ]
  },
  {
    name: 'Tanvi Bhatia',
    email: 'tanvi.bhatia@example.com',
    phone: '+91 93666 77889',
    position: 'Security Engineer',
    experienceYears: 3,
    skills: ['OWASP Top 10', 'Penetration Testing', 'AppSec', 'Python'],
    resumeUrl: 'https://tanvibhatia.sec/cv.pdf',
    notes: 'Threat modeling and API vulnerability assessment background.',
    rating: 5,
    tags: ["Team Player","Top Talent"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 4), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'HR screening passed' }
    ]
  },
  {
    name: 'Manish Tiwari',
    email: 'manish.tiwari@example.com',
    phone: '+91 92777 88990',
    position: 'Backend Developer',
    experienceYears: 2,
    skills: ['Go', 'PostgreSQL', 'gRPC', 'Docker'],
    resumeUrl: 'https://manishtiwari.dev/resume.pdf',
    notes: 'Screened for backend concurrency roles. Strong fundamentals.',
    rating: 3,
    tags: ["Startup Veteran"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 6), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Screening passed' }
    ]
  },
  {
    name: 'Ritu Kapoor',
    email: 'ritu.kapoor@example.com',
    phone: '+91 91888 99001',
    position: 'Full Stack Engineer',
    experienceYears: 3,
    skills: ['React', 'Node.js', 'Express', 'Tailwind CSS'],
    resumeUrl: 'https://ritukapoor.dev/cv.pdf',
    notes: 'Well-rounded developer with agile teamwork experience.',
    rating: 4,
    tags: ["Strong Portfolio"],
    stage: 'Screening',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 5), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 1), notes: 'Screening passed' }
    ]
  },

  // 3. Interview (6 candidates)
  {
    name: 'Gaurav Agarwal',
    email: 'gaurav.agarwal@example.com',
    phone: '+91 98999 11223',
    position: 'Senior Backend Engineer',
    experienceYears: 6,
    skills: ['Node.js', 'MongoDB', 'System Design', 'Redis'],
    resumeUrl: 'https://gauravagarwal.dev/resume.pdf',
    notes: 'Round 1 technical interview cleared with flying colors. System design round upcoming.',
    rating: 5,
    tags: ["Top Talent","High Priority"],
    stage: 'Interview',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 12), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 9), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 4), notes: 'Technical Round 1 passed' }
    ]
  },
  {
    name: 'Ishaan Malhotra',
    email: 'ishaan.m@example.com',
    phone: '+91 97111 44556',
    position: 'Full Stack Engineer',
    experienceYears: 4,
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    resumeUrl: 'https://ishaanm.tech/cv.pdf',
    notes: 'Live coding challenge completed. Strong architectural reasoning.',
    rating: 5,
    tags: ["Ex-FAANG","Tech Lead Material"],
    stage: 'Interview',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 10), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 7), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'Live coding passed' }
    ]
  },
  {
    name: 'Kavita Pillai',
    email: 'kavita.pillai@example.com',
    phone: '+91 96222 55667',
    position: 'Engineering Manager',
    experienceYears: 8,
    skills: ['Team Leadership', 'Architecture', 'Mentorship', 'Agile'],
    resumeUrl: 'https://kavitapillai.me/cv.pdf',
    notes: 'Leadership and culture interview scheduled with founders.',
    rating: 4,
    tags: ["Problem Solver","Culture Fit"],
    stage: 'Interview',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 14), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 10), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Managerial Round 1' }
    ]
  },
  {
    name: 'Abhinav Saxena',
    email: 'abhinav.saxena@example.com',
    phone: '+91 95333 66778',
    position: 'Frontend Developer',
    experienceYears: 3,
    skills: ['React', 'Vite', 'State Machines', 'Tailwind CSS'],
    resumeUrl: 'https://abhinavs.dev/resume.pdf',
    notes: 'UI assessment passed. Impressed interviewers with clean component abstraction.',
    rating: 5,
    tags: ["Strong Communicator","Immediate Joiner"],
    stage: 'Interview',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 11), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 8), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 1), notes: 'Take-home assignment passed' }
    ]
  },
  {
    name: 'Deepika Choudhary',
    email: 'deepika.c@example.com',
    phone: '+91 94444 77889',
    position: 'Data Scientist',
    experienceYears: 4,
    skills: ['Python', 'PyTorch', 'NLP', 'Vector Databases'],
    resumeUrl: 'https://deepikac.ai/resume.pdf',
    notes: 'Interviewing for AI recommendation ranking role.',
    rating: 4,
    tags: ["System Design Star"],
    stage: 'Interview',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 9), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 6), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'Technical interview' }
    ]
  },
  {
    name: 'Naveen Kumar',
    email: 'naveen.kumar@example.com',
    phone: '+91 93555 88990',
    position: 'Backend Developer',
    experienceYears: 5,
    skills: ['Java', 'Spring Boot', 'Kafka', 'Elasticsearch'],
    resumeUrl: 'https://naveenkumar.dev/cv.pdf',
    notes: 'Final technical loop today.',
    rating: 4,
    tags: ["Referral"],
    stage: 'Interview',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 13), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 9), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Interview round' }
    ]
  },

  // 4. Offer (4 candidates)
  {
    name: 'Rahul Varma',
    email: 'rahul.varma@example.com',
    phone: '+91 98123 45678',
    position: 'Senior Full Stack Engineer',
    experienceYears: 6,
    skills: ['React', 'Node.js', 'MongoDB', 'AWS'],
    resumeUrl: 'https://rahulvarma.dev/cv.pdf',
    notes: 'Offer letter extended. Candidate reviewing package details.',
    rating: 5,
    tags: ["Top Talent","Priority Close"],
    stage: 'Offer',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 20), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 16), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 10), notes: 'Interviews cleared' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'Formal offer extended' }
    ]
  },
  {
    name: 'Pallavi Jain',
    email: 'pallavi.jain@example.com',
    phone: '+91 97234 56789',
    position: 'Lead UX Engineer',
    experienceYears: 7,
    skills: ['Design Systems', 'React', 'Figma', 'TypeScript'],
    resumeUrl: 'https://pallavijain.design/resume.pdf',
    notes: 'Compensation negotiation finalized. Expected start date in 3 weeks.',
    rating: 5,
    tags: ["Strong Offer","High Priority"],
    stage: 'Offer',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 18), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 14), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 8), notes: 'Portfolio presentation' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 1), notes: 'Offer rolled out' }
    ]
  },
  {
    name: 'Suresh Reddy',
    email: 'suresh.reddy@example.com',
    phone: '+91 96345 67890',
    position: 'Infrastructure Architect',
    experienceYears: 9,
    skills: ['Kubernetes', 'GCP', 'Terraform', 'Security'],
    resumeUrl: 'https://sureshreddy.cloud/cv.pdf',
    notes: 'Verbal offer accepted. Written contract sent.',
    rating: 4,
    tags: ["Culture Champion"],
    stage: 'Offer',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 22), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 18), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 11), notes: 'Deep architecture interview' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Offer released' }
    ]
  },
  {
    name: 'Anjali Menon',
    email: 'anjali.menon@example.com',
    phone: '+91 95456 78901',
    position: 'Senior Product Designer',
    experienceYears: 5,
    skills: ['Product Strategy', 'UI/UX', 'Design Tokens', 'Prototyping'],
    resumeUrl: 'https://anjalimenon.work/cv.pdf',
    notes: 'Competitive offer made. Candidate excited about EarlyJobs mission.',
    rating: 5,
    tags: ["Ex-FAANG","Leadership"],
    stage: 'Offer',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 16), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 12), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 7), notes: 'Final presentation' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 2), notes: 'Offer sent' }
    ]
  },

  // 5. Hired (4 candidates)
  {
    name: 'Karthik Swaminathan',
    email: 'karthik.s@example.com',
    phone: '+91 98111 88990',
    position: 'Staff Software Engineer',
    experienceYears: 8,
    skills: ['TypeScript', 'Node.js', 'Distributed Systems', 'MongoDB'],
    resumeUrl: 'https://karthikswami.dev/resume.pdf',
    notes: 'Joined EarlyJobs core platform engineering team on October 1st.',
    rating: 5,
    tags: ["Top Performer","Joined Team"],
    stage: 'Hired',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 35), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 30), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 22), notes: 'All rounds cleared' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 15), notes: 'Offer accepted' },
      { from: 'Offer', to: 'Hired', changedAt: new Date(Date.now() - 86400000 * 8), notes: 'Onboarded' }
    ]
  },
  {
    name: 'Aditi Bose',
    email: 'aditi.bose@example.com',
    phone: '+91 97222 99001',
    position: 'Frontend Engineer',
    experienceYears: 3,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit'],
    resumeUrl: 'https://aditibose.dev/cv.pdf',
    notes: 'Joined frontend team. Currently leading component library upgrade.',
    rating: 5,
    tags: ["Team Lead","Top Talent"],
    stage: 'Hired',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 30), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 25), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 18), notes: 'Technical test' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 12), notes: 'Offer accepted' },
      { from: 'Offer', to: 'Hired', changedAt: new Date(Date.now() - 86400000 * 5), notes: 'Onboarded' }
    ]
  },
  {
    name: 'Tushar Singhania',
    email: 'tushar.s@example.com',
    phone: '+91 96333 00112',
    position: 'Full Stack Engineer',
    experienceYears: 4,
    skills: ['React', 'Express', 'MongoDB', 'Docker'],
    resumeUrl: 'https://tushars.dev/resume.pdf',
    notes: 'Successfully joined. Shipped first PR within week 1.',
    rating: 4,
    tags: ["Strong Performer"],
    stage: 'Hired',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 28), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 24), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 16), notes: 'Interviews passed' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 10), notes: 'Offer accepted' },
      { from: 'Offer', to: 'Hired', changedAt: new Date(Date.now() - 86400000 * 4), notes: 'Onboarded' }
    ]
  },
  {
    name: 'Bhavna Kulkarni',
    email: 'bhavna.k@example.com',
    phone: '+91 95444 11223',
    position: 'Backend Developer',
    experienceYears: 4,
    skills: ['Node.js', 'PostgreSQL', 'Microservices', 'Redis'],
    resumeUrl: 'https://bhavnak.tech/cv.pdf',
    notes: 'Joined payments service team.',
    rating: 5,
    tags: ["Ex-FAANG","Onboarding Complete"],
    stage: 'Hired',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 32), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 26), notes: 'Screened' },
      { from: 'Screening', to: 'Interview', changedAt: new Date(Date.now() - 86400000 * 19), notes: 'System design' },
      { from: 'Interview', to: 'Offer', changedAt: new Date(Date.now() - 86400000 * 11), notes: 'Offer accepted' },
      { from: 'Offer', to: 'Hired', changedAt: new Date(Date.now() - 86400000 * 3), notes: 'Onboarded' }
    ]
  },

  // 6. Rejected (3 candidates)
  {
    name: 'Sunil Mathur',
    email: 'sunil.mathur@example.com',
    phone: '+91 94111 55667',
    position: 'Frontend Developer',
    experienceYears: 1,
    skills: ['HTML', 'CSS', 'Basic JavaScript'],
    resumeUrl: 'https://sunilmathur.info/cv.pdf',
    notes: 'Did not meet minimum React & TypeScript requirement for senior grade.',
    rating: 2,
    tags: ["Skill Gap"],
    stage: 'Rejected',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 15), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 12), notes: 'Screened' },
      { from: 'Screening', to: 'Rejected', changedAt: new Date(Date.now() - 86400000 * 10), notes: 'Skill mismatch for level' }
    ]
  },
  {
    name: 'Pooja Bhatt',
    email: 'pooja.bhatt@example.com',
    phone: '+91 93222 66778',
    position: 'DevOps Engineer',
    experienceYears: 2,
    skills: ['Bash', 'Linux', 'Git'],
    resumeUrl: 'https://poojabhatt.dev/cv.pdf',
    notes: 'Candidate accepted an alternate counter-offer before interviews.',
    rating: 3,
    tags: ["Future Prospect"],
    stage: 'Rejected',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 14), notes: 'Application received' },
      { from: 'Applied', to: 'Screening', changedAt: new Date(Date.now() - 86400000 * 11), notes: 'Screened' },
      { from: 'Screening', to: 'Rejected', changedAt: new Date(Date.now() - 86400000 * 9), notes: 'Candidate withdrew' }
    ]
  },
  {
    name: 'Rajesh Nair',
    email: 'rajesh.nair@example.com',
    phone: '+91 92333 77889',
    position: 'Backend Developer',
    experienceYears: 3,
    skills: ['PHP', 'MySQL', 'jQuery'],
    resumeUrl: 'https://rajeshnair.me/resume.pdf',
    notes: 'Role requires modern Node.js and MongoDB asynchronous stack.',
    rating: 2,
    tags: ["Tech Stack Divergence"],
    stage: 'Rejected',
    stageHistory: [
      { from: null, to: 'Applied', changedAt: new Date(Date.now() - 86400000 * 18), notes: 'Application received' },
      { from: 'Applied', to: 'Rejected', changedAt: new Date(Date.now() - 86400000 * 16), notes: 'Tech stack divergence' }
    ]
  }
];

async function seedDatabase() {
  console.log('🌱 Connecting to MongoDB Atlas for idempotent seeding...');
  await mongoose.connect(MONGODB_URI!, {
    serverSelectionTimeoutMS: 15000
  });

  console.log('✅ Connected to MongoDB Atlas.');

  let insertedCount = 0;
  let updatedCount = 0;

  for (const record of SEED_CANDIDATES) {
    const res = await Candidate.findOneAndUpdate(
      { email: record.email },
      { $set: record },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (res) {
      insertedCount++;
    }
  }

  console.log(`🎉 Seeding complete! Processed ${insertedCount} candidates across all 6 hiring stages.`);
  console.log('📊 Stage distribution:');
  console.log('   - Applied: 10');
  console.log('   - Screening: 8');
  console.log('   - Interview: 6');
  console.log('   - Offer: 4');
  console.log('   - Hired: 4');
  console.log('   - Rejected: 3');
  console.log(`   - Total: ${SEED_CANDIDATES.length} candidates`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected cleanly from database.');
}

if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  seedDatabase().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
