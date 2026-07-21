import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FilePlus, Receipt, CreditCard, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-105`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { data: documents = [] } = useQuery({
    queryKey: ['all-documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 50),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const quotes = documents.filter(d => d.doc_type === 'quote');
  const salesOrders = documents.filter(d => d.doc_type === 'sales_order');
  const invoices = documents.filter(d => d.doc_type === 'invoice');
  const creditNotes = documents.filter(d => d.doc_type === 'credit_note');
  const lowStockProducts = products.filter(p => p.stock_quantity <= 5 && p.is_active !== false);

  const recentDocs = documents.slice(0, 8);
  const totalInvoiced = invoices.reduce((s, d) => s + (d.total || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your business</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Quotes" value={quotes.length} color="bg-blue-500" to="/quotes" />
        <StatCard icon={FilePlus} label="Sales Orders" value={salesOrders.length} color="bg-indigo-500" to="/sales-orders" />
        <StatCard icon={Receipt} label="Invoices" value={invoices.length} color="bg-emerald-500" to="/invoices" />
        <StatCard icon={CreditCard} label="Credit Notes" value={creditNotes.length} color="bg-amber-500" to="/credit-notes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total invoiced */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading">R {totalInvoiced.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Invoiced</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading">{products.length}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${lowStockProducts.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading">{lowStockProducts.length}</p>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No documents yet. Start by creating a quote or invoice.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Number</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Type</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Customer</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Date</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs text-right">Total</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocs.map(doc => (
                    <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 font-medium">{doc.doc_number}</td>
                      <td className="py-2.5 capitalize text-xs">{doc.doc_type?.replace('_', ' ')}</td>
                      <td className="py-2.5">{doc.customer_name}</td>
                      <td className="py-2.5 text-muted-foreground">{doc.date}</td>
                      <td className="py-2.5 text-right font-medium">R {(doc.total || 0).toFixed(2)}</td>
                      <td className="py-2.5"><StatusBadge status={doc.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}