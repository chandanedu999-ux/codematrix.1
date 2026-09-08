import React, { useState } from 'react';
import { Shelter } from '../types';
import { useResq } from '../context/ResqContext';
import { AlertTriangle, X, Send } from 'lucide-react';

interface ReportIncorrectModalProps {
  shelter: Shelter | null;
  onClose: () => void;
}

export const ReportIncorrectModal: React.FC<ReportIncorrectModalProps> = ({ shelter, onClose }) => {
  const { submitUserReport } = useResq();
  const [reason, setReason] = useState<'FULL' | 'CLOSED' | 'INCORRECT_LOCATION' | 'RESOURCE_UNAVAILABLE' | 'OTHER'>('FULL');
  const [details, setDetails] = useState('');
  const [reportedBy, setReportedBy] = useState('');

  if (!shelter) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitUserReport({
      shelterId: shelter.id,
      shelterName: shelter.name,
      reason,
      details: details.trim() || 'Discrepancy observed by citizen.',
      reportedBy: reportedBy.trim() || 'Anonymous Evacuee'
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Report Discrepancy</h3>
              <p className="text-xs text-slate-500">{shelter.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Observed
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="FULL">Shelter is actually Full (No beds remaining)</option>
              <option value="CLOSED">Shelter is Closed / Locked / Inaccessible</option>
              <option value="INCORRECT_LOCATION">Incorrect Pin / Road blocked to location</option>
              <option value="RESOURCE_UNAVAILABLE">Critical Resource depleted (No water/ration/med)</option>
              <option value="OTHER">Other critical field observation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Field Details
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Arrived at 12:15 PM, ground floor flooded, coordinator redirecting people to Paldi School..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Name or Phone (Optional)
            </label>
            <input
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="For EOC verification callback"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Reports are immediately flagged in the Emergency Operations Center table for telephone verification with the shelter in-charge.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
