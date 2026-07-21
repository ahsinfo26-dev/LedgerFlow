import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Search, Package, Upload } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import CatalogueImport from '@/components/CatalogueImport';

const emptyProduct = { code: '', name: '', description: '', unit_price: 0, cost_price: 0, stock_quantity: 0, unit: 'each', category: '', is_active: true };

export default function Products() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [sellPrice, setSellPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);

  const gp = sellPrice > 0 ? (((sellPrice - costPrice) / sellPrice) * 100).toFixed(1) : null;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing?.id ? base44.entities.Product.update(editing.id, data) : base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      toast.success(editing?.id ? 'Product updated' : 'Product created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
  });

  const filtered = products.filter(p =>
    p.code?.toLowerCase().includes(search.toLowerCase()) ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveMutation.mutate({
      code: fd.get('code'),
      name: fd.get('name'),
      description: fd.get('description'),
      unit_price: parseFloat(fd.get('unit_price')) || 0,
      cost_price: parseFloat(fd.get('cost_price')) || 0,
      stock_quantity: parseFloat(fd.get('stock_quantity')) || 0,
      unit: fd.get('unit'),
      category: fd.get('category'),
      is_active: true,
    });
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products`}
        actionLabel="Add Product"
        onAction={() => { setEditing(emptyProduct); setSellPrice(0); setCostPrice(0); setDialogOpen(true); }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Import Catalogue
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Code</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Category</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs">Price</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs">Stock</th>
                  <th className="p-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs font-medium">{p.code}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{p.category || '—'}</td>
                    <td className="p-3 text-right">R {(p.unit_price || 0).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <span className={p.stock_quantity <= 5 ? 'text-destructive font-medium' : ''}>
                        {p.stock_quantity || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(p); setSellPrice(p.unit_price || 0); setCostPrice(p.cost_price || 0); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CatalogueImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code *</Label><Input name="code" defaultValue={editing?.code} required /></div>
              <div><Label>Unit</Label><Input name="unit" defaultValue={editing?.unit || 'each'} /></div>
            </div>
            <div><Label>Name *</Label><Input name="name" defaultValue={editing?.name} required /></div>
            <div><Label>Description</Label><Input name="description" defaultValue={editing?.description} /></div>
            <div><Label>Category</Label><Input name="category" defaultValue={editing?.category} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sell Price *</Label>
                <Input name="unit_price" type="number" step="0.01" defaultValue={editing?.unit_price} required
                  onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Cost Price</Label>
                <Input name="cost_price" type="number" step="0.01" defaultValue={editing?.cost_price}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            {gp !== null && (
              <div className={`text-sm font-medium px-3 py-2 rounded-md ${parseFloat(gp) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                GP: {gp}% &nbsp;(Margin: R {(sellPrice - costPrice).toFixed(2)})
              </div>
            )}
            <div><Label>Stock Qty</Label><Input name="stock_quantity" type="number" defaultValue={editing?.stock_quantity} /></div>
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