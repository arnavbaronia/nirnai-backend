import { Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../drizzle/schema';
import pdf from 'pdf-parse';
import axios from 'axios';
import { TransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    const data = await pdf(pdfBuffer);
    return data.text;
  }

  async translateText(text: string, targetLanguage = 'en'): Promise<string> {
    try {
      const response = await axios.post(
        'https://libretranslate.de/translate',
        {
          q: text,
          source: 'ta',
          target: targetLanguage,
          format: 'text'
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async parseTransactions(text: string): Promise<TransactionDto[]> {
    const transactions: TransactionDto[] = [];

    const transactionSections = text
      .split(/(?=\nSr\. No\.|வ. எண்)/)
      .filter(section => section.trim());

    for (const section of transactionSections) {
      const translatedSection = await this.translateText(section);

      const transaction: TransactionDto = {
        serialNumber: this.extractField(translatedSection, /Sr\. No\.\s*:\s*(\S+)/),
        documentNumber: this.extractField(translatedSection, /Document No\.\s*:\s*(\S+)/),
        executionDate: this.extractDate(translatedSection, /Execution Date\s*:\s*(\S+)/),
        presentationDate: this.extractDate(translatedSection, /Presentation Date\s*:\s*(\S+)/),
        registrationDate: this.extractDate(translatedSection, /Registration Date\s*:\s*(\S+)/),
        nature: this.extractField(translatedSection, /Nature\s*:\s*(.+)/),
        executants: this.extractNames(translatedSection, /Executants\s*:\s*([\s\S]+?)Claimants/),
        claimants: this.extractNames(translatedSection, /Claimants\s*:\s*([\s\S]+?)Volume/),
        volumeNumber: this.extractField(translatedSection, /Volume No\.\s*:\s*(\S+)/),
        pageNumber: this.extractField(translatedSection, /Page No\.\s*:\s*(\S+)/),
        considerationValue: this.extractNumber(translatedSection, /Consideration Value\s*:\s*([\d,]+)/),
        marketValue: this.extractNumber(translatedSection, /Market Value\s*:\s*([\d,]+)/),
        prNumber: this.extractField(translatedSection, /PR Number\s*:\s*(\S+)/),
        documentRemarks: this.extractField(translatedSection, /Document Remarks\s*:\s*([\s\S]+?)Property Type/),
        propertyType: this.extractField(translatedSection, /Property Type\s*:\s*(.+)/),
        propertyExtent: this.extractField(translatedSection, /Property Extent\s*:\s*(.+)/),
        village: this.extractField(translatedSection, /Village\s*:\s*(.+)/),
        street: this.extractField(translatedSection, /Street\s*:\s*(.+)/),
        surveyNumbers: this.extractSurveyNumbers(translatedSection),
        plotNumber: this.extractField(translatedSection, /Plot No\.\s*:\s*(\S+)/),
        scheduleRemarks: this.extractField(translatedSection, /Schedule Remarks\s*:\s*([\s\S]+)/),
        originalText: section
      };

      transactions.push(transaction);
    }

    return transactions;
  }

  private extractField(text: string, regex: RegExp): string | undefined {
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private extractDate(text: string, regex: RegExp): Date | undefined {
    const match = text.match(regex);
    return match ? new Date(match[1].trim()) : undefined;
  }

  private extractNumber(text: string, regex: RegExp): number | undefined {
    const match = text.match(regex);
    return match ? parseFloat(match[1].replace(/,/g, '')) : undefined;
  }

  private extractNames(text: string, regex: RegExp): string[] {
    const match = text.match(regex);
    if (!match) return [];
    const namesText = match[1].trim();
    return namesText.split(/\d+\.\s*/).filter(name => name.trim());
  }

  private extractSurveyNumbers(text: string): string[] {
    const match = text.match(/Survey No\.\s*:\s*([\d,\/]+)/);
    if (!match) return [];
    return match[1].split(/,\s*/).map(num => num.trim());
  }

  async saveTransactions(transactions: TransactionDto[], userId: number) {
    const values = transactions.map(tx => ({
      serialNumber: tx.serialNumber,
      documentNumber: tx.documentNumber,
      executionDate: tx.executionDate?.toISOString(),
      presentationDate: tx.presentationDate?.toISOString(),
      registrationDate: tx.registrationDate?.toISOString(),
      nature: tx.nature,
      executants: tx.executants || [],
      claimants: tx.claimants || [],
      volumeNumber: tx.volumeNumber,
      pageNumber: tx.pageNumber,
      considerationValue: tx.considerationValue?.toString(),
      marketValue: tx.marketValue?.toString(),
      prNumber: tx.prNumber,
      documentRemarks: tx.documentRemarks,
      propertyType: tx.propertyType,
      propertyExtent: tx.propertyExtent,
      village: tx.village,
      street: tx.street,
      surveyNumbers: tx.surveyNumbers || [],
      plotNumber: tx.plotNumber,
      scheduleRemarks: tx.scheduleRemarks,
      originalText: tx.originalText,
      createdBy: userId
    }));

    const inserted = await this.db
      .insert(schema.transactions)
      .values(values)
      .returning();
    return inserted;
  }

  async searchTransactions(query: any) {
    const dbQuery = this.db.select().from(schema.transactions);

    if (query.buyer) {
      dbQuery.where(
        sql`${schema.transactions.claimants}::text LIKE ${`%${query.buyer}%`}`
      );
    }

    if (query.seller) {
      dbQuery.where(
        sql`${schema.transactions.executants}::text LIKE ${`%${query.seller}%`}`
      );
    }

    if (query.houseNumber) {
      dbQuery.where(
        eq(schema.transactions.plotNumber, query.houseNumber)
      );
    }

    if (query.surveyNumber) {
      dbQuery.where(
        sql`${schema.transactions.surveyNumbers}::text LIKE ${`%${query.surveyNumber}%`}`
      );
    }

    if (query.documentNumber) {
      dbQuery.where(
        eq(schema.transactions.documentNumber, query.documentNumber)
      );
    }

    return dbQuery;
  }
}