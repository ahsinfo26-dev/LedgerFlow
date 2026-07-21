import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Calculator, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const SARS_VAT_PERIODS = [
  { label: 'January 2026', start: '2026-01-01', end: '2026-01-31' },
  { label: 'February 2026', start: '2026-02-01', end: '2026-02-28' },
  { label: 'March 2026', start: '2026-03-01', end: '2026-03-31' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30' },
  { label: 'May 2026', start: '2026-05-01', end: '2026-05-31' },
  { label: 'June 2026', start: '2026-06-01', end: '2026-06-30' },
  { label: 'July 2026', start: '2026-07-01', end: '2026-07-31' },
  { label: 'August 2026', start: '2026-08-01', end: '2026-08-31' },
  { label: 'September 2026', start: '2026-09-01', end: '2026-09-30' },
  { label: 'October 2026', start: '2026-10-01', end: '2026-10-31' },
  { label: 'November 2026', start: '2026-11-01', end: '2026-11-30' },
  { label: 'December 2026', start: '2026-12-01', end: '2026-12-31' },
  { label: 'Tax Year 2025/26 (Mar–Feb)', start: '2025-03-01', end: '2026-02-28' },
  { label: 'Tax Year 2026/27 (Mar–Feb)', start: '2026-03-01', end: '2027-02-28' },
];

function inPeriod(docDate, start, end) {
  if (!docDate) return false;
  return docDate >= start && docDate <= end;
}

function formatRand(n) {
  return 'R ' + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function Reports() {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['all-documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 1000),
  });
  const { data: settingsArr = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });
  const settings = settingsArr[0] || {};

  const [periodIdx, setPeriodIdx] = useState('5'); // June 2026 default
  const period = SARS_VAT_PERIODS[parseInt(periodIdx)];

  const periodDocs = useMemo(() => {
    return documents.filter(d => inPeriod(d.date, period.start, period.end));
  }, [documents, period]);

  // VAT Summary
  const vatData = useMemo(() => {
    const invoices = periodDocs.filter(d => d.doc_type === 'invoice' && d.status !== 'cancelled' && d.status !== 'draft');
    const creditNotes = periodDocs.filter(d => d.doc_type === 'credit_note' && d.status !== 'cancelled' && d.status !== 'draft');

    const outputVat = invoices.reduce((s, d) => s + (d.vat_amount || 0), 0);
    const inputVatCredit = creditNotes.reduce((s, d) => s + (d.vat_amount || 0), 0);
    const netVatPayable = outputVat - inputVatCredit;

    const totalSalesExcl = invoices.reduce((s, d) => s + (d.subtotal || 0), 0);
    const totalCreditNotesExcl = creditNotes.reduce((s, d) => s + (d.subtotal || 0), 0);

    return {
      invoices,
      creditNotes,
      outputVat,
      inputVatCredit,
      netVatPayable,
      totalSalesExcl,
      totalCreditNotesExcl,
      netSalesExcl: totalSalesExcl - totalCreditNotesExcl,
    };
  }, [periodDocs]);

  // Income Statement
  const incomeData = useMemo(() => {
    const invoices = periodDocs.filter(d => d.doc_type === 'invoice' && d.status !== 'cancelled' && d.status !== 'draft');
    const creditNotes = periodDocs.filter(d => d.doc_type === 'credit_note' && d.status !== 'cancelled' && d.status !== 'draft');

    const revenueExcl = invoices.reduce((s, d) => s + (d.subtotal || 0) - (d.discount_total || 0), 0);
    const creditNotesExcl = creditNotes.reduce((s, d) => s + (d.subtotal || 0) - (d.discount_total || 0), 0);
    const netRevenue = revenueExcl - creditNotesExcl;

    // COGS — estimate from cost_price on line items' products
    // Since line items don't carry cost, we show revenue only with a note
    const outputVat = invoices.reduce((s, d) => s + (d.vat_amount || 0), 0);
    const inputVatCredit = creditNotes.reduce((s, d) => s + (d.vat_amount || 0), 0);
    const netProfitBeforeTax = netRevenue; // no COGS/expenses tracked yet

    return { revenueExcl, creditNotesExcl, netRevenue, outputVat, inputVatCredit, netProfitBeforeTax };
  }, [periodDocs]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="SARS-compliant VAT and financial year-end reports" />

      <Card className="no-print">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <Label className="mb-1.5 block">SARS Tax Period</Label>
            <Select value={periodIdx} onValueChange={setPeriodIdx}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SARS_VAT_PERIODS.map((p, i) => (
                  <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <Tabs defaultValue="vat">
          <TabsList className="no-print">
            <TabsTrigger value="vat" className="gap-1.5"><Calculator className="w-3.5 h-3.5" /> VAT Summary</TabsTrigger>
            <TabsTrigger value="income" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Income Statement</TabsTrigger>
          </TabsList>

          {/* VAT Summary */}
          <TabsContent value="vat">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>VAT201 Summary</CardTitle>
                <CardDescription>
                  {settings.company_name || 'Your Company'}
                  {settings.company_vat && ` · VAT: ${settings.company_vat}`}
                  {' · '}Period: {period.start} to {period.end}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Tax Invoices Issued</p>
                    <p className="text-lg font-bold">{vatData.invoices.length}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Credit Notes Issued</p>
                    <p className="text-lg font-bold">{vatData.creditNotes.length}</p>
                  </div>
                </div>

                <div className="border-2 border-border rounded-lg divide-y divide-border">
                  <div className="flex justify-between p-3">
                    <div>
                      <p className="font-medium">Output VAT (collected on sales)</p>
                      <p className="text-xs text-muted-foreground">Sales excl. VAT: {formatRand(vatData.totalSalesExcl)}</p>
                    </div>
                    <p className="font-bold text-right">{formatRand(vatData.outputVat)}</p>
                  </div>
                  <div className="flex justify-between p-3">
                    <div>
                      <p className="font-medium">Less: Input VAT (credit notes)</p>
                      <p className="text-xs text-muted-foreground">Credit notes excl. VAT: {formatRand(vatData.totalCreditNotesExcl)}</p>
                    </div>
                    <p className="font-bold text-right text-destructive">- {formatRand(vatData.inputVatCredit)}</p>
                  </div>
                  <div className="flex justify-between p-3 bg-primary/5">
                    <p className="font-bold">Net VAT Payable to SARS</p>
                    <p className={`font-bold text-lg text-right ${vatData.netVatPayable >= 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {formatRand(vatData.netVatPayable)}
                    </p>
                  </div>
                </div>

                {vatData.netVatPayable < 0 && (
                  <p className="text-xs text-muted-foreground">
                    A negative amount indicates a VAT refund due from SARS for this period.
                  </p>
                )}

                {/* Invoice detail */}
                {vatData.invoices.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Invoice Breakdown</p>
                    <div className="overflow-x-auto border border-border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr className="border-b border-border">
                            <th className="text-left p-2 font-medium">Number</th>
                            <th className="text-left p-2 font-medium">Customer</th>
                            <th className="text-left p-2 font-medium">Date</th>
                            <th className="text-right p-2 font-medium">Excl. VAT</th>
                            <th className="text-right p-2 font-medium">VAT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vatData.invoices.map(d => (
                            <tr key={d.id} className="border-b border-border">
                              <td className="p-2 font-medium">{d.doc_number}</td>
                              <td className="p-2">{d.customer_name}</td>
                              <td className="p-2 text-muted-foreground">{d.date}</td>
                              <td className="p-2 text-right">{formatRand(d.subtotal)}</td>
                              <td className="p-2 text-right">{formatRand(d.vat_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {vatData.creditNotes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Credit Note Breakdown</p>
                    <div className="overflow-x-auto border border-border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr className="border-b border-border">
                            <th className="text-left p-2 font-medium">Number</th>
                            <th className="text-left p-2 font-medium">Customer</th>
                            <th className="text-left p-2 font-medium">Date</th>
                            <th className="text-right p-2 font-medium">Excl. VAT</th>
                            <th className="text-right p-2 font-medium">VAT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vatData.creditNotes.map(d => (
                            <tr key={d.id} className="border-b border-border">
                              <td className="p-2 font-medium">{d.doc_number}</td>
                              <td className="p-2">{d.customer_name}</td>
                              <td className="p-2 text-muted-foreground">{d.date}</td>
                              <td className="p-2 text-right">{formatRand(d.subtotal)}</td>
                              <td className="p-2 text-right">{formatRand(d.vat_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                  This summary is generated from your issued tax invoices and credit notes for the selected SARS tax period. Output VAT is collected on sales; credit notes reduce your VAT liability. Submit via SARS eFiling as part of your VAT201 return.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Statement */}
          <TabsContent value="income">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>
                  {settings.company_name || 'Your Company'}
                  {' · '}Period: {period.start} to {period.end}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="border-2 border-border rounded-lg divide-y divide-border">
                  <div className="flex justify-between p-3">
                    <span>Sales Revenue (excl. VAT)</span>
                    <span className="font-medium">{formatRand(incomeData.revenueExcl)}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span>Less: Credit Notes (excl. VAT)</span>
                    <span className="font-medium text-destructive">- {formatRand(incomeData.creditNotesExcl)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/30">
                    <span className="font-semibold">Net Revenue</span>
                    <span className="font-bold">{formatRand(incomeData.netRevenue)}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span>Less: Cost of Sales</span>
                    <span className="font-medium text-muted-foreground">{formatRand(0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/30">
                    <span className="font-semibold">Gross Profit</span>
                    <span className="font-bold">{formatRand(incomeData.netRevenue)}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span>Less: Operating Expenses</span>
                    <span className="font-medium text-muted-foreground">{formatRand(0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-primary/5">
                    <span className="font-bold">Net Profit Before Tax</span>
                    <span className="font-bold text-lg text-emerald-600">{formatRand(incomeData.netProfitBeforeTax)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                  This statement reflects revenue from issued tax invoices less credit notes for the period. Cost of Sales and Operating Expenses are not yet tracked — add product cost prices and record expenses to see a complete profit figure. Use this for your annual financial year-end (February) income tax return (ITR14) via SARS eFiling.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}