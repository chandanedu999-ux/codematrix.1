import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter, AlertItem } from '../types';
import { 
  Bell, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
  Droplet, 
  Utensils, 
  HeartPulse, 
  Users,
  ShieldAlert
} from 'lucide-react';

interface AlertCenterViewProps {
  onSelectShelter: (shelter: Shelter) => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({ onSelectShelter }) => {
  const { alerts, shelters, resolveAlert, showToast } = useResq();
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [showResolved, setShowResolved] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    if (!showResolved && a.resolved) return false;
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => !a.resolved && a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => !a.resolved && a.severity === 'WARNING').length;
  const infoCount = alerts.filter((a) => !a.resolved && a.severity === 'INFO').length;

  const handleActionClick = (alert: AlertItem) => {
    if (alert.shelterId) {
      const sh = shelters.find((s) => s.id === alert.shelterId);
      if (sh) onSelectShelter(sh);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-12">
      
      {/* Header */}
      <div className="bg-[#12304A] text-white border-b border-slate-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
                EMERGENCY ALERT TRIAGE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Shelter &amp; Resource Alert Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Automated threshold alerts: surge occupancies, critical supply deficits, and medical dispatch logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">
              {criticalCount} Critical &bull; {warningCount} Warning
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterSeverity('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                filterSeverity === 'ALL'
                  ? 'bg-[#12304A] text-white border-[#12304A]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Unresolved ({alerts.filter((a) => !a.resolved).length})
            </button>

            <button
              onClick={() => setFilterSeverity('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                filterSeverity === 'CRITICAL'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              🔴 Critical ({criticalCount})
            </button>

            <button
              onClick={() => setFilterSeverity('WARNING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                filterSeverity === 'WARNING'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              🟡 Warning ({warningCount})
            </button>

            <button
              onClick={() => setFilterSeverity('INFO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                filterSeverity === 'INFO'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              🔵 Information ({infoCount})
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Include Resolved Alerts</span>
          </label>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              All monitored shelters are currently within normal operating thresholds
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No active capacity overflows or critical water/ration shortages detected for this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';

              let cardBg = 'bg-white border-slate-200';
              let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
              let Icon = Info;

              if (isCrit) {
                cardBg = 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-300/60';
                badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                Icon = AlertOctagon;
              } else if (isWarn) {
                cardBg = 'bg-amber-50/40 border-amber-200';
                badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                Icon = AlertTriangle;
              }

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl p-5 border shadow-2xs transition-all ${cardBg} ${alert.resolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isCrit ? 'bg-rose-600 text-white' : isWarn ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeColor}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {alert.resolved && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                              RESOLVED
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {alert.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {alert.description}
                        </p>

                        {alert.shelterName && (
                          <div className="text-xs font-semibold text-slate-700 pt-1">
                            Location: <span className="font-bold text-slate-900">{alert.shelterName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-end gap-2 shrink-0 self-end sm:self-center">
                      {alert.shelterId && (
                        <button
                          onClick={() => handleActionClick(alert)}
                          className="px-3.5 py-2 bg-[#12304A] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{alert.actionLabel || 'View Shelter'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
