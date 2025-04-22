import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';

export interface AnalysisResult {
  fileType: string;
  fileName: string;
  summary: {
    totalRows?: number;
    sheets?: string[];
    pages?: number;
    keywords?: string[];
    carbonRelatedData?: any[];
  };
  extractedData: any;
  modelingSuggestions: string[];
}

export class FileAnalyzer {
  async analyzeFile(file: File): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      fileType: file.type,
      fileName: file.name,
      summary: {},
      extractedData: null,
      modelingSuggestions: []
    };

    try {
      if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.type.includes('csv')) {
        await this.analyzeSpreadsheet(file, result);
      } else if (file.type.includes('pdf')) {
        await this.analyzePDF(file, result);
      } else if (file.type.startsWith('image/')) {
        await this.analyzeImage(file, result);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      result.modelingSuggestions.push('文件分析过程中遇到错误，建议手动检查文件内容');
    }

    return result;
  }

  private async analyzeSpreadsheet(file: File, result: AnalysisResult) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    
    result.summary.sheets = workbook.SheetNames;
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    
    result.summary.totalRows = data.length;
    result.extractedData = data;

    // 分析表头，识别碳足迹相关字段
    const headers = Object.keys(data[0] || {});
    const carbonRelatedHeaders = headers.filter(header => 
      header.toLowerCase().includes('carbon') ||
      header.toLowerCase().includes('emission') ||
      header.toLowerCase().includes('energy') ||
      header.toLowerCase().includes('consumption')
    );

    if (carbonRelatedHeaders.length > 0) {
      result.modelingSuggestions.push(
        `发现${carbonRelatedHeaders.length}个碳排放相关字段，建议优先关注这些数据`
      );
      result.summary.carbonRelatedData = carbonRelatedHeaders;
    }
  }

  private async analyzePDF(file: File, result: AnalysisResult) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    result.summary.pages = pdfDoc.getPageCount();
    
    // TODO: 添加PDF文本提取和分析逻辑
    result.modelingSuggestions.push(
      '建议从PDF中提取关键数据表格进行建模',
      '如有数据表格，建议转换为Excel格式以便处理'
    );
  }

  private async analyzeImage(file: File, result: AnalysisResult) {
    // TODO: 集成OCR服务进行图片文字识别
    result.modelingSuggestions.push(
      '图片可能包含数据表格或图表，建议：',
      '1. 使用OCR提取表格数据',
      '2. 手动输入图表中的关键数据点'
    );
  }
}

export const fileAnalyzer = new FileAnalyzer(); 