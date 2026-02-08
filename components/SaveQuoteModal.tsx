import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Hash, User as UserIcon, FileText, CheckSquare, Building2, ChevronDown } from 'lucide-react';
import { RFQHeader, User } from '../types';
import { getUsers } from '../services/userService';

interface SaveQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (header: RFQHeader) => void;
  initialHeader: RFQHeader;
  totalCost: string;
}

export const SaveQuoteModal: React.FC<SaveQuoteModalProps> = ({
  isOpen, onClose, onSave, initialHeader, totalCost
}) => {
  const [formData, setFormData] = useState<RFQHeader>(initialHeader);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  // Update form data when initialHeader changes (for auto-fill)
  useEffect(() => {
    setFormData(initialHeader);
  }, [initialHeader]);

  if (!isOpen) return null;

  const handleChange = (field: keyof RFQHeader, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300 scale-100">

        {/* Header */}
        <div className="px-10 py-8 bg-white border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Update RFQ Details</h2>
            <div className="flex items-center text-sm text-gray-600 mt-2 gap-2 font-medium">
              <span className="text-blue-600">Quotation Management</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900">Metadata & Logistics</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-10 overflow-y-auto flex-1 bg-white custom-scrollbar">
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">

            {/* Row 1: RFQ Number & Customer Name */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">RFQ Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.rfqNumber || 'RFQ00129'}
                  readOnly
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-bold font-mono text-sm focus:outline-none cursor-not-allowed"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Hash className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-900 font-medium placeholder-gray-400 shadow-sm"
                placeholder="Client Company Name"
              />
            </div>

            {/* Row 2: RFQ Name & Responsible Person */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">RFQ Name / Project</label>
              <input
                type="text"
                value={formData.rfqName}
                onChange={(e) => handleChange('rfqName', e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-900 font-medium placeholder-gray-400 shadow-sm"
                placeholder="e.g. Project Alpha Chassis"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Responsible Person</label>
              <div className="relative">
                <select
                  value={formData.responsiblePerson}
                  onChange={(e) => handleChange('responsiblePerson', e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-900 font-medium appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">Select User...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Row 3: Bid Close Date & Vendor */}
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                Bid Close Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.bidCloseDate}
                  onChange={(e) => handleChange('bidCloseDate', e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-900 font-medium shadow-sm"
                />
                <Calendar className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Vendor / Supplier</label>
              <div className="flex items-center">
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3.5 rounded-xl border border-blue-100 shadow-sm w-full">
                  <span className="text-sm font-bold truncate">{formData.vendorName}</span>
                </div>
              </div>
            </div>

            {/* Row 4: Description (Full Width) */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">RFQ Description</label>
              <textarea
                value={formData.rfqDescription}
                onChange={(e) => handleChange('rfqDescription', e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-900 resize-none h-24 font-medium placeholder-gray-400 shadow-sm"
                placeholder="Enter detailed description of the project requirements..."
              />
            </div>

            {/* Row 5: Location */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Ship To Location</label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{formData.location}</div>
                  <div className="text-xs text-gray-600">Primary Logistics Center</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Estimated Value</p>
            <p className="text-2xl font-extrabold text-blue-600">{totalCost}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-8 py-3.5 text-gray-700 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-10 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all text-sm active:translate-y-0"
            >
              Save Updates
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};