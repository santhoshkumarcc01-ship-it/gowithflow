# GoWithFlow 🌊

> **Find Your Direction. Grow With Flow.**  
> *AI-Powered Career Intelligence & Personalized Learning Platform.*

GoWithFlow is an intelligent career development ecosystem that helps learners understand their current capabilities, discover skill gaps, explore career opportunities, and follow personalized learning journeys.

---

## 🚀 Key Features

### 1. GoWithFlow Profile
- **Holistic Competency Graph**: Connects personal background, education, learning interests, and technical skills with evidence.
- **Project & Certification Showcase**: Direct repository verification and credential tracking.

### 2. GoWithFlow Pathways (Learning Pathway Agent)
- **AI Career Gap Analysis**: Real-time evaluation of current capabilities against 2026 industry standards.
- **Dynamic Multi-Phase Roadmaps**: Generates structured phases with target competencies and learning durations.
- **Curated Learning Resources**: Direct access to documentation, tutorials, and local coursework repositories.

### 3. GoWithFlow Insights (Career Evaluation Agent)
- **Multi-Vector Readiness Auditing**: Detailed scoring across Technical Skills, Projects, Certifications, Portfolio, and Career Preparation.
- **Actionable Growth Plans**: Concrete strengths, identified gaps, and next-step actions.

### 4. GoWithFlow Mentor (AI Companion)
- **Context-Aware Study Guidance**: Connected to enrolled coursework, pending tasks, and active roadmap milestones.
- **Interactive Advice**: Goal setting, structured study sessions, progress reflection, and weekly planning.

### 5. GoWithFlow Progress (Learning Tracker)
- **Measurable Growth**: Real-time tracking of logged study hours, milestone completion velocity, and attendance ledger.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js / React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend & Database**: Next.js API Routes, Supabase PostgreSQL, Prisma ORM, SQLite
- **AI Engine**: Google Gemini Generative AI (`gemini-3.5-flash-lite`) via `@google/generative-ai`
- **Authentication**: Passwordless Email OTP Authentication with JWT HTTP-only sessions

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="your_secure_session_secret"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-3.5-flash-lite"
SUPABASE_URL="your_supabase_url"
SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"
SUPABASE_SECRET_KEY="your_supabase_service_role_key"
```

### 3. Run Database Migrations
```bash
npx prisma generate
npx prisma db push
```

### 4. Launch Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to experience GoWithFlow.

---

## 📄 License
© 2026 GoWithFlow. All rights reserved.
