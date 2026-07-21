import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const docTypeLabels = {
  quote: 'QUOTATION', sales_order: 'SALES ORDER', invoice: 'TAX INVOICE', credit_note: 'CREDIT NOTE'
};

export default function DocumentPreview({ document }) {
  const { data: settingsArr = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });
  const settings = settingsArr[0] || {};

  const { data: customer } = useQuery({
    queryKey: ['customer', document.customer_id],
    queryFn: async () => {
      if (!document.customer_id) return null;
      const results = await base44.entities.Customer.filter({ id: document.customer_id });
      return results[0];
    },
    enabled: !!document.customer_id,
  });

  const termsForDocType = () => {
    if (document.doc_type === 'quote') return settings.terms_and_conditions_quotes || settings.terms_and_conditions || [];
    if (document.doc_type === 'invoice') return settings.terms_and_conditions_invoices || settings.terms_and_conditions || [];
    return settings.terms_and_conditions || [];
  };
  const terms = termsForDocType();

  return (
    <div>
      <div className="flex justify-end mb-3 no-print">
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print / PDF
        </Button>
      </div>
      <Card id="document-preview-content" className="max-w-3xl mx-auto print:shadow-none print:border-none">
        <CardContent className="p-8 space-y-6 text-sm">
          {/* Header — Logo on top, then two columns aligned: company left, invoice to right */}
          <div className="border-b-[3px] border-foreground pb-6">
            {settings.company_logo_url && (
              <img src={settings.company_logo_url} alt="Company Logo" className="h-24 mb-3 object-contain" />
            )}
            <div className="flex justify-between items-start gap-8">
              {/* Left: Company details */}
              <div className="flex-1">
                <h2 className="font-heading text-xl font-bold text-foreground">{settings.company_name || 'Your Company'}</h2>
                {settings.company_address && <p className="text-muted-foreground text-xs whitespace-pre-line mt-1">{settings.company_address}</p>}
                {settings.company_phone && <p className="text-muted-foreground text-xs">Tel: {settings.company_phone}</p>}
                {settings.company_email && <p className="text-muted-foreground text-xs">{settings.company_email}</p>}
                {settings.company_vat && <p className="text-muted-foreground text-xs font-medium">VAT Reg: {settings.company_vat}</p>}
              </div>

              {/* Right: Customer Details */}
              <div className="w-56 flex-shrink-0">
                <p className="font-heading text-xl font-bold text-foreground mb-1">CUSTOMER DETAILS</p>
                <p className="font-medium">{document.customer_name}</p>
                {document.customer_address && <p className="text-muted-foreground text-xs whitespace-pre-line">{document.customer_address}</p>}
                {document.customer_email && <p className="text-muted-foreground text-xs">{document.customer_email}</p>}
                {document.customer_vat && <p className="text-muted-foreground text-xs">VAT: {document.customer_vat}</p>}
              </div>
            </div>
          </div>

          {/* Document details */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-heading text-xl font-bold text-foreground">{docTypeLabels[document.doc_type]}</p>
              {customer?.account_number && (
                <p className="text-sm font-bold mt-1">Account: {customer.account_number}</p>
              )}
              <p className="text-sm font-bold mt-1">{document.doc_number}</p>
              <p className="text-muted-foreground text-xs mt-1">Date: {document.date}</p>
              {document.valid_until && <p className="text-muted-foreground text-xs">Valid Until: {document.valid_until}</p>}
              {document.order_reference && (
                <p className="text-muted-foreground text-xs mt-1">Order Ref: {document.order_reference}</p>
              )}
              {document.converted_from_number && (
                <p className="text-muted-foreground text-xs mt-1">Ref: {document.converted_from_number}</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b-[3px] border-foreground">
                <th className="text-left p-2 font-medium">Code</th>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-right p-2 font-medium">Qty</th>
                <th className="text-right p-2 font-medium">Unit Price</th>
                <th className="text-right p-2 font-medium">Disc %</th>
                <th className="text-right p-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(document.line_items || []).map((item, i) => (
                <tr key={i} className="border-b border-foreground/40">
                  <td className="p-2">{item.product_code}</td>
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">R {(item.unit_price || 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{item.discount_percent || 0}%</td>
                  <td className="p-2 text-right">R {(item.line_total || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal (excl. VAT)</span>
                <span>R {(document.subtotal || 0).toFixed(2)}</span>
              </div>
              {(document.discount_total || 0) > 0 && (
                <div className="flex justify-between text-xs text-destructive">
                  <span>Discount</span>
                  <span>- R {(document.discount_total || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">VAT ({document.vat_percent || 0}%)</span>
                <span>R {(document.vat_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t-[3px] border-foreground">
                <span>Total (incl. VAT)</span>
                <span>R {(document.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {document.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{document.notes}</p>
            </div>
          )}

          {/* Signature & Banking Details */}
          {(document.doc_type === 'invoice' || document.doc_type === 'quote') && (
            <div className="border border-border rounded-lg p-3 grid grid-cols-5 gap-4 text-xs">
              {/* Left: Signature / Date */}
              <div className="col-span-2 space-y-5 pt-1">
                <div>
                  <span className="font-bold">Date:</span>
                  <div className="border-b border-foreground mt-4" />
                </div>
                <div>
                  <span className="font-bold">Signature</span>
                  <div className="border-b border-foreground mt-4" />
                </div>
              </div>
              {/* Right: Banking Details */}
              {settings.bank_name && (
                <div className="col-span-3">
                  <p className="font-bold underline mb-1">Banking Details</p>
                  <div className="space-y-0.5">
                    {settings.bank_name && <p>{settings.bank_name}</p>}
                    {settings.bank_account_name && <p>Account Name: {settings.bank_account_name}</p>}
                    {settings.bank_account_number && <p>Account No: {settings.bank_account_number}</p>}
                    {settings.bank_branch_code && <p>Branch Code: {settings.bank_branch_code}</p>}
                    {settings.bank_swift && <p>SWIFT: {settings.bank_swift}</p>}
                    {settings.bank_reference && <p>Reference: {settings.bank_reference}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terms and Conditions */}
          {(document.doc_type === 'invoice' || document.doc_type === 'quote') && terms.length > 0 && (
            <div className="border-t-[3px] border-foreground pt-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Terms & Conditions</p>
              <ol className="list-decimal list-inside space-y-0.5">
                {terms.map((term, i) => (
                  term && <li key={i} className="text-[9px] text-muted-foreground leading-tight">{term}</li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}