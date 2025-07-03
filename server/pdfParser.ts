import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ParsedTransaction {
  cusip?: string;
  description: string;
  dateAcquired: string;
  dateSold: string;
  proceeds: number;
  costBasis: number;
  washSaleLoss?: number;
  netGainLoss: number;
  quantity: number;
  isLongTerm: boolean;
  formType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // Form 8949 categories
}

export interface ParsedTaxData {
  accountNumber: string;
  documentId: string;
  taxpayerName: string;
  transactions: ParsedTransaction[];
  summary: {
    totalProceeds: number;
    totalCostBasis: number;
    totalWashSaleLoss: number;
    totalNetGainLoss: number;
    shortTermGainLoss: number;
    longTermGainLoss: number;
  };
}

export class RobinhoodPDFParser {
  
  /**
   * Parse Robinhood 1099-B PDF and extract actual transaction data
   */
  async parsePDF(filePath: string): Promise<ParsedTaxData> {
    console.log(`PDF 파싱 시작: ${filePath}`);
    
    return new Promise((resolve, reject) => {
      const pythonScriptPath = path.join(__dirname, 'parse_pdf.py');
      
      // Python 스크립트 실행
      const pythonProcess = spawn('python3', [pythonScriptPath, filePath]);
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            
            if (result.success) {
              console.log(`거래 데이터 파싱 완료: ${result.transactions.length}개 거래`);
              
              // ParsedTaxData 형식으로 변환
              const parsedData: ParsedTaxData = {
                accountNumber: result.accountNumber || 'Unknown',
                documentId: 'Robinhood-1099B',
                taxpayerName: result.taxpayerName || 'Unknown',
                transactions: result.transactions.map((tx: any) => ({
                  cusip: tx.cusip || '',
                  description: tx.description,
                  dateAcquired: tx.dateAcquired,
                  dateSold: tx.dateSold,
                  proceeds: tx.proceeds,
                  costBasis: tx.costBasis,
                  washSaleLoss: tx.washSaleLoss || 0,
                  netGainLoss: tx.netGainLoss,
                  quantity: tx.quantity,
                  isLongTerm: tx.isLongTerm,
                  formType: tx.formType as 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
                })),
                summary: result.summary
              };
              
              resolve(parsedData);
            } else {
              reject(new Error(result.error || 'Python 스크립트 실행 실패'));
            }
          } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            console.log('Python 출력:', output);
            reject(new Error('파싱 결과를 처리할 수 없습니다'));
          }
        } else {
          console.error('Python 스크립트 오류:', errorOutput);
          reject(new Error(`Python 스크립트 실행 실패 (exit code: ${code}): ${errorOutput}`));
        }
      });
    });
  }
  
  /**
   * Extract transaction data from parsed PDF text
   */
  private extractTransactionData(text: string): ParsedTaxData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract basic account information
    const accountInfo = this.extractAccountInfo(lines);
    
    // Extract summary data from the summary table
    const summary = this.extractSummaryData(lines);
    
    // Extract individual transactions
    const transactions = this.extractIndividualTransactions(lines);
    
    return {
      accountNumber: accountInfo.accountNumber,
      documentId: accountInfo.documentId,
      taxpayerName: accountInfo.taxpayerName,
      transactions,
      summary
    };
  }
  
  /**
   * Extract account information from PDF
   */
  private extractAccountInfo(lines: string[]): { accountNumber: string; documentId: string; taxpayerName: string } {
    let accountNumber = '';
    let documentId = '';
    let taxpayerName = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Find Master Account Number
      if (line.includes('Master Account Number for Import:')) {
        accountNumber = lines[i + 1]?.trim() || '';
      }
      
      // Find Document ID
      if (line.includes('Document ID for Import:')) {
        documentId = lines[i + 1]?.trim() || '';
      }
      
      // Find taxpayer name (usually appears early in the document)
      if (!taxpayerName && line.length > 5 && line.length < 50 && 
          !line.includes('Robinhood') && !line.includes('Road') && 
          !line.includes('CA') && /^[A-Za-z\s]+$/.test(line) &&
          i < 20) {
        taxpayerName = line;
      }
    }
    
    return { accountNumber, documentId, taxpayerName };
  }
  
  /**
   * Extract summary data from the summary table
   */
  private extractSummaryData(lines: string[]): ParsedTaxData['summary'] {
    const summary = {
      totalProceeds: 0,
      totalCostBasis: 0,
      totalWashSaleLoss: 0,
      totalNetGainLoss: 0,
      shortTermGainLoss: 0,
      longTermGainLoss: 0
    };
    
    // Find the summary table section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for the summary table with proceeds, cost basis, etc.
      if (line.includes('Total Short-term') || line.includes('Short') && line.includes('basis reported')) {
        // Parse the numeric values from the summary lines
        const numberPattern = /[\d,]+\.\d{2}/g;
        const numbers = line.match(numberPattern);
        
        if (numbers && numbers.length >= 4) {
          summary.totalProceeds += this.parseNumber(numbers[0]);
          summary.totalCostBasis += this.parseNumber(numbers[1]);
          if (numbers.length > 3) {
            summary.totalWashSaleLoss += this.parseNumber(numbers[2]);
            summary.shortTermGainLoss += this.parseNumber(numbers[3]);
          }
        }
      }
      
      if (line.includes('Total Long-term')) {
        const numberPattern = /[\d,]+\.\d{2}/g;
        const numbers = line.match(numberPattern);
        
        if (numbers && numbers.length >= 4) {
          summary.longTermGainLoss += this.parseNumber(numbers[3]);
        }
      }
      
      if (line.includes('Grand total')) {
        const numberPattern = /[\d,]+\.\d{2}/g;
        const numbers = line.match(numberPattern);
        
        if (numbers && numbers.length >= 4) {
          summary.totalProceeds = this.parseNumber(numbers[0]);
          summary.totalCostBasis = this.parseNumber(numbers[1]);
          summary.totalWashSaleLoss = this.parseNumber(numbers[2]);
          summary.totalNetGainLoss = this.parseNumber(numbers[3]);
        }
      }
    }
    
    return summary;
  }
  
  /**
   * Extract individual transaction data
   */
  private extractIndividualTransactions(lines: string[]): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    
    // Look for transaction detail sections
    let inTransactionSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect start of transaction details section
      if (line.includes('CUSIP') || line.includes('Description') || 
          line.includes('Date acquired') || line.includes('Date sold')) {
        inTransactionSection = true;
        continue;
      }
      
      // Skip header and summary lines
      if (line.includes('Form 8949') || line.includes('Total') || 
          line.includes('Summary') || line.includes('Page')) {
        continue;
      }
      
      // Try to parse transaction lines
      if (inTransactionSection && this.looksLikeTransactionLine(line)) {
        const transaction = this.parseTransactionLine(line, lines, i);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }
    
    console.log(`PDF에서 ${transactions.length}개의 거래 추출됨`);
    return transactions;
  }
  
  /**
   * Check if a line looks like a transaction data line
   */
  private looksLikeTransactionLine(line: string): boolean {
    // Look for patterns that indicate transaction data:
    // - Contains dates (MM/DD/YYYY format)
    // - Contains dollar amounts
    // - Has multiple numeric values
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/g;
    const moneyPattern = /\$?[\d,]+\.\d{2}/g;
    
    const dates = line.match(datePattern);
    const amounts = line.match(moneyPattern);
    
    return (dates && dates.length >= 2) && (amounts && amounts.length >= 2);
  }
  
  /**
   * Parse individual transaction line
   */
  private parseTransactionLine(line: string, allLines: string[], index: number): ParsedTransaction | null {
    try {
      // Extract components using patterns
      const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/g;
      const dates = line.match(datePattern);
      
      const moneyPattern = /\$?([\d,]+\.\d{2})/g;
      const amounts: number[] = [];
      let match;
      while ((match = moneyPattern.exec(line)) !== null) {
        amounts.push(this.parseNumber(match[1]));
      }
      
      if (!dates || dates.length < 2 || amounts.length < 3) {
        return null;
      }
      
      // Extract description (usually the first text part)
      const parts = line.split(/\s+/);
      let description = '';
      let foundFirstDate = false;
      
      for (const part of parts) {
        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(part)) {
          foundFirstDate = true;
          break;
        }
        if (!foundFirstDate && part.length > 2) {
          description += part + ' ';
        }
      }
      
      description = description.trim();
      
      // Extract key values
      const dateAcquired = dates[0];
      const dateSold = dates[1];
      const proceeds = amounts[0] || 0;
      const costBasis = amounts[1] || 0;
      const washSaleLoss = amounts.length > 3 ? amounts[2] : 0;
      const netGainLoss = amounts[amounts.length - 1] || (proceeds - costBasis);
      
      // Determine if long-term (more than 1 year)
      const acquiredDate = new Date(dateAcquired);
      const soldDate = new Date(dateSold);
      const daysDiff = (soldDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24);
      const isLongTerm = daysDiff > 365;
      
      return {
        description: description || 'Unknown Security',
        dateAcquired,
        dateSold,
        proceeds,
        costBasis,
        washSaleLoss,
        netGainLoss,
        quantity: 1, // Default to 1 if not specified
        isLongTerm,
        formType: 'A' // Default to Form 8949 Type A
      };
      
    } catch (error) {
      console.error('거래 라인 파싱 오류:', error, line);
      return null;
    }
  }
  
  /**
   * Parse number string to float
   */
  private parseNumber(numberStr: string): number {
    if (!numberStr) return 0;
    return parseFloat(numberStr.replace(/,/g, '').replace('$', '')) || 0;
  }
}

export default RobinhoodPDFParser;