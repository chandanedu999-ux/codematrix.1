import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Users, Calendar, Download, RefreshCw } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { shelters, families } = useResq();
  const [timeRange, setTimeRange] = useState<'6h' | 'today' | '7d'>('today');

  // Realistic time-series data for Ahmedabad crisis timeline
  const occupancyTrendData = [
    { time: '06:00', sheltered: 8400, capacity: 32800, available: 24400 },
    { time: '08:00', sheltered: 10800, capacity: 32800, available: 22000 },
    { time: '10:00', sheltered: 13950, capacity: 32800, available: 18850 },
    { time: '12:00', sheltered: 16100, capacity: 32800, available: 16700 },
    { time: '14:00', sheltered: 17400, capacity: 32800, available: 15400 },
    { time: '16:00', sheltered: 18420, capacity: 32800, available: 14380 }
  ];

  const arrivalsPerHourData = [
    { hour: '07:00', count: 180, vulnerable: 45 },
    { hour: '08:00', count: 320, vulnerable: 88 },
    { hour: '09:00', count: 460, vulnerable: 112 },
    { hour: '10:00', count: 680, vulnerable: 195 },
    { hour: '11:00', count: 740, vulnerable: 210 },
    { hour: '12:00', count: 520, vulnerable: 140 },
    { hour: '13:00', count: 410, vulnerable: 95 },
    { hour: '14:00', count: 350, vulnerable: 80 }
  ];

  const resourceConsumptionData = [
    { item: 'Beds Set Up', current: 2840, required: 4200 },
    { item: 'Water (x100 L)', current: 480, required: 850 },
    { item: 'Ration Kits', current: 3600, required: 5200 },
    { item: 'Medical Kits', current: 42, required: 70 }
  ];

  const shelterUtilizationList = shelters.map((s) => ({
    name: s.name.length > 22 ? s.name.substring(0, 20) + '...' : s.name,
    occupancy: Math.round((s.currentOccupancy / s.capacity) * 100),
    people: s.currentOccupancy
  })).sort((a, b) => b.occupancy - a.occupancy).slice(0, 8);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Shelter Name,Capacity,Current Occupancy,Occupancy Percent,Status\n" +
      shelters.map(s => `"${s.name}",${s.capacity},${s.currentOccupancy},${Math.round((s.currentOccupancy/s.capacity)*100)}%,${s.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RESQ_EOC_Shelter_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-12">
      
      {/* Header */}
      <div className="bg-[#12304A] text-white border-b border-slate-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                CRISIS ANALYTICS &amp; FORECASTING
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Operational Trends &amp; Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Headcount velocity, consumption burn rates, and capacity headroom forecasts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center">
              <button
                onClick={() => setTimeRange('6h')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  timeRange === '6h' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Last 6h
              </button>
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  timeRange === 'today' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  timeRange === '7d' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                7 Days
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Occupancy Trend */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Occupancy &amp; Capacity Velocity</h3>
                <p className="text-xs text-slate-500">Cumulative evacuees sheltered vs total network ceiling</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                +18% since 06:00
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="sheltered" stroke="#1769AA" strokeWidth={3} name="Sheltered Evacuees" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="available" stroke="#15803D" strokeWidth={2} name="Available Capacity" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Arrivals Per Hour */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hourly Evacuee Influx Rate</h3>
                <p className="text-xs text-slate-500">Intake volume and vulnerable population sub-count</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Peak: 11:00 AM
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arrivalsPerHourData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="count" fill="#2563EB" name="Total Arrivals" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vulnerable" fill="#DC2626" name="Special Needs / Vulnerable" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Shelter Utilization */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Highest Utilized Shelters</h3>
                <p className="text-xs text-slate-500">Ranked by percentage saturation</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={shelterUtilizationList} margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 105]} unit="%" stroke="#64748B" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  />
                  <Bar dataKey="occupancy" fill="#D97706" name="Occupancy %" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Essential Relief Reserves */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Relief Supply Coverage</h3>
                <p className="text-xs text-slate-500">Current available supply vs 48-hour projected requirement</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceConsumptionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="item" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="current" fill="#15803D" name="Current Stock" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="required" fill="#94A3B8" name="Required Target" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
