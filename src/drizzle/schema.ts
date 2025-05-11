import { pgTable, serial, text, varchar, timestamp, integer, date, numeric, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  serialNumber: varchar('serial_number', { length: 20 }),
  documentNumber: varchar('document_number', { length: 50 }),
  executionDate: date('execution_date'),
  presentationDate: date('presentation_date'),
  registrationDate: date('registration_date'),
  nature: varchar('nature', { length: 100 }),
  executants: json('executants').$type<string[]>(),
  claimants: json('claimants').$type<string[]>(),
  volumeNumber: varchar('volume_number', { length: 20 }),
  pageNumber: varchar('page_number', { length: 20 }),
  considerationValue: numeric('consideration_value'),
  marketValue: numeric('market_value'),
  prNumber: varchar('pr_number', { length: 100 }),
  documentRemarks: text('document_remarks'),
  propertyType: varchar('property_type', { length: 100 }),
  propertyExtent: varchar('property_extent', { length: 100 }),
  village: varchar('village', { length: 100 }),
  street: varchar('street', { length: 100 }),
  surveyNumbers: json('survey_numbers').$type<string[]>(),
  plotNumber: varchar('plot_number', { length: 50 }),
  scheduleRemarks: text('schedule_remarks'),
  originalText: text('original_text'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
});