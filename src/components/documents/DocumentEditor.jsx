import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Save, Loader2 } from 'lucide-react';
import LineItemRow from './LineItemRow';
import { toast } from 'sonner';

export default function DocumentEditor({ document, docType, onSave, onCancel }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [doc, setDoc] = useState(document || {
    doc_type: docType,
    status: 'draft',
    date: new Date().toISOString().split('T')[0],
    line_items: [],
    vat_percent: 15,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  useEffect(() => {
    recalculate(doc.line_items, doc.vat_percent);
  }, []);

  const recalculate = (items, vatPct) => {
    const subtotal = items.reduce((sum, item) => {
      const lineSub = (item.quantity || 0) * (item.unit_price || 0);
      return sum + lineSub;
    }, 0);
    const discountTotal = items.reduce((sum, item) => {
      const lineSub = (item.quantity || 0) * (item.unit_price || 0);
      return sum + (lineSub * (item.discount_percent || 0) / 100);
    }, 0);
    const afterDiscount = subtotal - discountTotal;
    const vatAmount = afterDiscount * (vatPct || 0) / 100;
    setDoc(prev => ({
      ...prev,
      line_items: items,
      vat_percent: vatPct,
      subtotal,
      discount_total: discountTotal,
      vat_amount: vatAmount,
      total: afterDiscount + vatAmount,
    }));
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setDoc(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name,
        customer_email: customer.email || '',
        customer_address: customer.address || '',
        customer_vat: customer.vat_number || '',
      }));
    }
  };

  const addLineItem = () => {
    const newItems = [...doc.line_items, {
      product_id: '', product_code: '', description: '',
      quantity: 1, unit_price: 0, discount_percent: 0, line_total: 0
    }];
    recalculate(newItems, doc.vat_percent);
  };

  const updateLineItem = (index, item) => {
    const newItems = [...doc.line_items];
    newItems[index] = item;
    recalculate(newItems, doc.vat_percent);
  };

  const removeLineItem = (index) => {
    const newItems = doc.line_items.filter((_, i) => i !== index);
    recalculate(newItems, doc.vat_percent);
  };

  const handleSave = async () => {
    if (!doc.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (doc.line_items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    setSaving(true);
    await onSave(doc);
    setSaving(false);
  };

  const docTypeLabels = {
    quote: 'Quote', sales_order: 'Sales Order', invoice: 'Invoice', credit_note: 'Credit Note'
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{doc.id ? 'Edit' : 'New'} {docTypeLabels[docType]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Customer</Label>
              <Select value={doc.customer_id || ''} onValueChange={handleCustomerSelect}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Order Reference</Label>
              <Input
                value={doc.order_reference || ''}
                onChange={(e) => setDoc(prev => ({ ...prev, order_reference: e.target.value }))}
                placeholder="Customer PO / order number"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={doc.date || ''}
                onChange={(e) => setDoc(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            {docType === 'quote' && (
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={doc.valid_until || ''}
                  onChange={(e) => setDoc(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            )}
            <div>
              <Label>Status</Label>
              <Select value={doc.status || 'draft'} onValueChange={(v) => setDoc(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  {docType === 'invoice' && <SelectItem value="paid">Paid</SelectItem>}
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <Label>Charge VAT</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch
                  checked={(doc.vat_percent || 0) > 0}
                  onCheckedChange={(checked) => recalculate(doc.line_items, checked ? 15 : 0)}
                  disabled={!isAdmin}
                />
                <span className="text-sm text-muted-foreground">
                  {(doc.vat_percent || 0) > 0 ? `${doc.vat_percent}% VAT` : 'No VAT'}
                </span>
                {!isAdmin && <span className="text-xs text-muted-foreground">(admin only)</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="p-2 font-medium text-muted-foreground text-xs">Code</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs">Description</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Qty</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Unit Price</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Disc %</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Total</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {doc.line_items.map((item, i) => (
                   <LineItemRow
                    key={i}
                    item={item}
                    index={i}
                    products={products}
                    onChange={updateLineItem}
                    onRemove={removeLineItem}
                    isAdmin={isAdmin}
                  />
                ))}
              </tbody>
            </table>
            {doc.line_items.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No items added yet. Click "Add Item" to begin.</p>
            )}
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R {(doc.subtotal || 0).toFixed(2)}</span>
              </div>
              {(doc.discount_total || 0) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>- R {(doc.discount_total || 0).toFixed(2)}</span>
                </div>
              )}
              {(doc.vat_percent || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({doc.vat_percent}%)</span>
                  <span>R {(doc.vat_amount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1.5 border-t border-border">
                <span>Total</span>
                <span>R {(doc.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-4">
          <Label>Notes</Label>
          <Textarea
            value={doc.notes || ''}
            onChange={(e) => setDoc(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save {docTypeLabels[docType]}
        </Button>
      </div>
    </div>
  );
}