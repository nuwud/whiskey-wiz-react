import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AnalyticsService } from '../services/analytics.service';
import { Quarter, WhiskeySample, ScoringRules, Difficulty } from '../types/game.types';
import { Timestamp } from 'firebase/firestore';

export interface QuarterTemplate extends Omit<Quarter, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  difficulty: Difficulty;
  description: string;  
  samples: WhiskeySample[];
  scoringRules: ScoringRules;
}

export class QuarterTemplateService {
  private templateCollection = collection(db, 'quarter_templates');

  async createQuarterTemplate(template: QuarterTemplate): Promise<string> {
    try {
      // Validate scoring rules and samples before adding
      this.validateTemplate(template);

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

  async getTemplatesByDifficulty(difficulty: Difficulty): Promise<QuarterTemplate[]> {
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

  private validateTemplate(template: QuarterTemplate): void {
    // Validate samples
    if (!Array.isArray(template.samples)) {
      throw new Error('Samples must be an array');
    }
    template.samples.forEach(sample => {
      if (!sample.id || !sample.name || !sample.mashbill) {
        throw new Error('Invalid sample data');
      }
    });
  
    // Validate scoring rules if they exist
    const rules = template.scoringRules;
    if (rules) {
      if (!rules.age || !rules.proof || !rules.mashbill) {
        throw new Error('Missing scoring rules');
      }
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
      const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  
      for (const difficulty of difficulties) {
        const templates = await this.getTemplatesByDifficulty(difficulty);
  
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