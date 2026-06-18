/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { db } from '../utils/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import {
  Users,
  Building,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Megaphone,
  Calendar,
  Activity,
  PhoneCall,
  BellRing,
  Wallet,
  ArrowUpRight,
  ShieldAlert,
  Printer,
  HardHat,
  CheckCircle2,
  Zap,
  Wrench,
  Droplets,
  Gauge,
  Layers,
  Video,
  Play
} from 'lucide-react';

export default function Dashboard() {
  const { 
    members, 
    flats, 
    payments, 
    expenses, 
    notices, 
    activityLogs, 
    triggerPaymentReminder, 
    language,
    config,
    setActiveTab,
    constructionPhases
  } = useSociety();

  const t = translations[language];

  const [showQuickActions, setShowQuickActions] = useState(false);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'project_videos'),
      orderBy('uploadDate', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let dateStr = '';
        if (data.uploadDate) {
          try {
            if (data.uploadDate.toDate) {
              dateStr = data.uploadDate.toDate().toISOString().split('T')[0];
            } else if (data.uploadDate.seconds) {
              dateStr = new Date(data.uploadDate.seconds * 1000).toISOString().split('T')[0];
            } else {
              dateStr = String(data.uploadDate);
            }
          } catch(e) {
            dateStr = new Date().toISOString().split('T')[0];
          }
        } else {
          dateStr = new Date().toISOString().split('T')[0];
        }
        return {
          id: docSnap.id,
          title: data.title || '',
          projectName: data.projectName || '',
          category: data.category || '',
          thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&auto=format&fit=crop&q=80',
          uploadDate: dateStr,
          youtubeUrl: data.youtubeUrl || '',
          facebookUrl: data.facebookUrl || '',
          description: data.description || ''
        };
      });
      setRecentVideos(vList);
    }, (error) => {
      console.warn("Dashboard recent videos listener suppressed: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Calculations
  const totalResidents = members.filter(m => m.status === 'Active').length;
  const totalFlats = flats.length;
  const occupiedFlats = flats.filter(f => f.status === 'occupied_owner' || f.status === 'occupied_tenant').length;
  const vacantFlats = flats.filter(f => f.status === 'vacant').length;
  const maintenanceDueCount = flats.filter(f => f.maintenanceStatus === 'Due' || f.maintenanceStatus === 'Overdue').length;

  // Financial aggregates
  const rawTotalCollection = 0;

  const rawTotalExpense = expenses
    .reduce((sum, e) => sum + e.amount, 0);

  const rawTotalOutstanding = payments
    .filter(p => p.status === 'Pending' || p.status === 'Partial' || p.status === 'Overdue')
    .reduce((sum, p) => sum + p.dueAmount, 0);

  // Formatting helpers
  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US').format(val);
  };

  const occupancyRate = totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0;

  // Unpaid Bills for Admin reminders list
  const outstandingBills = payments
    .filter(p => p.status === 'Pending' || p.status === 'Overdue' || p.status === 'Partial')
    .slice(0, 4);

  // General Emergency Contacts in Bangladesh
  const bangladeshHelplines = [
    { service: language === 'bn' ? 'জাতীয় জরুরি সেবা' : 'National Emergency', number: '999', desc: language === 'bn' ? 'পুলিশ, ফায়ার, অ্যাম্বুলেন্স' : 'Police, Fire, Ambulance' },
    { service: language === 'bn' ? 'কুমিল্লা সদর থানা' : 'Cumilla Sadar Police', number: '+8801713373738', desc: language === 'bn' ? 'স্থানীয় আইন শৃঙ্খলা ও নিরাপত্তা' : 'Local Law Enforcement Hub' },
    { service: language === 'bn' ? 'তিতাস গ্যাস অভিযোগ' : 'Gas Complaint Line', number: '16111', desc: language === 'bn' ? 'গ্যাস অনাকাঙ্ক্ষিত লিকেজ' : 'Emergency Gas Leakages' },
    { service: language === 'bn' ? 'ডেসকো অভিযোগ কেন্দ্র' : 'DESCO Power HelpDesk', number: '16120', desc: language === 'bn' ? 'বিদ্যুৎ বিপর্যয় অভিযোগ' : 'Power Outages Desk' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-extrabold text-white tracking-tight font-sans bg-black border-t border-l border-slate-700 border-b-4 border-r-4 border-b-neutral-900 border-r-neutral-900 rounded-lg px-5 py-2.5 shadow-lg flex items-center gap-2">
              <span>{language === 'bn' ? 'সোসাইটি কার্যনির্বাহী ড্যাশবোর্ড' : 'Society Executive Suite'}</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shadow-[0_0_8px_rgba(16,185,129,0.8)] ml-1" />
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-2">
            {config.name} • {config.address}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          
          <div className="flex items-center gap-2 bg-black border border-neutral-800 p-2.5 rounded-lg shadow-md">
            <Calendar className="h-4 w-4 text-white" />
            <span className="text-[10px] sm:text-xs font-mono font-bold text-white">
              {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Executive Card Analytics Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        
        {/* KPI: Members */}
        <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#4a050b] to-[#250003] p-4 relative overflow-hidden group hover:border-[#D4AF37]/60 shadow-lg transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[18px] font-black text-[#D4AF37] font-sans">
              {t.stats_members}
            </span>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#FFD700] tracking-tight mt-2 relative z-10">
            {formatNumber(totalResidents)}
          </p>
          <p className="text-[9px] text-amber-200/80 mt-1 relative z-10">
            • {formatNumber(members.filter(m => m.type === 'Owner').length)} {language === 'bn' ? 'মালিক' : 'Owners'}
          </p>
        </div>

        {/* KPI: Flats */}
        <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#4a050b] to-[#250003] p-4 relative overflow-hidden group hover:border-[#D4AF37]/60 shadow-lg transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[18px] font-black text-[#D4AF37] font-sans">
              {t.stats_flats}
            </span>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#FFD700] tracking-tight mt-2 relative z-10">
            {formatNumber(totalFlats)}
          </p>
          <p className="text-[9px] text-amber-200/80 mt-1 relative z-10">
            • {formatNumber(vacantFlats)} {language === 'bn' ? 'খালি ফ্ল্যাট' : 'Vacant Units'}
          </p>
        </div>

        {/* KPI: Total Collection */}
        <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#4a050b] to-[#250003] p-4 relative overflow-hidden group hover:border-[#D4AF37]/60 shadow-lg transition-all col-span-2 lg:col-span-1">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[18px] font-black text-[#D4AF37] font-sans">
              {t.stats_collections}
            </span>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#FFD700] tracking-tight mt-2 relative z-10">
            {formatBDT(rawTotalCollection)}
          </p>
        </div>

        {/* KPI: Monthly Expense */}
        <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#4a050b] to-[#250003] p-4 relative overflow-hidden group hover:border-[#D4AF37]/60 shadow-lg transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[18px] font-black text-[#D4AF37] font-sans">
              {t.stats_expenses}
            </span>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#FFD700] tracking-tight mt-2 relative z-10">
            {formatBDT(rawTotalExpense)}
          </p>
          <p className="text-[9px] text-amber-200/80 mt-1 relative z-10">
            • {formatNumber(expenses.length)} {language === 'bn' ? 'টি ভাউচার বিবরণ' : 'Disbursements'}
          </p>
        </div>

        {/* KPI: Outstanding Dues */}
        <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#4a050b] to-[#250003] p-4 relative overflow-hidden group hover:border-[#D4AF37]/60 shadow-lg transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[18px] font-black text-[#D4AF37] font-sans">
              {t.stats_dues}
            </span>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#FFD700] tracking-tight mt-2 relative z-10">
            {formatBDT(rawTotalOutstanding)}
          </p>
          <p className="text-[9px] text-amber-200/80 mt-1 relative z-10">
            • {formatNumber(maintenanceDueCount)} {language === 'bn' ? 'টি ফ্ল্যাটে বকেয়া' : 'Unpaid Standard Cards'}
          </p>
        </div>

      </div>

      {/* 🏗️ Construction Summary Widget - Full Width Section */}
      <div className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-6 space-y-4 hover:border-[#D4AF37]/30 transition-all">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-950/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-900/80">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white font-sans flex items-center gap-2">
                {language === 'bn' ? 'বিল্ডিং নির্মাণ হিসাব ও তহবিল খতিয়ান' : 'Building Construction & Dev Accounts'}
              </h3>
              <p className="text-[16px] text-slate-400 font-mono mt-1">
                {language === 'bn' 
                  ? '৭২ জন সদস্যের চাঁদা ঘোষণা, সংগৃহীত ফান্ড এবং নির্মাণ সামগ্রী ক্রয়ের ব্যয়ের রূপচিত্র' 
                  : 'Overall target projection, collections and material expenditures across 10 floors'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('construction')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-[#D4AF37]/20 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <span>{language === 'bn' ? 'নির্মাণ খতিয়ানে যান' : 'Go to Construction Ledger'}</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* Global Construction Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 pt-2 pb-4">
          <div className="p-5 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
            <span className="text-[14px] text-[#FFD700] font-bold uppercase tracking-wider block relative z-10">
              {language === 'bn' ? 'সর্বমোট লক্ষ্যমাত্রা' : 'Projected Target'}
            </span>
            <p className="text-[14px] font-black text-blue-400 mt-2 block tracking-wide relative z-10">
              {formatBDT(
                constructionPhases.reduce((sum, p) => sum + (p.subscriptionPerMember * 72), 0)
              )}
            </p>
            <span className="text-[14px] text-amber-200/85 font-medium block mt-2 relative z-10">
              {language === 'bn' ? '৭২ জন সদস্যের চাঁদা ঘোষণা অনুসারে' : 'Based on declared member subscriptions'}
            </span>
          </div>

          <div className="p-5 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            <span className="text-[14px] text-[#FFD700] font-bold uppercase tracking-wider block relative z-10">
              {language === 'bn' ? 'মোট সংগৃহীত চাঁদা' : 'Total Collected'}
            </span>
            <p className="text-[14px] font-black text-emerald-400 mt-2 block tracking-wide relative z-10">
              {formatBDT(
                constructionPhases.reduce(
                  (sum, p) => sum + p.deposits.reduce((pSum, d) => pSum + d.amountPaid, 0), 
                  0
                )
              )}
            </p>
            <div className="flex items-center justify-between mt-2 text-[14px] font-medium text-amber-200 relative z-10">
              <span>
                {Math.round(
                  (constructionPhases.reduce((sum, p) => sum + p.deposits.reduce((pSum, d) => pSum + d.amountPaid, 0), 0) /
                    (constructionPhases.reduce((sum, p) => sum + (p.subscriptionPerMember * 72), 0) || 1)) * 100
                )}% {language === 'bn' ? 'উত্তোলন সম্পন্ন' : 'Collected'}
              </span>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
            <span className="text-[14px] text-[#FFD700] font-bold uppercase tracking-wider block relative z-10">
              {language === 'bn' ? 'মোট নির্মাণ ব্যয়' : 'Incurred Cost'}
            </span>
            <p className="text-[14px] font-black text-rose-400 mt-2 block tracking-wide relative z-10">
              {formatBDT(
                constructionPhases.reduce(
                  (sum, p) => sum + p.expenses.reduce((pSum, e) => pSum + e.amount, 0), 
                  0
                )
              )}
            </p>
            <span className="text-[14px] text-amber-200/85 font-medium block mt-2 relative z-10">
              {language === 'bn' ? 'অনুমোদিত ভাউচার অনুযায়ী ব্যয়' : 'Total spent on materials & labor'}
            </span>
          </div>

          <div className="p-5 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-amber-400"></div>
            <span className="text-[14px] text-[#FFD700] font-bold uppercase tracking-wider block relative z-10">
              {language === 'bn' ? 'তহবিলের বর্তমান ব্যালেন্স' : 'Current Fund Balance'}
            </span>
            <p className="text-[14px] font-black text-[#D4AF37] mt-2 block tracking-wide relative z-10">
              {formatBDT(
                constructionPhases.reduce((sum, p) => sum + p.deposits.reduce((pSum, d) => pSum + d.amountPaid, 0), 0) -
                constructionPhases.reduce((sum, p) => sum + p.expenses.reduce((pSum, e) => pSum + e.amount, 0), 0)
              )}
            </p>
            <span className="text-[14px] text-amber-200/85 font-medium block mt-2 relative z-10">
              {language === 'bn' ? 'ব্যয় বাদ দিয়ে অবশিষ্ট তহবিল' : 'Remaining cash for construction work'}
            </span>
          </div>
        </div>
      </div>

      {/* 📊 CONSTRUCTION PHASES MILESTONES (Replaces Utilities & Resource Ops) */}
      <div className="bg-transparent space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md p-2 bg-slate-900 text-[#D4AF37] border border-[#D4AF37]/50 shadow-inner">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-block">
                <h3 className="text-[20px] font-black uppercase tracking-widest text-white font-sans bg-black border-t border-l border-slate-700 border-b-4 border-r-4 border-b-neutral-900 border-r-neutral-900 rounded-lg px-4 py-2 shadow-lg mb-2">
                  {language === 'bn' ? 'নির্মাণ প্রধান ধাপসমূহের সংক্ষিপ্ত বিবরণ' : 'Construction Phase Milestones Overview'}
                </h3>
              </div>
              <p className="text-[14px] text-slate-400 mt-1 mt-1 block">
                {language === 'bn' 
                  ? 'পাইলিং ও বেইসমেন্ট থেকে শুরু করে ১০ম ছাদ ঢালাই পর্যন্ত কাজের অগ্রগতি ও সংগ্রহ'
                  : 'Track progress and fund collections from Piling & Basement up to the 10th Floor Casting'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
          {constructionPhases.map((phase, idx) => {
            const pTarget = phase.subscriptionPerMember * 72;
            const pDeposits = phase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
            const pPercent = pTarget > 0 ? Math.min(100, Math.round((pDeposits / pTarget) * 100)) : 0;
            return (
              <div 
                key={phase.id} 
                className="bg-slate-800 border border-slate-600 rounded-xl p-5 flex flex-col justify-between hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all relative overflow-hidden"
              >
                {/* Accent Top Border per box */}
                <div className={`absolute top-0 left-0 w-full h-1 ${(pDeposits >= pTarget || phase.status === 'Completed') ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`}></div>
                
                <div>
                  <div className="flex items-start justify-between mb-4 mt-1">
                    <span className="text-[14px] font-black text-slate-300 bg-slate-700 px-2 py-0.5 rounded shadow">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={`inline-block text-[14px] font-bold px-3 py-0.5 rounded-full shadow ${
                      (pDeposits >= pTarget || phase.status === 'Completed') 
                        ? 'bg-emerald-900/80 text-emerald-400 border border-emerald-500' 
                        : phase.status === 'In-Progress' 
                          ? 'bg-amber-900/80 text-amber-400 border border-amber-500' 
                          : 'bg-slate-700 text-slate-400 border border-slate-500'
                    }`}>
                      {(pDeposits >= pTarget || phase.status === 'Completed') 
                        ? (language === 'bn' ? 'সম্পন্ন' : 'Completed') 
                        : phase.status === 'In-Progress' 
                          ? (language === 'bn' ? 'চলমান' : 'In-Progress') 
                          : (language === 'bn' ? 'বকেয়া' : 'Pending')}
                    </span>
                  </div>
                  <h4 className="text-[14px] font-black text-[#D4AF37] leading-tight mb-4 tracking-wide font-sans">
                    {language === 'bn' ? phase.nameBn : phase.nameEn}
                  </h4>
                  <div className="text-[14px] text-slate-300 space-y-2 font-medium bg-slate-900/50 p-3 rounded-lg border border-slate-700/60">
                    <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                      <span>{language === 'bn' ? 'লক্ষ্য:' : 'Target:'}</span>
                      <span className="text-blue-400 font-bold">{pTarget >= 100000 ? (pTarget/100000).toFixed(2) + 'L' : pTarget >= 1000 ? (pTarget/1000).toFixed(0) + 'K' : pTarget}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span>{language === 'bn' ? 'আদায়:' : 'Paid:'}</span>
                      <span className="text-emerald-400 font-bold">{pDeposits >= 100000 ? (pDeposits/100000).toFixed(2) + 'L' : pDeposits >= 1000 ? (pDeposits/1000).toFixed(0) + 'K' : pDeposits}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[14px] text-slate-300 mb-2 font-bold">
                    <span>{pPercent}%</span>
                    <span>{language === 'bn' ? 'তহবিল সংগ্রহ' : 'Col. Progress'}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] ${(pDeposits >= pTarget || phase.status === 'Completed') ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`} 
                      style={{ width: `${pPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Visualizations and Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* CUSTOM SVG CHART: Collections vs Expenses */}
        <div className="lg:col-span-2 rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                {t.income_vs_expense}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Society Monthly audit comparisons (BDT)</p>
            </div>
            
            {/* Legend Indicators */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-emerald-500" />
                <span className="text-slate-300">{language === 'bn' ? 'আদায়' : 'Collections'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-[#D4AF37]" />
                <span className="text-slate-300">{language === 'bn' ? 'ব্যয়' : 'Expenses'}</span>
              </span>
            </div>
          </div>

          {/* SVG Vector Chart Area */}
          <div className="relative pt-2 h-48 w-full flex items-end">
            
            <svg className="w-full h-full" viewBox="0 0 400 160">
              {/* Guidelines */}
              <line x1="20" y1="20" x2="380" y2="20" stroke="#064e3b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="65" x2="380" y2="65" stroke="#064e3b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="110" x2="380" y2="110" stroke="#064e3b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="140" x2="380" y2="140" stroke="#022c22" strokeWidth="1.5" />

              {/* Chart Axes Values */}
              <text x="5" y="25" fill="#64748b" className="text-[8px] font-mono">50K</text>
              <text x="5" y="70" fill="#64748b" className="text-[8px] font-mono">25K</text>
              <text x="5" y="145" fill="#64748b" className="text-[8px] font-mono">0</text>

              {/* Data Node representation - Feb, Mar, Apr, May */}
              {/* Feb */}
              <g>
                <rect x="75" y="60" width="16" height="80" rx="3" fill="#10b981" />
                <rect x="94" y="90" width="16" height="50" rx="3" fill="#D4AF37" />
                <text x="82" y="154" fill="#94a3b8" className="text-[8px] font-mono">Feb</text>
              </g>

              {/* Mar */}
              <g>
                <rect x="150" y="40" width="16" height="100" rx="3" fill="#10b981" />
                <rect x="169" y="85" width="16" height="55" rx="3" fill="#D4AF37" />
                <text x="157" y="154" fill="#94a3b8" className="text-[8px] font-mono">Mar</text>
              </g>

              {/* Apr */}
              <g>
                <rect x="225" y="30" width="16" height="110" rx="3" fill="#10b981" />
                <rect x="244" y="95" width="16" height="45" rx="3" fill="#D4AF37 text-[#D4AF37]" />
                <text x="232" y="154" fill="#94a3b8" className="text-[8px] font-mono">Apr</text>
              </g>

              {/* May */}
              <g>
                <rect x="300" y="25" width="16" height="115" rx="3" fill="#10b981" />
                <rect x="319" y="75" width="16" height="65" rx="3" fill="#D4AF37" />
                <text x="307" y="154" fill="#94a3b8" className="text-[8px] font-mono">May</text>
              </g>
            </svg>

          </div>
        </div>

        {/* OCCUPANCY TRACKER: Circular Progress */}
        <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              {t.occupancy_chart}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Society flat assignment percentages</p>
          </div>

          <div className="relative flex items-center justify-center py-4">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
              {/* Inner Track */}
              <path
                className="text-neutral-900"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Outer Indicator */}
              <path
                className="text-emerald-500"
                strokeWidth="3"
                strokeDasharray={`${occupancyRate}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold text-white font-mono">{occupancyRate}%</span>
              <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono mt-0.5">OCCUPIED</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-emerald-950/60 pt-3 text-center">
            <div>
              <span className="block text-xs font-bold text-emerald-400">{occupiedFlats}</span>
              <span className="text-[8px] text-slate-500 uppercase font-mono">{language === 'bn' ? 'ভরাট' : 'Allocated'}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#D4AF37]">{vacantFlats}</span>
              <span className="text-[8px] text-slate-500 uppercase font-mono">{language === 'bn' ? 'খালি' : 'Vacant'}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-amber-500">
                {flats.filter(f => f.status === 'under_maintenance').length}
              </span>
              <span className="text-[8px] text-slate-500 uppercase font-mono">{language === 'bn' ? 'রক্ষণাবেক্ষণ' : 'Reserved'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main widgets container */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Payment Reminders list & bKash speed dial */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Unpaid Billings / Cash remittances Actions */}
          <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  {language === 'bn' ? 'বকেয়া বিলসমূহ এবং রিমাইন্ডার অ্যাকশন' : 'Outstanding Bills Alert Desk'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Generate direct notification alerts with residents</p>
              </div>
              <button 
                onClick={() => setActiveTab('payments')}
                className="text-[10px] text-[#D4AF37] border border-[#D4AF37]/30 rounded px-2 py-0.5 hover:bg-[#D4AF37]/10"
              >
                {language === 'bn' ? 'সব বিল দেখুন' : 'View Ledger'}
              </button>
            </div>

            {outstandingBills.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500 font-mono">
                ✔ All resident bills cleared! Zero outstanding balances.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-950">
                      <th className="py-2.5 text-slate-400 font-semibold">{t.flat_no}</th>
                      <th className="py-2.5 text-slate-400 font-semibold">{language === 'bn' ? 'আবাসিক' : 'Resident'}</th>
                      <th className="py-2.5 text-slate-400 font-semibold">{t.amount}</th>
                      <th className="py-2.5 text-slate-400 font-semibold">{t.status}</th>
                      <th className="py-2.5 text-right text-slate-400 font-semibold">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#059669]/10">
                    {outstandingBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-emerald-950/10">
                        <td className="py-3 font-semibold text-white font-mono">{bill.flatNumber}</td>
                        <td className="py-3 text-slate-300 font-medium">{bill.memberName}</td>
                        <td className="py-3 font-mono text-emerald-400 font-semibold">{formatBDT(bill.dueAmount)}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${bill.status === 'Overdue' ? 'bg-red-950/40 text-red-500 border border-red-905' : 'bg-amber-950/40 text-amber-500 border border-amber-905'}`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => triggerPaymentReminder(bill.id)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 border border-[#D4AF37]/20 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 transition-colors"
                          >
                            <BellRing className="h-3 w-3" />
                            <span>{bill.reminderSent ? t.reminded : t.remind}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* bKash Payment guidelines instructions */}
          <div className="rounded-xl border border-dashed border-[#D4AF37]/30 bg-emerald-950/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-bold tracking-wider text-white uppercase font-mono flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  {t.quick_payment}
                </h4>
                <p className="text-[10px] text-slate-400">
                  Dial bKash USSD Code <span className="text-[#D4AF37] font-mono font-bold">*247#</span> or Nagad App to clear bills instantly from home.
                </p>
              </div>
              <div className="flex gap-2.5 shrink-0">
                <div className="bg-neutral-900 border border-emerald-950 px-3 py-2 rounded text-center">
                  <span className="block text-[8px] text-slate-500 font-mono">BKASH MAR.</span>
                  <span className="text-[11px] font-bold text-white font-mono">{config.bKashMerchant}</span>
                </div>
                <div className="bg-neutral-900 border border-emerald-950 px-3 py-2 rounded text-center">
                  <span className="block text-[8px] text-slate-500 font-mono">NAGAD MAR.</span>
                  <span className="text-[11px] font-bold text-white font-mono">{config.nagadMerchant}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Project Videos Widget */}
          <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-emerald-400 animate-pulse" />
                  {language === 'bn' ? 'সাম্প্রতিক প্রকল্পের লাইভ ভিডিও খতিয়ান' : 'Recent Project Live Videos'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'bn' ? 'আস্থা টুইন টাওয়ার্সের সরাসরি ভিডিও আপডেট' : 'Stay synchronized with live progress and construction works'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('project-videos')}
                className="text-[10px] text-[#D4AF37] border border-[#D4AF37]/35 rounded px-2.5 py-1 hover:bg-[#D4AF37]/10 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{language === 'bn' ? 'সব ভিডিও দেখুন' : 'Go to Gallery'}</span>
              </button>
            </div>

            {recentVideos.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-mono">
                🎥 No recent videos posted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {recentVideos.map((v) => (
                  <div 
                    key={v.id}
                    onClick={() => setActiveTab('project-videos')}
                    className="group rounded-lg border border-emerald-950/60 bg-neutral-900/50 hover:border-emerald-700 hover:bg-[#043327]/30 transition-all p-2.5 flex flex-col justify-between cursor-pointer shadow relative"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-video rounded-md overflow-hidden bg-neutral-950 mb-2">
                      <img 
                        src={v.thumbnail || null} 
                        alt={v.title}
                        className="w-full h-full object-cover filter brightness-85 group-hover:brightness-100 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-70 group-hover:opacity-100 transition-opacity">
                        <div className="h-8 w-8 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-md">
                          <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <span className="text-[8px] bg-emerald-950 text-emerald-300 rounded px-1.5 py-0.5 font-mono font-bold leading-none block w-fit">
                        {v.projectName}
                      </span>
                      <h4 className="text-[11px] font-bold text-white font-sans line-clamp-1 leading-snug group-hover:text-amber-400 transition-colors">
                        {v.title}
                      </h4>
                      <p className="text-[9px] text-[#D4AF37]/80 font-mono leading-none">{v.uploadDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: notice bulletins lists & Emergency Helplines */}
        <div className="space-y-6">
          
          {/* notices feed Board */}
          <div className="rounded-xl border border-[#D4AF37]/20 bg-neutral-950/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-emerald-400" />
                {t.bulletin_board}
              </h3>
              <button 
                onClick={() => setActiveTab('notices')} 
                className="text-[9px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
              >
                {language === 'bn' ? 'সব নোটিশ' : 'View Notices'}
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {notices.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 font-mono">
                  No active notices on the board.
                </div>
              ) : (
                notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="p-3 rounded-lg border border-emerald-950 bg-[#059669]/5 hover:border-emerald-800 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className={`rounded-sm px-1.5 py-0.5 text-[8px] font-bold border ${
                          notice.type === 'Emergency' ? 'bg-red-950/40 text-red-500 border-red-900' :
                          notice.type === 'Alert' ? 'bg-amber-950/40 text-[#D4AF37] border-amber-900' :
                          'bg-emerald-950/40 text-emerald-400 border-emerald-900'
                        }`}>
                          {notice.type}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono">{notice.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5 leading-tight">{notice.title}</h4>
                      <p className="text-[10px] text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">{notice.content}</p>
                    </div>
                    
                    <div className="mt-2.5 pt-2 border-t border-emerald-950/50 flex items-center justify-between text-[8px] font-mono leading-none">
                      {!notice.expiryDate ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                          <span className="relative flex h-1 w-1 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                          </span>
                          <span>{language === 'bn' ? 'স্থায়ী নোটিশ' : 'Permanent Notice'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-sans">
                          {language === 'bn' ? `মেয়াদ: ${notice.expiryDate}` : `Expires: ${notice.expiryDate}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bangladesh Emergency contacts panel list */}
          <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-[#D4AF37]" />
              {t.emergency_contacts}
            </h3>

            <div className="divide-y divide-emerald-950/60 font-sans">
              {bangladeshHelplines.map((item, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-slate-200">{item.service}</span>
                    <span className="text-[10px] text-slate-500">{item.desc}</span>
                  </div>
                  <a
                    href={`tel:${item.number}`}
                    className="rounded bg-neutral-900 border border-[#D4AF37]/30 px-3 py-1 font-mono text-xs font-bold text-[#D4AF37] hover:bg-emerald-950/20"
                  >
                    {item.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER ROW: Live security logging activity */}
      <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          {t.recent_activities}
        </h3>

        <div className="space-y-2.5 max-h-48 overflow-y-auto">
          {activityLogs.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 font-mono">
              {t.no_activities}
            </div>
          ) : (
            activityLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex gap-3 text-xs leading-relaxed py-1.5 border-b border-emerald-950/40 last:border-b-0">
                <span className="font-mono text-slate-500 text-[10px] shrink-0 mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {hour: '2-digit', minute:'2-digit'})}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-white mr-1.5">[{log.action}]</span>
                  <span className="text-slate-300">{log.details}</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono ml-1.5">• {log.userName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        {/* Backdrop for mobile */}
        {showQuickActions && (
          <div 
            className="fixed inset-0 z-40 bg-[#0c0a09]/40 backdrop-blur-sm sm:hidden"
            onClick={() => setShowQuickActions(false)} 
          />
        )}
        
        {/* Menu Items */}
        <div className={`absolute bottom-16 right-0 mb-3 flex flex-col gap-3 items-end transition-all duration-300 z-50 ${showQuickActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button 
            onClick={() => { setActiveTab('complaints'); setShowQuickActions(false); }}
            className="flex items-center gap-2.5 bg-rose-900 border border-rose-800 hover:bg-rose-800 text-rose-100 px-4 py-2.5 rounded-full shadow-lg shadow-black/50 transition-transform hover:scale-105 whitespace-nowrap"
          >
            <span className="text-xs font-bold">{language === 'bn' ? 'অভিযোগ যোগ করুন' : 'Add Complaint'}</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </button>
          
          <button 
            onClick={() => { setActiveTab('notices'); setShowQuickActions(false); }}
            className="flex items-center gap-2.5 bg-amber-900 border border-amber-800 hover:bg-amber-800 text-amber-100 px-4 py-2.5 rounded-full shadow-lg shadow-black/50 transition-transform hover:scale-105 whitespace-nowrap"
          >
            <span className="text-xs font-bold">{language === 'bn' ? 'নোটিশ তৈরি করুন' : 'Create Notice'}</span>
            <Megaphone className="h-4 w-4 text-amber-400" />
          </button>

          <button 
            onClick={() => { setActiveTab('payments'); setShowQuickActions(false); }}
            className="flex items-center gap-2.5 bg-emerald-900 border border-emerald-800 hover:bg-emerald-800 text-emerald-100 px-4 py-2.5 rounded-full shadow-lg shadow-black/50 transition-transform hover:scale-105 whitespace-nowrap"
          >
            <span className="text-xs font-bold">{language === 'bn' ? 'পেমেন্ট রেকর্ড করুন' : 'Record Payment'}</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </button>
        </div>

        {/* Trigger Button */}
        <button 
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`relative z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 border border-emerald-500 text-white shadow-xl shadow-emerald-900/60 transition-all duration-300 focus:outline-none hover:bg-emerald-500 hover:scale-105 hover:shadow-emerald-500/30 ${showQuickActions ? 'rotate-45 bg-[#D4AF37] hover:bg-amber-400 border-amber-300 text-neutral-950 hover:shadow-amber-500/30' : ''}`}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

    </div>
  );
}
