import DocumentList from '@/components/documents/DocumentList';

export default function SalesOrders() {
  return <DocumentList docType="sales_order" basePath="/sales-orders" />;
}