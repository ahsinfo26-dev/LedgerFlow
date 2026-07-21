import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Eye, Pencil, Trash2, FileText, ArrowRightLeft } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';
import { toast } from 'sonner';

const docTypeLabels = {
  quote: 'Quote', sales_order: 'Sales Order', invoice: 'Invoice', credit_note: 'Credit Note'
};

export default function DocumentList({ docType, basePath }) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', docType],
    queryFn: () => base44.entities.Document.filter({ doc_type: docType }, '-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', docType] });
      toast.success('Document deleted');
    },
  });

  const filtered = documents.filter(d =>
    d.doc_number?.toLowerCase().includes(search.toLowerCase()) ||
    d.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={`${docTypeLabels[docType]}s`}
        subtitle={`${documents.length} ${docTypeLabels[docType].toLowerCase()}s`}
        actionLabel={`New ${docTypeLabels[docType]}`}
        onAction={() => navigate(`${basePath}/new`)}
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
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Number</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs">Total</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Status</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`${basePath}/${doc.id}`)}>
                    <td className="p-3 font-medium">{doc.doc_number}</td>
                    <td className="p-3">{doc.customer_name}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{doc.date}</td>
                    <td className="p-3 text-right font-medium">R {(doc.total || 0).toFixed(2)}</td>
                    <td className="p-3"><StatusBadge status={doc.status} /></td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`${basePath}/${doc.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`${basePath}/${doc.id}/edit`)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {docType === 'quote' && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`/sales-orders/convert/${doc.id}`)}>
                                <ArrowRightLeft className="w-4 h-4 mr-2" /> Convert to Sales Order
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/invoices/convert/${doc.id}`)}>
                                <ArrowRightLeft className="w-4 h-4 mr-2" /> Convert to Invoice
                              </DropdownMenuItem>
                            </>
                          )}
                          {docType === 'sales_order' && (
                            <DropdownMenuItem onClick={() => navigate(`/invoices/convert/${doc.id}`)}>
                              <ArrowRightLeft className="w-4 h-4 mr-2" /> Convert to Invoice
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(doc.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No {docTypeLabels[docType].toLowerCase()}s found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}