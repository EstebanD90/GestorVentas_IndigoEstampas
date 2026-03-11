import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, TrendingUp, AlertCircle } from 'lucide-react';

export default function Calculators() {
  // State for Price Calculator
  const [cost, setCost] = useState<number | ''>('');
  const [margin, setMargin] = useState<number | ''>(30);
  const [tax, setTax] = useState<number | ''>(16); // Default VAT often 16% or similar, using 16 as placeholder or 0
  
  // Results
  const [profit, setProfit] = useState<number>(0);
  const [priceBeforeTax, setPriceBeforeTax] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  // State for Reverse Calculator (Target Price -> Max Cost)
  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [targetMargin, setTargetMargin] = useState<number | ''>(30);
  const [targetTax, setTargetTax] = useState<number | ''>(16);
  const [maxCost, setMaxCost] = useState<number>(0);

  // Effect for Forward Calculation
  useEffect(() => {
    const c = Number(cost) || 0;
    const m = Number(margin) || 0;
    const t = Number(tax) || 0;

    // Logic: Price = Cost + (Cost * Margin%)
    // Then add Tax on top of that price? Or Margin on top of Cost+Tax? 
    // Usually: Cost + Profit = NetPrice. NetPrice + Tax = FinalPrice.
    
    const profitAmount = c * (m / 100);
    const netPrice = c + profitAmount;
    const taxAmount = netPrice * (t / 100);
    const total = netPrice + taxAmount;

    setProfit(profitAmount);
    setPriceBeforeTax(netPrice);
    setFinalPrice(total);
  }, [cost, margin, tax]);

  // Effect for Reverse Calculation
  useEffect(() => {
    const p = Number(targetPrice) || 0;
    const m = Number(targetMargin) || 0;
    const t = Number(targetTax) || 0;

    // Logic: FinalPrice = (Cost * (1 + m/100)) * (1 + t/100)
    // Cost = FinalPrice / ((1 + t/100) * (1 + m/100))
    
    const taxMultiplier = 1 + (t / 100);
    const marginMultiplier = 1 + (m / 100);
    
    const calculatedMaxCost = p / (taxMultiplier * marginMultiplier);
    setMaxCost(calculatedMaxCost);
  }, [targetPrice, targetMargin, targetTax]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <Calculator className="h-8 w-8" />
        Calculadoras y Estimaciones
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forward Calculator */}
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Calcular Precio de Venta</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Costo del Producto ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || '')}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Margen de Ganancia (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(parseFloat(e.target.value) || '')}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Impuesto / IVA (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || '')}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="16"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-3 border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ganancia Neta:</span>
                <span className="font-medium text-green-500 font-mono text-lg">+${profit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Precio sin Impuestos:</span>
                <span className="font-medium font-mono">${priceBeforeTax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="font-bold">Precio Final Sugerido:</span>
                <span className="text-2xl font-bold text-primary font-mono">${finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reverse Calculator */}
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <AlertCircle className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Calcular Costo Máximo</h2>
          </div>
          <div className="text-sm text-muted-foreground mb-4 space-y-2">
            <p>
              <strong>¿Para qué sirve?</strong> Útil cuando el mercado fija el precio.
            </p>
            <p>
              Por ejemplo: Si la competencia vende una Coca-Cola a $20, tú no puedes venderla a $30. 
              Debes venderla a $20. Esta calculadora te dice <strong>cuánto es lo MÁXIMO que debes pagarle a tu proveedor</strong> por esa Coca-Cola para ganar tu margen deseado (ej. 30%).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio de Venta Objetivo (Mercado) ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || '')}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Margen Deseado (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(parseFloat(e.target.value) || '')}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Impuesto / IVA (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={targetTax}
                    onChange={(e) => setTargetTax(parseFloat(e.target.value) || '')}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="16"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-3 border border-border">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Margen de Maniobra:</span>
                 <span className="font-medium font-mono">${(Number(targetPrice) - maxCost).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="font-bold">Costo Máximo Permitido:</span>
                <span className="text-2xl font-bold text-primary font-mono">${maxCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
