import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Building2, Landmark, FileText, Hash, ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});
  const [termsTextQuotes, setTermsTextQuotes] = useState('');
  const [termsTextInvoices, setTermsTextInvoices] = useState('');

  const { data: settingsArr = [], isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });

  useEffect(() => {
    const s = settingsArr[0];
    if (s) {
      setForm(s);
      const qTerms = s.terms_and_conditions_quotes || s.terms_and_conditions || [];
      setTermsTextQuotes(qTerms.join('\n'));
      setTermsTextInvoices((s.terms_and_conditions_invoices || []).join('\n'));
    }
  }, [settingsArr]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const s = settingsArr[0];
      if (s?.id) {
        return base44.entities.Settings.update(s.id, data);
      }
      return base44.entities.Settings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved');
    },
  });

  const handleSave = () => {
    const quotesArray = termsTextQuotes.split('\n').slice(0, 15);
    const invoicesArray = termsTextInvoices.split('\n').slice(0, 15);
    saveMutation.mutate({
      ...form,
      terms_and_conditions_quotes: quotesArray,
      terms_and_conditions_invoices: invoicesArray,
    });
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company details, banking and terms" />

      <div className="space-y-4 max-w-3xl">
        {/* Company Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Company Details</CardTitle>
            </div>
            <CardDescription>Your company information shown on documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Logo Upload */}
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5"><ImageIcon className="w-3.5 h-3.5" /> Company Logo</Label>
              <div className="flex items-center gap-4">
                {form.company_logo_url && (
                  <img src={form.company_logo_url} alt="Logo preview" className="h-14 object-contain border rounded p-1" />
                )}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Logo URL (paste a direct image link)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.company_logo_url || ''}
                      onChange={e => updateField('company_logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    {form.company_logo_url && (
                      <Button variant="outline" size="sm" onClick={() => updateField('company_logo_url', '')}>Remove</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Company Name</Label><Input value={form.company_name || ''} onChange={e => updateField('company_name', e.target.value)} /></div>
              <div><Label>VAT Number</Label><Input value={form.company_vat || ''} onChange={e => updateField('company_vat', e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={form.company_phone || ''} onChange={e => updateField('company_phone', e.target.value)} /></div>
              <div><Label>Email</Label><Input value={form.company_email || ''} onChange={e => updateField('company_email', e.target.value)} /></div>
            </div>
            <div><Label>Address</Label><Textarea value={form.company_address || ''} onChange={e => updateField('company_address', e.target.value)} rows={3} /></div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Banking Details</CardTitle>
            </div>
            <CardDescription>Shown on quotes and invoices for customer payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Bank Name</Label><Input value={form.bank_name || ''} onChange={e => updateField('bank_name', e.target.value)} /></div>
              <div><Label>Account Holder Name</Label><Input value={form.bank_account_name || ''} onChange={e => updateField('bank_account_name', e.target.value)} /></div>
              <div><Label>Account Number</Label><Input value={form.bank_account_number || ''} onChange={e => updateField('bank_account_number', e.target.value)} /></div>
              <div><Label>Branch Code</Label><Input value={form.bank_branch_code || ''} onChange={e => updateField('bank_branch_code', e.target.value)} /></div>
              <div><Label>SWIFT Code</Label><Input value={form.bank_swift || ''} onChange={e => updateField('bank_swift', e.target.value)} /></div>
              <div><Label>Default Reference</Label><Input value={form.bank_reference || ''} onChange={e => updateField('bank_reference', e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Terms & Conditions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Quote Terms & Conditions</CardTitle>
            </div>
            <CardDescription>Up to 15 lines. Each line appears as a numbered item on quotations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={termsTextQuotes}
              onChange={e => setTermsTextQuotes(e.target.value)}
              rows={10}
              placeholder={"Line 1: Prices valid for 30 days from quote date.\nLine 2: 50% deposit required to confirm order.\nLine 3: ..."}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {termsTextQuotes.split('\n').filter(Boolean).length} / 15 lines used
            </p>
          </CardContent>
        </Card>

        {/* Invoice Terms & Conditions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Invoice Terms & Conditions</CardTitle>
            </div>
            <CardDescription>Up to 15 lines. Each line appears as a numbered item on tax invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={termsTextInvoices}
              onChange={e => setTermsTextInvoices(e.target.value)}
              rows={10}
              placeholder={"Line 1: Payment due within 30 days of invoice date.\nLine 2: Interest charged at 2% per month on overdue accounts.\nLine 3: ..."}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {termsTextInvoices.split('\n').filter(Boolean).length} / 15 lines used
            </p>
          </CardContent>
        </Card>

        {/* Document Numbering */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Document Numbering</CardTitle>
            </div>
            <CardDescription>Prefixes and next sequence numbers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>Quote Prefix</Label>
                <Input value={form.quote_prefix || 'QUO'} onChange={e => updateField('quote_prefix', e.target.value)} />
              </div>
              <div>
                <Label>Next #</Label>
                <Input type="number" value={form.next_quote_number || 1} onChange={e => updateField('next_quote_number', parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <Label>SO Prefix</Label>
                <Input value={form.sales_order_prefix || 'SO'} onChange={e => updateField('sales_order_prefix', e.target.value)} />
              </div>
              <div>
                <Label>Next #</Label>
                <Input type="number" value={form.next_sales_order_number || 1} onChange={e => updateField('next_sales_order_number', parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <Label>Invoice Prefix</Label>
                <Input value={form.invoice_prefix || 'INV'} onChange={e => updateField('invoice_prefix', e.target.value)} />
              </div>
              <div>
                <Label>Next #</Label>
                <Input type="number" value={form.next_invoice_number || 1} onChange={e => updateField('next_invoice_number', parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <Label>CN Prefix</Label>
                <Input value={form.credit_note_prefix || 'CN'} onChange={e => updateField('credit_note_prefix', e.target.value)} />
              </div>
              <div>
                <Label>Next #</Label>
                <Input type="number" value={form.next_credit_note_number || 1} onChange={e => updateField('next_credit_note_number', parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div className="mt-3">
              <Label>Default VAT %</Label>
              <Input type="number" value={form.default_vat_percent ?? 15} onChange={e => updateField('default_vat_percent', parseFloat(e.target.value) || 0)} className="w-24" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}