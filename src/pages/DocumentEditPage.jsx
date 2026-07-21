import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DocumentEditor from '@/components/documents/DocumentEditor';

export default function DocumentEditPage({ docType, basePath }) {
  const { id, sourceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load existing document for editing
  const { data: existingDoc, isLoading: loadingExisting } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ id });
      return docs[0];
    },
    enabled: !!id,
  });

  // Load source document for conversion
  const { data: sourceDoc, isLoading: loadingSource } = useQuery({
    queryKey: ['document', sourceId],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ id: sourceId });
      return docs[0];
    },
    enabled: !!sourceId,
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });
  const settings = settingsArr[0] || {};

  const getNextNumber = () => {
    const prefixMap = {
      quote: settings.quote_prefix || 'QUO',
      sales_order: settings.sales_order_prefix || 'SO',
      invoice: settings.invoice_prefix || 'INV',
      credit_note: settings.credit_note_prefix || 'CN',
    };
    const numMap = {
      quote: settings.next_quote_number || 1,
      sales_order: settings.next_sales_order_number || 1,
      invoice: settings.next_invoice_number || 1,
      credit_note: settings.next_credit_note_number || 1,
    };
    return `${prefixMap[docType]}-${String(numMap[docType]).padStart(4, '0')}`;
  };

  const incrementNumber = async () => {
    if (!settings.id) return;
    const fieldMap = {
      quote: 'next_quote_number',
      sales_order: 'next_sales_order_number',
      invoice: 'next_invoice_number',
      credit_note: 'next_credit_note_number',
    };
    const field = fieldMap[docType];
    const current = settings[field] || 1;
    await base44.entities.Settings.update(settings.id, { [field]: current + 1 });
  };

  const updateStockLevels = async (lineItems, operation) => {
    for (const item of lineItems) {
      if (item.product_id) {
        const products = await base44.entities.Product.filter({ id: item.product_id });
        const product = products[0];
        if (product) {
          const qtyChange = operation === 'deduct' ? -(item.quantity || 0) : (item.quantity || 0);
          await base44.entities.Product.update(product.id, {
            stock_quantity: (product.stock_quantity || 0) + qtyChange,
          });
        }
      }
    }
  };

  const handleSave = async (docData) => {
    if (id) {
      // Update existing
      await base44.entities.Document.update(id, docData);
      toast.success('Document updated');
    } else {
      // Create new
      const docNumber = getNextNumber();
      const newDoc = {
        ...docData,
        doc_type: docType,
        doc_number: docNumber,
      };
      if (sourceId && sourceDoc) {
        newDoc.converted_from_id = sourceId;
        newDoc.converted_from_type = sourceDoc.doc_type;
        newDoc.converted_from_number = sourceDoc.doc_number;
        // Mark source as converted
        await base44.entities.Document.update(sourceId, { status: 'converted' });
      }
      await base44.entities.Document.create(newDoc);
      await incrementNumber();

      // Deduct stock for invoices and sales orders
      if (docType === 'invoice' || docType === 'sales_order') {
        await updateStockLevels(docData.line_items || [], 'deduct');
      }
      // Add stock back for credit notes
      if (docType === 'credit_note') {
        await updateStockLevels(docData.line_items || [], 'add');
      }

      toast.success('Document created');
    }
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['all-documents'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    navigate(basePath);
  };

  if (loadingExisting || loadingSource) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Prepare initial document data
  let initialDoc = existingDoc || undefined;
  if (sourceDoc && !id) {
    initialDoc = {
      ...sourceDoc,
      id: undefined,
      doc_type: docType,
      doc_number: undefined,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      created_date: undefined,
      updated_date: undefined,
    };
  }

  return (
    <DocumentEditor
      document={initialDoc}
      docType={docType}
      onSave={handleSave}
      onCancel={() => navigate(basePath)}
    />
  );
}