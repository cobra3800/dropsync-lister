import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service.js';

@Injectable()
export class AspectMapperService {
  constructor(private readonly aiService: AiService) {}

  async map(
    title: string,
    description: string,
    requiredAspects: string[],
  ): Promise<Record<string, string[]>> {
    try {
      return await this.aiService.generateAspects(
        title,
        description,
        requiredAspects,
      );
    } catch {
      const text = `${title}\n${description}`.toLowerCase();

      const aspects: Record<string, string[]> = {};

      for (const aspect of requiredAspects) {
        switch (aspect.toLowerCase()) {
          case 'brand':
            aspects[aspect] = [
              this.find(text, [
                'apple',
                'dell',
                'hp',
                'lenovo',
                'asus',
                'acer',
                'niakun',
              ]) ?? 'Unbranded',
            ];
            break;

          case 'processor':
            aspects[aspect] = [
              this.find(text, [
                'intel core i3',
                'intel core i5',
                'intel core i7',
                'intel pentium',
                'amd ryzen',
              ]) ?? 'Intel Pentium',
            ];
            break;

          case 'screen size':
            aspects[aspect] = [
              this.findRegex(
                text,
                /\d+(\.\d+)?\s?(inch|in)/,
              ) ?? '15.6 in',
            ];
            break;

          case 'color':
            aspects[aspect] = [
              this.find(text, [
                'black',
                'white',
                'silver',
                'blue',
                'red',
              ]) ?? 'Black',
            ];
            break;

          default:
            aspects[aspect] = ['Does Not Apply'];
        }
      }

      return aspects;
    }
  }

  private find(text: string, values: string[]): string | undefined {
    return values.find((value) => text.includes(value));
  }

  private findRegex(text: string, regex: RegExp): string | undefined {
    return text.match(regex)?.[0];
  }
}