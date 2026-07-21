import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';

const emptyCustomer = { name: '', contact_person: '', email: '', phone: '', address: '', vat_number: '' };

const generateAccountNumber = (name, existingCustomers) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let initials = words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
  if (!initials) initials = 'CUST';
  const prefix = initials;
  const matching = existingCustomers.filter(c => (c.account_number || '').startsWith(prefix));
  const nextNum = matching.length + 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
};

export default function Customers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing?.id ? base44.entities.Customer.update(editing.id, data) : base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDialogOpen(false);
      toast.success(editing?.id ? 'Customer updated' : 'Customer added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
  });

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      contact_person: fd.get('contact_person'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      address: fd.get('address'),
      vat_number: fd.get('vat_number'),
    };
    if (!editing?.id) {
      data.account_number = generateAccountNumber(data.name, customers);
    }
    saveMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers`}
        actionLabel="Add Customer"
        onAction={() => { setEditing(emptyCustomer); setDialogOpen(true); }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" />
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Account No</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Contact</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Phone</th>
                  <th className="p-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell font-mono text-xs">{c.account_number || '—'}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{c.contact_person || '—'}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.email || '—'}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{c.phone || '—'}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No customers found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Company / Customer Name *</Label><Input name="name" defaultValue={editing?.name} required /></div>
            <div><Label>Contact Person</Label><Input name="contact_person" defaultValue={editing?.contact_person} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input name="email" type="email" defaultValue={editing?.email} /></div>
              <div><Label>Phone</Label><Input name="phone" defaultValue={editing?.phone} /></div>
            </div>
            <div><Label>Address</Label><Textarea name="address" defaultValue={editing?.address} rows={2} /></div>
            <div><Label>VAT Number</Label><Input name="vat_number" defaultValue={editing?.vat_number} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}