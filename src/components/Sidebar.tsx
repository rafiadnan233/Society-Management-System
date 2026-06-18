/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { db } from '../utils/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  TrendingDown,
  Megaphone,
  LifeBuoy,
  UserCheck,
  ShieldAlert,
  BarChart3,
  Settings,
  Database,
  User,
  LogOut,
  X,
  HardHat,
  Phone,
  Video
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { activeTab, setActiveTab, currentUser, logout, language, setLanguage, config } = useSociety();
  const t = translations[language];

  const [hasNewVideo, setHasNewVideo] = React.useState(false);

  React.useEffect(() => {
    const q = query(collection(db, 'project_videos'), orderBy('uploadDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setHasNewVideo(false);
        return;
      }
      
      const lastViewed = Number(localStorage.getItem('as_last_videos_viewed_time') || 0);
      const docs = snapshot.docs;
      const newestDoc = docs[0].data();
      
      let newestTime = 0;
      if (newestDoc.uploadDate) {
        if (newestDoc.uploadDate.toDate) {
          newestTime = newestDoc.uploadDate.toDate().getTime();
        } else if (newestDoc.uploadDate.seconds) {
          newestTime = newestDoc.uploadDate.seconds * 1000;
        } else {
          newestTime = new Date(newestDoc.uploadDate).getTime();
        }
      }

      if (newestTime > lastViewed && (Date.now() - newestTime < 48 * 60 * 60 * 1000 || lastViewed === 0)) {
        setHasNewVideo(true);
      } else {
        setHasNewVideo(false);
      }
    }, (error) => {
      console.warn("Sidebar project_videos listener suppressed: ", error);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, roles: ['Admin', 'Committee Member', 'Resident', 'Security Guard', 'Staff'] },
    { id: 'members', label: t.members, icon: Users, roles: ['Admin', 'Committee Member', 'Resident'] },
    { id: 'flats', label: t.flats, icon: Building2, roles: ['Admin', 'Committee Member', 'Resident', 'Security Guard'] },
    { id: 'construction', label: t.construction, icon: HardHat, roles: ['Admin', 'Committee Member', 'Resident'] },
    { id: 'project-videos', label: language === 'bn' ? 'প্রকল্প লাইভ ভিডিও' : 'Project Live Videos', icon: Video, roles: ['Admin', 'Committee Member', 'Resident', 'Security Guard', 'Staff'] },
    { id: 'payments', label: t.payments, icon: CreditCard, roles: ['Admin', 'Resident', 'Committee Member'] },
    { id: 'expenses', label: t.expenses, icon: TrendingDown, roles: ['Admin'] },
    { id: 'notices', label: t.notices, icon: Megaphone, roles: ['Admin', 'Committee Member', 'Resident'] },
    { id: 'complaints', label: t.complaints, icon: LifeBuoy, roles: ['Admin', 'Committee Member', 'Resident'] },
    { id: 'visitors', label: t.visitors, icon: UserCheck, roles: ['Admin', 'Security Guard', 'Staff'] },
    { id: 'staff', label: t.staff, icon: ShieldAlert, roles: ['Admin'] },
    { id: 'reports', label: t.reports, icon: BarChart3, roles: ['Admin'] },
    { id: 'backup', label: t.backup, icon: Database, roles: ['Admin'] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!currentUser) return item.roles.includes('Resident');
    return item.roles.includes(currentUser.role as any);
  });

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-[#043e2f] 
        bg-[#064e3b] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Header Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#043e2f]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#043327] border border-emerald-750">
              <span className="text-sm font-bold text-white tracking-widest font-sans">
                {language === 'bn' ? 'আ' : 'AS'}
              </span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white font-sans tracking-tight">
                {t.app_name}
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-amber-400 font-mono font-medium">
                {t.tagline}
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="rounded-md p-1.5 text-emerald-200 hover:bg-[#043327] hover:text-white lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Badge Info */}
        {currentUser && (
          <div className="mx-4 my-4 p-3 rounded-lg border border-emerald-800 bg-[#043327]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 border border-emerald-700 text-white font-medium">
                {currentUser.name.charAt(0)}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#043327]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{currentUser.name}</p>
                <p className="truncate text-[10px] text-emerald-300 font-mono">
                  {currentUser.role === 'Admin' ? 'Super Admin' : currentUser.role === 'Committee Member' ? 'Committee Member' : currentUser.role === 'Resident' ? `Flat ${currentUser.flatNumber || 'Resident'}` : 'Security Guard'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="px-6 py-1">
          <hr className="border-emerald-800" />
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`
                  group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-[14px] font-bold transition-all duration-250 cursor-pointer
                  ${isActive 
                    ? 'bg-emerald-800/60 text-white border-l-4 border-amber-400 rounded-md shadow-inner' 
                    : 'text-emerald-50/90 hover:bg-[#043327]/80 hover:text-white'
                  }
                `}
              >
                <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-amber-300' : 'text-emerald-250 group-hover:text-amber-300'}`} />
                <span>{item.label}</span>
                {item.id === 'project-videos' && hasNewVideo && (
                  <span className="ml-2 rounded bg-amber-400 px-1.5 py-0.5 text-[8.5px] font-black text-neutral-950 uppercase tracking-wider animate-pulse h-fit">
                    NEW
                  </span>
                )}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                )}
              </button>
            );
          })}
        </nav>


      </aside>
    </>
  );
}
