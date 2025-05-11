export class TransactionDto {
  serialNumber?: string;
  documentNumber?: string;
  executionDate?: Date;
  presentationDate?: Date;
  registrationDate?: Date;
  nature?: string;
  executants?: string[];
  claimants?: string[];
  volumeNumber?: string;
  pageNumber?: string;
  considerationValue?: number;
  marketValue?: number;
  prNumber?: string;
  documentRemarks?: string;
  propertyType?: string;
  propertyExtent?: string;
  village?: string;
  street?: string;
  surveyNumbers?: string[];
  plotNumber?: string;
  scheduleRemarks?: string;
  originalText?: string;
}