import fs from 'fs';
import path from 'path';
import { QuarterTemplate } from '../services/quarter-template.service';

export class QuarterComponentGenerator {
  private static COMPONENT_TEMPLATE = (template: QuarterTemplate) => `
    import React, { useState, useEffect } from 'react';
    import { BaseQuarterComponent } from '../components/quarters/BaseQuarterComponent';
    import { GameChallengeService } from '../services/GameChallengeService';
    import { useAuth } from '../context/AuthContext';

    export const Quarter${template.id}Component: React.FC = () => {
      const { user } = useAuth();
      const [challenges, setChallenges] = useState(${JSON.stringify(template.samples)});
      const gameChallengeService = new GameChallengeService();

      useEffect(() => {
        const initializeQuarterChallenges = async () => {
          if (!user) return;

          try {
            // Adaptive challenge generation
            const adaptiveChallenges = await gameChallengeService.generateAdaptiveChallenges(
              user.uid, 
              '${template.id}'
            );

            setChallenges(adaptiveChallenges);
          } catch (error) {
            console.error('Failed to initialize quarter challenges', error);
          }
        };

        initializeQuarterChallenges();
      }, [user]);

      return (
        <BaseQuarterComponent
          quarterId="${template.id}"
          quarterName="${template.name}"
          difficulty="${template.difficulty}"
        >
          {/* Quarter-specific rendering logic */}
          <div className="quarter-challenges">
            {challenges.map(challenge => (
              <div key={challenge.id} className="challenge-item">
                {/* Challenge rendering */}
              </div>
            ))}
          </div>
        </BaseQuarterComponent>
      );
    };

    export default Quarter${template.id}Component;`;

  static generateQuarterComponent(template: QuarterTemplate): string {
    return this.COMPONENT_TEMPLATE(template);
  }

  static async saveQuarterComponent(template: QuarterTemplate, outputDir: string): Promise<string> {
    const componentCode = this.generateQuarterComponent(template);
    const fileName = `Quarter${template.id}Component.tsx`;
    const filePath = path.join(outputDir, fileName);

    try {
      await fs.promises.writeFile(filePath, componentCode, 'utf8');
      return filePath;
    } catch (error) {
      console.error(`Failed to save quarter component for ${template.id}`, error);
      throw error;
    }
  }

  static async generateMultipleComponents(templates: QuarterTemplate[], outputDir: string): Promise<string[]> {
    const generatedPaths = await Promise.all(
      templates.map(template => this.saveQuarterComponent(template, outputDir))
    );

    return generatedPaths;
  }
}