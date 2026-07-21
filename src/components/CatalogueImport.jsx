import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const PRODUCT_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      code: { type: "string", description: "Product code or SKU" },
      name: { type: "string", description: "Product name" },
      description: { type: "string", description: "Product description" },
      unit_price: { type: "number", description: "Selling price" },
      cost_price: { type: "number", description: "Cost price if available" },
      unit: { type: "string", description: "Unit of measure e.g. each, box, kg" },
      category: { type: "string", description: "Product category" },
    },
    required: ["code", "name"]
  }
};

export default function CatalogueImport({ open, onClose, onImported }) {
  const [stage, setStage] = useState('idle'); // idle | uploading | extracting | review | saving
  const [file, setFile] = useState(null);
  const [extracted, setExtracted] = useState([]);
  const [selected, setSelected] = useState([]);
  const fileRef = useRef();

  const reset = () => {
    setStage('idle');
    setFile(null);
    setExtracted([]);
    setSelected([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;

    try {
      setStage('uploading');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setStage('extracting');
      const result = await Promise.race([
        base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: PRODUCT_SCHEMA,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 60000)
        ),
      ]);

      if (result.status !== 'success' || !result.output?.length) {
        toast.error('Could not extract products from this file. Try a clearer PDF or image.');
        setStage('idle');
        return;
      }

    const items = (Array.isArray(result.output) ? result.output : [result.output]).map((p, i) => ({
      ...p,
      unit_price: p.unit_price || 0,
      cost_price: p.cost_price || 0,
      stock_quantity: 0,
      unit: p.unit || 'each',
      is_active: true,
      _key: i,
    }));

      setExtracted(items);
      setSelected(items.map((_, i) => i));
      setStage('review');
    } catch (err) {
      if (err.message === 'timeout') {
        toast.error('Extraction timed out. The file may be too large or complex. Try splitting it into smaller sections.');
      } else {
        toast.error('Something went wrong during extraction. Please try again.');
      }
      setStage('idle');
    }
  };

  const toggleSelect = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleImport = async () => {
    const toImport = extracted.filter(p => selected.includes(p._key)).map(({ _key, ...p }) => p);
    if (!toImport.length) return;

    setStage('saving');
    await base44.entities.Product.bulkCreate(toImport);
    toast.success(`${toImport.length} product${toImport.length > 1 ? 's' : ''} imported!`);
    onImported();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Catalogue</DialogTitle>
        </DialogHeader>

        {stage === 'idle' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:bg-muted/30 transition-colors w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">{file ? file.name : 'Click to upload your catalogue'}</p>
              <p className="text-sm text-muted-foreground mt-1">PDF, PNG, JPG or XLSX supported</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
              </div>
            )}
            <Button onClick={handleProcess} disabled={!file} className="w-full">
              Extract Products
            </Button>
          </div>
        )}

        {(stage === 'uploading' || stage === 'extracting') && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-medium">{stage === 'uploading' ? 'Uploading file...' : 'Extracting products with AI...'}</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {stage === 'review' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Found <strong>{extracted.length}</strong> products. Select which ones to import.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelected(extracted.map((_, i) => i))}>All</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected([])}>None</Button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 border rounded-lg divide-y">
              {extracted.map((p) => (
                <div
                  key={p._key}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors ${selected.includes(p._key) ? 'bg-primary/5' : 'opacity-50'}`}
                  onClick={() => toggleSelect(p._key)}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(p._key) ? 'bg-primary border-primary' : 'border-border'}`}>
                    {selected.includes(p._key) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="font-mono text-xs font-semibold text-primary">{p.code}</span>
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.category && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{p.category}</span>}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                    <p className="text-xs mt-0.5">
                      {p.unit_price > 0 ? `R ${p.unit_price.toFixed(2)}` : 'No price'}
                      {p.unit && ` · ${p.unit}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={!selected.length}>
                Import {selected.length} Product{selected.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}

        {stage === 'saving' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-medium">Saving products...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}