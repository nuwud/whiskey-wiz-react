import React, { useState } from 'react';
import { Copy, Share2, Twitter, Facebook } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card-ui.component";
import { Alert } from "../../components/ui/alert-ui.component";

interface ShareResultsProps {
    score: number;
    totalSamples: number;
    bestGuess: {
        sampleId: string;
        accuracy: number;
        name: string;
    };
}

const ShareResults: React.FC<ShareResultsProps> = ({ score, totalSamples, bestGuess }) => {
    const [showCopied, setShowCopied] = useState(false);

    // Generate the share text
    const shareText = `🥃 I scored ${score} points on ${totalSamples} whiskey samples in Whiskey Wiz! My best guess was ${bestGuess.name} with ${bestGuess.accuracy}% accuracy. Can you beat my score?`;

    // Generate the share URL (update with your actual domain)
    const shareUrl = `${window.location.origin}/play`;

    // Handle copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Handle social media sharing
    const handleShare = async () => {
        if ('share' in navigator) {
            try {
                await navigator.share({
                    title: 'Whiskey Wiz Results',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        }
    };

    // Generate Twitter share URL
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    // Generate Facebook share URL
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Share Your Results
                </CardTitle>
                <CardDescription>
                    Share your whiskey tasting expertise with friends!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {showCopied && (
                    <Alert>
                        Copied to clipboard!
                    </Alert>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{shareText}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Copy className="w-4 h-4" />
                        Copy Text
                    </button>

                    {'share' in navigator && (
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 p-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    )}
                </div>

                <div className="flex justify-center gap-4 pt-4 border-t">
                    <a
                        href={twitterShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 text-sm font-medium text-blue-400 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Twitter className="w-4 h-4" />
                        Twitter
                    </a>
                    <a
                        href={facebookShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Facebook className="w-4 h-4" />
                        Facebook
                    </a>
                </div>
            </CardContent>
        </Card>
    );
};

export default ShareResults;