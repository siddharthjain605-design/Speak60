import { useStore } from '../store';
import ProgressContent from '../components/progress/ProgressContent';

export default function ProgressPage() {
  const attempts = useStore((s) => s.attempts);
  const badges = useStore((s) => s.badges);
  return <ProgressContent attempts={attempts} badges={badges} />;
}
