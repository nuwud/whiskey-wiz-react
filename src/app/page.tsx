import { GameComponent } from '@/components/game/GameComponent';
import { useFeature } from '@/contexts/FeatureContext';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">BlindBarrels.com</h1>
      <GameComponent />
    </main>
  );
}
