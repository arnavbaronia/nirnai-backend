import { Controller, Post, UploadedFile, UseInterceptors, UseGuards, Body, Get, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionDto } from './dto/transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('userId') userId: number) {
    const text = await this.transactionsService.extractTextFromPdf(file.buffer);
    const transactions = await this.transactionsService.parseTransactions(text);
    const savedTransactions = await this.transactionsService.saveTransactions(transactions, userId);
    return savedTransactions;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async searchTransactions(@Query() query: any) {
    return this.transactionsService.searchTransactions(query);
  }
}