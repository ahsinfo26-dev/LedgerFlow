import DocumentList from '@/components/documents/DocumentList';

export default function Invoices() {
  return <DocumentList docType="invoice" basePath="/invoices" />;
}