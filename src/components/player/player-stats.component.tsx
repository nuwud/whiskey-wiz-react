// player-stats.component.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card-ui.component';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../config/firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
import { useAuth } from '../../contexts/auth.context';

// Define our interfaces for type safety
interface GameResult {
    id: string;
    quarterId: string;
    score: number;
    completedAt: Date;
    samples: Array<{
        id: string;
        accuracy: number;
        timeSpent: number;
    }>;
}

export interface PlayerStats {
    totalScore: number;
    totalGames: number;
    averageScore: number;
    recentResults: GameResult[];
    bestQuarterScore: number;
    totalQuartersCompleted: number;
    averageScorePerQuarter: number;
}

export const PlayerStatsComponent: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<PlayerStats>({
        totalScore: 0,
        totalGames: 0,
        averageScore: 0,
        recentResults: [],
        bestQuarterScore: 0,
        totalQuartersCompleted: 0,
        averageScorePerQuarter: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                const resultsRef = collection(db, 'gameResults');
                const q = query(resultsRef, where('userId', '==', user.userId));
                const querySnapshot = await getDocs(q);

                const results = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    completedAt: doc.data().completedAt?.toDate()
                })) as GameResult[];

                const totalGames = results.length;
                const totalScore = results.reduce((sum, result) => sum + result.score, 0);
                const bestScore = Math.max(...results.map(r => r.score));

                setStats({
                    totalScore: totalScore,
                    totalGames: totalGames,
                    averageScore: totalGames > 0 ? totalScore / totalGames : 0,
                    bestQuarterScore: bestScore,
                    recentResults: results.slice(0, 5), // Last 5 games
                    totalQuartersCompleted: results.reduce((sum, result) => sum + result.samples.length, 0),
                    averageScorePerQuarter: totalGames > 0 ? totalScore / results.reduce((sum, result) => sum + result.samples.length, 0) : 0
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, [user]);

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Total Games</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalGames}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.averageScore.toFixed(1)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Best Score</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.bestQuarterScore}
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-3">
                <CardHeader>
                    <CardTitle>Recent Games</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recentResults.map(result => (
                            <div key={result.id} className="flex items-center justify-between">
                                <span>{new Date(result.completedAt).toLocaleDateString()}</span>
                                <span className="text-lg font-medium">{result.score}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlayerStats;