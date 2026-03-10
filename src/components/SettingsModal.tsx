import React from 'react';
import { X, Bell, Shield, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-serif font-bold text-xl text-slate-900">Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">

           {/* Notifications */}
           <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
              <div className="flex items-center space-x-3">
                 <div className="p-2 bg-amber-50 rounded-full">
                    <Bell className="h-5 w-5 text-amber-600" />
                 </div>
                 <div>
                    <p className="font-bold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">Email alerts (Coming Soon)</p>
                 </div>
              </div>
              <div className="h-6 w-11 bg-slate-100 rounded-full"></div>
           </div>

           {/* Security */}
           <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <div className="p-2 bg-emerald-50 rounded-full">
                    <Key className="h-5 w-5 text-emerald-600" />
                 </div>
                 <div>
                    <p className="font-bold text-slate-900">Password</p>
                    <p className="text-xs text-slate-500">Last changed 30 days ago</p>
                 </div>
              </div>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Update</button>
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LibWare v3.0.1</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
