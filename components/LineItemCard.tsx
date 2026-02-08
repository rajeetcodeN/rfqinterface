import React from 'react';
import { LineItem, MaterialType } from '../types';
import { formatCurrency, formatNumber } from '../services/calculationService';
import { ChevronDown, Box, Ruler, Weight, Euro, Trash2, Copy } from 'lucide-react';

interface LineItemCardProps {
  item: LineItem;
  index: number;
  onChange: (id: string, field: string, value: any) => void;
}

export const LineItemCard: React.FC<LineItemCardProps> = ({ item, index, onChange }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 transition-all duration-300 hover:shadow-md hover:border-blue-200 group">
      {/* Card Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between cursor-pointer rounded-t-xl transition-colors ${isExpanded ? 'bg-gray-50/80 border-b border-gray-100' : 'hover:bg-gray-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-white border border-gray-200 text-gray-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">
            {index + 1}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 text-sm truncate max-w-[250px]">{item.description || 'New Line Item'}</span>
            <span className="text-xs text-gray-600 font-mono">{item.material} • {item.quantity} {item.unit}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-700 font-medium uppercase tracking-wider">Total</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(item.calculation.totalLineCost)}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Card Body */}
      {isExpanded && (
        <div className="p-6 bg-white rounded-b-xl animate-in slide-in-from-top-2 duration-200">

          <div className="grid grid-cols-12 gap-6">

            {/* Description - Full Width */}
            <div className="col-span-12">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 block">Description</label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => onChange(item.id, 'description', e.target.value)}
                className="w-full text-base font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none py-2 px-3 transition-colors shadow-sm"
                placeholder="Enter item description..."
              />
            </div>

            {/* Material Select */}
            <div className="col-span-12 md:col-span-4">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Box className="w-3 h-3" /> Material
              </label>
              <div className="relative">
                <select
                  value={item.material}
                  onChange={(e) => onChange(item.id, 'material', e.target.value)}
                  className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer shadow-sm"
                >
                  {Object.values(MaterialType).map((m) => (
                    <option key={m} value={m} className="text-gray-900 bg-white">{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Quantity */}
            <div className="col-span-6 md:col-span-2">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">Qty</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
              />
            </div>

            {/* Delivery Date */}
            <div className="col-span-6 md:col-span-6">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">Delivery Target</label>
              <input
                type="date"
                value={item.deliveryDate || ''}
                onChange={(e) => onChange(item.id, 'deliveryDate', e.target.value)}
                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>

            {/* Dimensions */}
            <div className="col-span-12">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Dimensions (mm)
              </label>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="relative group">
                  <span className="text-[10px] font-bold text-gray-500 absolute top-2.5 left-3">L</span>
                  <input
                    type="number"
                    value={item.dimensions.length}
                    onChange={(e) => onChange(item.id, 'dimensions.length', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-bold font-mono text-gray-900 bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="relative group">
                  <span className="text-[10px] font-bold text-gray-500 absolute top-2.5 left-3">W</span>
                  <input
                    type="number"
                    value={item.dimensions.width}
                    onChange={(e) => onChange(item.id, 'dimensions.width', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-bold font-mono text-gray-900 bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="relative group">
                  <span className="text-[10px] font-bold text-gray-500 absolute top-2.5 left-3">H</span>
                  <input
                    type="number"
                    value={item.dimensions.height}
                    onChange={(e) => onChange(item.id, 'dimensions.height', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-bold font-mono text-gray-900 bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Calculation Breakdown (Mini) */}
            <div className="col-span-12 mt-2 pt-4 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-blue-600 uppercase font-bold">Volume</span>
                    <span className="text-xs font-mono font-bold text-blue-900">{(item.calculation.volumeMm3 / 1000).toFixed(2)} cm³</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-blue-600 uppercase font-bold">Weight</span>
                    <span className="text-xs font-mono font-bold text-blue-900">{formatNumber(item.calculation.weightGrams)} g</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-blue-600 uppercase font-bold">Material Rate</span>
                    <span className="text-xs font-mono font-bold text-blue-900">{formatCurrency(item.calculation.materialCost)} / unit</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors" title="Duplicate">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};