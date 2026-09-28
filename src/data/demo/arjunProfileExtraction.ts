import type { ProfileExtraction } from '../../types/profile/profileExtraction'

/** Synthetic development fixture. It is explicitly not a live AI result. */
export const ARJUN_PROFILE_EXTRACTION: ProfileExtraction = {
  candidate: {
    name: 'Arjun Mehta',
    currentTitle: 'Principal Technology Architect',
    location: 'Bengaluru, India',
    nationality: 'Indian',
    age: 43,
  },
  extraction: { confidence: 'HIGH', quality: 'RICH' },
  sections: [
    { title: 'Education', items: [
      { sourcePage: null, text: '2006–2008 Indian Institute of Technology Madras – M.Tech in Computer Science and Engineering (Thesis: “Sca”).' },
      { sourcePage: null, text: '2002–2006 Anna University – B.E. in Computer Science and Engineering.' },
    ]},
    { title: 'Employment History', items: [
      { sourcePage: null, text: 'Principal Technology Architect — GlobalTech Systems Pvt. Ltd. (2018–Present). Responsibilities include architecture of distributed enterprise platforms, cloud migration programs, technical architecture reviews, platform reliability, API governance, AI infrastructure, mentoring senior engineering teams, and technical decision-making across multiple programs. Provides architectural guidance to approximately 35 engineers across four teams; direct reports: 8.' },
      { sourcePage: null, text: 'Senior Solutions Architect — CloudSphere Technologies (2013–2018). Worked on cloud migration, distributed data platforms, enterprise APIs, containerized applications and infrastructure modernization. Led architecture activities for programs involving multiple enterprise customers.' },
      { sourcePage: null, text: 'Software Architect — TechNova Solutions (2009–2013). Worked on enterprise middleware, integration platforms, distributed systems and data processing.' },
      { sourcePage: null, text: 'Senior Software Engineer — Infoware Systems (2006–2009). Software engineering work involving enterprise systems and distributed technology.' },
    ]},
    { title: 'Major Technical Contributions', items: [
      { sourcePage: null, text: 'Distributed Configuration Drift Detection Platform (2019). Designed internal platform comparing configuration states across development, staging and production environments; generates environment-difference reports. Used across several internal projects. Evidence: architecture diagram, internal technical document, screenshots. No independent publication or patent.' },
      { sourcePage: null, text: 'Cloud Migration Architecture. Lead architect for a large enterprise migration from legacy infrastructure to cloud-native architecture. Claimed scope: 300+ services and 20+ engineering teams across multiple geographical regions. Reported outcomes: reduced deployment time, improved observability, infrastructure standardization. Evidence: internal project documentation, architecture diagrams, manager confirmation.' },
      { sourcePage: null, text: 'AI Infrastructure Optimization Framework. Designed internal framework for estimating infrastructure requirements of large-scale machine-learning workloads. Reportedly reduced infrastructure planning time. Evidence: internal technical document only.' },
    ]},
    { title: 'Publications', items: [
      { sourcePage: null, text: '“Distributed Event Processing for Enterprise Data Platforms,” International Journal of Emerging Computing Systems, 2011. Evidence: PDF copy and publication page. Indexing status, citation count, peer-review documentation unknown.' },
      { sourcePage: null, text: '“Cloud Migration Patterns for Distributed Enterprise Applications,” Technology blog, 2022. Author listed as Arjun Mehta. Evidence: webpage. No peer review or citation evidence.' },
    ]},
    { title: 'Patent / IP', items: [
      { sourcePage: null, text: '“System and Method for Detecting Configuration Drift Across Distributed Enterprise Systems,” patent application submitted 2021. Status: pending / requires verification. Evidence: application number and filing document. No granted patent.' },
    ]},
    { title: 'Awards & Recognition', items: [
      { sourcePage: null, text: 'GlobalTech Architecture Excellence Award — 2022. Internal award for contribution to cloud migration architecture. Evidence: internal award certificate.' },
      { sourcePage: null, text: '“Top Architect” Recognition — 2023. Internal company recognition. Evidence: HR recognition email.' },
    ]},
    { title: 'Professional Memberships', items: [
      { sourcePage: null, text: 'IEEE member' },
      { sourcePage: null, text: 'ACM member' },
      { sourcePage: null, text: 'Cloud Native Computing Foundation community participant' },
    ]},
    { title: 'Judging / Reviewing', items: [
      { sourcePage: null, text: 'University Hackathon Judge — 2024. Technical judge for a university-level software hackathon. Evidence: invitation email and event webpage.' },
      { sourcePage: null, text: 'Conference Reviewer — 2025. Reviewed two technical submissions for an international conference. Evidence: reviewer acknowledgement email. No public reviewer profile.' },
    ]},
    { title: 'Speaking & Presentations', items: [
      { sourcePage: null, text: 'Guest Lecture — 2024 “Designing Reliable Cloud-Native Enterprise Systems.” Evidence: invitation, presentation slides, event photograph.' },
      { sourcePage: null, text: 'Technology Webinar — 2025 “Modernizing Legacy Enterprise Systems.” Evidence: webinar recording and organizer page.' },
    ]},
    { title: 'Media / External Coverage', items: [
      { sourcePage: null, text: 'Industry Interview — 2023. Technology publication interview titled “How Enterprises Are Moving Beyond Legacy Infrastructure.” Evidence: article URL and publication metadata; approximately 300 words.' },
    ]},
    { title: 'International Experience', items: [
      { sourcePage: null, text: 'Worked on projects involving the United States, Germany, Singapore and India. Profile lacks complete documentation of corporate relationships between foreign and U.S. entities.' },
    ]},
    { title: 'Management & Leadership', items: [
      { sourcePage: null, text: 'Current role: Principal Technology Architect. Team influence: approximately 35 engineers across four teams. Direct reports: 8. Budget authority unclear; hiring authority partial; performance-review authority unclear.' },
    ]},
    { title: 'Compensation', items: [
      { sourcePage: null, text: 'Approximately ₹72 lakh/year. Evidence: employment contract and salary statements. No independent industry benchmark provided.' },
    ]},
    { title: 'External Visibility', items: [
      { sourcePage: null, text: 'LinkedIn profile has approximately 18,000 followers. Technical posts occasionally receive 500–2,000 views and 50–150 reactions. No independent evidence establishing professional recognition.' },
    ]},
  ],
  claims: [
    { sourcePage: null, text: "One of the world's leading cloud architects.", verificationStatus: 'ASSERTED_UNVERIFIED', verificationReason: 'unsupported-superlative' },
    { sourcePage: null, text: 'Designed a platform used by millions of users.', verificationStatus: 'ASSERTED_UNVERIFIED', verificationReason: 'unsupported-quantitative-claim' },
    { sourcePage: null, text: 'Recognized among the top 1% of cloud architects globally.', verificationStatus: 'ASSERTED_UNVERIFIED', verificationReason: 'unsupported-superlative' },
    { sourcePage: null, text: 'Architected one of the largest enterprise cloud migrations in Asia.', verificationStatus: 'ASSERTED_UNVERIFIED', verificationReason: 'unsupported-quantitative-claim' },
  ],
  ambiguities: [],
  otherItems: [],
  meta: { provider: 'Development fixture', model: 'Arjun synthetic profile extraction', fixture: true },
}
