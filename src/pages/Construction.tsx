/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeAllInlineStyles } from '../utils/oklchPatch';
import { 
  ConstructionPhase, 
  ConstructionExpense, 
  ConstructionDeposit,
  ConstructionDailyLedgerEntry
} from '../types';
import { 
  Building2, 
  CreditCard, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  DollarSign, 
  Calendar, 
  Filter, 
  X, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Layers, 
  User, 
  Briefcase, 
  PlusCircle, 
  Coins, 
  Wrench, 
  ArrowLeftRight,
  FileDown,
  Download,
  Loader2,
  FileText,
  Clock,
  Users,
  Mic,
  MicOff
} from 'lucide-react';

export default function Construction() {
  const { 
    constructionPhases, 
    updateConstructionPhaseSubscription, 
    updateConstructionPhaseStatus, 
    addConstructionExpense, 
    updateConstructionExpense, 
    deleteConstructionExpense, 
    addConstructionDeposit, 
    updateConstructionDeposit, 
    deleteConstructionDeposit, 
    addConstructionDailyLedger,
    updateConstructionDailyLedger,
    deleteConstructionDailyLedger,
    flats, 
    language, 
    currentUser,
    config
  } = useSociety();

  const t = translations[language];
  const isAdmin = currentUser?.role === 'Admin';

  // State Management
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('piling_basement');
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'expenses' | 'ledger'>('deposits');
  
  // Filtering & Search
  const [depositSearch, setDepositSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<'All' | 'Paid' | 'Due'>('All');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'All' | 'Labor' | 'Material'>('All');

  // Modal State
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Editing state
  const [editingDeposit, setEditingDeposit] = useState<ConstructionDeposit | null>(null);
  const [editingExpense, setEditingExpense] = useState<ConstructionExpense | null>(null);
  const [editingLedger, setEditingLedger] = useState<ConstructionDailyLedgerEntry | null>(null);

  // Active receipt for printing/downloading
  const [activeReceipt, setActiveReceipt] = useState<ConstructionDeposit | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Daily Ledger Form State
  const [dlType, setDlType] = useState<'Labor' | 'Material'>('Labor');
  const [dlTitle, setDlTitle] = useState<string>('');
  const [dlAmount, setDlAmount] = useState<number>(0);
  const [dlQty, setDlQty] = useState<string>('');
  const [dlRate, setDlRate] = useState<number>(0);
  const [dlSupplierOrRecipient, setDlSupplierOrRecipient] = useState<string>('');
  const [dlVoucherNo, setDlVoucherNo] = useState<string>('');
  const [dlNotes, setDlNotes] = useState<string>('');
  const [dlDate, setDlDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dlStatus, setDlStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [dlLaborCount, setDlLaborCount] = useState<number>(0);
  const [selectedLedgerDate, setSelectedLedgerDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [summaryMode, setSummaryMode] = useState<'daily' | 'monthly'>('daily');

  // Speech Recognition / Voice-to-Text Search State & Handler
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'bn' ? 'আপনার ব্রাউজার ভয়েস অনুসন্ধান সমর্থন করে না।' : 'Your browser does not support voice search.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      if (resultText) {
        let cleanText = resultText.trim();
        if (cleanText.endsWith('.')) {
          cleanText = cleanText.slice(0, -1);
        }
        setDepositSearch(cleanText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  // Form Fields State
  // Subscription form
  const [subAmount, setSubAmount] = useState<number>(0);
  
  // Deposit form
  const [depFlat, setDepFlat] = useState<string>('');
  const [depMember, setDepMember] = useState<string>('');
  const [depAmount, setDepAmount] = useState<number>(0);
  const [depDate, setDepDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [depMethod, setDepMethod] = useState<ConstructionDeposit['payMethod']>('Cash');
  const [depReceipt, setDepReceipt] = useState<string>('');
  const [depTrx, setDepTrx] = useState<string>('');
  const [depNotes, setDepNotes] = useState<string>('');

  // Expense form
  const [expTitle, setExpTitle] = useState<string>('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expVoucher, setExpVoucher] = useState<string>('');
  const [expSupplier, setExpSupplier] = useState<string>('');
  const [expDesc, setExpDesc] = useState<string>('');

  // Active Phase lookup
  const activePhase = constructionPhases.find(p => p.id === selectedPhaseId) || constructionPhases[0];

  // Helper formatting BDT
  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  // Convert numbers to local script
  const formatNumber = (num: number) => {
    if (language === 'bn') {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
    }
    return String(num);
  };

  // Global calculations
  // Total 72 members
  const memberCount = 72; 
  
  // Total projected collection across all initialized phases
  const totalProjected = constructionPhases.reduce((sum, p) => sum + (p.subscriptionPerMember * memberCount), 0);
  
  // Total deposits/collections across all phases
  const totalDeposits = constructionPhases.reduce(
    (sum, p) => sum + p.deposits.reduce((pSum, d) => pSum + d.amountPaid, 0), 
    0
  );

  // Total expenses across all phases
  const totalExpenses = constructionPhases.reduce(
    (sum, p) => sum + p.expenses.reduce((pSum, e) => pSum + e.amount, 0), 
    0
  );

  const totalDues = totalProjected - totalDeposits;
  const currentNetFund = totalDeposits - totalExpenses;

  // Selected phase specific calculations
  const phaseTotalTarget = activePhase ? activePhase.subscriptionPerMember * memberCount : 0;
  const phaseTotalDeposited = activePhase ? activePhase.deposits.reduce((s, d) => s + d.amountPaid, 0) : 0;
  const phaseTotalSpent = activePhase ? activePhase.expenses.reduce((s, e) => s + e.amount, 0) : 0;
  const phaseRemainingDue = phaseTotalTarget - phaseTotalDeposited;
  const phaseBalance = phaseTotalDeposited - phaseTotalSpent;

  // Prepare ledger of 72 members/flats for the active phase
  // Let's generate a list of all 72 flats from standard structure to match payments
  const standardFlats = flats.length > 0 ? flats : Array.from({ length: 72 }, (_, i) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const floor = Math.floor(i / 8) + 1;
    const letter = letters[i % 8];
    return {
      id: String(i + 1),
      number: `${floor}${letter}`,
      floor,
      status: 'occupied_owner',
      ownerName: `Owner ${floor}${letter}`,
      renterName: '',
      phone: '',
      monthlyRent: 0,
      maintenanceStatus: 'Paid',
      squareFeet: 1540
    };
  });

  const memberLedger = standardFlats.map(f => {
    // Collect all deposits this flat has paid inside this phase
    const flatDeposits = activePhase ? activePhase.deposits.filter(d => d.flatNumber.toLowerCase() === f.number.toLowerCase()) : [];
    const totalPaid = flatDeposits.reduce((s, d) => s + d.amountPaid, 0);
    const required = activePhase ? activePhase.subscriptionPerMember : 0;
    const remaining = Math.max(0, required - totalPaid);
    const isPaidAll = totalPaid >= required;

    return {
      flatNo: f.number,
      ownerName: f.ownerName && f.ownerName !== 'Unassigned' ? f.ownerName : `Flat Owner ${f.number}`,
      required,
      paid: totalPaid,
      due: remaining,
      isPaidAll,
      deposits: flatDeposits
    };
  });

  // Filtering Member Ledger
  const filteredLedger = memberLedger.filter(m => {
    const matchesSearch = m.flatNo.toLowerCase().includes(depositSearch.toLowerCase()) || 
                          m.ownerName.toLowerCase().includes(depositSearch.toLowerCase());
    
    if (depositFilter === 'Paid') {
      return matchesSearch && m.isPaidAll;
    } else if (depositFilter === 'Due') {
      return matchesSearch && !m.isPaidAll;
    }
    return matchesSearch;
  });

  // Filtering Expenses List
  const filteredPhaseExpenses = activePhase ? activePhase.expenses.filter(e => {
    return e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
           e.supplierName.toLowerCase().includes(expenseSearch.toLowerCase()) ||
           e.voucherNo.toLowerCase().includes(expenseSearch.toLowerCase());
  }) : [];

  // Handlers
  const handleAnnounceSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    updateConstructionPhaseSubscription(selectedPhaseId, subAmount);
    setShowSubModal(false);
  };

  const handleUpdateStatus = (status: ConstructionPhase['status']) => {
    if (!isAdmin) return;
    updateConstructionPhaseStatus(selectedPhaseId, status);
  };

  const openAddDeposit = (flatNo?: string, owner?: string) => {
    setDepFlat(flatNo || flats[0]?.number || '1A');
    setDepMember(owner || `Member Owner ${flatNo || '1A'}`);
    setDepAmount(activePhase ? activePhase.subscriptionPerMember : 0);
    setDepDate(new Date().toISOString().split('T')[0]);
    setDepMethod('Cash');
    setDepReceipt(`REC-CS-${Date.now().toString().slice(-4)}`);
    setDepTrx('');
    setDepNotes('');
    setEditingDeposit(null);
    setShowDepModal(true);
  };

  const openEditDeposit = (dep: ConstructionDeposit) => {
    setEditingDeposit(dep);
    setDepFlat(dep.flatNumber);
    setDepMember(dep.memberName);
    setDepAmount(dep.amountPaid);
    setDepDate(dep.payDate);
    setDepMethod(dep.payMethod);
    setDepReceipt(dep.receiptNo || '');
    setDepTrx(dep.transactionId || '');
    setDepNotes(dep.notes || '');
    setShowDepModal(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই কাজটি সম্পন্ন করতে পারবেন।' : 'Only authorized admin can compile ledger audits.');
      return;
    }
    if (!depFlat || depAmount < 0) return;

    if (editingDeposit) {
      updateConstructionDeposit(selectedPhaseId, {
        id: editingDeposit.id,
        flatNumber: depFlat,
        memberName: depMember,
        amountPaid: depAmount,
        payDate: depDate,
        payMethod: depMethod,
        receiptNo: depReceipt || undefined,
        transactionId: depTrx || undefined,
        notes: depNotes || undefined
      });
    } else {
      addConstructionDeposit(selectedPhaseId, {
        flatNumber: depFlat,
        memberName: depMember,
        amountPaid: depAmount,
        payDate: depDate,
        payMethod: depMethod,
        receiptNo: depReceipt || undefined,
        transactionId: depTrx || undefined,
        notes: depNotes || undefined
      });
    }
    setShowDepModal(false);
  };

  const handleDeleteDeposit = (depId: string) => {
    if (!isAdmin) return;
    if (window.confirm(language === 'bn' ? 'আপনি কি এই জমা রশিদ মুছে ফেলতে চান?' : 'Are you sure you want to delete this construction deposit record?')) {
      deleteConstructionDeposit(selectedPhaseId, depId);
    }
  };

  const openAddExpense = () => {
    setExpTitle('');
    setExpAmount(0);
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpVoucher(`VOUCH-${Date.now().toString().slice(-4)}`);
    setExpSupplier('');
    setExpDesc('');
    setEditingExpense(null);
    setShowExpModal(true);
  };

  const openEditExpense = (exp: ConstructionExpense) => {
    setEditingExpense(exp);
    setExpTitle(exp.title);
    setExpAmount(exp.amount);
    setExpDate(exp.date);
    setExpVoucher(exp.voucherNo);
    setExpSupplier(exp.supplierName);
    setExpDesc(exp.description);
    setShowExpModal(true);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!expTitle || expAmount < 0) return;

    if (editingExpense) {
      updateConstructionExpense(selectedPhaseId, {
        id: editingExpense.id,
        title: expTitle,
        amount: expAmount,
        date: expDate,
        voucherNo: expVoucher,
        supplierName: expSupplier,
        description: expDesc
      });
    } else {
      addConstructionExpense(selectedPhaseId, {
        title: expTitle,
        amount: expAmount,
        date: expDate,
        voucherNo: expVoucher,
        supplierName: expSupplier,
        description: expDesc
      });
    }
    setShowExpModal(false);
  };

  const handleDeleteExpense = (expId: string) => {
    if (!isAdmin) return;
    if (window.confirm(language === 'bn' ? 'আপনি কি এই ভাউচার বা খরচ মুছে ফেলতে চান?' : 'Are you sure you want to delete this transaction voucher?')) {
      deleteConstructionExpense(selectedPhaseId, expId);
    }
  };

  const openAddLedger = () => {
    setEditingLedger(null);
    setDlType('Labor');
    setDlTitle('');
    setDlAmount(0);
    setDlQty('');
    setDlRate(0);
    setDlSupplierOrRecipient('');
    setDlVoucherNo('');
    setDlNotes('');
    setDlDate(new Date().toISOString().split('T')[0]);
    setDlStatus('Paid');
    setDlLaborCount(0);
    setShowLedgerModal(true);
  };

  const openEditLedger = (dl: ConstructionDailyLedgerEntry) => {
    setEditingLedger(dl);
    setDlType(dl.type);
    setDlTitle(dl.title);
    setDlAmount(dl.amount);
    setDlQty(dl.qty || '');
    setDlRate(dl.rate || 0);
    setDlSupplierOrRecipient(dl.supplierOrRecipient);
    setDlVoucherNo(dl.voucherNo || '');
    setDlNotes(dl.notes || '');
    setDlDate(dl.date);
    setDlStatus(dl.status || 'Paid');
    setDlLaborCount(dl.laborCount || 0);
    setShowLedgerModal(true);
  };

  const handleLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!dlTitle || dlAmount < 0) return;

    const dataPayload = {
      date: dlDate,
      type: dlType,
      title: dlTitle,
      amount: dlAmount,
      qty: dlQty || undefined,
      rate: dlRate || undefined,
      supplierOrRecipient: dlSupplierOrRecipient,
      voucherNo: dlVoucherNo || undefined,
      notes: dlNotes || undefined,
      status: dlStatus,
      laborCount: dlType === 'Labor' ? (dlLaborCount || undefined) : undefined
    };

    if (editingLedger) {
      updateConstructionDailyLedger(selectedPhaseId, {
        id: editingLedger.id,
        ...dataPayload
      });
    } else {
      addConstructionDailyLedger(selectedPhaseId, dataPayload);
    }
    setShowLedgerModal(false);
  };

  const handleDeleteLedger = (dlId: string) => {
    if (!isAdmin) return;
    if (window.confirm(language === 'bn' ? 'আপনি কি এই দৈনিক খতিয়ান এন্ট্রি মুছে ফেলতে চান?' : 'Are you sure you want to delete this daily ledger entry?')) {
      deleteConstructionDailyLedger(selectedPhaseId, dlId);
    }
  };

  const generateDailyLedgerPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [15, 23, 42]; // Slate 900

      let y = 15;

      const drawHeader = (isSubPage = false) => {
        doc.setFillColor(15, 23, 42); // Navy theme header bar
        doc.rect(15, 10, 180, 18, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("ASTHA TWIN TOWERS OWNERS SOCIETY", 20, 17);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const subtitle = `DAILY LABOR COST & PURCHASE LEDGER - ${activePhase?.nameEn?.toUpperCase() || 'PHASE'}`;
        doc.text(subtitle, 20, 23);
        
        doc.setFont('helvetica', 'italic');
        const rightText = isSubPage ? `Page ${doc.internal.pages.length - 1}` : `Generated: ${new Date().toLocaleDateString()}`;
        doc.text(rightText, 170, 20, { align: 'right' });
      };

      const checkNewPage = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          drawHeader(true);
          y = 35;
        }
      };

      // Draw first page header
      drawHeader();
      y = 35;

      // Filtered items
      const list = activePhase?.dailyLedger || [];
      const filtered = list.filter(item => {
        const matchesSearch = 
          (item.title || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
          (item.supplierOrRecipient || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
          (item.voucherNo || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
          (item.notes || '').toLowerCase().includes(ledgerSearch.toLowerCase());
        
        const matchesType = ledgerTypeFilter === 'All' || item.type === ledgerTypeFilter;
        
        return matchesSearch && matchesType;
      });

      const totalLabor = filtered.filter(item => item.type === 'Labor').reduce((sum, item) => sum + item.amount, 0);
      const totalMaterial = filtered.filter(item => item.type === 'Material').reduce((sum, item) => sum + item.amount, 0);
      const totalSpent = filtered.reduce((sum, item) => sum + item.amount, 0);
      const totalPaid = filtered.filter(item => !item.status || item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
      const totalPending = filtered.filter(item => item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0);

      const totalLaborCount = filtered.filter(item => item.type === 'Labor').reduce((sum, item) => {
        if (item.laborCount !== undefined && item.laborCount > 0) {
          return sum + item.laborCount;
        }
        if (item.qty) {
          const match = item.qty.match(/\d+/);
          if (match) {
            const parsed = parseInt(match[0], 10);
            if (!isNaN(parsed)) return sum + parsed;
          }
        }
        return sum;
      }, 0);

      // 1. STATS BOX SUMMARY
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. LEDGER SUMMARIZED REPORT", 15, y);
      y += 5;

      // Summary boxes: Taller container for double-row stats
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 32, 'FD');

      // Grid line split
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 16, 195, y + 16);

      // ROW 1: Labor, Materials, Workers count
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL LABOR COSTS", 20, y + 5.5);
      doc.text("TOTAL MATERIAL PURCHASES", 80, y + 5.5);
      doc.text("TOTAL LABOR COUNT", 140, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(29, 78, 216); // Blue
      doc.text(`BDT ${totalLabor.toLocaleString()}`, 20, y + 12);
      doc.setTextColor(109, 40, 217); // Purple
      doc.text(`BDT ${totalMaterial.toLocaleString()}`, 80, y + 12);
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.text(`${totalLaborCount.toLocaleString()} Workers`, 140, y + 12);

      // ROW 2: Paid, Pending, Grand Total
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL PAID AMOUNT", 20, y + 21.5);
      doc.text("TOTAL PENDING AMOUNT", 80, y + 21.5);
      doc.text("GRAND TOTAL AMOUNT", 140, y + 21.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(5, 150, 105); // Emerald/Green
      doc.text(`BDT ${totalPaid.toLocaleString()}`, 20, y + 28);
      doc.setTextColor(217, 119, 6); // Amber/Orange
      doc.text(`BDT ${totalPending.toLocaleString()}`, 80, y + 28);
      doc.setTextColor(15, 23, 42); // Navy/Slate
      doc.text(`BDT ${totalSpent.toLocaleString()}`, 140, y + 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Type Filter Status: ${ledgerTypeFilter} | Records Found: ${filtered.length}`, 20, y + 37);

      y += 45;

      // 2. LEDGER LIST OF ENTRIES
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. CHRONOLOGICAL LOG OF ENTRIES (FILTERED)`, 15, y);
      y += 5;

      // Draw table headers
      const colX = [15, 34, 52, 110, 142, 168];
      
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Date", colX[0] + 2, y + 5);
      doc.text("Type & Status", colX[1] + 2, y + 5);
      doc.text("Expense Head / Description", colX[2] + 2, y + 5);
      doc.text("Paid to / Supplier", colX[3] + 2, y + 5);
      doc.text("Rate & Qty", colX[4] + 2, y + 5);
      doc.text("Total", colX[5] + 2, y + 5);
      
      y += 7;

      filtered.forEach((dl) => {
        const rowHeight = 11;
        checkNewPage(rowHeight + 2);
        
        doc.setFillColor(255, 255, 255);
        doc.rect(15, y, 180, rowHeight, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + rowHeight, 195, y + rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(51, 65, 85);

        // Date
        doc.text(dl.date, colX[0] + 2, y + 6);

        // Type
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        doc.text(dl.type.toUpperCase(), colX[1] + 2, y + 4.5);
        
        // Status indicator
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        if (dl.status === 'Pending') {
          doc.setTextColor(180, 83, 9); // Pending amber
          doc.text("PENDING", colX[1] + 2, y + 8);
        } else {
          doc.setTextColor(4, 120, 87); // Paid emerald
          doc.text("PAID", colX[1] + 2, y + 8);
        }

        // Description / Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        const maxDescWidth = 56;
        let pTitle = dl.title;
        const titleLines = doc.splitTextToSize(pTitle, maxDescWidth);
        doc.text(titleLines[0] || '', colX[2] + 2, y + 4.5);

        // Subtext / Voucher / Notes
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        let subText = '';
        if (dl.voucherNo) subText += `Voucher #${dl.voucherNo} | `;
        if (dl.notes) subText += `${dl.notes}`;
        const subLines = doc.splitTextToSize(subText, maxDescWidth);
        doc.text(subLines[0] || '', colX[2] + 2, y + 8);

        // Supplier
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const supplierLines = doc.splitTextToSize(dl.supplierOrRecipient || '', 30);
        doc.text(supplierLines[0] || '', colX[3] + 2, y + 6);

        // Rate & Qty
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const rateQtyText = dl.rate && dl.qty ? `${dl.rate.toLocaleString()} x ${dl.qty}` : '—';
        doc.text(rateQtyText, colX[4] + 2, y + 4.5);

        // Laborers if present
        if (dl.type === 'Labor' && dl.laborCount) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6);
          doc.setTextColor(37, 99, 235); // Blue
          doc.text(`👷 ${dl.laborCount} Workers`, colX[4] + 2, y + 8);
        }

        // Total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(dl.amount.toLocaleString(), colX[5] + 2, y + 6);
        doc.setFont('helvetica', 'normal');

        y += rowHeight;
      });

      // Signature & Footer
      checkNewPage(30);
      y += 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, 65, y);
      doc.line(145, y, 195, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text("PREPARED BY (ON-SITE CLERK)", 15, y + 4);
      doc.text("APPROVED BY (TREASURER)", 145, y + 4);

      doc.save(`Daily-Ledger-${activePhase?.id || 'Phase'}-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  const generateMonthlyLedgerPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let y = 15;

      const drawHeader = (isSubPage = false) => {
        doc.setFillColor(15, 23, 42); // Navy theme header bar
        doc.rect(15, 10, 180, 18, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("ASTHA TWIN TOWERS OWNERS SOCIETY", 20, 17);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const [year, month] = selectedLedgerMonth.split('-');
        let monthName = selectedLedgerMonth;
        try {
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
          monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
        } catch {}
        const subtitle = `MONTHLY LABOR COST & PURCHASE LEDGER - ${monthName} - ${activePhase?.nameEn?.toUpperCase() || 'PHASE'}`;
        doc.text(subtitle, 20, 23);
        
        doc.setFont('helvetica', 'italic');
        const rightText = isSubPage ? `Page ${doc.internal.pages.length - 1}` : `Generated: ${new Date().toLocaleDateString()}`;
        doc.text(rightText, 170, 20, { align: 'right' });
      };

      const checkNewPage = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          drawHeader(true);
          y = 35;
        }
      };

      // Draw first page header
      drawHeader();
      y = 35;

      // Filter entries for the selected month
      const list = activePhase?.dailyLedger || [];
      const filtered = list.filter(item => 
        item.date && item.date.startsWith(selectedLedgerMonth)
      );

      const totalLabor = filtered.filter(item => item.type === 'Labor').reduce((sum, item) => sum + item.amount, 0);
      const totalMaterial = filtered.filter(item => item.type === 'Material').reduce((sum, item) => sum + item.amount, 0);
      const totalSpent = filtered.reduce((sum, item) => sum + item.amount, 0);
      const totalPaid = filtered.filter(item => !item.status || item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
      const totalPending = filtered.filter(item => item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0);

      const totalLaborCount = filtered.filter(item => item.type === 'Labor').reduce((sum, item) => {
        if (item.laborCount !== undefined && item.laborCount > 0) {
          return sum + item.laborCount;
        }
        if (item.qty) {
          const match = item.qty.match(/\d+/);
          if (match) {
            const parsed = parseInt(match[0], 10);
            if (!isNaN(parsed)) return sum + parsed;
          }
        }
        return sum;
      }, 0);

      // 1. STATS BOX SUMMARY
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. MONTHLY LEDGER SUMMARIZED REPORT", 15, y);
      y += 5;

      // Summary boxes: Taller container for double-row stats
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 32, 'FD');

      // Grid line split
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 16, 195, y + 16);

      // ROW 1: Labor, Materials, Workers count
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL LABOR COSTS", 20, y + 5.5);
      doc.text("TOTAL MATERIAL PURCHASES", 80, y + 5.5);
      doc.text("CUMULATIVE LABOR COUNT", 140, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(29, 78, 216); // Blue
      doc.text(`BDT ${totalLabor.toLocaleString()}`, 20, y + 12);
      doc.setTextColor(109, 40, 217); // Purple
      doc.text(`BDT ${totalMaterial.toLocaleString()}`, 80, y + 12);
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.text(`${totalLaborCount.toLocaleString()} workers`, 140, y + 12);

      // ROW 2: Paid, Pending, Grand Total
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("MONTHLY PAID AMOUNT", 20, y + 21.5);
      doc.text("MONTHLY PENDING AMOUNT", 80, y + 21.5);
      doc.text("GRAND EXPENSE TOTAL", 140, y + 21.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(5, 150, 105); // Emerald/Green
      doc.text(`BDT ${totalPaid.toLocaleString()}`, 20, y + 28);
      doc.setTextColor(217, 119, 6); // Amber/Orange
      doc.text(`BDT ${totalPending.toLocaleString()}`, 80, y + 28);
      doc.setTextColor(15, 23, 42); // Navy/Slate
      doc.text(`BDT ${totalSpent.toLocaleString()}`, 140, y + 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Monthly Filter: ${selectedLedgerMonth} | Records Found: ${filtered.length}`, 20, y + 37);

      y += 45;

      // 2. LEDGER LIST OF ENTRIES
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. CHRONOLOGICAL LIST OF ENTRIES FOR THE MONTH`, 15, y);
      y += 5;

      // Draw table headers
      const colX = [15, 34, 52, 110, 142, 168];
      
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Date", colX[0] + 2, y + 5);
      doc.text("Type & Status", colX[1] + 2, y + 5);
      doc.text("Expense Head / Description", colX[2] + 2, y + 5);
      doc.text("Paid to / Supplier", colX[3] + 2, y + 5);
      doc.text("Rate & Qty", colX[4] + 2, y + 5);
      doc.text("Total", colX[5] + 2, y + 5);
      
      y += 7;

      if (filtered.length === 0) {
        checkNewPage(15);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("No entries recorded for this month.", 20, y + 6);
        y += 10;
      } else {
        filtered.forEach((dl) => {
          const rowHeight = 11;
          checkNewPage(rowHeight + 2);
          
          doc.setFillColor(255, 255, 255);
          doc.rect(15, y, 180, rowHeight, 'F');
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + rowHeight, 195, y + rowHeight);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(51, 65, 85);

          // Date
          doc.text(dl.date, colX[0] + 2, y + 6);

          // Type
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);
          doc.text(dl.type.toUpperCase(), colX[1] + 2, y + 4.5);
          
          // Status indicator
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          if (dl.status === 'Pending') {
            doc.setTextColor(180, 83, 9); // Pending amber
            doc.text("PENDING", colX[1] + 2, y + 8);
          } else {
            doc.setTextColor(4, 120, 87); // Paid emerald
            doc.text("PAID", colX[1] + 2, y + 8);
          }

          // Description / Title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          const maxDescWidth = 56;
          let pTitle = dl.title;
          const titleLines = doc.splitTextToSize(pTitle, maxDescWidth);
          doc.text(titleLines[0] || '', colX[2] + 2, y + 4.5);

          // Subtext / Voucher / Notes
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          let subText = '';
          if (dl.voucherNo) subText += `Voucher #${dl.voucherNo} | `;
          if (dl.notes) subText += `${dl.notes}`;
          const subLines = doc.splitTextToSize(subText, maxDescWidth);
          doc.text(subLines[0] || '', colX[2] + 2, y + 8);

          // Supplier
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(71, 85, 105);
          const supplierLines = doc.splitTextToSize(dl.supplierOrRecipient || '', 30);
          doc.text(supplierLines[0] || '', colX[3] + 2, y + 6);

          // Rate & Qty
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          const rateQtyText = dl.rate && dl.qty ? `${dl.rate.toLocaleString()} x ${dl.qty}` : '—';
          doc.text(rateQtyText, colX[4] + 2, y + 4.5);

          // Laborers if present
          if (dl.type === 'Labor' && dl.laborCount) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(6);
            doc.setTextColor(37, 99, 235); // Blue
            doc.text(`👷 ${dl.laborCount} Workers`, colX[4] + 2, y + 8);
          }

          // Total
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(dl.amount.toLocaleString(), colX[5] + 2, y + 6);
          doc.setFont('helvetica', 'normal');

          y += rowHeight;
        });
      }

      // Signature & Footer
      checkNewPage(30);
      y += 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, 65, y);
      doc.line(145, y, 195, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text("PREPARED BY (ON-SITE CLERK)", 15, y + 4);
      doc.text("APPROVED BY (TREASURER)", 145, y + 4);

      doc.save(`Monthly-Ledger-${activePhase?.id || 'Phase'}-${selectedLedgerMonth}.pdf`);

    } catch (error) {
      console.error("Monthly PDF generation failed:", error);
    }
  };

  const generatePDFStatement = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [15, 23, 42]; // Slate 900
      const textColor = [51, 65, 85]; // Slate 700

      let y = 15;

      const drawHeader = (isSubPage = false) => {
        doc.setFillColor(15, 23, 42); // Navy theme header bar
        doc.rect(15, 10, 180, 18, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("ASTHA TWIN TOWERS OWNERS SOCIETY", 20, 17);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text("BUILDING CONSTRUCTION LEDGER AUDIT STATEMENT", 20, 23);
        
        doc.setFont('helvetica', 'italic');
        doc.text(isSubPage ? `Page ${doc.internal.pages.length - 1}` : `Generated: ${new Date().toLocaleDateString()}`, 170, 20, { align: 'right' });
      };

      const checkNewPage = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          drawHeader(true); // Draw header on new page as well
          y = 35; // Start lower because of header
        }
      };

      // Draw first page header
      drawHeader();
      y = 35;

      // 1. PROJECT META / EXECUTIVE SUMMARY
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. EXECUTIVE CAPITAL SUMMARY", 15, y);
      y += 5;

      // Draw Summary Grid Boxes
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 25, 'FD'); // Outer box

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      
      // Column labels
      doc.text("EXPECTED TARGETS", 20, y + 6);
      doc.text("TOTAL DEPOSITS", 60, y + 6);
      doc.text("TOTAL EXPENDED", 100, y + 6);
      doc.text("OUTSTANDING DUES", 140, y + 6);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`BDT ${totalProjected.toLocaleString()}`, 20, y + 13);
      doc.setTextColor(16, 185, 129); // Green for deposits
      doc.text(`BDT ${totalDeposits.toLocaleString()}`, 60, y + 13);
      doc.setTextColor(239, 68, 68); // Red for expenses
      doc.text(`BDT ${totalExpenses.toLocaleString()}`, 100, y + 13);
      doc.setTextColor(217, 119, 6); // Amber for dues
      doc.text(`BDT ${totalDues.toLocaleString()}`, 140, y + 13);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 18, 195, y + 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`AVAILABLE CONSTRUCTION FUND SURPLUS: BDT ${currentNetFund.toLocaleString()}`, 20, y + 22.5);

      y += 33;

      // 2. PHASE-WISE BUDGET SEGREGATION
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("2. STRUCTURAL PHASES BUDGET DISTRIBUTION", 15, y);
      y += 5;

      // Draw table headers
      const colX = [15, 52, 74, 98, 122, 144, 168];
      
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Phase Name", colX[0] + 2, y + 5);
      doc.text("Target/Unit", colX[1] + 2, y + 5);
      doc.text("Total Budget", colX[2] + 2, y + 5);
      doc.text("Deposited", colX[3] + 2, y + 5);
      doc.text("Spent", colX[4] + 2, y + 5);
      doc.text("Current Balance", colX[5] + 2, y + 5);
      doc.text("Status", colX[6] + 2, y + 5);
      
      y += 7;

      constructionPhases.forEach((phase) => {
        checkNewPage(8);
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 7, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y + 7, 195, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        
        const pName = phase.nameEn || phase.nameBn;
        doc.text(pName, colX[0] + 2, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.text(phase.subscriptionPerMember.toLocaleString(), colX[1] + 2, y + 4.5);
        
        const phaseBudget = phase.subscriptionPerMember * 72;
        doc.text(phaseBudget.toLocaleString(), colX[2] + 2, y + 4.5);

        const phaseDeposits = phase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
        doc.text(phaseDeposits.toLocaleString(), colX[3] + 2, y + 4.5);

        const phaseSpent = phase.expenses.reduce((sum, e) => sum + e.amount, 0);
        doc.text(phaseSpent.toLocaleString(), colX[4] + 2, y + 4.5);

        const currentBalance = phaseDeposits - phaseSpent;
        doc.text(currentBalance.toLocaleString(), colX[5] + 2, y + 4.5);

        // Status
        doc.setFont('helvetica', 'bold');
        let displayStatus = phase.status;
        if (phaseDeposits >= phaseBudget) {
          displayStatus = 'Completed';
        }

        if (displayStatus === 'Completed') {
          doc.setTextColor(16, 185, 129);
        } else if (displayStatus === 'In-Progress') {
          doc.setTextColor(59, 130, 246);
        } else {
          doc.setTextColor(100, 116, 139);
        }
        doc.text(displayStatus, colX[6] + 2, y + 4.5);

        y += 7;
      });

      y += 5;

      // 3. PHASE EXPENDITURE AUDIT LEDGER
      checkNewPage(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("3. PHASE-WISE DETAILED CAPITAL EXPENDITURES", 15, y);
      y += 6;

      // Iterate over active or all phases to list expenditure breakdown
      constructionPhases.forEach((phase) => {
        if (phase.expenses.length === 0) return;

        checkNewPage(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`${phase.nameEn || phase.nameBn} - Expenditures List`, 15, y);
        y += 4;

        // Draw Sub-table headers
        const expX = [15, 40, 85, 130, 160];

        doc.setFillColor(51, 65, 85);
        doc.rect(15, y, 180, 6, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("Date", expX[0] + 2, y + 4);
        doc.text("Title/Item Description", expX[1] + 2, y + 4);
        doc.text("Vendor/Supplier", expX[2] + 2, y + 4);
        doc.text("Voucher No", expX[3] + 2, y + 4);
        doc.text("Amount BDT", expX[4] + 2, y + 4);

        y += 6;

        phase.expenses.forEach(e => {
          checkNewPage(8);
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + 6, 195, y + 6);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(51, 65, 85);
          
          doc.text(e.date, expX[0] + 2, y + 4);
          doc.text(e.title.substring(0, 32), expX[1] + 2, y + 4);
          doc.text(e.supplierName.substring(0, 32), expX[2] + 2, y + 4);
          doc.text(e.voucherNo || '-', expX[3] + 2, y + 4);

          doc.setFont('helvetica', 'bold');
          doc.text(e.amount.toLocaleString(), expX[4] + 2, y + 4);

          y += 6;
        });

        // Add Total Expense row under "Amount BDT"
        checkNewPage(8);
        doc.setDrawColor(15, 23, 42);
        doc.line(15, y + 1, 195, y + 1);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Total Amount:", expX[3] + 2, y + 5);
        
        const totalPhaseExpenses = phase.expenses.reduce((sum, e) => sum + e.amount, 0);
        doc.text(totalPhaseExpenses.toLocaleString(), expX[4] + 2, y + 5);

        y += 10; // Extra margin after each phase
      });

      // 4. UNPAID / DUE STATEMENT SUMMARY BY MEMBERS
      checkNewPage(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("4. UNRESOLVED MEMBER ARREARS SUMMARY (TOP UNITS)", 15, y);
      y += 5;

      const overdueLedger = standardFlats.map(f => {
        let totalPaid = 0;
        let totalRequired = 0;
        constructionPhases.forEach(p => {
          if (p.status !== 'Pending') {
            totalRequired += p.subscriptionPerMember;
            const pmts = p.deposits.filter(d => d.flatNumber.toLowerCase() === f.number.toLowerCase());
            totalPaid += pmts.reduce((sum, d) => sum + d.amountPaid, 0);
          }
        });
        const dueNum = Math.max(0, totalRequired - totalPaid);
        return {
          flatNo: f.number,
          ownerName: f.ownerName && f.ownerName !== 'Unassigned' ? f.ownerName : `Owner ${f.number}`,
          required: totalRequired,
          paid: totalPaid,
          due: dueNum
        };
      }).filter(m => m.due > 0);

      if (overdueLedger.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text("All members are fully settled across all active and completed construction phases. No outstanding arrears.", 15, y + 4);
        y += 8;
      } else {
        const dx = [15, 45, 100, 140, 165];
        
        doc.setFillColor(239, 68, 68); // Red background for due table header
        doc.rect(15, y, 180, 6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("Flat", dx[0] + 2, y + 4);
        doc.text("Registered Owner", dx[1] + 2, y + 4);
        doc.text("Total Required", dx[2] + 2, y + 4);
        doc.text("Total Paid", dx[3] + 2, y + 4);
        doc.text("Outstanding Due", dx[4] + 2, y + 4);

        y += 6;

        overdueLedger.slice(0, 15).forEach((item) => {
          checkNewPage(8);
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + 6, 195, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(51, 65, 85);

          doc.text(item.flatNo, dx[0] + 2, y + 4);
          doc.text(item.ownerName.substring(0, 35), dx[1] + 2, y + 4);
          doc.text(`BDT ${item.required.toLocaleString()}`, dx[2] + 2, y + 4);
          doc.text(`BDT ${item.paid.toLocaleString()}`, dx[3] + 2, y + 4);
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 38, 38); // red for due
          doc.text(`BDT ${item.due.toLocaleString()}`, dx[4] + 2, y + 4);
          doc.setTextColor(51, 65, 85); // reset

          y += 6;
        });

        if (overdueLedger.length > 15) {
          checkNewPage(7);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`... and ${overdueLedger.length - 15} more members with minor arrears. Refer to standard ledger in-app.`, 15, y + 4);
          y += 6;
        }
      }

      // Signoff section
      checkNewPage(35);
      y += 5;
      doc.setDrawColor(15, 23, 42);
      doc.line(15, y, 195, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text("ASTHA TWIN TOWERS JOINT DEVELOPMENT BOARD", 15, y);
      
      const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'System Administrator';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Audited & Compiled by: ${userStr}`, 15, y + 4);
      doc.text("Official ledger document certified under Astha Twin Towers Owners Association Charter.", 15, y + 8);

      // Signoff lines
      doc.line(145, y + 10, 190, y + 10);
      doc.setFont('helvetica', 'bold');
      doc.text("Authorized Signature", 145, y + 14);

      // Save document
      doc.save("Astha_Twin_Towers_Construction_Ledger_Statement.pdf");

    } catch (err) {
      console.error("PDF generation fail:", err);
      alert(language === 'bn' ? "পিডিএফ তৈরি করতে ত্রুটি ঘটেছে।" : "An error occurred while compiling the PDF audit.");
    }
  };

  const generateMemberDepositsPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let y = 15;

      const drawHeader = (isSubPage = false) => {
        doc.setFillColor(15, 23, 42); // Private-equity standard dark slate header bar
        doc.rect(15, 10, 180, 18, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("ASTHA TWIN TOWERS OWNERS SOCIETY", 20, 16);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const subTitleStr = `CONSTRUCTION MEMBER CONTRIBUTION STATEMENT  -  ${activePhase?.nameEn?.toUpperCase() || 'PHASE'}`;
        doc.text(subTitleStr, 20, 22);
        
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        const rightText = isSubPage ? `Page ${doc.internal.pages.length - 1}` : `Generated: ${new Date().toLocaleDateString()}`;
        doc.text(rightText, 170, 19, { align: 'right' });
      };

      const checkNewPage = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          drawHeader(true);
          y = 35;
        }
      };

      // Draw initial page header
      drawHeader();
      y = 35;

      // Filter settings explanation
      let filterDisplayLabel = "All Dynamic Flats/Members";
      if (depositFilter === 'Paid') {
        filterDisplayLabel = "Settled/Fully Paid Contributors Only";
      } else if (depositFilter === 'Due') {
        filterDisplayLabel = "Outstanding Arrears & Dues Only";
      }

      if (depositSearch) {
        filterDisplayLabel += ` (Matching search term: "${depositSearch}")`;
      }

      // Calculations based on filtered list
      const totalFilteredCount = filteredLedger.length;
      const totalRequiredSum = filteredLedger.reduce((sum, item) => sum + item.required, 0);
      const totalPaidSum = filteredLedger.reduce((sum, item) => sum + item.paid, 0);
      const totalDueSum = filteredLedger.reduce((sum, item) => sum + item.due, 0);

      // Section 1: Executive Highlights
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. CONTRIBUTIONS FINANCIAL SUMMARY", 15, y);
      y += 5;

      // Draw Summary Grid Boxes
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 24, 'FD'); // Outer box

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      
      // Render text grid labels
      doc.text("FILTER STATE", 20, y + 6);
      doc.text("TOTAL MEMBERS", 65, y + 6);
      doc.text("TOTAL COLLECTED (PAID)", 105, y + 6);
      doc.text("TOTAL OUTSTANDING (DUE)", 150, y + 6);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(depositFilter.toUpperCase(), 20, y + 13);
      
      doc.setTextColor(15, 23, 42);
      doc.text(`${totalFilteredCount} Units`, 65, y + 13);
      
      doc.setTextColor(5, 150, 105); // emerald green
      doc.text(`BDT ${totalPaidSum.toLocaleString()}`, 105, y + 13);
      
      doc.setTextColor(217, 119, 6); // amber
      doc.text(`BDT ${totalDueSum.toLocaleString()}`, 150, y + 13);

      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 17, 195, y + 17);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Active Scope: ${filterDisplayLabel}`, 20, y + 21);

      y += 33;

      // Section 2: Detailed Table
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("2. ITEMIZED LEDGER RECORD LIST", 15, y);
      y += 5;

      // Draw table headers
      const colX = [15, 33, 75, 105, 137, 168];
      
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Flat No", colX[0] + 2, y + 5);
      doc.text("Registered Owner", colX[1] + 2, y + 5);
      doc.text("Target Due (BDT)", colX[2] + 2, y + 5);
      doc.text("Collected (BDT)", colX[3] + 2, y + 5);
      doc.text("Balance Due (BDT)", colX[4] + 2, y + 5);
      doc.text("Status", colX[5] + 2, y + 5);
      
      y += 7;

      if (filteredLedger.length === 0) {
        checkNewPage(12);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("No member ledger matches the current filter selection.", 20, y + 6);
        y += 10;
      } else {
        filteredLedger.forEach((item) => {
          const rowHeight = 8;
          checkNewPage(rowHeight + 1);
          
          doc.setFillColor(255, 255, 255);
          doc.rect(15, y, 180, rowHeight, 'F');
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + rowHeight, 195, y + rowHeight);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);

          // Flat No
          doc.setFont('helvetica', 'bold');
          doc.text(item.flatNo, colX[0] + 2, y + 5.5);
          doc.setFont('helvetica', 'normal');

          // Registered Owner name
          const cleanName = item.ownerName ? item.ownerName.replace(/[^\x00-\x7F]/g, "") : `Owner ${item.flatNo}`; // strip non-ascii to avoid jsPDF box renders
          const nameToUse = cleanName.trim() === "" ? `Owner ${item.flatNo}` : cleanName;
          doc.text(nameToUse.substring(0, 24), colX[1] + 2, y + 5.5);

          // Target share/required
          doc.text(item.required.toLocaleString(), colX[2] + 2, y + 5.5);

          // Paid amount
          doc.text(item.paid.toLocaleString(), colX[3] + 2, y + 5.5);

          // Due amount
          if (item.due > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(217, 119, 6); // Amber
            doc.text(item.due.toLocaleString(), colX[4] + 2, y + 5.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
          } else {
            doc.text("0", colX[4] + 2, y + 5.5);
          }

          // Status label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          if (item.isPaidAll) {
            doc.setTextColor(5, 150, 105); // green
            doc.text("PAID", colX[5] + 2, y + 5.5);
          } else {
            doc.setTextColor(220, 38, 38); // red
            doc.text("DUE ARREAR", colX[5] + 2, y + 5.5);
          }
          doc.setFontSize(7.5); // reset
          doc.setTextColor(51, 65, 85); // reset

          y += rowHeight;
        });

        // Add Summary footer row in the table
        checkNewPage(10);
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 8, 'F');
        doc.setDrawColor(15, 23, 42);
        doc.line(15, y + 8, 195, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Total", colX[0] + 2, y + 5.5);
        
        doc.text(`Count: ${totalFilteredCount}`, colX[1] + 2, y + 5.5);
        doc.text(totalRequiredSum.toLocaleString(), colX[2] + 2, y + 5.5);
        doc.text(totalPaidSum.toLocaleString(), colX[3] + 2, y + 5.5);
        
        doc.setTextColor(220, 38, 38); // Red for total dues
        doc.text(totalDueSum.toLocaleString(), colX[4] + 2, y + 5.5);
        
        y += 12;
      }

      // Preparation, approval signature box
      checkNewPage(32);
      y += 8;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, 65, y);
      doc.line(145, y, 195, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("PREPARED BY (TREASURER)", 15, y + 4.5);
      doc.text("VERIFIED BY (SOCIETY CHAIRMAN)", 145, y + 4.5);

      const statusDesc = depositFilter === 'All' ? 'Complete' : depositFilter;
      doc.save(`Member-Deposits-${activePhase?.id || 'Phase'}-${statusDesc}.pdf`);

    } catch (err) {
      console.error("Member PDF compilation failed:", err);
    }
  };

  const generateVentureExpensesPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let y = 15;

      const drawHeader = (isSubPage = false) => {
        doc.setFillColor(15, 23, 42); // slate 900
        doc.rect(15, 10, 180, 18, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("ASTHA TWIN TOWERS OWNERS SOCIETY", 20, 16);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const subTitleStr = `CONSTRUCTION VENTURE EXPENDITURES & VOUCHERS - ${activePhase?.nameEn?.toUpperCase() || 'PHASE'}`;
        doc.text(subTitleStr, 20, 22);
        
        doc.setFont('helvetica', 'italic');
        const rightText = isSubPage ? `Page ${doc.internal.pages.length - 1}` : `Generated: ${new Date().toLocaleDateString()}`;
        doc.text(rightText, 170, 19, { align: 'right' });
      };

      const checkNewPage = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          drawHeader(true);
          y = 35;
        }
      };

      drawHeader();
      y = 35;

      // Filter settings explanation
      let filterDisplayLabel = "All Venture Expense records matching filters";
      if (expenseSearch) {
        filterDisplayLabel += ` (Matching search term: "${expenseSearch}")`;
      }

      const totalFilteredCount = filteredPhaseExpenses.length;
      const totalSpentSum = filteredPhaseExpenses.reduce((sum, item) => sum + item.amount, 0);

      // Section 1: Financial Highlight card
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. EXPENDITURES SUMMARY OVERVIEW", 15, y);
      y += 5;

      // Draw Summary Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 22, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("ACTIVE WORK PHASE", 20, y + 6);
      doc.text("TOTAL RECORDED VOUCHERS", 85, y + 6);
      doc.text("CUMULATIVE EXPENDITURE", 140, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(activePhase?.nameEn?.toUpperCase() || 'PHASE', 20, y + 13);
      doc.text(`${totalFilteredCount} Vouchers`, 85, y + 13);
      doc.setTextColor(220, 38, 38); // red for expense
      doc.text(`BDT ${totalSpentSum.toLocaleString()}`, 140, y + 13);

      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 16, 195, y + 16);

      y += 28;

      // Section 2: Detailed Table
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("2. ITEMIZED CONSTRUCTION EXPENDITURES & VOUCHERS", 15, y);
      y += 5;

      // Draw table headers
      const colX = [15, 33, 50, 110, 142, 168];
      
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Date", colX[0] + 2, y + 5);
      doc.text("Voucher #", colX[1] + 2, y + 5);
      doc.text("Expenditure Head & Details", colX[2] + 2, y + 5);
      doc.text("Contractor / Supplier", colX[3] + 2, y + 5);
      doc.text("Status", colX[4] + 2, y + 5);
      doc.text("Amount (BDT)", colX[5] + 2, y + 5);
      
      y += 7;

      if (filteredPhaseExpenses.length === 0) {
        checkNewPage(12);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("No expenditure items found matching key filters.", 20, y + 6);
        y += 10;
      } else {
        filteredPhaseExpenses.forEach((exp) => {
          const rowHeight = 11;
          checkNewPage(rowHeight + 1);
          
          doc.setFillColor(255, 255, 255);
          doc.rect(15, y, 180, rowHeight, 'F');
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + rowHeight, 195, y + rowHeight);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);

          // Date
          doc.text(exp.date, colX[0] + 2, y + 6.5);

          // VoucherID
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(79, 70, 229); // indigo
          doc.text(exp.voucherNo || '—', colX[1] + 2, y + 6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);

          // Head & Description
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const rawTitle = exp.title ? exp.title.replace(/[^\x00-\x7F]/g, "") : "Expense";
          const titleToUse = rawTitle.trim() === "" ? "Voucher Expense" : rawTitle;
          doc.text(titleToUse.substring(0, 32), colX[2] + 2, y + 4.5);
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          const rawDesc = exp.description ? exp.description.replace(/[^\x00-\x7F]/g, "") : "";
          doc.text(rawDesc.substring(0, 48), colX[2] + 2, y + 8.5);
          doc.setFontSize(7.5); // reset

          // Supplier Name
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          const rawSup = exp.supplierName ? exp.supplierName.replace(/[^\x00-\x7F]/g, "") : "—";
          doc.text(rawSup.substring(0, 22), colX[3] + 2, y + 6.5);

          // Status (Paid on completion)
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(5, 150, 105); // green
          doc.text("SETTLED", colX[4] + 2, y + 6.5);
          doc.setFontSize(7.5);

          // Amount
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 38, 38); // red/rose
          doc.text(exp.amount.toLocaleString(), colX[5] + 2, y + 6.5);
          doc.setTextColor(51, 65, 85); // reset
          doc.setFont('helvetica', 'normal');

          y += rowHeight;
        });

        // Summary footer row in the table
        checkNewPage(12);
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 8, 'F');
        doc.setDrawColor(15, 23, 42);
        doc.line(15, y + 8, 195, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Total", colX[0] + 2, y + 5.5);
        doc.text(`Count: ${totalFilteredCount} items`, colX[1] + 2, y + 5.5);
        doc.text("Cumulative Sum of Settled Vouchers:", colX[2] + 2, y + 5.5);
        
        doc.setTextColor(220, 38, 38); // Red
        doc.text(totalSpentSum.toLocaleString(), colX[5] + 2, y + 5.5);
        
        y += 12;
      }

      // Preparation, approval signature box
      checkNewPage(32);
      y += 8;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, 65, y);
      doc.line(145, y, 195, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("PREPARED BY (TREASURER)", 15, y + 4.5);
      doc.text("VERIFIED BY (SOCIETY CHAIRMAN)", 145, y + 4.5);

      doc.save(`Venture-Expenses-${activePhase?.id || 'Phase'}.pdf`);

    } catch (err) {
      console.error("Venture Expense PDF compiling failed:", err);
    }
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleDownloadReceiptPDF = async () => {
    const element = document.getElementById('printable-construction-receipt');
    if (!element) return;

    try {
      setIsGeneratingPDF(true);
      
      // Sanitize all inline styles to prevent oklch rendering exceptions
      sanitizeAllInlineStyles(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0a0a0a',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Construction-Receipt-${activeReceipt?.receiptNo || activeReceipt?.id || 'download'}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className={`space-y-6 animate-fade-in pb-12 ${activeReceipt ? 'print:hidden' : ''}`}>
      
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight sm:text-2xl font-sans">
            {language === 'bn' ? 'বিল্ডিং নির্মাণ আর্থিক লেজার' : 'Building Construction Ledger'}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {language === 'bn' 
              ? 'পাইলিং, বেইসমেন্ট এবং ১ম হতে ১০ম ছাদ পর্যন্ত প্রতিটি ধাপের চাঁদা আদায় ও ব্যয়ের খতিয়ান' 
              : 'End-to-end accounting for Piling foundation, basement, and all 10 floor slabs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generatePDFStatement}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-4 py-2 text-xs font-bold cursor-pointer print:hidden transition-all duration-150"
            type="button"
          >
            <FileDown className="h-4 w-4 text-white" />
            <span>{language === 'bn' ? 'লেজার পিডিএফ ডাউনলোড' : 'Download PDF Statement'}</span>
          </button>

          
        </div>
      </div>

      {/* Overview Cards Container */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Total Projected Collection Targets */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#4a050b] to-[#250003] hover:from-[#5c0b12] hover:to-[#330106] p-5 border border-[#D4AF37]/30 shadow-md group hover:border-[#D4AF37]/65 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-sans">
              {language === 'bn' ? 'মোট লক্ষ্যমাত্রা' : 'Expected Targets'}
            </p>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#FFD700] font-sans leading-none relative z-10">
            {formatBDT(totalProjected)}
          </p>
          <p className="mt-2 text-[10px] text-amber-200/80 font-mono font-bold uppercase relative z-10">
            {language === 'bn' ? `${formatNumber(memberCount)} জন সদস্যের চাঁদা` : `${memberCount} Unit Contributions`}
          </p>
        </div>

        {/* Total Deposited/Collected */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#4a050b] to-[#250003] hover:from-[#5c0b12] hover:to-[#330106] p-5 border border-[#D4AF37]/30 shadow-md group hover:border-[#D4AF37]/65 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-sans">
              {language === 'bn' ? 'মোট সংগৃহীত চাঁদা' : 'Total Deposits'}
            </p>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#FFD700] font-sans leading-none relative z-10">
            {formatBDT(totalDeposits)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-amber-200/80 font-mono font-bold relative z-10">
            <span>{formatNumber(totalProjected ? Math.round((totalDeposits / totalProjected) * 100) : 0)}% {language === 'bn' ? 'আদায় সম্পন্ন' : 'Collected'}</span>
          </div>
        </div>

        {/* Expenses incurred */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#4a050b] to-[#250003] hover:from-[#5c0b12] hover:to-[#330106] p-5 border border-[#D4AF37]/30 shadow-md group hover:border-[#D4AF37]/65 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-sans">
              {language === 'bn' ? 'মোট নির্মাণ ব্যয়' : 'Total Expended'}
            </p>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#FFD700] font-sans leading-none relative z-10">
            {formatBDT(totalExpenses)}
          </p>
          <p className="mt-2 text-[10px] text-amber-200/80 font-mono font-bold uppercase relative z-10">
            {language === 'bn' ? 'সবগুলো ধাপ মিলিয়ে' : 'All construction phases'}
          </p>
        </div>

        {/* Total Outstanding Dues */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#4a050b] to-[#250003] hover:from-[#5c0b12] hover:to-[#330106] p-5 border border-[#D4AF37]/30 shadow-md group hover:border-[#D4AF37]/65 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-sans">
              {language === 'bn' ? 'অবশিষ্ট বকেয়া' : 'Outstanding Dues'}
            </p>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#FFD700] font-sans leading-none relative z-10">
            {formatBDT(totalDues)}
          </p>
          <p className="mt-2 text-[10px] text-amber-200/80 font-mono font-bold uppercase relative z-10">
            {language === 'bn' ? 'বকেয়া চাঁদা আদায়যোগ্য' : 'Due for collection'}
          </p>
        </div>

        {/* Available Structural balance */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#4a050b] to-[#250003] hover:from-[#5c0b12] hover:to-[#330106] p-5 border border-[#D4AF37]/30 shadow-md group hover:border-[#D4AF37]/65 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-xl group-hover:bg-[#D4AF37]/15 transition-all"></div>
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-sans">
              {language === 'bn' ? 'তহবিল উদ্বৃত্ত' : 'Available Fund'}
            </p>
            <div className="rounded-md p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-[#FFD700] font-sans leading-none relative z-10">
            {formatBDT(currentNetFund)}
          </p>
          <p className="mt-2 text-[10px] text-amber-200/80 font-mono font-bold uppercase relative z-10">
            {language === 'bn' ? 'ট্রেজারি নেট ব্যালেন্স' : 'Net cash in hand'}
          </p>
        </div>

      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Side: Phase Timeline Selector */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600 whitespace-nowrap" />
              <span>{language === 'bn' ? 'নির্মাণের প্রধান ধাপসমূহ' : 'Construction Work Phases'}</span>
            </h3>
            <span className="rounded-full bg-slate-200/70 border border-slate-300 px-2 py-0.5 text-[9px] font-bold font-mono text-slate-600">
              {formatNumber(constructionPhases.length)} PHASES
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {constructionPhases.map((phase) => {
              const op = selectedPhaseId === phase.id;
              
              // Phase calculations
              const pTarget = phase.subscriptionPerMember * memberCount;
              const pDeposited = phase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
              const pPercent = pTarget > 0 ? Math.round((pDeposited / pTarget) * 100) : 0;
              const pSpent = phase.expenses.reduce((sum, e) => sum + e.amount, 0);

              return (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={`w-full text-left p-4 transition-all duration-200 flex flex-col gap-2 hover:bg-slate-50/80 cursor-pointer ${
                    op ? 'bg-emerald-50/45 border-l-4 border-emerald-600' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="pr-2">
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                        {language === 'bn' ? phase.nameBn : phase.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {language === 'bn' 
                          ? `সদস্য চাঁদা: ${formatBDT(phase.subscriptionPerMember)}` 
                          : `Per Member: ${formatBDT(phase.subscriptionPerMember)}`}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold leading-none font-sans uppercase tracking-wider ${
                      (pDeposited >= pTarget || phase.status === 'Completed') 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60' 
                        : phase.status === 'In-Progress' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {(pDeposited >= pTarget || phase.status === 'Completed') 
                        ? (language === 'bn' ? 'সম্পন্ন' : 'Completed') 
                        : phase.status === 'In-Progress' 
                          ? (language === 'bn' ? 'চলমান' : 'In-Progress') 
                          : (language === 'bn' ? 'বকেয়া' : 'Pending')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full mt-1">
                    <div className="flex justify-between items-center text-[9px] font-semibold text-slate-500 font-mono mb-1">
                      <span>{language === 'bn' ? 'সংগ্রহ:' : 'Collected:'} {formatBDT(pDeposited)}</span>
                      <span>{formatNumber(pPercent)}%</span>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-350 ${
                          (pDeposited >= pTarget || phase.status === 'Completed') ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`} 
                        style={{ width: `${Math.min(100, pPercent)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 mt-0.5 pt-1.5 border-t border-dashed border-slate-100">
                    <span>{language === 'bn' ? 'ব্যয়:' : 'Spent:'} <strong className="text-rose-600 font-semibold">{formatBDT(pSpent)}</strong></span>
                    <span>{language === 'bn' ? `বকেয়া: ${formatBDT(pTarget - pDeposited)}` : `Due: ${formatBDT(pTarget - pDeposited)}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Primary Phase Management Interface */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Phase Header Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider font-mono">
                  {language === 'bn' ? 'ধাপের বিস্তারিত বিবরণ' : 'Phase Details & Actions'}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {language === 'bn' ? activePhase.nameBn : activePhase.nameEn}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold font-mono">
                  {language === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}
                </span>
                
                {isAdmin ? (
                  <select
                    value={(() => {
                      const activeTarget = activePhase.subscriptionPerMember * memberCount;
                      const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                      if (activeDeposited >= activeTarget) return 'Completed';
                      return activePhase.status;
                    })()}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none focus:border-emerald-600 shadow-sm transition-all duration-150 ${
                      (() => {
                        const activeTarget = activePhase.subscriptionPerMember * memberCount;
                        const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                        const isCompleted = activeDeposited >= activeTarget || activePhase.status === 'Completed';
                        return isCompleted 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : activePhase.status === 'In-Progress' 
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200';
                      })()
                    }`}
                  >
                    <option value="Pending">{language === 'bn' ? 'স্থগিত / পেন্ডিং' : 'Pending'}</option>
                    <option value="In-Progress">{language === 'bn' ? 'চলমান / ইন-প্রগ্রেস' : 'In-Progress'}</option>
                    <option value="Completed">{language === 'bn' ? 'সম্পন্ন / কমপ্লিটেড' : 'Completed'}</option>
                  </select>
                ) : (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    (() => {
                      const activeTarget = activePhase.subscriptionPerMember * memberCount;
                      const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                      const isCompleted = activeDeposited >= activeTarget || activePhase.status === 'Completed';
                      return isCompleted 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : activePhase.status === 'In-Progress' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-600';
                    })()
                  }`}>
                    {(() => {
                      const activeTarget = activePhase.subscriptionPerMember * memberCount;
                      const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                      const isCompleted = activeDeposited >= activeTarget || activePhase.status === 'Completed';
                      return isCompleted 
                        ? (language === 'bn' ? 'সম্পন্ন' : 'Completed') 
                        : activePhase.status === 'In-Progress' 
                          ? (language === 'bn' ? 'চলমান' : 'In-Progress') 
                          : (language === 'bn' ? 'স্থগিত' : 'Pending');
                    })()}
                  </span>
                )}
              </div>
            </div>

            {/* Sub Stats Dashboard */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-1">
              <div className="p-3 bg-gradient-to-br from-[#4a050b] to-[#250003] rounded-lg border border-[#D4AF37]/35 shadow-sm">
                <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider block">
                  {language === 'bn' ? 'ঘোষিত সদস্য চাঁদা' : 'Contribution Per Member'}
                </span>
                <p className="text-base font-black text-[#FFD700] font-sans mt-1">
                  {formatBDT(activePhase.subscriptionPerMember)}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSubAmount(activePhase.subscriptionPerMember);
                      setShowSubModal(true);
                    }}
                    className="text-[10px] font-black text-amber-200 hover:text-amber-350 hover:underline mt-1 cursor-pointer block text-left"
                  >
                    {language === 'bn' ? 'চাঁদা পরিবর্তন করুন' : 'Change Amount'}
                  </button>
                )}
              </div>

              <div className="p-3 bg-gradient-to-br from-[#4a050b] to-[#250003] rounded-lg border border-[#D4AF37]/35 shadow-sm">
                <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider block">
                  {language === 'bn' ? 'সর্বমোট লক্ষ্যমাত্রা' : 'Target Collections'}
                </span>
                <p className="text-base font-black text-[#FFD700] font-sans mt-1">
                  {formatBDT(phaseTotalTarget)}
                </p>
                <span className="text-[9px] text-amber-200/80 block font-mono">
                  {language === 'bn' ? `${formatNumber(memberCount)} জন সদস্য × ${formatBDT(activePhase.subscriptionPerMember)}` : `${memberCount} units × ${formatBDT(activePhase.subscriptionPerMember)}`}
                </span>
              </div>

              <div className="p-3 bg-gradient-to-br from-[#4a050b] to-[#250003] rounded-lg border border-[#D4AF37]/35 shadow-sm">
                <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider block">
                  {language === 'bn' ? 'আদায়কৃত চাঁদা' : 'Total Collected'}
                </span>
                <p className="text-base font-black text-[#FFD700] font-sans mt-1">
                  {formatBDT(phaseTotalDeposited)}
                </p>
                <span className="text-[9px] text-amber-200 block font-bold font-sans">
                  {language === 'bn' ? `অবশিষ্ট বকেয়া: ${formatBDT(phaseRemainingDue)}` : `Remaining Due: ${formatBDT(phaseRemainingDue)}`}
                </span>
              </div>

              <div className="p-3 bg-gradient-to-br from-[#4a050b] to-[#250003] rounded-lg border border-[#D4AF37]/35 shadow-sm">
                <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider block">
                  {language === 'bn' ? 'ধাপের ব্যয়' : 'Phase Expenditure'}
                </span>
                <p className="text-base font-black text-[#FFD700] font-sans mt-1">
                  {formatBDT(phaseTotalSpent)}
                </p>
                <span className="text-[9px] text-amber-200 block font-bold">
                  {language === 'bn' ? `ব্যালেন্স: ${formatBDT(phaseBalance)}` : `Treasury Bal: ${formatBDT(phaseBalance)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveSubTab('deposits')}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'deposits' 
                  ? 'border-emerald-600 text-emerald-800' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>{language === 'bn' ? 'সদস্যদের চাঁদা আদায়ের খতিয়ান' : 'Residents Contribution Ledger'}</span>
              <span className="rounded-full bg-slate-100 border px-2 py-0.5 text-[9px] font-bold font-mono">
                {formatNumber(memberCount)}
              </span>
            </button>
             <button
              onClick={() => setActiveSubTab('expenses')}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'expenses' 
                  ? 'border-emerald-600 text-emerald-800' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>{language === 'bn' ? 'নির্মাণ ব্যয় ও খরচ ভাউচার' : 'Material & Structural Expenses'}</span>
              <span className="rounded-full bg-slate-100 border px-2 py-0.5 text-[9px] font-bold font-sans">
                {formatNumber(activePhase.expenses.length)}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('ledger')}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'ledger' 
                  ? 'border-emerald-600 text-emerald-800' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>{language === 'bn' ? 'দৈনিক কাজের খতিয়ান' : 'Daily Labor & Purchase Ledger'}</span>
              <span className="rounded-full bg-slate-100 border px-2 py-0.5 text-[9px] font-bold font-sans">
                {formatNumber((activePhase.dailyLedger || []).length)}
              </span>
            </button>
          </div>

          {/* Main SubTab Content Panels */}
          {activeSubTab === 'deposits' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              
              {/* Collection Lists controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'ফ্ল্যাট বা সদস্যের নাম অনুসন্ধান...' : 'Search by flat number or resident name...'}
                      value={depositSearch}
                      onChange={(e) => setDepositSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-10 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 font-sans shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={startVoiceSearch}
                      title={language === 'bn' ? 'কণ্ঠস্বর দিয়ে সন্ধান করুন' : 'Voice Search'}
                      className={`absolute inset-y-1 right-1.5 px-2 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-50'
                      }`}
                    >
                      {isListening ? (
                        <Mic className="h-3.5 w-3.5 animate-bounce" />
                      ) : (
                        <Mic className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Filters and Add New */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Status filter button */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setDepositFilter('All')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'All' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'সব' : 'All'}
                    </button>
                    <button
                      onClick={() => setDepositFilter('Paid')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                    </button>
                    <button
                      onClick={() => setDepositFilter('Due')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'Due' ? 'bg-amber-50 text-amber-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'বকেয়া' : 'Due'}
                    </button>
                  </div>

                  {/* Member PDF Statement download button */}
                  <button
                    onClick={generateMemberDepositsPDF}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-3.5 py-1.8 text-xs font-bold cursor-pointer transition-all duration-150 shadow-sm"
                    type="button"
                  >
                    <FileDown className="h-4.5 w-4.5" />
                    <span>
                      {depositFilter === 'All' 
                        ? (language === 'bn' ? 'সব চাঁদা খতিয়ান ডাউনলোড (PDF)' : 'Download All Contributions (PDF)')
                        : depositFilter === 'Paid'
                        ? (language === 'bn' ? 'পরিশোধিত খতিয়ান ডাউনলোড (PDF)' : 'Download Paid List (PDF)')
                        : (language === 'bn' ? 'বকেয়া খতিয়ান ডাউনলোড (PDF)' : 'Download Arrears List (PDF)')
                      }
                    </span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => openAddDeposit()}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-[#D4AF37]/20 px-3.5 py-1.8 text-xs font-bold cursor-pointer text-white shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{language === 'bn' ? 'নতুন কিস্তি জমা যোগ করুন' : 'Collect New Instalment'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ledger Table listing 72 units */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-widest font-mono text-[10px] font-bold border-b border-slate-100">
                      <th className="py-3 px-4">{language === 'bn' ? 'ফ্ল্যাট নং' : 'Flat No'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'সদস্যের নাম' : 'Member Contributor'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'ধাপের পাওনা' : 'Required Share'}</th>
                      <th className="py-3 px-4 text-center">{language === 'bn' ? 'মোট সংগৃহীত' : 'Paid BDT'}</th>
                      <th className="py-3 px-4 text-right">{language === 'bn' ? 'অবশিষ্ট বকেয়া' : 'Pending Due'}</th>
                      <th className="py-3 px-4 text-center print:hidden">{language === 'bn' ? 'অবস্থা / রসিদ সংযোগ' : 'Receipt Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                          {language === 'bn' ? 'কোনো সদস্য জমা খতিয়ান রেকর্ড মেলেনি।' : 'No resident contributor logs matching search qualifiers found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((m) => (
                        <tr key={m.flatNo} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-extrabold text-slate-900 font-sans">{m.flatNo}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{m.ownerName}</td>
                          <td className="py-3 px-4 text-slate-500 font-bold font-sans">{formatBDT(m.required)}</td>
                          <td className="py-3 px-4 text-center font-extrabold text-slate-900 font-sans">
                            {formatBDT(m.paid)}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold font-sans">
                            {m.due > 0 ? (
                              <span className="text-amber-600 font-bold">{formatBDT(m.due)}</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center print:hidden">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              {m.deposits.length > 0 ? (
                                <div className="space-y-1">
                                  {m.deposits.map(dep => (
                                    <div key={dep.id} className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                      <span className="font-mono text-[9px] font-bold">
                                        {formatBDT(dep.amountPaid)} ({dep.payMethod})
                                      </span>
                                      <button 
                                        onClick={() => setActiveReceipt(dep)}
                                        className="text-emerald-600 hover:text-emerald-800 cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
                                        title={language === 'bn' ? 'মানি রশিদ প্রিন্ট' : 'Print Money Receipt'}
                                      >
                                        <Printer className="h-3 w-3" />
                                      </button>
                                      {isAdmin && (
                                        <div className="flex items-center gap-1 border-l border-slate-300 pl-1">
                                          <button 
                                            onClick={() => openEditDeposit(dep)}
                                            className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                            title="Edit Deposit"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteDeposit(dep.id)}
                                            className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                            title="Delete Invoice"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {isAdmin && m.due > 0 && (
                                    <button
                                      onClick={() => openAddDeposit(m.flatNo, m.ownerName)}
                                      className="text-[9px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center justify-center gap-0.5 hover:underline cursor-pointer"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                      <span>{language === 'bn' ? 'বাকি অংশ আদায়' : 'Collect Balance'}</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                isAdmin ? (
                                  <button
                                    onClick={() => openAddDeposit(m.flatNo, m.ownerName)}
                                    className="rounded bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 text-[10px] font-extrabold hover:bg-rose-100 cursor-pointer"
                                  >
                                    {language === 'bn' ? 'চাঁদা আদায় করুন' : 'Collect Fee'}
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-500 tracking-wider">
                                    {language === 'bn' ? 'পরিশোধহীন' : 'Unpaid'}
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : activeSubTab === 'expenses' ? (
            // Material Expenditures Tab
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'খরচের বিবরণ, ভাউচার বা সরবরাহকারী...' : 'Search by voucher, supplier or materials...'}
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 font-sans shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={generateVentureExpensesPDF}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-3.5 py-2 text-xs font-bold cursor-pointer transition-all duration-150 shadow-sm"
                    type="button"
                  >
                    <FileDown className="h-4.5 w-4.5" />
                    <span>{language === 'bn' ? 'ব্যয় খতিয়ান ডাউনলোড (PDF)' : 'Download Expenses PDF'}</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={openAddExpense}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-[#D4AF37]/20 px-4 py-2 text-xs font-bold cursor-pointer text-white shadow-sm"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      <span>{language === 'bn' ? 'নতুন খরচ ভাউচার যোগ করুন' : 'Record New Venture Expense'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Expenses table list */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-widest font-mono text-[10px] font-bold border-b border-slate-100">
                      <th className="py-3 px-4">{language === 'bn' ? 'তারিখ' : 'Voucher Date'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'ভাউচার নং' : 'Voucher ID'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'খরচের বিবরণ' : 'Description Header'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'সরবরাহকারী' : 'Contractor / Supplier'}</th>
                      <th className="py-3 px-4 text-right">{language === 'bn' ? 'খরচের পরিমাণ' : 'Paid amount'}</th>
                      <th className="py-3 px-4 text-center print:hidden">{language === 'bn' ? 'সম্পাদনা' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPhaseExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                          {language === 'bn' ? 'এই ধাপে এখনো কোনো ব্যয়ের বিবরণ নিবন্ধিত হয়নি।' : 'No material procurement vouchers recorded for this selected work phase.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPhaseExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-600 font-bold whitespace-nowrap font-sans">{exp.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">{exp.voucherNo}</td>
                          <td className="py-3 px-4">
                            <h5 className="font-extrabold text-slate-900 leading-tight">{exp.title}</h5>
                            {exp.description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{exp.description}</p>}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{exp.supplierName}</td>
                          <td className="py-3 px-4 text-right font-extrabold font-sans text-rose-600">
                            {formatBDT(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-center print:hidden">
                            {isAdmin ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditExpense(exp)}
                                  className="rounded border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 p-1 hover:border-slate-350 cursor-pointer"
                                  title="Edit Ledger Item"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="rounded border border-slate-200 bg-white hover:bg-slate-50 text-rose-600 p-1 hover:border-slate-350 cursor-pointer"
                                  title="Delete Ledger Item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredPhaseExpenses.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr className="font-bold text-slate-800">
                        <td className="py-3 px-4" colSpan={3}></td>
                        <td className="py-3 px-4 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          {language === 'bn' ? 'মোট ব্যয়ের পরিমাণ:' : 'Total Expenditure:'}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 text-sm font-extrabold whitespace-nowrap font-sans">
                          {formatBDT(filteredPhaseExpenses.reduce((sum, e) => sum + e.amount, 0))}
                        </td>
                        <td className="py-3 px-4 text-center print:hidden"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          ) : (
            // DAILY LEDGER OPTION PANEL
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              
              {/* Daily Ledger stats summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                <div className="p-4 rounded-xl bg-blue-50/55 border border-blue-100/40">
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট লেবার খরচ' : 'Total Labor Costs'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-blue-900">{formatBDT((activePhase.dailyLedger || []).filter(item => item.type === 'Labor').reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                    {language === 'bn' ? 'দৈনিক মজুরি, মিস্ত্রি ও সুপারভাইজার ফি' : 'Day wages, mason payouts, supervisor payouts'}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl bg-purple-50/55 border border-purple-100/40">
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট ম্যাটেরিয়াল ক্রয়' : 'Total Material Purchases'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-purple-900">{formatBDT((activePhase.dailyLedger || []).filter(item => item.type === 'Material').reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                    {language === 'bn' ? 'কংক্রিট, রড, বালু, সিমেন্ট ও সাইট সরঞ্জাম' : 'Sand, gravel, cement, local hardware purchases'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'দৈনিক খতিয়ান গ্র্যান্ড টোটাল' : 'Grand Total Daily Ledger'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-slate-900">{formatBDT((activePhase.dailyLedger || []).reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                    {language === 'bn' ? 'চলতি ধাপের মোট অন-সাইট দৈনন্দিন খরচ' : 'Cumulative on-site local expense records'}
                  </span>
                </div>
              </div>

              {/* Summary Dashboard Toggleable Section (Daily & Monthly) */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-4.5 space-y-3.5 print:hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>
                        {summaryMode === 'daily' 
                          ? (language === 'bn' ? 'তারিখ অনুযায়ী দৈনিক সংক্ষিপ্ত খতিয়ান' : 'Daily Summary Statistics') 
                          : (language === 'bn' ? 'মাস ভিত্তিক মাসিক সংক্ষিপ্ত খতিয়ান' : 'Monthly Summary Statistics')}
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {summaryMode === 'daily'
                        ? (language === 'bn' ? 'নির্দিষ্ট দিনের মোট পরিশোধিত খরচ, বকেয়া ও অন-সাইট শ্রমিক সংখ্যা দেখতে তারিখ পরিবর্তন করুন।' : 'Choose a ledger date to analyze active daily spend, pending payments, and labor count.')
                        : (language === 'bn' ? 'নির্দিষ্ট মাসের মোট পরিশোধিত খতিয়ান, বকেয়া বিবরণী ও মোট শ্রমিক কর্মদিবস বিশ্লেষণ করুন।' : 'Select a calendar month to evaluate monthly cumulative expenses, pending status, and worker metrics.')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Mode Toggle Switch */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
                      <button
                        type="button"
                        onClick={() => setSummaryMode('daily')}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold transition-all cursor-pointer ${
                          summaryMode === 'daily' 
                            ? 'bg-white text-emerald-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {language === 'bn' ? 'দৈনিক' : 'Daily'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryMode('monthly')}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold transition-all cursor-pointer ${
                          summaryMode === 'monthly' 
                            ? 'bg-white text-emerald-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {language === 'bn' ? 'মাসিক' : 'Monthly'}
                      </button>
                    </div>

                    {/* Date/Month pickers */}
                    <div className="flex items-center gap-1.5 min-w-[170px]">
                      {summaryMode === 'daily' ? (
                        <>
                          <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
                            {language === 'bn' ? 'তারিখ:' : 'Date:'}
                          </span>
                          <input
                            type="date"
                            value={selectedLedgerDate}
                            onChange={(e) => setSelectedLedgerDate(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-sm font-sans"
                          />
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
                            {language === 'bn' ? 'মাস নির্বাচন:' : 'Month:'}
                          </span>
                          <input
                            type="month"
                            value={selectedLedgerMonth}
                            onChange={(e) => setSelectedLedgerMonth(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-sm font-sans"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {summaryMode === 'daily' ? (() => {
                    const dailyEntries = (activePhase.dailyLedger || []).filter(item => item.date === selectedLedgerDate);
                    const spendTotal = dailyEntries
                      .filter(item => !item.status || item.status === 'Paid')
                      .reduce((sum, item) => sum + item.amount, 0);
                    const pendingTotal = dailyEntries
                      .filter(item => item.status === 'Pending')
                      .reduce((sum, item) => sum + item.amount, 0);
                    const laborSum = dailyEntries
                      .filter(item => item.type === 'Labor')
                      .reduce((sum, item) => {
                        if (item.laborCount !== undefined && item.laborCount > 0) {
                          return sum + item.laborCount;
                        }
                        if (item.qty) {
                          const match = item.qty.match(/\d+/);
                          if (match) {
                            const parsed = parseInt(match[0], 10);
                            if (!isNaN(parsed)) return sum + parsed;
                          }
                        }
                        return sum;
                      }, 0);

                    return (
                      <>
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all duration-200">
                          <div>
                            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                              {language === 'bn' ? 'দৈনিক মোট খরচ' : 'Total Daily Spend'}
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-extrabold text-emerald-950 font-sans">{formatBDT(spendTotal)}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                              {language === 'bn' ? `${selectedLedgerDate} তারিখে পরিশোধিত` : `Paid out on ${selectedLedgerDate}`}
                            </span>
                          </div>
                          <div className="text-emerald-600 bg-emerald-100/80 p-2.5 rounded-lg shrink-0">
                            <Coins className="h-5 w-5" />
                          </div>
                        </div>

                        {/* Pending Payments card */}
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all duration-200">
                          <div>
                            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                              {language === 'bn' ? 'বকেয়া পরিশোধের পরিমাণ' : 'Pending Payments'}
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-extrabold text-amber-950 font-sans">{formatBDT(pendingTotal)}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                              {language === 'bn' ? `${selectedLedgerDate} তারিখে বকেয়া বিল` : `Due/Unpaid on ${selectedLedgerDate}`}
                            </span>
                          </div>
                          <div className="text-amber-600 bg-amber-100/80 p-2.5 rounded-lg shrink-0">
                            <Clock className="h-5 w-5" />
                          </div>
                        </div>

                        {/* Labor Count card */}
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all duration-200">
                          <div>
                            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                              {language === 'bn' ? 'দৈনিক শ্রমিক সংখ্যা' : 'Labor Count'}
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-extrabold text-blue-950 font-sans">
                                {laborSum} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'জন' : 'worker(s)'}</span>
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                              {language === 'bn' ? `${selectedLedgerDate} তারিখে সাইটে উপস্থিত` : `Active laborers on ${selectedLedgerDate}`}
                            </span>
                          </div>
                          <div className="text-blue-600 bg-blue-100/80 p-2.5 rounded-lg shrink-0">
                            <Users className="h-5 w-5" />
                          </div>
                        </div>
                      </>
                    );
                  })() : (() => {
                    const monthlyEntries = (activePhase.dailyLedger || []).filter(item => 
                      item.date && item.date.startsWith(selectedLedgerMonth)
                    );
                    const spendTotalM = monthlyEntries
                      .filter(item => !item.status || item.status === 'Paid')
                      .reduce((sum, item) => sum + item.amount, 0);
                    const pendingTotalM = monthlyEntries
                      .filter(item => item.status === 'Pending')
                      .reduce((sum, item) => sum + item.amount, 0);
                    const laborSumM = monthlyEntries
                      .filter(item => item.type === 'Labor')
                      .reduce((sum, item) => {
                        if (item.laborCount !== undefined && item.laborCount > 0) {
                          return sum + item.laborCount;
                        }
                        if (item.qty) {
                          const match = item.qty.match(/\d+/);
                          if (match) {
                            const parsed = parseInt(match[0], 10);
                            if (!isNaN(parsed)) return sum + parsed;
                          }
                        }
                        return sum;
                      }, 0);

                    // Helper to get beautiful month name
                    const monthDisplay = () => {
                      try {
                        const [year, month] = selectedLedgerMonth.split('-');
                        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                        return dateObj.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
                      } catch {
                        return selectedLedgerMonth;
                      }
                    };

                    return (
                      <>
                        <div className="p-4 rounded-xl bg-teal-50 border border-teal-100/50 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all duration-200">
                          <div>
                            <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                              {language === 'bn' ? 'মাসিক মোট খরচ' : 'Total Monthly Spend'}
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-extrabold text-teal-950 font-sans">{formatBDT(spendTotalM)}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                              {language === 'bn' ? `${monthDisplay()} গুদামে পরিশোধিত` : `Paid in ${monthDisplay()}`}
                            </span>
                          </div>
                          <div className="text-teal-600 bg-teal-100/80 p-2.5 rounded-lg shrink-0">
                            <Coins className="h-5 w-5" />
                          </div>
                        </div>

                        {/* Pending Payments card */}
                        <div className="p-4 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all duration-200">
                          <div>
                            <span className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block">
                              {language === 'bn' ? 'মাসিক বকেয়া পরিমাণ' : 'Monthly Pending Payments'}
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-extrabold text-orange-950 font-sans">{formatBDT(pendingTotalM)}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                              {language === 'bn' ? `${monthDisplay()} মাসের মোট বকেয়া` : `Pending bills for ${monthDisplay()}`}
                            </span>
                          </div>
                          <div className="text-orange-600 bg-orange-100/80 p-2.5 rounded-lg shrink-0">
                            <Clock className="h-5 w-5" />
                          </div>
                        </div>

                        {/* Labor cumulative attendance card */}
                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all duration-200">
                          <div>
                            <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">
                              {language === 'bn' ? 'মাসিক লেবার হাজিরা' : 'Monthly Labor Strength'}
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-extrabold text-indigo-950 font-sans">
                                {laborSumM} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'ম্যান-ডে' : 'man-days'}</span>
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono italic block mt-0.5">
                              {language === 'bn' ? `${monthDisplay()}-এ সর্বমোট দৈনিক কর্মী` : `Cumulative on-site workers in ${monthDisplay()}`}
                            </span>
                          </div>
                          <div className="text-indigo-600 bg-indigo-100/80 p-2.5 rounded-lg shrink-0">
                            <Users className="h-5 w-5" />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'বিবরণ, ভাউচার নাম্বার বা প্রাপক অনুসন্ধান...' : 'Search details, voucher, or recipient...'}
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 font-sans shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Filter */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setLedgerTypeFilter('All')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        ledgerTypeFilter === 'All' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'সব' : 'All'}
                    </button>
                    <button
                      onClick={() => setLedgerTypeFilter('Labor')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        ledgerTypeFilter === 'Labor' ? 'bg-blue-50 text-blue-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'লেবার খরচ' : 'Labor'}
                    </button>
                    <button
                      onClick={() => setLedgerTypeFilter('Material')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        ledgerTypeFilter === 'Material' ? 'bg-purple-50 text-purple-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'মালপত্র' : 'Material'}
                    </button>
                  </div>

                  {summaryMode === 'monthly' ? (
                    <button
                      onClick={generateMonthlyLedgerPDF}
                      className="flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white border border-teal-700 px-4 py-2 text-xs font-bold cursor-pointer transition-all duration-150 shadow-sm"
                      type="button"
                    >
                      <FileDown className="h-4.5 w-4.5" />
                      <span>{language === 'bn' ? 'মাসিক রিপোর্ট ডাউনলোড (PDF)' : 'Download Monthly PDF'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={generateDailyLedgerPDF}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-4 py-2 text-xs font-bold cursor-pointer transition-all duration-150 shadow-sm"
                      type="button"
                    >
                      <FileDown className="h-4.5 w-4.5" />
                      <span>{language === 'bn' ? 'পিডিএফ রিপোর্ট ডাউনলোড' : 'Download Ledger PDF'}</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={openAddLedger}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-[#D4AF37]/20 px-4 py-2 text-xs font-bold cursor-pointer text-white shadow-sm"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      <span>{language === 'bn' ? 'নতুন দৈনিক এন্ট্রি যোগ করুন' : 'Record Daily Cost/Purchase'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-widest font-mono text-[10px] font-bold border-b border-slate-100">
                      <th className="py-3 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'প্রকার' : 'Type'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'খরচের বিবরণ' : 'Expense / Purchase Head'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'মজুর/সরবরাহকারী' : 'Paid to / Supplier'}</th>
                      <th className="py-3 px-4 text-center">{language === 'bn' ? 'দর ও পরিমাণ' : 'Unit Rate & Qty'}</th>
                      <th className="py-3 px-4 text-right">{language === 'bn' ? 'সর্বমোট পরিমাণ' : 'Total Amount'}</th>
                      <th className="py-3 px-4 text-center print:hidden">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const list = activePhase.dailyLedger || [];
                      const filtered = list.filter(item => {
                        const matchesSearch = 
                          (item.title || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          (item.supplierOrRecipient || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          (item.voucherNo || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          (item.notes || '').toLowerCase().includes(ledgerSearch.toLowerCase());
                        
                        const matchesType = ledgerTypeFilter === 'All' || item.type === ledgerTypeFilter;
                        
                        return matchesSearch && matchesType;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                              {language === 'bn' ? 'কোনো দৈনিক খতিয়ান এন্ট্রি খুঁজে পাওয়া যায়নি।' : 'No on-site daily labor or purchase entries recorded matching current criteria.'}
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((dl) => (
                        <tr key={dl.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-600 font-bold whitespace-nowrap font-sans">{dl.date}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                dl.type === 'Labor' 
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {dl.type === 'Labor' 
                                  ? (language === 'bn' ? 'লেবার মজুরি' : 'Labor Cost') 
                                  : (language === 'bn' ? 'মালপত্র ক্রয়' : 'Material')}
                              </span>
                              
                              {/* Status Badge */}
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                dl.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {dl.status === 'Pending'
                                  ? (language === 'bn' ? 'বকেয়া' : 'Pending')
                                  : (language === 'bn' ? 'পরিশোধিত' : 'Paid')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h5 className="font-extrabold text-slate-900 leading-tight">{dl.title}</h5>
                              {dl.voucherNo && (
                                <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-500 font-bold">
                                  #{dl.voucherNo}
                                </span>
                              )}
                              {dl.type === 'Labor' && dl.laborCount ? (
                                <span className="font-sans text-[9.5px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/50 font-bold inline-flex items-center gap-0.5">
                                  👷 {dl.laborCount} {language === 'bn' ? 'শ্রমিক' : 'Labor(s)'}
                                </span>
                              ) : null}
                            </div>
                            {dl.notes && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">{dl.notes}</p>}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{dl.supplierOrRecipient}</td>
                          <td className="py-3 px-4 text-center font-sans">
                            {dl.rate && dl.qty ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="font-bold text-slate-800">{formatBDT(dl.rate)}</span>
                                <span className="text-[9px] text-slate-500 font-mono">× {dl.qty}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold font-sans text-slate-900">
                            {formatBDT(dl.amount)}
                          </td>
                          <td className="py-3 px-4 text-center print:hidden">
                            {isAdmin ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditLedger(dl)}
                                  className="rounded border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 p-1 hover:border-slate-350 cursor-pointer"
                                  title="Edit Ledger Entry"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLedger(dl.id)}
                                  className="rounded border border-slate-200 bg-white hover:bg-slate-50 text-rose-600 p-1 hover:border-slate-350 cursor-pointer"
                                  title="Delete Ledger Entry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                  {(() => {
                    const list = activePhase.dailyLedger || [];
                    const filtered = list.filter(item => {
                      const matchesSearch = 
                        (item.title || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                        (item.supplierOrRecipient || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                        (item.voucherNo || '').toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                        (item.notes || '').toLowerCase().includes(ledgerSearch.toLowerCase());
                      const matchesType = ledgerTypeFilter === 'All' || item.type === ledgerTypeFilter;
                      return matchesSearch && matchesType;
                    });
                    if (filtered.length > 0) {
                      return (
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr className="font-bold text-slate-800">
                            <td className="py-3 px-4" colSpan={4}></td>
                            <td className="py-3 px-4 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                              {language === 'bn' ? 'মোট পরিমাণ:' : 'Filtered Sum:'}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-900 text-sm font-extrabold whitespace-nowrap font-sans">
                              {formatBDT(filtered.reduce((sum, e) => sum + e.amount, 0))}
                            </td>
                            <td className="py-3 px-4 text-center print:hidden"></td>
                          </tr>
                        </tfoot>
                      );
                    }
                  })()}
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* 1. Modal: Announced subscription per member */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h4 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'ধাপের নির্ধারিত চাঁদা ঘোষণা করুন' : 'Announce Phase Share Subscription'}
              </h4>
              <button 
                onClick={() => setShowSubModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAnnounceSubscription} className="p-5 space-y-4">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200/50 flex gap-2">
                <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                  {language === 'bn' 
                    ? 'এখানে ঘোষিত চাঁদাটি ৭২ জন সদস্যের প্রত্যেকের জন্য প্রযোজ্য হবে। নির্ধারিত চাঁদা পরিবর্তন করলে এই ধাপের মোট লক্ষ্যমাত্রা স্বয়ংক্রিয়ভাবে পুনঃহিসাব হবে।' 
                    : 'Setting this subscription amount instantly binds it across all 72 units. Changing this values recalculates targets dynamically.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {language === 'bn' ? 'সক্রিয় ধাপের নাম' : 'Current Active Phase'}
                </label>
                <p className="font-extrabold text-sm text-slate-900 bg-slate-50 border px-3 py-2 rounded-lg">
                  {language === 'bn' ? activePhase.nameBn : activePhase.nameEn}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'প্রতি সদস্যের চাঁদার পরিমাণ (৳)' : 'Subscription Amount per Member (BDT)'}
                </label>
                <input
                  type="number"
                  required
                  value={subAmount || ''}
                  onChange={(e) => setSubAmount(parseFloat(e.target.value) || 0)}
                  placeholder="যেমন: ৮০,০০০"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  {language === 'bn' ? 'চাঁদা ঘোষণা করুন' : 'Confirm Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Record Deposit Payment */}
      {showDepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h4 className="text-sm font-bold text-slate-800">
                {editingDeposit 
                  ? (language === 'bn' ? 'জমা কিস্তি বিবরণ সংশোধন' : 'Adjust Contribution Deposit') 
                  : (language === 'bn' ? 'নতুন কিস্তি জমা যোগ করুন' : 'Record Member Instalment Deposit')}
              </h4>
              <button 
                onClick={() => setShowDepModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleDepositSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Flat selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ফ্ল্যাট নম্বর নির্বাচন' : 'Target Unit Flat No.'}
                  </label>
                  {editingDeposit ? (
                    <p className="font-extrabold text-xs text-slate-900 bg-slate-100 px-3 py-2 rounded-lg border border-slate-150">
                      {depFlat}
                    </p>
                  ) : (
                    <select
                      value={depFlat}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDepFlat(val);
                        const matchedFlat = flats.find(f => f.number === val);
                        if (matchedFlat && matchedFlat.ownerName && matchedFlat.ownerName !== 'Unassigned') {
                          setDepMember(matchedFlat.ownerName);
                        } else {
                          setDepMember(`Member Owner ${val}`);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                    >
                      {standardFlats.map(f => (
                        <option key={f.number} value={f.number}>
                          {language === 'bn' ? `ফ্ল্যাট ${f.number} (${f.ownerName || 'Unassigned'})` : `Flat ${f.number} (${f.ownerName || 'Owner'})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Member/Owner name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'সদস্যের নাম' : 'Member Contributor Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={depMember}
                    onChange={(e) => setDepMember(e.target.value)}
                    placeholder="সদস্যের পুরো নাম"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'জমা দেওয়ার পরিমাণ (৳)' : 'Deposited amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={depAmount}
                    onChange={(e) => setDepAmount(parseFloat(e.target.value) || 0)}
                    placeholder="যেমন: ৮০,০০০"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Deposit Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'অর্থ পরিশোধের তারিখ' : 'Payment Clearance Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={depDate}
                    onChange={(e) => setDepDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'লেনদেনের মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={depMethod}
                    onChange={(e) => setDepMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  >
                    <option value="Cash">{language === 'bn' ? 'ক্যাশ / নগদ অর্থ' : 'Cash'}</option>
                    <option value="Bank">{language === 'bn' ? 'ব্যাংক লেনদেন' : 'Bank Transfer'}</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>

                {/* Money receipt no */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'রসিদ / মানি রিসিট নং' : 'Money Receipt ID'}
                  </label>
                  <input
                    type="text"
                    value={depReceipt}
                    onChange={(e) => setDepReceipt(e.target.value)}
                    placeholder="যেমন: REC-204"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Bank / mobile transaction id */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ব্যাংক চালানি / TrxID (ঐচ্ছিক)' : 'Bank Draft / TrxID (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={depTrx}
                    onChange={(e) => setDepTrx(e.target.value)}
                    placeholder="যেমন: BK539050X1"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'অতিরিক্ত মন্তব্য (ঐচ্ছিক)' : 'Ledger Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={depNotes}
                    onChange={(e) => setDepNotes(e.target.value)}
                    placeholder="যেমন: ১ম কিস্তি পরিশোধ"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDepModal(false)}
                  className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  {editingDeposit ? (language === 'bn' ? 'সংশোধন চূড়ান্ত করুন' : 'Apply Adjustments') : (language === 'bn' ? 'জমা রশিদ তৈরি করুন' : 'Approve Settlement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Record Expense Invoice */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h4 className="text-sm font-bold text-slate-800">
                {editingExpense 
                  ? (language === 'bn' ? 'নির্মাণ ব্যয় চালান সংশোধন' : 'Adjust Construction Invoice') 
                  : (language === 'bn' ? 'নতুন খরচ ভাউচার যোগ করুন' : 'Journal Construction Expense Voucher')}
              </h4>
              <button 
                onClick={() => setShowExpModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'খরচের প্রধান খাত / বিবরণ' : 'Expense Category Description'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="যেমন: ৫০ টন রড ক্রয় (বিএসআরএম)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'খরচের পরিমাণ (৳)' : 'Expense Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    placeholder="যেমন: ৪৫,০০,০০০"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ভাউচারের তারিখ' : 'Invoice Clearance Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Voucher number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ভাউচার / সবুজ রশিদ নম্বর' : 'Voucher Receipt No.'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expVoucher}
                    onChange={(e) => setExpVoucher(e.target.value)}
                    placeholder="যেমন: VOUCH-405"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Supplier name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'সরবরাহকারী বা প্রতিষ্ঠানের নাম' : 'Contractor / Supplier'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    placeholder="যেমন: মেসার্স আবুল স্টীল কো."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'অতিরিক্ত বর্ণনা' : 'Detailed Narrative'}
                  </label>
                  <textarea
                    rows={2}
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="কাজের বিস্তারিত বিবরণ বা উপকরণের গুণমান..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  {editingExpense ? (language === 'bn' ? 'খরচ সংশোধন নিশ্চিত করুন' : 'Confirm Amendment') : (language === 'bn' ? 'ভাউচার হিসাবভুক্ত করুন' : 'Post Voucher Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Record/Register Daily Ledger Entry */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h4 className="text-sm font-bold text-slate-800">
                {editingLedger 
                  ? (language === 'bn' ? 'দৈনিক কাজের খতিয়ান সংশোধন' : 'Edit Daily Ledger Entry') 
                  : (language === 'bn' ? 'নতুন দৈনিক কাজের হিসাব রেকর্ড করুন' : 'Record Daily Cost/Purchase')}
              </h4>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleLedgerSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Entry Type */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {language === 'bn' ? 'হিসাবের ধরণ' : 'Ledger Category Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDlType('Labor')}
                      className={`py-2 px-4 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        dlType === 'Labor' 
                          ? 'bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-600/20' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      <span>{language === 'bn' ? 'লেবার খরচ' : 'Labor & Wages'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDlType('Material')}
                      className={`py-2 px-4 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        dlType === 'Material' 
                          ? 'bg-purple-50 border-purple-600 text-purple-800 ring-2 ring-purple-600/20' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                      <span>{language === 'bn' ? 'মালপত্র ক্রয়' : 'Material Purchases'}</span>
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={dlDate}
                    onChange={(e) => setDlDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Voucher number (optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ভাউচার / মেমো নং (ঐচ্ছিক)' : 'Voucher / Memo No (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={dlVoucherNo}
                    onChange={(e) => setDlVoucherNo(e.target.value)}
                    placeholder="যেমন: MEMO-112"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'খরচের বিবরণ' : 'Description / Entry Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={dlTitle}
                    onChange={(e) => setDlTitle(e.target.value)}
                    placeholder={dlType === 'Labor' ? "যেমন: দিনমজুর ও রাজমিস্ত্রীর দৈনিক হাজিরা" : "যেমন: ৩০০০ পিস লাল ইট ক্রয়"}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Supplier or Paid to */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {dlType === 'Labor' 
                      ? (language === 'bn' ? 'কাকে প্রদান করা হয়েছে (মিস্ত্রি / ঠিকাদার)' : 'Paid to (Contractor / Mason)')
                      : (language === 'bn' ? 'সরবরাহকারী / প্রতিষ্ঠানের নাম' : 'Supplier Business Name / Dealer')}
                  </label>
                  <input
                    type="text"
                    required
                    value={dlSupplierOrRecipient}
                    onChange={(e) => setDlSupplierOrRecipient(e.target.value)}
                    placeholder={dlType === 'Labor' ? "যেমন: হেলাল মিস্ত্রী (প্রধান রাজমিস্ত্রী)" : "যেমন: মেসার্স ভাই ভাই ব্রিকস"}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Unit Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'একক দর (৳) (ঐচ্ছিক)' : 'Unit Rate (BDT) (Optional)'}
                  </label>
                  <input
                    type="number"
                    value={dlRate || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDlRate(val);
                      const parsedQty = parseFloat(dlQty);
                      if (!isNaN(parsedQty) && val > 0) {
                        setDlAmount(parsedQty * val);
                      }
                    }}
                    placeholder="যেমন: ৮৫০"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'পরিমাণ (ঐচ্ছিক)' : 'Quantity / Vol (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={dlQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDlQty(val);
                      const parsedQty = parseFloat(val);
                      if (!isNaN(parsedQty) && dlRate > 0) {
                        setDlAmount(parsedQty * dlRate);
                      }
                    }}
                    placeholder={dlType === 'Labor' ? "যেমন: ১২ জন" : "যেমন: ১০০ বস্তা"}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Amount */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'মোট খরচের পরিমাণ (৳)' : 'Total Cost Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={dlAmount || ''}
                    onChange={(e) => setDlAmount(parseFloat(e.target.value) || 0)}
                    placeholder="যেমন: ১০,২০০"
                    className="w-full rounded-lg border border-slate-300 bg-emerald-50/20 px-3 py-2.5 text-xs font-extrabold text-emerald-950 outline-none focus:border-emerald-600 shadow-sm"
                  />
                  {dlRate > 0 && parseFloat(dlQty) > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1 font-sans">
                      {language === 'bn' 
                        ? `হিসাব: ${parseFloat(dlQty)} × ${dlRate} = ৳ ${(parseFloat(dlQty) * dlRate).toLocaleString()}` 
                        : `Auto-calc: ${parseFloat(dlQty)} × BDT ${dlRate} = BDT ${(parseFloat(dlQty) * dlRate).toLocaleString()}`}
                    </span>
                  )}
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'পরিশোধের অবস্থা' : 'Payment Status'}
                  </label>
                  <select
                    value={dlStatus}
                    onChange={(e) => setDlStatus(e.target.value as 'Paid' | 'Pending')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  >
                    <option value="Paid">{language === 'bn' ? 'পরিশোধিত (Paid)' : 'Paid'}</option>
                    <option value="Pending">{language === 'bn' ? 'বকেয়া (Pending)' : 'Pending'}</option>
                  </select>
                </div>

                {/* Labor Count (conditional) */}
                {dlType === 'Labor' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'শ্রমিক সংখ্যা (ঐচ্ছিক)' : 'Labor Count (Optional)'}
                    </label>
                    <input
                      type="number"
                      value={dlLaborCount || ''}
                      onChange={(e) => setDlLaborCount(parseInt(e.target.value) || 0)}
                      placeholder={language === 'bn' ? "যেমন: দিনমজুরের সংখ্যা" : "e.g. 5, 12, etc."}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                ) : (
                  <div>
                    {/* Placeholder to keep alignment */}
                    <div className="h-full"></div>
                  </div>
                )}

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'মন্তব্য (ঐচ্ছিক)' : 'Memo Notes (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={dlNotes}
                    onChange={(e) => setDlNotes(e.target.value)}
                    placeholder={language === 'bn' ? "কোনো বিশেষ দ্রষ্টব্য..." : "Any special instruction or material grade note..."}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer border border-[#D4AF37]/20"
                >
                  {editingLedger 
                    ? (language === 'bn' ? 'সংশোধন নিশ্চিত করুন' : 'Update Record') 
                    : (language === 'bn' ? 'হিসাবভুক্ত করুন' : 'Post into Ledger')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED CONSTRUCTION MONEY RECEIPT MODAL (PRINT READY PREVIEW) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/30 bg-[#0c0a09] p-6 shadow-2xl relative block font-sans space-y-6 max-h-[95vh] overflow-y-auto print:border-0 print:shadow-none print:w-full print:max-w-none print:p-0">
            
            {/* Modal Header & Controls (Hidden during print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950 pb-4 print:hidden">
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-widest uppercase font-sans flex items-center gap-1.5 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {language === 'bn' ? 'নির্মাণ তহবিল জমা রশিদ' : 'Construction Deposit Receipt'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {language === 'bn' ? 'অফিসিয়াল ক্যাশ রসিদ খতিয়ান' : 'Official Building Fund Receipt'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded px-3 py-1.5 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all duration-200 shadow-md transform active:scale-95"
                >
                  <Printer className="h-4 w-4" />
                  <span>{language === 'bn' ? 'প্রিন্ট করুন' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReceiptPDF}
                  disabled={isGeneratingPDF}
                  className="rounded px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/30 hover:text-white flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span>{isGeneratingPDF ? (language === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...') : (language === 'bn' ? 'পিডিএফ' : 'PDF')}</span>
                </button>
                <button 
                  onClick={() => setActiveReceipt(null)} 
                  className="rounded p-1.5 text-slate-400 hover:bg-neutral-800 hover:text-white transition-all duration-200"
                  title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Money Receipt Layout starts here */}
            <div id="printable-construction-receipt" className="space-y-6 border border-emerald-950/40 bg-neutral-950 p-6 rounded-lg text-slate-300">
              
              {/* Receipt Header Seal */}
              <div className="flex justify-between items-start border-b border-emerald-950 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-emerald-700 border border-[#D4AF37]/40">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">{config?.name || 'Astha Twin Towers'}</h2>
                    <span className="text-[9px] text-[#D4AF37] tracking-widest block font-mono">CONSTRUCTION CAPITAL REGISTER</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase font-bold text-slate-500 font-mono">Receipt Reference</span>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    {activeReceipt.receiptNo || `#REC-CS-${activeReceipt.id.substring(activeReceipt.id.length - 4).toUpperCase()}`}
                  </span>
                </div>
              </div>

              {/* Sub-Header address meta */}
              <div className="text-[10px] text-slate-500 font-mono leading-relaxed space-y-0.5">
                <p>Location: {config?.address || 'Dhaka, Bangladesh'}</p>
                <p>Contact: {config?.contactNo || '01XXXXXXXXX'} • Email: {config?.email || 'admin@asthatwintowers.com'}</p>
                <p>Deposit Clear Date: {activeReceipt.payDate || new Date().toISOString().split('T')[0]}</p>
              </div>

              {/* Central ledger details */}
              <div className="border border-emerald-950 rounded-lg p-3 bg-neutral-900/60 text-xs gap-3 space-y-2">
                <div className="flex justify-between border-b border-emerald-950/50 pb-1.5">
                  <span className="font-mono text-slate-500">{language === 'bn' ? 'সদস্যের নাম:' : 'MEMBER/CONTRIBUTOR:'}</span>
                  <span className="font-bold text-white text-right">{activeReceipt.memberName}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-950/50 pb-1.5">
                  <span className="font-mono text-slate-500">{language === 'bn' ? 'ফ্ল্যাট নম্বর:' : 'FLAT UNIT:'}</span>
                  <span className="font-bold text-[#D4AF37] font-mono">Flat {activeReceipt.flatNumber}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-950/50 pb-1.5">
                  <span className="font-mono text-slate-500">{language === 'bn' ? 'নির্মাণ ধাপ:' : 'CONSTRUCTION PHASE:'}</span>
                  <span className="font-bold text-slate-200 font-sans">
                    {language === 'bn' ? activePhase?.nameBn : activePhase?.nameEn}
                  </span>
                </div>
                <div className="flex justify-between font-sans">
                  <span className="font-mono text-slate-500">{language === 'bn' ? 'হিসাবখাত:' : 'FUNDS ACCOUNT:'}</span>
                  <span className="font-bold text-emerald-400">
                    {language === 'bn' ? 'বিল্ডিং প্ল্যান ও নির্মাণ তহবিল' : 'Structural Venture Fund'}
                  </span>
                </div>
              </div>

              {/* Financial columns */}
              <div className="space-y-2 border-t border-emerald-950 pt-4">
                <div className="flex justify-between items-baseline text-xs font-sans">
                  <span className="text-slate-400">{language === 'bn' ? 'পরিশোধিত অর্থের পরিমাণ:' : 'Amount Received BDT:'}</span>
                  <span className="font-extrabold text-emerald-400 font-sans text-sm">{formatBDT(activeReceipt.amountPaid)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">{language === 'bn' ? 'পরিশোধের মাধ্যম:' : 'Payment Channel:'}</span>
                  <span className="font-bold text-slate-200 font-mono">{activeReceipt.payMethod}</span>
                </div>
                {activeReceipt.transactionId && (
                  <div className="flex justify-between items-baseline text-xs text-slate-400 font-mono">
                    <span>{language === 'bn' ? 'লেনদেন আইডি (TrxID):' : 'Transaction Gateway ID:'}</span>
                    <span className="text-[#D4AF37] font-bold">{activeReceipt.transactionId}</span>
                  </div>
                )}
                {activeReceipt.notes && (
                  <div className="flex justify-between items-baseline text-xs text-slate-400 font-mono pt-1">
                    <span>{language === 'bn' ? 'মন্তব্য/নোট:' : 'Ledger Remarks:'}</span>
                    <span className="text-slate-300 italic">{activeReceipt.notes}</span>
                  </div>
                )}
                
                {/* Net payment badge block status */}
                <div className="flex justify-between items-center text-xs pt-3.5 border-t border-emerald-950/40 font-mono">
                  <span>METRIC RECEIVED STATUS:</span>
                  <span className="font-black tracking-widest text-emerald-500">
                    [ RECEIVED & CLEAR ]
                  </span>
                </div>
              </div>

              {/* Seal Footer */}
              <div className="flex justify-between items-center pt-8 text-[9px] font-mono text-slate-500 border-t border-emerald-950/20">
                <div className="text-center w-24">
                  <div className="border-b border-emerald-900 pb-1 mb-1" />
                  <span>PREPARED BY</span>
                </div>
                <p className="text-center text-[8px] uppercase">{language === 'bn' ? 'ডিজিটাল রশিদ খতিয়ান রেকর্ড' : 'DIGITALLY GENERATED LEDGER RECORD'}</p>
                <div className="text-center w-24">
                  <div className="border-b border-emerald-900 pb-1 mb-1" />
                  <span>AUTHORISED SEAL</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
