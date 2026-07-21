import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function LineItemRow({ item, index, products, onChange, onRemove, isAdmin }) {
  const handleProductSelect = (code) => {
    const product = products.find(p => p.code === code);
    if (product) {
      onChange(index, {
        ...item,
        product_id: product.id,
        product_code: product.code,
        description: product.name,
        unit_price: product.unit_price,
        quantity: item.quantity || 1,
        discount_percent: item.discount_percent || 0,
      });
    }
  };

  const calcLineTotal = (qty, price, disc) => {
    const sub = (qty || 0) * (price || 0);
    return sub - (sub * (disc || 0) / 100);
  };

  const handleChange = (field, value) => {
    const updated = { ...item, [field]: value };
    updated.line_total = calcLineTotal(updated.quantity, updated.unit_price, updated.discount_percent);
    onChange(index, updated);
  };

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="p-2">
        <Input
          placeholder="Code"
          value={item.product_code || ''}
          onChange={(e) => {
            handleChange('product_code', e.target.value);
            handleProductSelect(e.target.value);
          }}
          list={`products-${index}`}
          className="w-24 text-xs"
        />
        <datalist id={`products-${index}`}>
          {products.map(p => (
            <option key={p.id} value={p.code}>{p.name}</option>
          ))}
        </datalist>
      </td>
      <td className="p-2">
        <Input
          placeholder="Description"
          value={item.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="text-xs"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="0"
          value={item.quantity || ''}
          onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
          className="w-full text-xs text-right"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unit_price || ''}
          onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
          className="w-full text-xs text-right"
          disabled={!isAdmin}
          title={!isAdmin ? 'Only admins can change pricing' : ''}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          min="0"
          max="100"
          value={item.discount_percent || ''}
          onChange={(e) => handleChange('discount_percent', parseFloat(e.target.value) || 0)}
          className="w-full text-xs text-right"
          disabled={!isAdmin}
          title={!isAdmin ? 'Only admins can apply discounts' : ''}
        />
      </td>
      <td className="p-2 text-right text-xs font-medium whitespace-nowrap">
        R {(item.line_total || 0).toFixed(2)}
      </td>
      <td className="p-2">
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="h-7 w-7 text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );
}