import React, { useState } from 'react';
import {
   Plus, Search, FileText, Clock, ArrowRight, DollarSign,
   MoreVertical, Calendar, TrendingUp, Filter, ChevronLeft,
   ChevronRight, MoreHorizontal, CheckCircle2, Circle, AlertCircle,
   ArrowUpRight, Briefcase, Eye, Download
} from 'lucide-react';
import { SavedQuote, QuoteStatus } from '../types';
import { formatCurrency } from '../services/calculationService';

interface DashboardProps {
   quotes: SavedQuote[];
   totalProcessed: number;
   onNewQuote: () => void;
   onEditQuote: (id: string) => void;
   onDownload: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ quotes, totalProcessed, onNewQuote, onEditQuote, onDownload }) => {
   const [filterStatus, setFilterStatus] = useState<string>('All');
   const [searchTerm, setSearchTerm] = useState<string>('');
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 8;

   // --- Filtering Logic ---
   const filteredQuotes = quotes.filter(q => {
      const statusMatch = filterStatus === 'All' ? true : q.status === filterStatus;
      const searchMatch = !searchTerm ||
         q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         q.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (q.rfqName && q.rfqName.toLowerCase().includes(searchTerm.toLowerCase()));

      return statusMatch && searchMatch;
   });

   // --- High Value Logic ---
   const highValueQuotes = [...quotes].sort((a, b) => b.totalValue - a.totalValue).slice(0, 3);

   // --- Pagination Logic ---
   const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
   const paginatedQuotes = filteredQuotes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
   );

   const getStatusColor = (status: QuoteStatus) => {
      switch (status) {
         case QuoteStatus.DRAFT: return 'bg-gray-100 text-gray-800 ring-gray-600/10';
         case QuoteStatus.REVIEW: return 'bg-amber-50 text-amber-800 ring-amber-600/20';
         case QuoteStatus.APPROVED: return 'bg-blue-50 text-blue-800 ring-blue-700/10';
         case QuoteStatus.SENT: return 'bg-purple-50 text-purple-800 ring-purple-700/10';
         case QuoteStatus.ON_HOLD: return 'bg-red-50 text-red-800 ring-red-600/10';
         case QuoteStatus.WIP: return 'bg-indigo-50 text-indigo-800 ring-indigo-700/10';
         default: return 'bg-gray-50 text-gray-800 ring-gray-600/10';
      }
   };

   const totalPipelineValue = quotes.reduce((acc, q) => acc + q.totalValue, 0);

   // Visual Workflow Component (Matches Reference Image 5)
   const WorkflowProgress = ({ status }: { status: QuoteStatus }) => {
      const steps = [QuoteStatus.DRAFT, QuoteStatus.REVIEW, QuoteStatus.APPROVED, QuoteStatus.SENT];
      const currentIndex = steps.indexOf(status);

      // Fallback for statuses not in the main flow
      if (currentIndex === -1) return <span className="text-xs text-gray-600">Standard Flow</span>;

      return (
         <div className="flex items-center gap-1 w-full max-w-[120px]">
            {steps.map((step, idx) => (
               <div key={step} className="flex-1 flex flex-col gap-1">
                  <div className={`h-1.5 rounded-full ${idx <= currentIndex ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
               </div>
            ))}
         </div>
      );
   };

   return (
      <div className="flex-1 bg-[#F8FAFC] p-6 lg:p-8 overflow-y-auto h-full animate-in fade-in duration-500 flex flex-col">

         {/* Top Stats Row (Compacted) */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Total Pipeline</p>
                  <h3 className="text-xl font-extrabold text-gray-900">{formatCurrency(totalPipelineValue)}</h3>
               </div>
               <div className="p-2.5 bg-green-50 text-green-700 rounded-lg">
                  <DollarSign className="w-4 h-4" />
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Active RFQs</p>
                  <h3 className="text-xl font-extrabold text-gray-900">{quotes.length}</h3>
               </div>
               <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                  <FileText className="w-4 h-4" />
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">RFQs Processed</p>
                  <h3 className="text-xl font-extrabold text-gray-900">{totalProcessed}</h3>
               </div>
               <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Action Items</p>
                  <h3 className="text-xl font-extrabold text-gray-900">{quotes.filter(q => q.status === QuoteStatus.REVIEW).length}</h3>
               </div>
               <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
               </div>
            </div>
         </div>

         {/* High Priority / High Value Orders Section */}
         {highValueQuotes.length > 0 && (
            <div className="mb-8">
               <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-2.5 w-2.5 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">High Priority Opportunities</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {highValueQuotes.map(quote => (
                     <div
                        key={quote.id}
                        onClick={() => onEditQuote(quote.id)}
                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                     >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex justify-between items-start mb-4">
                           <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Briefcase className="w-5 h-5" />
                           </div>
                           <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(quote.status)}`}>
                              {quote.status}
                           </div>
                        </div>

                        <div className="mb-4">
                           <h3 className="text-lg font-bold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">{quote.customerName}</h3>
                           <p className="text-xs text-gray-600 font-mono flex items-center gap-1">
                              {quote.rfqNumber} <span className="w-1 h-1 rounded-full bg-gray-300"></span> {new Date(quote.documentDate).toLocaleDateString()}
                           </p>
                        </div>

                        <div className="flex items-end justify-between pt-4 border-t border-gray-50">
                           <div>
                              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5">Estimated Value</p>
                              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(quote.totalValue)}</p>
                           </div>
                           <div className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              <ArrowUpRight className="w-4 h-4" />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Main Table Section */}
         <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-0">

            {/* Table Toolbar */}
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4 w-full md:w-auto">
                  <h2 className="text-lg font-bold text-gray-800">Recent RFQs</h2>
                  <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                  <div className="flex bg-gray-100/50 p-1 rounded-lg">
                     {['All', QuoteStatus.DRAFT, QuoteStatus.REVIEW, QuoteStatus.SENT].map(status => (
                        <button
                           key={status}
                           onClick={() => setFilterStatus(status)}
                           className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                           {status}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="flex gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                     <input
                        type="text"
                        placeholder="Search by ID, Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm bg-white shadow-sm placeholder-gray-500"
                     />
                  </div>
                  <button onClick={onNewQuote} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">
                     <Plus className="w-4 h-4" /> New Quote
                  </button>
               </div>
            </div>

            {/* Dense Data Grid */}
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-900 font-semibold text-xs uppercase tracking-wider">
                     <tr>
                        <th className="px-6 py-3">RFQ Details</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Value</th>
                        <th className="px-6 py-3">Dates</th>
                        <th className="px-6 py-3 w-40">Workflow Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {paginatedQuotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-blue-50/10 transition-colors group">
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <FileText className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <div className="font-bold text-gray-900">{quote.rfqNumber}</div>
                                    <div className="text-xs text-gray-600 truncate max-w-[150px]">{quote.rfqName || 'Unnamed Project'}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-3">
                              <div className="font-medium text-gray-900">{quote.customerName}</div>
                              <div className="text-xs text-gray-700">{quote.location}</div>
                           </td>
                           <td className="px-6 py-3">
                              <div className="font-mono font-bold text-gray-900">{formatCurrency(quote.totalValue)}</div>
                           </td>
                           <td className="px-6 py-3">
                              <div className="flex flex-col text-xs text-gray-600">
                                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(quote.documentDate).toLocaleDateString()}</span>
                                 <span className="flex items-center gap-1 text-gray-600">Exp: {quote.bidCloseDate || 'N/A'}</span>
                              </div>
                           </td>
                           <td className="px-6 py-3">
                              <div className="flex flex-col gap-1.5">
                                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset w-fit ${getStatusColor(quote.status)}`}>
                                    {quote.status}
                                 </span>
                                 <WorkflowProgress status={quote.status} />
                              </div>
                           </td>
                           <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button
                                    onClick={() => onEditQuote(quote.id)}
                                    className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                                    title="View / Edit"
                                 >
                                    <Eye className="w-4 h-4" />
                                 </button>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); onDownload(quote.id); }}
                                    className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                                    title="Download PDF"
                                 >
                                    <Download className="w-4 h-4" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
               <p className="text-xs text-gray-700">
                  Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredQuotes.length)}</span> of <span className="font-bold">{filteredQuotes.length}</span> quotes
               </p>
               <div className="flex gap-2">
                  <button
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                     className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>

         </div>
      </div>
   );
};