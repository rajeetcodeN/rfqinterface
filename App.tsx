import React, { useState, useCallback } from 'react';
import {
  Upload, FileText, ArrowLeft,
  LayoutDashboard, Calculator,
  ChevronLeft, ScrollText, CheckCircle, Keyboard, ChevronRight, X,
  LogOut, Shield
} from 'lucide-react';
import { runExtractionPipeline } from './services/pipeline/extraction';
import { calculateCostsWithApi, applyCostResults } from './services/cost_api';
import { calculateLineItem } from './services/calculationService';
import { getPricingConfig, savePricingConfig } from './services/settingsService';
import { RFQData, LineItem, ViewMode, EditorMode, MaterialType, SavedQuote, QuoteStatus, QuoteComment, Attachment, PricingConfig, ActivityLog, User } from './types';
import { INITIAL_HEADER } from './constants';
import { Dashboard } from './components/Dashboard';

// Mock User for Lean Mode (Auto-login)
const LEAN_USER: User = {
  id: 'u-1',
  email: 'admin@rfq-intel.com',
  name: 'Admin User',
  role: 'admin',
  company: 'My Company',
  status: 'active',
  joinedDate: '2025-01-01'
};



const MOCK_COMMENTS: QuoteComment[] = [
  { id: '1', author: 'Hans Schmidt', text: 'Bitte die Toleranzen bei der Härtung nach DIN EN ISO 6508 prüfen.', timestamp: '2026-01-21 10:30', type: 'internal', role: 'admin' }
];

const MOCK_ATTACHMENTS: Attachment[] = [
  { id: '1', name: 'Zeichnung_Getriebegehäuse_v3.pdf', size: '2.4 MB', type: 'pdf', uploadDate: '2026-01-18' }
];

const App: React.FC = () => {
  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [editorMode, setEditorMode] = useState<EditorMode>('verify');
  const [activeTab, setActiveTab] = useState<'items' | 'collaboration' | 'documents'>('items');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data State
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(getPricingConfig());
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [rfqData, setRfqData] = useState<RFQData>({
    header: INITIAL_HEADER,
    lineItems: [],
    comments: [],
    attachments: []
  });
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [totalProcessedCount, setTotalProcessedCount] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<QuoteStatus>(QuoteStatus.DRAFT);
  const [currentStep, setCurrentStep] = useState(2); // 0=Upload, 1=Extract, 2=Verify/Calc, 3=Export

  // UI State
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [splitView, setSplitView] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [explanationPopover, setExplanationPopover] = useState<{ id: string, text: string, x: number, y: number } | null>(null);

  // Calculate total
  const totalCost = rfqData.lineItems.reduce((sum, item) => sum + item.calculation.totalLineCost, 0);

  // --- Actions ---

  // Shared Cost Calculation Logic
  const performCostCalculation = async (items: LineItem[]) => {
    // 1. Log Input Payload
    const inputPayload = {
      requested_items: items.map(item => ({
        pos: item.id,
        article_name: item.description,
        quantity: item.quantity,
        config: item.config || { dimensions: item.dimensions, material: item.material }
      }))
    };

    setLogs(prev => [
      {
        id: Date.now().toString(),
        title: 'COST API INPUT',
        description: 'Sending items to external Cost Engine...',
        system: 'Cost Service',
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending',
        rawContent: JSON.stringify(inputPayload, null, 2)
      },
      ...prev
    ]);

    const response = await calculateCostsWithApi(items);
    const updatedItems = applyCostResults(items, response);

    // 2. Log Output Response
    setLogs(prev => [
      {
        id: (Date.now() + 1).toString(),
        title: 'COST API OUTPUT',
        description: `Processed ${response.length} items successfully`,
        system: 'Cost Service',
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
        rawContent: JSON.stringify(response, null, 2)
      },
      ...prev
    ]);

    return updatedItems;
  };

  const handleCalculateCosts = async () => {
    setIsCalculating(true);
    try {
      const updatedItems = await performCostCalculation(rfqData.lineItems);
      setRfqData(prev => ({ ...prev, lineItems: updatedItems }));
      setCurrentStep(3); // Move to Validate/Export phase
    } catch (err) {
      console.error("Cost calc failed", err);
      setLogs(prev => [{ id: Date.now().toString(), title: 'CALCULATION ERROR', description: 'Failed to retrieve costs', system: 'Cost Service', timestamp: new Date().toLocaleTimeString(), status: 'error', rawContent: String(err) }, ...prev]);
      alert("Cost calculation failed. See logs.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleStartNewQuote = () => {
    setRfqData({ header: INITIAL_HEADER, lineItems: [], comments: [], attachments: [] });
    setFile(null);
    setEditorMode('upload');
    setCurrentStatus(QuoteStatus.DRAFT);
    setViewMode('editor');
  };

  const handleEditQuote = (id: string) => {
    const quote = savedQuotes.find(q => q.id === id);
    if (quote) {
      setRfqData({
        header: quote,
        lineItems: [], // In real app, load items
        comments: MOCK_COMMENTS, // In real app, load from ID
        attachments: MOCK_ATTACHMENTS
      });
      setCurrentStatus(quote.status);
      setEditorMode('verify');
      setViewMode('editor');
    }
  };

  const handleDownloadQuote = (id: string) => {
    console.log('Download triggered for', id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setIsProcessing(true);


      try {
        // Use the new multi-stage pipeline
        const { data: extracted, rawContent, source } = await runExtractionPipeline(selectedFile);

        const newLogs: ActivityLog[] = [
          { id: Date.now().toString(), title: 'OCR API OUTPUT', description: `Raw extraction results from server`, system: 'Extraction Service', timestamp: new Date().toLocaleTimeString(), status: 'success', rawContent: rawContent },
          { id: (Date.now() + 1).toString(), title: 'NORMALIZATION OUTPUT', description: 'Data mapped to frontend RFQ structure', system: 'Normalization Engine', timestamp: new Date().toLocaleTimeString(), status: 'success', rawContent: JSON.stringify(extracted, null, 2) },
          { id: (Date.now() + 2).toString(), title: 'FILE UPLOADED', description: `Source: ${source}`, system: 'Ingestion Service', timestamp: new Date().toLocaleTimeString(), status: 'success' }
        ];

        // Append new logs to existing ones (or replace)
        setLogs(prev => [...newLogs, ...prev]);

        const processedItems: LineItem[] = (extracted.lineItems || []).map((item: any, idx: number) => {
          const material = item.material || MaterialType.STEEL_C45;
          const dims = {
            length: item.dimensions?.length || 0,
            width: item.dimensions?.width || 0,
            height: item.dimensions?.height || 0
          };

          return {
            id: String(item.id || item.pos || idx), // Stable ID for Cost API mapping
            description: item.description || 'Unnamed Item',
            material,
            quantity: item.quantity || 1,
            unit: item.unit || 'pcs',
            dimensions: dims,
            deliveryDate: item.deliveryDate || '',
            config: item.config,
            // INITIALIZE WITH ZERO COST - Wait for Real API
            calculation: {
              volumeMm3: 0,
              density: 0,
              weightGrams: 0,
              materialCost: 0,
              totalLineCost: 0,
              unitPrice: 0
            }
          };
        });

        // 1. Set Initial Data (Zero Costs)
        const header = extracted.header;
        setRfqData(prev => ({
          ...prev,
          header: {
            ...prev.header,
            customerName: header?.customerName || prev.header.customerName,
            rfqNumber: header?.rfqNumber || prev.header.rfqNumber,
            documentDate: header?.documentDate || prev.header.documentDate,
            vendorName: (header as any)?.supplier_name || header?.vendorName || prev.header.vendorName,
            rfqDescription: header?.rfqDescription || prev.header.rfqDescription,
            partNumber: header?.partNumber || prev.header.partNumber,
            customerNumber: (header as any)?.customer_number || header?.customerNumber || prev.header.customerNumber,
            documentType: (header as any)?.document_type || header?.documentType || prev.header.documentType
          },
          lineItems: processedItems,
          attachments: [...prev.attachments, {
            id: Date.now().toString(),
            name: selectedFile.name,
            size: (selectedFile.size / 1024).toFixed(1) + ' KB',
            type: selectedFile.type,
            uploadDate: new Date().toLocaleDateString()
          }]
        }));

        setTotalProcessedCount(prev => prev + 1);
        setEditorMode('verify');
        setCurrentStep(2); // Advance to Calculate Step

        // 2. TRIGGER AUTOMATED CALCULATION
        setIsCalculating(true);
        try {
          const calculatedItems = await performCostCalculation(processedItems);
          setRfqData(prev => ({ ...prev, lineItems: calculatedItems }));
          // Success - move to Validate
          setCurrentStep(3);
        } catch (calcErr) {
          console.error("Auto-calculation failed", calcErr);
          // Log error but stay on current step
          setLogs(prev => [{ id: Date.now().toString(), title: 'AUTO-CALC FAILED', description: 'Could not calculate initial costs', system: 'Cost Service', timestamp: new Date().toLocaleTimeString(), status: 'error', rawContent: String(calcErr) }, ...prev]);
        } finally {
          setIsCalculating(false);
        }

      } catch (err) {
        console.error("File upload and processing failed", err);
        setLogs(prev => [{ id: Date.now().toString(), title: 'ERROR', description: 'Processing Failed', system: 'System', timestamp: new Date().toLocaleTimeString(), status: 'error', rawContent: String(err) }, ...prev]);
        alert("Failed to process document. See logs for details.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAddManualItem = () => {
    const newItem: LineItem = {
      id: `manual-${Date.now()}`,
      description: 'New Manual Item',
      material: MaterialType.STEEL_C45,
      quantity: 1,
      unit: 'ST',
      dimensions: { length: 0, width: 0, height: 0 },
      calculation: calculateLineItem(MaterialType.STEEL_C45, { length: 0, width: 0, height: 0 }, 1, pricingConfig)
    };
    setRfqData(prev => ({ ...prev, lineItems: [...prev.lineItems, newItem] }));
    if (editorMode === 'upload') setEditorMode('verify');
  };

  const NavigationButton = ({ mode, icon: Icon, label }: { mode: ViewMode, icon: any, label: string }) => {
    const isActive = viewMode === mode;
    return (
      <button
        onClick={() => {
          if (mode === 'editor' && editorMode === 'upload' && rfqData.lineItems.length > 0) setEditorMode('verify');
          setViewMode(mode);
          setIsSidebarCollapsed(true);
        }}
        className={`w-full flex items-center relative py-3 px-3.5 rounded-xl transition-all duration-200 group ${isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
      >
        <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'}`} />
        <span className={`ml-3 font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          {label}
        </span>
        {isSidebarCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
            {label}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Raw Data Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{selectedLog.system}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedLog.timestamp}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedLog.title} - Raw Content</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-900">
              <pre className="text-sm font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                {selectedLog.rawContent}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/30">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Popover */}
      {explanationPopover && (
        <div
          className="fixed z-[60] bg-white border border-gray-200 shadow-xl rounded-xl p-4 w-[400px] animate-in fade-in zoom-in-95 duration-200"
          style={{ top: explanationPopover.y, left: explanationPopover.x - 400 }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Calculator className="w-3 h-3 text-blue-600" />
              Calculation Logic
            </h4>
            <button onClick={() => setExplanationPopover(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
            {explanationPopover.text}
          </div>
        </div>
      )}

      {/* Modern Sidebar - White Matte Theme */}
      <aside className={`${isSidebarCollapsed ? 'w-[88px]' : 'w-[280px]'} bg-white flex flex-col shrink-0 z-30 transition-all duration-100 ease-out relative border-r border-slate-200`}>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-9 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 rounded-full p-1.5 shadow-lg z-50 transition-all hover:scale-110"
        >
          <ChevronLeft size={14} className={`transition-transform duration-100 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className="h-24 flex items-center px-6 relative z-10 overflow-hidden">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-black/5 shrink-0 mr-3">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div className={`transition-all duration-100 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden whitespace-nowrap`}>
            <span className="font-bold text-black text-lg tracking-tight block">RFQ</span>
            <span className="text-[10px] text-black font-bold tracking-wider uppercase">Intelligence</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-4 overflow-y-auto py-4 scrollbar-none relative z-10">
          <div>
            <div className={`px-4 mb-3 transition-all duration-100 overflow-hidden ${isSidebarCollapsed ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100'}`}>
              <span className="text-[10px] font-bold text-black uppercase tracking-widest">Platform</span>
            </div>
            {isSidebarCollapsed && <div className="h-px bg-slate-100 mx-2 mb-4"></div>}
            <div className="space-y-1">
              <NavigationButton mode="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavigationButton mode="editor" icon={FileText} label="Active Quote" />
            </div>
          </div>
        </nav>


      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-[#F8FAFC]">

        {viewMode === 'dashboard' && (
          <Dashboard
            quotes={savedQuotes}
            totalProcessed={totalProcessedCount}
            onNewQuote={handleStartNewQuote}
            onEditQuote={handleEditQuote}
            onDownload={handleDownloadQuote}
          />
        )}

        {viewMode === 'editor' && (
          <div className="flex-1 flex flex-col h-full relative animate-in fade-in duration-300">

            {/* Glassmorphism Header */}
            {/* Glassmorphism Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shrink-0 transition-all">
              <div className="flex items-center justify-between px-8 h-20">
                <div className="flex items-center gap-6">
                  <button onClick={handleStartNewQuote} className="hover:bg-gray-100 p-2.5 rounded-xl transition-colors text-gray-700 group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-xl leading-tight tracking-tight">
                      {rfqData.header.rfqNumber || 'New Cost Estimate'}
                    </h2>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">{rfqData.header.customerName || 'Draft Quote'}</p>
                  </div>
                </div>

                {/* Modern Workflow Stepper */}
                {editorMode === 'verify' && (
                  <div className="hidden lg:flex items-center gap-4">
                    <div className="flex items-center bg-gray-100/50 p-1.5 rounded-full border border-gray-200/50">
                      {['Extract', 'Calculate', 'Validate', 'Export'].map((step, idx) => {
                        const isActive = idx === (currentStep - 1);
                        const isPast = idx < (currentStep - 1);

                        return (
                          <div key={step} className="flex items-center">
                            <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${isActive ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' :
                              isPast ? 'text-green-600' : 'text-gray-400'
                              }`}>
                              {isPast && <CheckCircle className="w-3.5 h-3.5" />}
                              {isActive && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                              {step}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Split View Toggle */}
                    <button
                      onClick={() => setSplitView(!splitView)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${splitView ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      {splitView ? 'Full Table' : 'Split View'}
                    </button>

                    {/* Logic Toggle */}
                    <button
                      onClick={() => setShowExplanations(!showExplanations)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showExplanations ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {showExplanations ? 'Hide Explanation' : 'Show Explanation'}
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {editorMode === 'verify' && rfqData.lineItems.length > 0 && (
                    <button
                      onClick={handleCalculateCosts}
                      disabled={isCalculating}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold shadow-sm transition-all ${isCalculating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {isCalculating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Calculating...</span>
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4" />
                          <span>Recalculate</span>
                        </>
                      )}
                    </button>
                  )}
                  {/* Activity Logs Button & Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setIsLogOpen(!isLogOpen)}
                      className={`p-2.5 rounded-xl transition-all ${isLogOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      title="Activity Logs"
                    >
                      <ScrollText className="w-5 h-5" />
                    </button>

                    {/* Logs Popover - Optimized for visibility */}
                    {isLogOpen && (
                      <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 shadow-2xl z-50 rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-sm">Activity Logs</h3>
                            {logs.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">{logs.length}</span>
                            )}
                          </div>
                          <button onClick={() => setIsLogOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30 max-h-[400px]">
                          {logs.length === 0 ? (
                            <div className="text-center py-10">
                              <ScrollText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                              <p className="text-sm text-gray-500 mb-1">No activity yet</p>
                              <p className="text-[11px] text-gray-400">Activity will appear here.</p>
                            </div>
                          ) : (
                            logs.map((log) => (
                              <div key={log.id}
                                onClick={() => log.rawContent && setSelectedLog(log)}
                                className={`p-3 rounded-xl border text-sm transition-all ${log.status === 'error' ? 'bg-red-50 border-red-200' : log.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'} ${log.rawContent ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''}`}>
                                <div className="flex justify-between mb-1">
                                  <span className="font-bold text-[10px] uppercase text-gray-500 tracking-wider font-mono">{log.system}</span>
                                  <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                                </div>
                                <div className="font-bold text-gray-900 mb-0.5 text-xs">{log.title}</div>
                                <div className="text-gray-600 text-[11px] leading-relaxed">{log.description}</div>
                                {log.rawContent && (
                                  <div className="mt-2 text-[10px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1 group">
                                    <span>👁 View Raw Data</span>
                                    <ChevronRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Header Details - Extracted Meta Data */}
              {editorMode === 'verify' && (
                <div className="px-8 pb-6 grid grid-cols-4 gap-6 bg-white/50 backdrop-blur-sm">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Supplier</span>
                    <p className="font-semibold text-gray-900">{rfqData.header.vendorName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {rfqData.header.vendorName.substring(0, 3).toUpperCase()}-001</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Customer</span>
                    <p className="font-semibold text-gray-900 whitespace-pre-line">{rfqData.header.customerName}</p>
                    {rfqData.header.customerNumber && <p className="text-xs text-gray-500 mt-0.5">#{rfqData.header.customerNumber}</p>}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Document</span>
                    <p className="font-semibold text-gray-900">{rfqData.header.documentType || 'Request for Quote'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rfqData.header.rfqNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Date</span>
                    <p className="font-semibold text-gray-900">{rfqData.header.documentDate}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Extracted
                    </p>
                  </div>
                </div>
              )}

              {/* Sleek Tabs */}
              {editorMode === 'verify' && (
                <div className="px-8 flex gap-8 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
                  {[
                    { id: 'items', label: 'Line Items', count: rfqData.lineItems.length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`relative py-4 text-sm font-medium transition-all flex items-center gap-2.5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {tab.count}
                        </span>
                      )}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full layout-id-underline shadow-[0_-2px_10px_rgba(37,99,235,0.5)]"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </header>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden relative">

              {editorMode === 'upload' ? (
                <div className="w-full h-full flex items-center justify-center bg-white p-8">
                  <div className="max-w-4xl w-full text-center">

                    <div className="mb-12">
                      <h3 className="text-3xl font-extrabold text-[#0B1120] mb-3 tracking-tight">Ingest & Analyze RFQ</h3>
                      <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
                        Upload any RFQ document (PDF, Excel, Word, or Scanned Image). Our engine will automatically detect the format and extract line items for quoting.
                      </p>
                    </div>

                    <div className="max-w-xl mx-auto">
                      <label className="relative group block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,application/pdf,.xlsx,.xls,.docx,.doc"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isProcessing}
                        />

                        {/* Upload Circle Area */}
                        <div className="mb-8">
                          <div className={`w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110 mb-6 ${isProcessing ? 'animate-pulse' : ''}`}>
                            {isProcessing ? (
                              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <div className="p-4 bg-white rounded-full shadow-sm">
                                <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                            )}
                          </div>

                          <h4 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                            Click to upload or drag and drop
                          </h4>
                          <p className="text-slate-400 text-sm font-medium">Supports PDF, DOCX, XLSX, JPG, PNG</p>
                        </div>

                      </label>

                      {/* File Type Icons Row */}
                      <div className="flex justify-center gap-8 mb-16 opacity-60">
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-red-500" />
                          </div>
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">PDF</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-blue-500" />
                          </div>
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Word</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-green-500" />
                          </div>
                          <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Excel</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-purple-500" />
                          </div>
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Images</span>
                        </div>
                      </div>


                      <button
                        onClick={handleAddManualItem}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors text-sm"
                      >
                        <Keyboard className="w-4 h-4" /> Or input raw text manually <ChevronRight className="w-3 h-3" />
                      </button>

                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Side: Document Viewer */}
                  {splitView && fileUrl && (
                    <div className="w-1/2 bg-white flex flex-col">
                      <div className="p-3 bg-white flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" />
                          Document Preview
                        </span>
                      </div>
                      <iframe
                        src={fileUrl}
                        className="flex-1 w-full border-none"
                        style={{ border: 'none' }}
                        title="RFQ Document"
                      />
                    </div>
                  )}

                  {/* Right Side: Data Table */}
                  <div className={`${splitView ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto bg-white`}>
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse text-[13px]">
                          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                              <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12">Pos</th>
                              <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[35%]">Input Data (Specs)</th>
                              <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Base Info</th>
                              <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modules & Setup</th>
                              {showExplanations && (
                                <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-64 bg-indigo-50/50">Calculation Explanation</th>
                              )}
                              <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Totals (EUR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rfqData.lineItems.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 align-top text-xs font-mono text-slate-500">
                                  {(idx + 1).toString().padStart(3, '0')}
                                </td>
                                <td className="py-4 px-4 align-top">
                                  <div className="font-bold text-slate-900">{item.description}</div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.material}</span>
                                    <span className="text-[10px] italic text-slate-400">Qty: {item.quantity}</span>
                                    {item.dimensions && (
                                      <span className="text-[10px] text-slate-500 font-mono ml-2 border-l border-slate-200 pl-2">
                                        {item.dimensions.width}x{item.dimensions.height}x{item.dimensions.length}
                                      </span>
                                    )}
                                  </div>

                                  {/* Merged Specs Section */}
                                  <div className="mt-2 space-y-1">
                                    {item.config?.standard && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase w-8">Std:</span>
                                        <span className="text-[11px] font-bold text-slate-700">{item.config.standard} / {item.config.form}</span>
                                      </div>
                                    )}
                                    {item.config?.features && item.config.features.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {item.config.features.map((f, i) => (
                                          <span key={i} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">
                                            {f.feature_type}:{f.spec}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Base Info Column */}
                                <td className="py-4 px-4 align-top">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] text-slate-400 uppercase">Base Price:</span>
                                      <span className="text-[11px] font-mono text-slate-700">€{item.calculation.baseUnitCost?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {item.calculation.baseMaterialId && (
                                      <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                        <div className="text-[10px] font-bold text-blue-700 font-mono break-all mb-1">
                                          {item.calculation.baseMaterialId}
                                        </div>
                                        {item.calculation.baseKeyDescription && (
                                          <div className="text-[9px] text-blue-600 leading-tight">
                                            {item.calculation.baseKeyDescription}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Modules & Setup Column */}
                                <td className="py-4 px-4 align-top">
                                  <div className="flex flex-col gap-2">

                                    {/* Applied Modules List */}
                                    {item.calculation.appliedModules && item.calculation.appliedModules.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        {item.calculation.appliedModules.map(m => (
                                          <span key={m} className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100 font-bold">
                                            {m}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] text-slate-400 uppercase">Manufacturing:</span>
                                      <span className="text-[11px] font-mono text-slate-700">€{item.calculation.modulesCost?.toFixed(2) || '0.00'}</span>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 my-0.5" />

                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] text-slate-400 uppercase">Setup:</span>
                                      <span className="text-[11px] font-mono text-slate-700">€{item.calculation.setupCost?.toFixed(2) || '0.00'}</span>
                                    </div>
                                  </div>
                                </td>

                                {showExplanations && (
                                  <td className="py-4 px-4 align-top bg-indigo-50/10 border-l border-indigo-100">
                                    <div className="text-[10px] text-slate-600 font-mono leading-relaxed whitespace-pre-wrap">
                                      {item.calculation.explanation || 'No explicit explanation available.'}
                                    </div>
                                  </td>
                                )}

                                <td className="py-4 px-4 align-top text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total:</span>
                                      <span className="text-sm font-bold text-blue-600">€{item.calculation.totalLineCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">Rate/100:</span>
                                      <span className="text-xs font-mono text-slate-500">€{item.calculation.ratePer100?.toFixed(2) || item.calculation.unitPrice.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  {!showExplanations && item.calculation.explanation && (
                                    <button
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setExplanationPopover({ id: item.id, text: item.calculation.explanation!, x: rect.left, y: rect.bottom + 10 });

                                      }}
                                      className="mt-2 text-[10px] flex items-center gap-1 text-slate-400 hover:text-blue-600 font-medium transition-colors ml-auto"
                                    >
                                      <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50">Is</span>
                                      Details
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 border-t border-slate-200">
                            <tr>
                              <td colSpan={4} className="py-4 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Batch Total</td>
                              <td className="py-4 px-4 text-right font-bold text-emerald-600 text-lg">€{totalCost.toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
        }
      </div >
    </div >
  );
};

export default App;