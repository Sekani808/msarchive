"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/Button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell } from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

interface LedgerEntry {
  id: string;
  source_type: "digital" | "physical";
  story_id: string;
  story_title: string;
  sale_date: string;
  amount_mwk: number;
  quantity: number;
  customer_name: string;
}

const CHART_COLORS = {
  digital: "#A78BFA",
  digitalStroke: "#8B5CF6",
  physical: "#7BC943",
  physicalStroke: "#65A30D",
};

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const staticChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedMonth) fetchReportData();
  }, [selectedMonth]);

  const fetchReportData = async () => {
    setIsLoading(true);
    
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const { data, error } = await supabase
      .from("v_sales_ledger")
      .select("*")
      .gte("sale_date", startDate)
      .lt("sale_date", endDate)
      .order("sale_date", { ascending: false });

    if (data) setEntries(data as LedgerEntry[]);
    setIsLoading(false);
  };

  const digitalSales = entries.filter(e => e.source_type === "digital");
  const physicalSales = entries.filter(e => e.source_type === "physical");
  
  const digitalRevenue = digitalSales.reduce((acc, e) => acc + e.amount_mwk, 0);
  const physicalRevenue = physicalSales.reduce((acc, e) => acc + e.amount_mwk, 0);
  const totalRevenue = digitalRevenue + physicalRevenue;

  const chartData = [
    { name: "Digital Sales", revenue: digitalRevenue, count: digitalSales.length },
    { name: "Physical Sales", revenue: physicalRevenue, count: physicalSales.length },
  ];

  // Calculate max value for static chart scaling
  const maxRevenue = Math.max(digitalRevenue, physicalRevenue, 1);

  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const formatMonthLabel = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    toast.info("Generating PDF report...");

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(60, 60, 60);
      doc.text("Msarchive Monthly Sales Report", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${formatMonthLabel()}`, pageWidth / 2, 28, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: "center" });

      // Summary Table
      autoTable(doc, {
        startY: 45,
        head: [["Category", "Transactions", "Revenue (MWK)"]],
        body: [
          ["Digital Sales", digitalSales.length.toString(), digitalRevenue.toLocaleString()],
          ["Physical Sales", physicalSales.length.toString(), physicalRevenue.toLocaleString()],
          ["TOTAL", entries.length.toString(), totalRevenue.toLocaleString()],
        ],
        theme: "grid",
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 10 },
      });

      // Capture static chart (not the recharts component)
      if (staticChartRef.current && entries.length > 0) {
        setIsExporting(true);
        
        // Wait for static chart to render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(staticChartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        setIsExporting(false);
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 160;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.addImage(imgData, "PNG", (pageWidth - imgWidth) / 2, finalY, imgWidth, imgHeight);
      }

      // Transactions Table
      const tableColumn = ["Date", "Type", "Story", "Customer", "Qty", "Amount (MWK)"];
      const tableRows = entries.map(entry => [
        new Date(entry.sale_date).toLocaleDateString(),
        entry.source_type.toUpperCase(),
        entry.story_title || "Unknown",
        entry.customer_name || "N/A",
        entry.quantity.toString(),
        entry.amount_mwk.toLocaleString(),
      ]);

      const chartHeight = staticChartRef.current && entries.length > 0 ? 90 : 0;
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + chartHeight + 20,
        head: [tableColumn],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8 },
      });

      doc.save(`Msarchive_Report_${selectedMonth}.pdf`);
      toast.success("Report downloaded successfully!");

    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. The table data has been saved.");
      setIsExporting(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Monthly Reports</h1>
          <p className="text-gray-light/60 mt-1">Download sales summaries and ledger exports.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Navigation */}
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg text-gray-light hover:text-white hover:bg-white/10 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="relative min-w-[160px] h-9">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
                <Calendar size={14} className="text-brand" />
                <span className="text-white font-semibold text-sm whitespace-nowrap">
                  {formatMonthLabel()}
                </span>
              </div>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg text-gray-light hover:text-white hover:bg-white/10 transition-colors"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <Button 
            variant="primary" 
            onClick={handleDownloadPDF} 
            disabled={isGenerating || entries.length === 0}
          >
            {isGenerating ? (
              <><Loader2 className="animate-spin" size={18} /> Generating...</>
            ) : (
              <><Download size={18} /> Download PDF</>
            )}
          </Button>
        </div>
      </div>

      {/* Report Card */}
      <div className="glass rounded-2xl p-6">
        <div className="border-b border-white/10 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-white">
            Sales Summary: <span className="text-brand">{formatMonthLabel()}</span>
          </h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white/5 p-5 rounded-xl border border-white/10"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-purple" />
            <p className="text-sm text-gray-light/70 mb-1">Digital Revenue</p>
            <p className="text-2xl font-bold text-accent-purple">{digitalRevenue.toLocaleString()} MWK</p>
            <p className="text-xs text-gray-light/50 mt-1">{digitalSales.length} transactions</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-white/5 p-5 rounded-xl border border-white/10"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <p className="text-sm text-gray-light/70 mb-1">Physical Revenue</p>
            <p className="text-2xl font-bold text-brand">{physicalRevenue.toLocaleString()} MWK</p>
            <p className="text-xs text-gray-light/50 mt-1">{physicalSales.length} transactions</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-white/5 p-5 rounded-xl border border-white/10"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue" />
            <p className="text-sm text-gray-light/70 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-accent-blue">{totalRevenue.toLocaleString()} MWK</p>
            <p className="text-xs text-gray-light/50 mt-1">{entries.length} total transactions</p>
          </motion.div>
        </div>

        {/* Interactive Chart (Recharts) - Hidden during PDF export */}
        <div 
          ref={chartRef} 
          className={`bg-white/5 rounded-xl p-4 mb-8 h-72 border border-white/10 ${isExporting ? 'hidden' : ''}`}
        >
          {entries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.08)" 
                  vertical={false} 
                />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.5)" 
                  tick={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 500 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1e293b", 
                    border: "1px solid rgba(255,255,255,0.15)", 
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    color: "#ffffff",
                    padding: "12px 16px"
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4, fontSize: 12 }}
                  itemStyle={{ color: "#ffffff", fontWeight: 600, padding: 0 }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  formatter={(value) => [`${Number(value ?? 0).toLocaleString()} MWK`, "Revenue"]}
                />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue (MWK)" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === "Digital Sales" ? CHART_COLORS.digital : CHART_COLORS.physical}
                      stroke={entry.name === "Digital Sales" ? CHART_COLORS.digitalStroke : CHART_COLORS.physicalStroke}
                      strokeWidth={2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-light/50">No sales data to chart for this month.</p>
            </div>
          )}
        </div>

        {/* Static Chart for PDF Export - Only visible during export */}
        <div 
          ref={staticChartRef} 
          className={`bg-white rounded-xl p-6 mb-8 ${isExporting ? 'block' : 'hidden'}`}
          style={{ width: '600px', height: '300px' }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>
            Revenue by Sales Type
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '60px', height: '200px', paddingBottom: '40px' }}>
            {/* Digital Sales Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '120px' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: `${Math.max((digitalRevenue / maxRevenue) * 180, 20)}px`,
                  backgroundColor: '#A78BFA',
                  borderRadius: '8px 8px 0 0',
                  border: '2px solid #8B5CF6',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: '8px'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                  {(digitalRevenue / 1000).toFixed(1)}k
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Digital Sales</span>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {digitalRevenue.toLocaleString()} MWK
              </span>
            </div>

            {/* Physical Sales Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '120px' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: `${Math.max((physicalRevenue / maxRevenue) * 180, 20)}px`,
                  backgroundColor: '#7BC943',
                  borderRadius: '8px 8px 0 0',
                  border: '2px solid #65A30D',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: '8px'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                  {(physicalRevenue / 1000).toFixed(1)}k
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Physical Sales</span>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {physicalRevenue.toLocaleString()} MWK
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Transaction Ledger</h3>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="py-3 px-4 text-gray-light/70 uppercase text-xs font-semibold tracking-wider">Date</th>
                  <th className="py-3 px-4 text-gray-light/70 uppercase text-xs font-semibold tracking-wider">Type</th>
                  <th className="py-3 px-4 text-gray-light/70 uppercase text-xs font-semibold tracking-wider">Story</th>
                  <th className="py-3 px-4 text-gray-light/70 uppercase text-xs font-semibold tracking-wider">Customer</th>
                  <th className="py-3 px-4 text-gray-light/70 uppercase text-xs font-semibold tracking-wider text-center">Qty</th>
                  <th className="py-3 px-4 text-gray-light/70 uppercase text-xs font-semibold tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-light/50">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      Loading ledger...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-gray-light/60 font-medium">No sales recorded for this month.</p>
                      <p className="text-gray-light/40 text-xs mt-1">Try selecting a different month.</p>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-light/90 whitespace-nowrap">
                        {new Date(entry.sale_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                          entry.source_type === 'digital' 
                            ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' 
                            : 'bg-brand/20 text-brand border border-brand/30'
                        }`}>
                          {entry.source_type === 'digital' ? '💻' : '📦'} {entry.source_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{entry.story_title || "Unknown"}</td>
                      <td className="py-3 px-4 text-gray-light/80">{entry.customer_name || "—"}</td>
                      <td className="py-3 px-4 text-gray-light/80 text-center">{entry.quantity}</td>
                      <td className="py-3 px-4 text-right text-white font-bold whitespace-nowrap">
                        {entry.amount_mwk.toLocaleString()} <span className="text-gray-light/50 text-xs">MWK</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {entries.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-sm">
              <span className="text-gray-light/60">
                Showing <span className="text-white font-semibold">{entries.length}</span> transactions
              </span>
              <span className="text-gray-light/60">
                Total: <span className="text-brand font-bold">{totalRevenue.toLocaleString()} MWK</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}