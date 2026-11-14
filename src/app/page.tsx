'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Check, Sparkles, ChevronDown, Compass, Target, TrendingUp, Layers, Cpu, Award, HelpCircle } from 'lucide-react';

// ==========================================
// 1. SHARED ANIMATION COMPONENTS
// ==========================================

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
}

function WordsPullUp({ text, className = '', showAsterisk = false }: WordsPullUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const words = text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={`inline-flex flex-wrap justify-center ${className}`}
    >
      {words.map((word, idx) => {
        const isLastWord = idx === words.length - 1;
        return (
          <span key={idx} className="relative inline-block mr-[0.25em] whitespace-nowrap">
            <motion.span variants={wordVariants} className="inline-block">
              {word}
            </motion.span>
            {isLastWord && showAsterisk && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em] text-[#E1E0CC] font-normal">
                *
              </span>
            )}
          </span>
        );
      })}
    </motion.span>
  );
}

interface WordsPullUpMultiStyleProps {
  segments: { text: string; className: string }[];
  className?: string;
}

function WordsPullUpMultiStyle({ segments, className = '' }: WordsPullUpMultiStyleProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={`inline-flex flex-wrap justify-center ${className}`}
    >
      {segments.map((segment, segIdx) => {
        const words = segment.text.split(' ');
        return (
          <React.Fragment key={segIdx}>
            {words.map((word, wordIdx) => (
              <span key={`${segIdx}-${wordIdx}`} className="inline-block mr-[0.25em] whitespace-nowrap">
                <motion.span variants={wordVariants} className={`inline-block ${segment.className}`}>
                  {word}
                </motion.span>
              </span>
            ))}
          </React.Fragment>
        );
      })}
    </motion.div>
  );
}

interface AnimatedCharacterProps {
  char: string;
  index: number;
  total: number;
  progress: any;
}

function AnimatedCharacter({ char, index, total, progress }: AnimatedCharacterProps) {
  const charProgress = index / total;
  const opacity = useTransform(
    progress,
    [Math.max(0, charProgress - 0.1), Math.min(1, charProgress + 0.05)],
    [0.2, 1]
  );

  return <motion.span style={{ opacity }}>{char}</motion.span>;
}

// ==========================================
// 2. MAIN LANDING PAGE COMPONENT
// ==========================================

export default function LandingPage() {
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Scroll tracking for character reveal in Section 2
  const { scrollYProgress } = useScroll({
    target: aboutRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const aboutParagraph = "You don't need another endless list of courses. You need a better understanding of your starting point and a clearer direction forward. That's where GoWithFlow comes in: connecting your skills, career goals, and personalized roadmaps into a continuous learning flow.";
  const chars = aboutParagraph.split('');

  const cardContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const isFeaturesInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const isHowInView = useInView(howItWorksRef, { once: true, margin: '-100px' });

  const faqs = [
    {
      q: "What is GoWithFlow?",
      a: "GoWithFlow is an AI-powered career intelligence and personalized learning platform that helps learners understand their skills, identify career gaps and follow structured learning roadmaps."
    },
    {
      q: "How does GoWithFlow identify my skill gaps?",
      a: "It compares your existing learner profile with the competencies associated with your selected target career and identifies areas that may need improvement."
    },
    {
      q: "Does GoWithFlow generate personalized learning roadmaps?",
      a: "Yes. It uses your existing skills, career goals, learning preferences and available time to generate a structured learning roadmap."
    },
    {
      q: "Can I add projects and certifications?",
      a: "Yes. You can add multiple projects, certifications and relevant professional links to your learner profile."
    },
    {
      q: "How does career evaluation work?",
      a: "The Career Evaluation Agent analyzes available information about your skills, projects, certifications, portfolio and assessments to generate a structured career readiness report."
    },
    {
      q: "Can I change my career goal?",
      a: "Yes. You can update your target career and regenerate learning recommendations for your new direction."
    },
    {
      q: "What does the AI Mentor do?",
      a: "The AI Mentor provides personalized learning guidance using your profile, roadmap and progress as context."
    },
    {
      q: "Does GoWithFlow guarantee a job?",
      a: "No. GoWithFlow helps you understand and improve your career preparation. Employment outcomes depend on many factors, including practical ability, experience, interviews and market conditions."
    }
  ];

  return (
    <div className="bg-black text-[#E1E0CC] overflow-x-hidden min-h-screen selection:bg-[#DEDBC8] selection:text-black">
      
      {/* SECTION 1: HERO */}
      <section className="h-screen w-screen p-4 md:p-6 bg-black relative">
        <div className="w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden relative bg-neutral-950">
          
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
          />

          {/* SVG Noise Overlay */}
          <div className="absolute inset-0 noise-overlay opacity-[0.7] mix-blend-overlay pointer-events-none z-10"></div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 z-10"></div>

          {/* Hanging Navbar Pill */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
            <nav className="bg-black rounded-b-2xl md:rounded-b-3xl px-6 py-2.5 md:px-10 border-b border-x border-[#E1E0CC]/10 flex items-center justify-between gap-4 sm:gap-8 md:gap-12 lg:gap-14 shadow-2xl">
              <a href="#how-it-works" className="text-[10px] sm:text-xs md:text-sm font-bold lowercase tracking-wider text-[#E1E0CC]/80 hover:text-[#E1E0CC] transition-colors">
                how it works
              </a>
              <a href="#features" className="text-[10px] sm:text-xs md:text-sm font-bold lowercase tracking-wider text-[#E1E0CC]/80 hover:text-[#E1E0CC] transition-colors">
                ai intelligence
              </a>
              <a href="#faq" className="text-[10px] sm:text-xs md:text-sm font-bold lowercase tracking-wider text-[#E1E0CC]/80 hover:text-[#E1E0CC] transition-colors">
                faq
              </a>
              <Link href="/login" className="text-[10px] sm:text-xs md:text-sm font-bold lowercase tracking-wider text-[#E1E0CC]/80 hover:text-[#E1E0CC] transition-colors">
                sign in
              </Link>
            </nav>
          </div>

          {/* Bottom aligned content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 bg-gradient-to-t from-black/80 to-transparent">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
              
              {/* Giant Heading */}
              <div className="md:col-span-8 text-left">
                <span className="text-primary text-[10px] sm:text-xs font-bold tracking-widest uppercase block mb-2">
                  CAREER GROWTH, WITH INTELLIGENCE.
                </span>
                <WordsPullUp
                  text="GoWithFlow"
                  showAsterisk={true}
                  className="text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] xl:text-[10vw] font-medium leading-[0.85] tracking-[-0.07em] text-[#E1E0CC]"
                />
              </div>

              {/* Text + Button */}
              <div className="md:col-span-4 text-left space-y-6">
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className="text-primary/70 text-xs sm:text-sm md:text-base leading-[1.2] font-medium"
                >
                  Your Potential Has a Direction. Let&apos;s Find It. GoWithFlow helps you understand your skills, discover career opportunities, identify what you need to improve and build a personalized learning journey toward your goals.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className="flex items-center gap-3 flex-wrap"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 pl-6 pr-2 py-2 bg-[#DEDBC8] hover:bg-[#DEDBC8]/90 text-black font-semibold text-sm sm:text-base rounded-full group transition-all"
                  >
                    <span>Discover My Path</span>
                    <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white transition-all group-hover:scale-110">
                      <ArrowRight className="w-4 h-4 sm:w-5 h-5 text-[#DEDBC8]" />
                    </div>
                  </Link>

                  <a
                    href="#how-it-works"
                    className="text-xs sm:text-sm font-semibold text-[#E1E0CC]/80 hover:text-[#E1E0CC] transition-colors py-2 px-3"
                  >
                    Explore How It Works &darr;
                  </a>
                </motion.div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: THE PROBLEM & PROMISE */}
      <section ref={aboutRef} className="bg-black py-32 px-6 flex items-center justify-center border-t border-neutral-900">
        <div className="bg-[#101010] border border-neutral-800/40 rounded-3xl p-12 md:p-20 text-center max-w-6xl w-full shadow-2xl relative">
          <div className="absolute inset-0 noise-overlay opacity-[0.1] mix-blend-overlay pointer-events-none rounded-3xl"></div>
          
          <span className="text-primary uppercase tracking-widest text-[10px] sm:text-xs font-bold block mb-6">
            DISCOVER — UNDERSTAND YOUR POTENTIAL
          </span>

          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-4xl mx-auto leading-[0.95] sm:leading-[0.9] text-[#E1E0CC] mb-8">
            <WordsPullUpMultiStyle
              segments={[
                { text: "Learning More Doesn't Always ", className: "font-normal" },
                { text: "Mean Moving Forward. ", className: "font-serif italic text-primary" },
                { text: "Find Your Direction. Grow With Flow.", className: "font-normal" }
              ]}
            />
          </div>

          <div className="max-w-2xl mx-auto text-[#DEDBC8] text-xs sm:text-sm md:text-base leading-relaxed font-medium">
            {chars.map((char, index) => (
              <AnimatedCharacter
                key={index}
                char={char}
                index={index}
                total={chars.length}
                progress={scrollYProgress}
              />
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 3: THE SOLUTION & AI INTELLIGENCE */}
      <section id="features" ref={featuresRef} className="min-h-screen bg-black py-32 px-6 relative border-t border-neutral-900">
        <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          
          <div className="text-center space-y-4">
            <span className="text-primary uppercase tracking-widest text-[10px] sm:text-xs font-bold block">
              ONE INTELLIGENT SYSTEM
            </span>
            <WordsPullUpMultiStyle
              segments={[
                { text: "A Clearer Career Journey. ", className: "text-[#E1E0CC] block mb-2" },
                { text: "Built for pure clarity. Powered by career intelligence.", className: "text-gray-500 block" }
              ]}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal"
            />
          </div>

          {/* 4-Column Card Grid */}
          <motion.div
            variants={cardContainerVariants}
            initial="hidden"
            animate={isFeaturesInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:h-[480px] gap-3"
          >
            
            {/* Card 1 - Video Card */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl overflow-hidden relative border border-neutral-800/40 bg-neutral-950 flex flex-col justify-end p-6 h-[400px] lg:h-full group"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
              <h4 className="text-lg font-bold text-[#E1E0CC] relative z-20">GoWithFlow Pathways & Real-Time Intelligence.</h4>
            </motion.div>

            {/* Card 2 - Profile & Skill Gaps */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-neutral-800/40 bg-[#212121] p-6 flex flex-col justify-between h-[400px] lg:h-full relative"
            >
              <div className="space-y-6">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85"
                  alt="Profile icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">01</span>
                  <h4 className="text-base font-bold text-[#E1E0CC]">Profile & Skill Gaps</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Complete profile with skills & projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Compare capabilities against target role</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Discover critical technical & practical gaps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Evidence-based portfolio evaluation</span>
                  </li>
                </ul>
              </div>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1E0CC] hover:text-white transition-colors group">
                <span>Explore Profile</span>
                <ArrowRight className="w-3.5 h-3.5 transform -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Card 3 - Learning Pathway Agent */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-neutral-800/40 bg-[#212121] p-6 flex flex-col justify-between h-[400px] lg:h-full relative"
            >
              <div className="space-y-6">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85"
                  alt="Pathway agent icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">02</span>
                  <h4 className="text-base font-bold text-[#E1E0CC]">Learning Pathway Agent</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Personalized multi-phase roadmap</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Curated study resources & local materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Milestone velocity & study tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Objective match % against 2026 industry</span>
                  </li>
                </ul>
              </div>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1E0CC] hover:text-white transition-colors group">
                <span>Explore Roadmaps</span>
                <ArrowRight className="w-3.5 h-3.5 transform -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Card 4 - Career Evaluation & AI Mentor */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-neutral-800/40 bg-[#212121] p-6 flex flex-col justify-between h-[400px] lg:h-full relative"
            >
              <div className="space-y-6">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85"
                  alt="Mentor icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">03</span>
                  <h4 className="text-base font-bold text-[#E1E0CC]">Evaluation & AI Mentor</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Multi-vector career readiness audit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Verified strengths & growth opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Context-aware AI Mentor 24/7</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Goal setting & weekly progress reflection</span>
                  </li>
                </ul>
              </div>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1E0CC] hover:text-white transition-colors group">
                <span>Meet AI Mentor</span>
                <ArrowRight className="w-3.5 h-3.5 transform -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section id="how-it-works" ref={howItWorksRef} className="py-28 px-6 bg-black border-t border-neutral-900 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-primary uppercase tracking-widest text-[10px] sm:text-xs font-bold block">
              STEP-BY-STEP PROGRESSION
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-medium tracking-tight text-[#E1E0CC]">
              From Where You Are to Where You Want to Be.
            </h2>
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-400 leading-relaxed">
              Your career journey should have direction. GoWithFlow transforms an uncertain learning process into a structured and personalized experience.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHowInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            {[
              {
                step: '01',
                title: 'Build Your Profile',
                desc: 'Add your academic background, interests, existing skills, certifications, projects and career ambitions.'
              },
              {
                step: '02',
                title: 'Discover Potential',
                desc: 'Our career intelligence system analyzes your profile and target career to identify strengths and skill gaps.'
              },
              {
                step: '03',
                title: 'Generate Roadmap',
                desc: 'Receive a personalized learning plan with relevant resources, practical exercises and structured milestones.'
              },
              {
                step: '04',
                title: 'Learn & Progress',
                desc: 'Follow your roadmap, complete learning activities and track your weekly study hour development.'
              },
              {
                step: '05',
                title: 'Evaluate & Grow',
                desc: 'Receive career readiness insights based on your skills, projects, certifications and assessments.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#121212] border border-neutral-800/60 rounded-2xl p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
                <div>
                  <span className="text-xs font-mono font-bold text-primary block mb-3">STEP {item.step}</span>
                  <h4 className="text-sm font-bold text-[#E1E0CC] mb-2">{item.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: THREE CORE PILLARS */}
      <section className="py-24 px-6 bg-[#0B0B0B] border-t border-neutral-900">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-primary uppercase tracking-widest text-[10px] sm:text-xs font-bold block">
              THE THREE CORE PILLARS
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#E1E0CC]">
              Clarity. Direction. Growth.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-primary">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-[#E1E0CC]">DISCOVER — Understand Potential</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Understand the learner&apos;s existing capabilities, interests, strengths, experience and career ambitions without assumptions.
              </p>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-[#E1E0CC]">DEVELOP — Build Direction</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Identify skill gaps, discover relevant resources and create personalized learning roadmaps based on your current level and target career.
              </p>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-[#E1E0CC]">EVALUATE — Measure Growth</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Evaluate technical skills, projects, certifications, portfolio and assessment results. Track improvements and identify the next areas to develop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ ACCORDION */}
      <section id="faq" className="py-28 px-6 bg-black border-t border-neutral-900">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-primary uppercase tracking-widest text-[10px] sm:text-xs font-bold block">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#E1E0CC]">
              Got Questions? We&apos;ve Got Answers.
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-[#121212] border border-neutral-800/80 rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-[#E1E0CC] hover:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-neutral-800/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section className="py-24 px-6 bg-[#0E0E0E] border-t border-neutral-900 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-primary text-[10px] sm:text-xs font-bold tracking-widest uppercase block">
            FIND YOUR DIRECTION. GROW WITH FLOW.
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#E1E0CC]">
            Your Next Chapter Starts With a Clear Direction.
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">
            You already have a starting point. What matters now is understanding where you want to go and what you need to do next. Let GoWithFlow help you turn your ambitions into a structured learning journey.
          </p>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#DEDBC8] hover:bg-[#DEDBC8]/90 text-black font-bold text-sm sm:text-base rounded-full shadow-lg hover:scale-105 transition-all"
            >
              <span>Start My Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-[11px] text-gray-500 pt-2">
            Discover your strengths &bull; Identify your skill gaps &bull; Find your direction &bull; Grow with flow
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-neutral-900 py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-xs">
          <div className="space-y-3 md:col-span-1">
            <h4 className="text-base font-bold text-[#E1E0CC]">GoWithFlow</h4>
            <p className="text-gray-500 leading-relaxed">
              AI-Powered Career Intelligence & Personalized Learning Platform.
            </p>
            <p className="text-[11px] text-primary font-medium">
              Find Your Direction. Grow With Flow.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[#E1E0CC] uppercase text-[10px] tracking-wider">Platform</h5>
            <ul className="space-y-1.5 text-gray-400">
              <li><Link href="/" className="hover:text-[#E1E0CC]">Home</Link></li>
              <li><a href="#how-it-works" className="hover:text-[#E1E0CC]">How It Works</a></li>
              <li><a href="#features" className="hover:text-[#E1E0CC]">AI Intelligence</a></li>
              <li><Link href="/login" className="hover:text-[#E1E0CC]">Learning Roadmaps</Link></li>
              <li><Link href="/login" className="hover:text-[#E1E0CC]">Career Evaluation</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[#E1E0CC] uppercase text-[10px] tracking-wider">Account</h5>
            <ul className="space-y-1.5 text-gray-400">
              <li><Link href="/login" className="hover:text-[#E1E0CC]">Sign In</Link></li>
              <li><Link href="/login" className="hover:text-[#E1E0CC]">Get Started</Link></li>
              <li><Link href="/student/dashboard" className="hover:text-[#E1E0CC]">Learner Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[#E1E0CC] uppercase text-[10px] tracking-wider">Support & FAQs</h5>
            <ul className="space-y-1.5 text-gray-400">
              <li><a href="#faq" className="hover:text-[#E1E0CC]">Frequently Asked Questions</a></li>
              <li><Link href="/login" className="hover:text-[#E1E0CC]">AI Mentor</Link></li>
              <li><Link href="/login" className="hover:text-[#E1E0CC]">Help Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-600">
          <p>&copy; {new Date().getFullYear()} GoWithFlow. All rights reserved.</p>
          <p>Connecting individual capabilities, learning opportunities and career ambitions.</p>
        </div>
      </footer>
    </div>
  );
}
