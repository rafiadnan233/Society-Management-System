/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SocietyProvider, useSociety } from './context/SocietyContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PrintPreviewModal from './components/PrintPreviewModal';
import Login from './pages/Login';
import Register from './pages/Register';
import AIAssistantWidget from './components/AIAssistantWidget';
import InactivityTimer from './components/InactivityTimer';

// Pages import
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Flats from './pages/Flats';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Notices from './pages/Notices';
import Complaints from './pages/Complaints';
import Visitors from './pages/Visitors';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import BackupRestore from './pages/BackupRestore';
import Construction from './pages/Construction';
import ProjectVideos from './pages/ProjectVideos';

function AppContent() {
  const { currentUser, activeTab } = useSociety();
  const [showRegister, setShowRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const nativePrintRef = useRef<() => void>(() => {});

  useEffect(() => {
    const originalPrint = window.print;
    
    nativePrintRef.current = () => {
      originalPrint.call(window);
    };

    window.print = () => {
      setPrintModalOpen(true);
    };

    return () => {
      window.print = originalPrint;
    };
  }, []);

  // Active View Tab Mapper
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <Members />;
      case 'flats':
        return <Flats />;
      case 'construction':
        return <Construction />;
      case 'payments':
        return <Payments />;
      case 'expenses':
        return <Expenses />;
      case 'notices':
        return <Notices />;
      case 'complaints':
        return <Complaints />;
      case 'visitors':
        return <Visitors />;
      case 'staff':
        return <Staff />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      case 'backup':
        return <BackupRestore />;
      case 'project-videos':
        return <ProjectVideos />;
      case 'nvr-terminal':
        return (
          <div className="w-full h-full bg-zinc-950 overflow-hidden relative">
            <iframe 
              src="/cctv/pages/camera.html" 
              className="absolute inset-0 w-full h-full border-0 bg-zinc-950"
              title="Astha CCTV NVR Console"
              referrerPolicy="no-referrer"
            />
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Render authentic views or dashboard wrapper
  let mainContent;
  if (!currentUser) {
    if (showRegister) {
      mainContent = <Register onLoginClick={() => setShowRegister(false)} />;
    } else {
      mainContent = <Login onRegisterClick={() => setShowRegister(true)} />;
    }
  } else {
    const isNvr = activeTab === 'nvr-terminal';
    mainContent = (
      <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans print:h-auto print:overflow-visible print:block w-full">
        {/* Primary Sidebar Layout Panel */}
        {!isNvr && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        {/* Main Right Area wrapper */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative print:h-auto print:overflow-visible print:block">
          {/* Sticky Header */}
          <Header onMenuToggle={() => setSidebarOpen(true)} />

          {/* Content Viewer viewport */}
          <main id="main-content-area" className={`flex-1 ${isNvr ? 'p-0 bg-zinc-950 overflow-hidden' : 'overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]'} relative print:overflow-visible print:h-auto print:p-0 border-none print:shadow-none animate-fade-in`}>
            {renderTabContent()}
          </main>
        </div>

        {/* Intercepted True-PDF Print Preview Overlay Dialog */}
        <PrintPreviewModal 
          isOpen={printModalOpen} 
          onClose={() => setPrintModalOpen(false)} 
          nativePrintRef={nativePrintRef}
        />
      </div>
    );
  }

  return (
    <>
      {mainContent}
      <AIAssistantWidget />
      <InactivityTimer />
    </>
  );
}

export default function App() {
  return (
    <SocietyProvider>
      <AppContent />
    </SocietyProvider>
  );
}
