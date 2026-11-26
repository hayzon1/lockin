import { motion, useScroll, useSpring } from 'framer-motion';
import LandingHeader from '../components/landing/LandingHeader';
import HeroBeat from '../components/landing/HeroBeat';
import ProblemBeat from '../components/landing/ProblemBeat';
import SolutionBeat from '../components/landing/SolutionBeat';
import LongGoalBeat from '../components/landing/LongGoalBeat';
import WindowBeat from '../components/landing/WindowBeat';
import RitualBeat from '../components/landing/RitualBeat';
import StreakBeat from '../components/landing/StreakBeat';
import ProofBeat from '../components/landing/ProofBeat';
import StepsBeat from '../components/landing/StepsBeat';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
}

export default function LandingPage({ onLogin, onGetStarted }: LandingPageProps) {
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100">
      <LandingHeader onLogin={onLogin} />
      <motion.div
        aria-hidden
        style={{ scaleX: bar }}
        className="fixed left-0 right-0 top-14 z-20 h-0.5 origin-left bg-emerald-500"
      />
      <main>
        <HeroBeat />
        <ProblemBeat />
        <SolutionBeat />
        <LongGoalBeat />
        <WindowBeat />
        <RitualBeat />
        <StreakBeat />
        <ProofBeat />
        <StepsBeat onGetStarted={onGetStarted} />
      </main>
    </div>
  );
}
