import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AnalyticsService } from '../services/analytics.service';

export interface QuarterTemplate {
  id?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  difficulty: string;
  description?: string;
  samples: Array<any>; // Consider creating a Sample interface
  scoringRules?: {
    age: number;
    proof: number;
    mashbill: number;
  };
}

export class QuarterTemplateService {
  private templateCollection = collection(db, 'quarter_templates');

  async createQuarterTemplate(template: QuarterTemplate): Promise<string> {
    try {
      const docRef = await addDoc(this.templateCollection, template);

      AnalyticsService.trackUserEngagement('quarter_template_created', {
        templateId: docRef.id,
        difficulty: template.difficulty
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create quarter template', error);
      throw error;
    }
  }

  async getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<QuarterTemplate[]> {
    try {
      const q = query(this.templateCollection, where('difficulty', '==', difficulty));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuarterTemplate));
    } catch (error) {
      console.error('Failed to fetch templates', error);
      return [];
    }
  }

  generateQuarterComponent(template: QuarterTemplate): string {
    return `
      import React from 'react';
      import { BaseQuarterComponent } from './BaseQuarterComponent';

      export const Quarter${template.id}Component: React.FC = () => {
        return (
          <BaseQuarterComponent
            quarterId="${template.id}"
            quarterName="${template.name}"
            difficulty="${template.difficulty}"
          >
            {/* Quarter-specific rendering logic */}
          </BaseQuarterComponent>
        );
      };
    `;
  }

  async generateDynamicQuarters(): Promise<void> {
    try {
      const difficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of difficulties) {
        const templates = await this.getTemplatesByDifficulty(difficulty as 'easy' | 'medium' | 'hard');

        templates.forEach(template => {
          // Generate component files or register dynamically
          this.generateQuarterComponent(template);

          AnalyticsService.trackUserEngagement('dynamic_quarter_generated', {
            templateId: template.id,
            difficulty: template.difficulty
          });
        });
      }
    } catch (error) {
      console.error('Failed to generate dynamic quarters', error);
    }
  }
}