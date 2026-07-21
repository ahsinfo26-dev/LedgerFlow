import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, ArrowRightLeft, Download, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import DocumentPreview from '@/components/documents/DocumentPreview';

const typeLabels = { quote: 'Quote', sales_order: 'Sales Order', invoice: 'Invoice', credit_note: 'Credit Note' };
const basePaths = { quote: '/quotes', sales_order: '/sales-orders', invoice: '/invoices', credit_note: '/credit-notes' };

export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generatingEmail, setGeneratingEmail] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ id });
      return docs[0];
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!doc) return <p className="text-center py-20 text-muted-foreground">Document not found</p>;

  const base = basePaths[doc.doc_type];

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const element = window.document.getElementById('document-preview-content');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 0;
    let remaining = imgHeight;
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight);
      remaining -= pageHeight;
      if (remaining > 0) { pdf.addPage(); y += pageHeight; }
    }
    pdf.save(`${doc.doc_number}.pdf`);
  };

  const handleEmailPDF = async () => {
    setGeneratingEmail(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const element = window.document.getElementById('document-preview-content');
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let y = 0;
      let remaining = imgHeight;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight);
        remaining -= pageHeight;
        if (remaining > 0) { pdf.addPage(); y += pageHeight; }
      }
      // Save PDF so user has it ready to attach
      pdf.save(`${doc.doc_number}.pdf`);
      // Open email client pre-filled with recipient and subject
      const docLabel = typeLabels[doc.doc_type];
      const settingsArr = await base44.entities.Settings.list();
      const settings = settingsArr[0] || {};
      const subject = encodeURIComponent(`${docLabel} ${doc.doc_number} from ${settings.company_name || ''}`);
      const body = encodeURIComponent(`Please find attached ${docLabel} ${doc.doc_number}.\n\nKind regards,\n${settings.company_name || ''}`);
      const to = encodeURIComponent(doc.customer_email || '');
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingEmail(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6 no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate(base)} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleEmailPDF} disabled={generatingEmail} className="gap-1.5">
          <Mail className="w-4 h-4" /> {generatingEmail ? 'Preparing...' : 'Email'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`${base}/${id}/edit`)} className="gap-1.5">
          <Pencil className="w-4 h-4" /> Edit
        </Button>
        {doc.doc_type === 'quote' && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/sales-orders/convert/${id}`)} className="gap-1.5">
              <ArrowRightLeft className="w-4 h-4" /> To Sales Order
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/convert/${id}`)} className="gap-1.5">
              <ArrowRightLeft className="w-4 h-4" /> To Invoice
            </Button>
          </>
        )}
        {doc.doc_type === 'sales_order' && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/convert/${id}`)} className="gap-1.5">
            <ArrowRightLeft className="w-4 h-4" /> To Invoice
          </Button>
        )}
      </div>
      <DocumentPreview document={doc} />


    </div>
  );
}