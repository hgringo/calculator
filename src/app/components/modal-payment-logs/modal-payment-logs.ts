import { Component, OnInit } from '@angular/core';
import { PaymentLogService } from '../../services/payment.log.service';
import { PaymentLog } from '../../types/paymentLog';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../services/settings.service';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DeviceConfigService } from '../../services/deviceConfig.service';
import { NetworkMode } from '../../types/config';
import { ExportLogsService } from '../../services/export-logs.service';
import { SystemOverlayService } from '../../services/system-overlay.service';

@Component({
  selector: 'app-modal-payment-logs',
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './modal-payment-logs.html',
  styleUrl: './modal-payment-logs.scss',
  providers: [DatePipe]
})
export class ModalPaymentLogs implements OnInit {

  logs: PaymentLog[] = [];
  networkMode!: NetworkMode;

  constructor(
    private ref: DynamicDialogRef,
    private paymentLogService: PaymentLogService,
    private settingsService: SettingsService,
    private deviceConfigService: DeviceConfigService,
    private datePipe: DatePipe,
    private exportLogsService: ExportLogsService,
    private overlayService: SystemOverlayService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.networkMode = this.deviceConfigService.networkMode;
    this.logs = this.paymentLogService
      .getLogs(true)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  get total() {
    return this.logs.reduce((sum, log) => sum + log.amount, 0);
  }

  isJustificatifEnabled(): boolean {
    return this.settingsService.loadReceiptSettings().enabled || false;
  }

  get emailReceipt(): string {
    return this.settingsService.loadReceiptSettings().email || '';
  }

  onCleanLogs() {
    setTimeout(() => {
      this.paymentLogService.clearLogs();
      this.logs = [];
      this.ref.close();
    }, 2000);
  }

  private async generateExcelBlob(): Promise<{ blob: Blob, filename: string }> {

    const includeJustif = this.isJustificatifEnabled();

    const t = (key: string) => this.translate.instant(key);

    const headers: string[] = [
      t('EXPORT.COL_DATE'),
      t('EXPORT.COL_INSERTED'),
      t('EXPORT.COL_REST'),
    ];
    if (includeJustif) headers.push(t('EXPORT.COL_JUSTIF'));
    headers.push(t('EXPORT.COL_STATUS'));
    headers.push(t('EXPORT.COL_AMOUNT'));

    const sortedLogs = this.paymentLogService.getLogs().sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const NO_JUSTIF_KEY = '__NO_JUSTIF__';
    const groups = new Map<string, PaymentLog[]>();

    for (const log of sortedLogs) {
      const key = (includeJustif && log.justif?.trim()) ? log.justif.trim() : NO_JUSTIF_KEY;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(log);
    }

    // Sub-totals are only relevant when justificatif is enabled AND there are multiple sections
    const showSubTotals = includeJustif && groups.size > 1;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payment Logs');

    const HEADER_COLOR  = 'FF48753B';
    const SECTION_COLOR = 'FFD9E8D4';
    const STATUS_COLORS: Record<string, string> = {
      'COMPLETED': 'FF92D050',
      'CANCELED':  'FFFF0000',
    };
    const ROW_EVEN = 'FFF2F2F2';
    const ROW_ODD  = 'FFFFFFFF';

    // Excel has no CSS padding — we simulate it with:
    //   • indent: 1  → left spacing on text cells
    //   • wrapText   → prevents clipping on taller rows
    //   • row height → vertical breathing room
    const ROW_HEIGHT        = 22;   // data rows  (default ~15)
    const HEADER_ROW_HEIGHT = 24;   // header / total rows
    const INDENT            = 1;    // ~3–4 px left indent on text cells

    const border = (): Partial<ExcelJS.Borders> => ({
      top:    { style: 'thin' },
      bottom: { style: 'thin' },
      left:   { style: 'thin' },
      right:  { style: 'thin' },
    });

    const styleHeaderRow = (row: ExcelJS.Row) => {
      row.height = HEADER_ROW_HEIGHT;
      row.eachCell(cell => {
        cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', indent: INDENT };
        cell.border    = border();
      });
    };

    // ── Global header row ──────────────────────────────────────────────────
    const headerRow = sheet.addRow(headers);
    styleHeaderRow(headerRow);

    const colInserted = 2;
    const colRest     = 3;
    const colStatus   = includeJustif ? 5 : 4;
    const colAmount   = includeJustif ? 6 : 5;

    const colWidths: number[] = headers.map(h => h.length + 2);

    let grandTotal = 0;

    for (const [, groupLogs] of groups.entries()) {

      let rowIndex = 0;

      // ── Data rows ────────────────────────────────────────────────────────
      for (const log of groupLogs) {
        const bgColor = rowIndex % 2 === 0 ? ROW_EVEN : ROW_ODD;
        rowIndex++;

        const rowValues: any[] = [
          this.datePipe.transform(log.timestamp, 'dd/MM/yyyy HH:mm'),
          log.inserted,
          log.rest,
        ];
        if (includeJustif) rowValues.push(log.justif ?? '');
        rowValues.push('');       // status: color only, no text
        rowValues.push(log.amount);

        const row = sheet.addRow(rowValues);
        row.height = ROW_HEIGHT;

        row.eachCell((cell, colNum) => {
          cell.border = border();
          cell.font   = { name: 'Arial', size: 10 };

          if (colNum === colStatus) {
            const statusKey  = log.status?.replace(/\s+/g, '') ?? '';
            const statusArgb = STATUS_COLORS[statusKey];
            cell.fill = statusArgb
              ? { type: 'pattern', pattern: 'solid', fgColor: { argb: statusArgb } }
              : { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          }

          if (colNum === colAmount) {
            cell.numFmt    = '#,##0.00 €';
            cell.alignment = { horizontal: 'right', vertical: 'middle', indent: INDENT };
          } else if (colNum === colInserted || colNum === colRest) {
            cell.numFmt    = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle', indent: INDENT };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle', indent: INDENT };
          }

          const valStr = cell.value != null ? cell.value.toString() : '';
          if (valStr.length + 2 > colWidths[colNum - 1]) {
            colWidths[colNum - 1] = valStr.length + 2;
          }
        });
      }

      const groupTotal = groupLogs
        .filter(l => l.status === 'COMPLETED')
        .reduce((sum, l) => sum + l.amount, 0);

      grandTotal += groupTotal;

      // ── Sub-total row — only when multiple sections ──────────────────────
      if (showSubTotals) {
        const subTotalValues: any[] = [t('EXPORT.SUBTOTAL'), '', ''];
        if (includeJustif) subTotalValues.push('');
        subTotalValues.push('');
        subTotalValues.push(groupTotal);

        const subTotalRow = sheet.addRow(subTotalValues);
        subTotalRow.height = ROW_HEIGHT;

        subTotalRow.eachCell((cell, colNum) => {
          cell.font      = { bold: true, italic: true, name: 'Arial', size: 10, color: { argb: 'FF1D4E1A' } };
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_COLOR } };
          cell.border    = border();
          cell.alignment = colNum === colAmount
            ? { horizontal: 'right', vertical: 'middle', indent: INDENT }
            : { horizontal: 'left',  vertical: 'middle', indent: INDENT };
          if (colNum === colAmount) cell.numFmt = '#,##0.00 €';
        });

        // Spacer only makes sense when sub-totals separate sections
        sheet.addRow([]);
      }
    }

    // ── Grand total row ───────────────────────────────────────────────────
    const totalValues: any[] = [t('EXPORT.TOTAL'), '', ''];
    if (includeJustif) totalValues.push('');
    totalValues.push('');
    totalValues.push(grandTotal);

    const totalRow = sheet.addRow(totalValues);
    styleHeaderRow(totalRow);
    totalRow.getCell(colAmount).numFmt    = '#,##0.00 €';
    totalRow.getCell(colAmount).alignment = { horizontal: 'right', vertical: 'middle', indent: INDENT };

    // ── Auto-fit columns ──────────────────────────────────────────────────
    sheet.columns.forEach((col, i) => {
      if (col) col.width = Math.max(colWidths[i] ?? 10, 10);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const today    = new Date();
    const filename = `export_logs_${today.getFullYear()}${(today.getMonth() + 1)
      .toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}.xlsx`;

    return { blob, filename };
  }

  async onExportLogs() {
    this.overlayService.show('EXPORT.IN_PROGRESS');
    try {
      const { blob, filename } = await this.generateExcelBlob();
      saveAs(blob, filename);
      this.onCleanLogs();
    } finally {
      this.overlayService.hide();
    }
  }

  async onSendLogsByEmail() {
    this.overlayService.show('LOGS.SENDING');

    const { blob, filename } = await this.generateExcelBlob();
    const society = this.settingsService.loadSocietySettings();

    this.exportLogsService.sendLogsByEmail(blob, filename, this.emailReceipt, society.name).subscribe({
      next: () => {
        this.onCleanLogs();
        this.overlayService.hide();
      },
      error: err => {
        this.overlayService.hide();
        console.error('Erreur envoi email', err);
      }
    });
  }
}