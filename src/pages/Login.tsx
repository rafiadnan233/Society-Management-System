/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import building3dImg from '../assets/images/building_3d_view_1780387092893.png';
import constructionImg from '../assets/images/construction_progress_1780387114013.png';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Notice } from '../types';
import { 
  Shield, 
  Key, 
  Mail, 
  Building, 
  UserCheck, 
  AlertCircle, 
  Sparkles, 
  Megaphone, 
  Award, 
  Users, 
  Camera, 
  Calendar, 
  Globe, 
  Info, 
  CheckCircle,
  FileText,
  Settings,
  Plus,
  X,
  Upload,
  BookOpen,
  CreditCard,
  UserPlus,
  Video,
  Play,
  Tv,
  Search,
  Trash2,
  Edit2
} from 'lucide-react';

interface ProjectVideo {
  id: string;
  title: string;
  description: string;
  projectName: string;
  category: string;
  youtubeUrl: string;
  facebookUrl: string;
  thumbnail: string;
  uploadDate: any; 
  createdBy: string;
  isFeatured?: boolean;
}

const PRESET_THUMBNAILS = [
  { url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80', label: 'Construction Structure' },
  { url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80', label: 'Concrete & Steel Work' },
  { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80', label: 'Modern Highrise Glass' },
  { url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80', label: 'Video Production Media' },
  { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80', label: 'Community Events Meeting' }
];

const CATEGORIES = [
  'Construction Progress',
  'Architectural Tour',
  'Security Briefing',
  'Society Events',
  'General Complex'
];

interface LoginProps {
  onRegisterClick: () => void;
}

export default function Login({ onRegisterClick }: LoginProps) {
  const { 
    login, 
    loginWithGoogle,
    resetPassword,
    userAccounts,
    updateUserPassword,
    language, 
    setLanguage, 
    notices, 
    config, 
    updateConfig, 
    addNotice, 
    updateNotice, 
    deleteNotice 
  } = useSociety();
  const t = translations[language];

  // Admin Live Customization Mode States
  const [adminEditorActive, setAdminEditorActive] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  // Customization Modals States
  const [show3dModal, setShow3dModal] = useState(false);
  const [showConstructionModal, setShowConstructionModal] = useState(false);
  
  // Leadership State Dialogs
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<any | null>(null);
  
  // Notices Dialogs (Dynamic Notices Add/Edit on login page)
  const [showLoginNoticeModal, setShowLoginNoticeModal] = useState(false);
  const [editingLoginNotice, setEditingLoginNotice] = useState<Notice | null>(null);

  // Form Fields State: 3D Render
  const [valBuilding3dImg, setValBuilding3dImg] = useState('');
  const [valBuilding3dImages, setValBuilding3dImages] = useState<string[]>([]);
  const [valBuilding3dNewUrl, setValBuilding3dNewUrl] = useState('');
  const [valBuilding3dTitleEn, setValBuilding3dTitleEn] = useState('');
  const [valBuilding3dTitleBn, setValBuilding3dTitleBn] = useState('');
  const [valBuilding3dDescEn, setValBuilding3dDescEn] = useState('');
  const [valBuilding3dDescBn, setValBuilding3dDescBn] = useState('');
  const [currentSlide3d, setCurrentSlide3d] = useState(0);

  // Slideshow Logic for 3D Render Gallery
  const parsed3dImages = React.useMemo(() => {
    try {
      if (config.building3dImagesJson) {
        const arr = JSON.parse(config.building3dImagesJson);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr;
        }
      }
    } catch (e) {
      console.error("Error parsing building3dImagesJson:", e);
    }
    return [config.building3dImg || building3dImg];
  }, [config.building3dImagesJson, config.building3dImg]);

  useEffect(() => {
    if (parsed3dImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide3d(prev => (prev + 1) % parsed3dImages.length);
    }, 6000); // changes every 6s to sync seamlessly with the kenburnsZoom duration
    return () => clearInterval(interval);
  }, [parsed3dImages]);

  // Slideshow Logic for Construction Logs Gallery
  const parsedConstructionImages = React.useMemo(() => {
    try {
      if (config.constructionImagesJson) {
        const arr = JSON.parse(config.constructionImagesJson);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr;
        }
      }
    } catch (e) {
      console.error("Error parsing constructionImagesJson:", e);
    }
    return [config.constructionImg || constructionImg];
  }, [config.constructionImagesJson, config.constructionImg]);

  useEffect(() => {
    if (parsedConstructionImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideConstruction(prev => (prev + 1) % parsedConstructionImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [parsedConstructionImages]);

  // Form Fields State: Construction Progress
  const [valConstructionImg, setValConstructionImg] = useState('');
  const [valConstructionImages, setValConstructionImages] = useState<string[]>([]);
  const [valConstructionNewUrl, setValConstructionNewUrl] = useState('');
  const [currentSlideConstruction, setCurrentSlideConstruction] = useState(0);
  const [valConstructionPercent, setValConstructionPercent] = useState(85);
  const [valConstructionDescEn, setValConstructionDescEn] = useState('');
  const [valConstructionDescBn, setValConstructionDescBn] = useState('');
  const [constructionProcessingCount, setConstructionProcessingCount] = useState(0);

  // Form Fields State: Leadership Card
  const [leaderInitials, setLeaderInitials] = useState('');
  const [leaderNameEn, setLeaderNameEn] = useState('');
  const [leaderNameBn, setLeaderNameBn] = useState('');
  const [leaderRoleEn, setLeaderRoleEn] = useState('');
  const [leaderRoleBn, setLeaderRoleBn] = useState('');
  const [leaderMsgEn, setLeaderMsgEn] = useState('');
  const [leaderMsgBn, setLeaderMsgBn] = useState('');

  const [leaderPhoto, setLeaderPhoto] = useState('');

  // Form Fields State: Quick Notice Write on login page
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<Notice['type']>('Announcement');
  const [noticeImage, setNoticeImage] = useState('');

  // Helper for Uploading from Local Drive with Client-side Canvas Compression
  // Compresses any large camera photos down to optimized JPEG representation (~40KB - 80KB)
  // This fully prevents Firestore 1MB document limitations and stops saving failures/reverts.
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High quality scale down to maximum 1024px width/height maintaining design details
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress JPEG quality to 65% which looks crisp but weighs only 30KB - 80KB
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          callback(compressedBase64);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Helper to generate and download a robust, high-fidelity offline printable HTML brochure
  // This completely circumvents iframe printing restrictions and provides an extraordinarily
  // professional corporate booklet containing all modules of the Astha Twin Towers Application.
  const handleDownloadBrochureHtml = () => {
    setShowBrochureToast(true);
    setTimeout(() => {
      setShowBrochureToast(false);
    }, 7000);

    const brochureTitle = language === 'bn' 
      ? 'আস্থা টুইন টাওয়ার্স - রাজকীয় আবাসন গাইডবুক ও ডিজিটাল ম্যানুয়াল' 
      : 'Astha Twin Towers - Royal Architectural Legacy & Smart Directory';

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });

    // Generate high-fidelity image grid HTML from all uploaded 3D slides
    const galleryHtml = parsed3dImages.map((imgUrl, index) => `
      <div class="gallery-card">
        <div class="gallery-photo-wrapper">
          <img src="${imgUrl}" alt="Architecture Render ${index + 1}" class="gallery-photo" />
        </div>
        <div class="gallery-caption">
          <strong>Exhibit ${index + 1}:</strong> ${
            language === 'bn' 
              ? `আস্থা টুইন টাওয়ার্স প্রজেক্টের প্রস্তাবিত স্থাপত্য চিত্র ${index + 1}` 
              : `Official architectural rendering model showcase, figure ${index + 1}`
          }
        </div>
      </div>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brochureTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,650;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0b221a;
      --secondary: #123524;
      --accent: #926a27;
      --tan: #ebd9b4;
      --vellum: #fdfbf7;
      --dark-text: #1d2925;
      --light-text: #f1ebd9;
      --gold-border: #d4af37;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Hind Siliguri', 'Inter', sans-serif;
      background-color: #0b110e;
      color: #faf6eb;
      line-height: 1.6;
      padding: 30px 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    /* Professional Floating Reader Console */
    .reader-console {
      width: 100%;
      max-width: 950px;
      background: linear-gradient(145deg, #0b221a 0%, #163a2b 100%);
      border: 2px solid var(--accent);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 30px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.6);
    }
    
    @media (min-width: 640px) {
      .reader-console {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .console-text h2 {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }

    .console-text p {
      font-size: 11.5px;
      color: #a3bfb2;
    }

    .console-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .btn-action {
      background: linear-gradient(to bottom, #d4af37, #af8d23);
      color: #0b221a;
      border: 1px solid #ffe89d;
      padding: 10px 18px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 5x 15px rgba(212, 175, 55, 0.35);
    }

    .btn-action:hover {
      background: #ffffff;
      color: #0b221a;
      border-color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255,255,255,0.4);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.06);
      color: #f1ebd9;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 10px 18px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary:hover {
      background: rgba(255,255,255,0.15);
    }

    /* THE ROYAL BOOKLET SHEETS */
    .booklet-container {
      background-color: var(--vellum);
      color: var(--dark-text);
      width: 100%;
      max-width: 950px;
      border-radius: 4px;
      box-shadow: 0 35px 80px rgba(0,0,0,0.8), inset 0 0 40px rgba(84, 61, 23, 0.08);
      position: relative;
      border: 1px solid #e1d8c1;
    }

    .page-break {
      page-break-after: always;
      position: relative;
      padding: 70px 85px;
      min-height: 1080px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      background-color: var(--vellum);
    }

    /* Double-line premium royal border wrapping around the text block */
    .book-frame-overlay {
      position: absolute;
      top: 30px;
      bottom: 30px;
      left: 30px;
      right: 30px;
      border: 1px solid rgba(146, 106, 39, 0.25);
      pointer-events: none;
      z-index: 5;
    }
    
    .book-frame-overlay::before {
      content: "";
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 4px;
      right: 4px;
      border: 2.5px double var(--accent);
    }

    /* Ornaments on corner of the pages */
    .corner-ornament {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--accent);
      z-index: 10;
    }
    .ornament-tl { top: 38px; left: 38px; border-right: none; border-bottom: none; }
    .ornament-tr { top: 38px; right: 38px; border-left: none; border-bottom: none; }
    .ornament-bl { bottom: 38px; left: 38px; border-right: none; border-top: none; }
    .ornament-br { bottom: 38px; right: 38px; border-left: none; border-top: none; }

    /* RUNNING BOOK HEADERS AND FOOTERS */
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--accent);
      padding-bottom: 10px;
      margin-bottom: 40px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent);
      font-family: 'Inter', sans-serif;
    }

    .running-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(146, 106, 39, 0.2);
      padding-top: 12px;
      margin-top: 40px;
      font-size: 11px;
      font-family: monospace;
      color: #64748b;
    }

    .page-number {
      font-size: 12px;
      font-weight: 850;
      color: var(--accent);
      background: #fdf2d6;
      border: 1px solid var(--accent);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: monospace;
    }

    /* COVER BLOCK STYLE (CHAPTER 1 - MASTER JACKET) */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      height: 1080px;
      padding: 90px 70px;
      text-align: center;
    }

    .spine-crest {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      margin-top: 20px;
    }

    .crest-icon {
      width: 90px;
      height: 90px;
      border: 3.5px double var(--accent);
      background-color: var(--primary);
      border-radius: 50%;
      color: var(--gold-border);
      font-weight: 900;
      font-size: 26px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8px 25px rgba(11, 34, 26, 0.25);
      font-family: 'Playfair Display', serif;
      letter-spacing: 1px;
    }

    .crest-subtitle {
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 4px;
      color: var(--accent);
      font-weight: 800;
      font-family: 'Inter', sans-serif;
    }

    .cover-midsection {
      width: 100%;
      max-width: 680px;
      margin: 50px 0;
    }

    .cover-midsection .badge {
      display: inline-block;
      border: 1px solid var(--accent);
      background-color: rgba(146, 106, 39, 0.08);
      color: var(--accent);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 3px;
      padding: 8px 22px;
      border-radius: 4px;
      margin-bottom: 30px;
    }

    .cover-title {
      font-family: 'Playfair Display', serif;
      font-size: 40px;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.25;
      margin-bottom: 24px;
    }

    .cover-subtitle {
      font-size: 15.5px;
      color: #3f5e52;
      font-weight: 500;
      line-height: 1.7;
      max-width: 580px;
      margin: 0 auto;
    }

    .cover-graphic-holder {
      margin-top: 45px;
      background: #ffffff;
      border: 1px solid #e5dec9;
      padding: 4px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(84, 61, 23, 0.06);
      overflow: hidden;
      aspect-ratio: 16/8;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cover-graphic-holder img {
      width: 100%;
      height: 100%;
      object-cover: cover;
    }

    .spine-bottom {
      border-top: 1px solid rgba(146, 106, 39, 0.18);
      width: 100%;
      padding-top: 25px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4b6156;
      font-weight: 600;
    }

    /* TABLE OF CONTENTS GRAPHIC DOTS */
    .toc-block {
      display: flex;
      flex-direction: column;
      gap: 18px;
      margin: 35px 0;
    }

    .toc-row {
      display: flex;
      align-items: baseline;
      font-size: 13.5px;
    }

    .toc-label {
      font-weight: 700;
      color: var(--primary);
      flex-shrink: 0;
    }

    .toc-dots {
      flex-grow: 1;
      border-bottom: 2px dotted rgba(146, 106, 39, 0.3);
      margin: 0 12px;
    }

    .toc-index-num {
      font-weight: bold;
      color: var(--accent);
      font-family: monospace;
    }

    /* EDITORIAL DROP CAP CHAPTER STYLES */
    .editorial-quote {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 16px;
      color: var(--accent);
      border-left: 3.5px solid var(--accent);
      padding-left: 20px;
      margin: 30px 0;
      line-height: 1.6;
    }

    .chapter-heading-group {
      margin-bottom: 30px;
    }

    .chapter-num {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      text-transform: uppercase;
      color: var(--accent);
      letter-spacing: 2.5px;
      font-weight: 700;
      display: block;
      margin-bottom: 4px;
    }

    .chapter-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--primary);
    }

    .chapter-body-p {
      font-size: 13.5px;
      color: #273b31;
      text-align: justify;
      margin-bottom: 20px;
      line-height: 1.7;
    }

    /* Beautiful Drop Cap */
    .chapter-body-p::first-letter {
      float: left;
      font-family: 'Playfair Display', serif;
      font-size: 60px;
      line-height: 48px;
      padding-top: 4px;
      padding-right: 8px;
      padding-left: 3px;
      font-weight: bold;
      color: var(--primary);
    }

    .feature-sheet-grid {
      display: grid;
      grid-template-cols: 1fr;
      gap: 25px;
    }

    .spec-block {
      background-color: #fcfaf3;
      border: 1px solid #e8deb8;
      border-radius: 6px;
      padding: 24px;
    }

    .spec-title-bar {
      display: flex;
      align-items: center;
      gap: 15px;
      border-bottom: 1.5px solid #e8deb8;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }

    .spec-circle {
      width: 36px;
      height: 36px;
      background-color: var(--primary);
      border: 1.5px solid var(--accent);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--gold-border);
      font-family: 'Playfair Display';
      font-size: 15px;
      font-weight: bold;
    }

    .spec-subtitle {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent);
      font-weight: 800;
      font-family: 'Inter';
    }

    .spec-main-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--primary);
    }

    .editorial-h4 {
      font-family: 'Playfair Display', serif;
      font-size: 14.5px;
      color: var(--primary);
      font-weight: bold;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(146, 106, 39, 0.15);
      padding-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .bullet-columns {
      list-style-type: none;
    }

    .bullet-columns li {
      position: relative;
      padding-left: 26px;
      margin-bottom: 14px;
      font-size: 12.5px;
      color: #273b31;
      font-weight: 550;
      line-height: 1.6;
    }

    .bullet-columns li::before {
      content: "✦";
      position: absolute;
      left: 0;
      top: 0;
      color: var(--accent);
      font-size: 14px;
      font-weight: bold;
    }

    .quote-footer-stamp {
      background: linear-gradient(135deg, rgba(146, 106, 39, 0.05) 0%, rgba(146, 106, 39, 0.01) 100%);
      border-left: 4px solid var(--accent);
      padding: 16px 20px;
      font-family: 'Playfair Display', serif;
      font-style: italic;
      color: #5d4a2d;
      font-size: 13.5px;
      line-height: 1.6;
      border-radius: 0 8px 8px 0;
      margin-top: auto;
    }

    /* CHAPTER 8: GALLERIES DISPLAY SHEET */
    .gallery-container {
      display: grid;
      grid-template-cols: 1fr;
      gap: 20px;
      margin: 25px 0;
    }
    
    @media (min-width: 640px) {
      .gallery-container {
        grid-template-cols: 1fr 1fr;
      }
    }

    .gallery-card {
      background: #ffffff;
      border: 1px solid #e2dabf;
      padding: 12px;
      border-radius: 4px;
      box-shadow: 0 6px 16px rgba(84, 61, 23, 0.04);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .gallery-photo-wrapper {
      width: 100%;
      aspect-ratio: 16/10;
      overflow: hidden;
      border: 1.5px solid #eeeeee;
      border-radius: 2px;
      background-color: #000;
    }

    .gallery-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: all 0.3s;
    }

    .gallery-caption {
      font-size: 11px;
      color: #4b6156;
      line-height: 1.5;
      font-family: 'Hind Siliguri', sans-serif;
    }

    /* BACK COVER EXQUISITE STYLING */
    .back-cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      height: 1080px;
      padding: 110px 70px;
      text-align: center;
    }

    .back-cover-seal {
      margin: 0 auto;
      width: 120px;
      height: 120px;
      border: 3px double var(--accent);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: var(--accent);
      font-size: 13px;
      font-family: 'Playfair Display';
      font-weight: bold;
      background: rgba(146, 106, 39, 0.05);
    }

    /* Color Presets Toggler via JS */
    body.theme-white .booklet-container {
      background-color: #ffffff;
      color: #0b130e;
    }
    body.theme-white .page-break {
      background-color: #ffffff;
    }
    body.theme-white .spec-block {
      background-color: #fcfcfc;
    }

    /* PRINT RULES */
    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .reader-console {
        display: none !important;
      }

      .booklet-container {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        background-color: #ffffff !important;
      }

      .page-break {
        page-break-after: always !important;
        display: flex !important;
        height: 100vh !important;
        min-height: 100%;
        box-sizing: border-box !important;
        background-color: #ffffff !important;
        padding: 60px 75px !important;
      }

      .book-frame-overlay {
        top: 25px !important;
        bottom: 25px !important;
        left: 25px !important;
        right: 25px !important;
      }

      .ornament-tl { top: 33px; left: 33px; }
      .ornament-tr { top: 33px; right: 33px; }
      .ornament-bl { bottom: 33px; left: 33px; }
      .ornament-br { bottom: 33px; right: 33px; }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Console at the Top (Hidden in Paper printing) -->
  <div class="reader-console">
    <div class="console-text">
      <h2>📖 আভিজাত্য আবাসন স্মার্ট ম্যানুয়াল ও রাজকীয় বুকলেট রেডি!</h2>
      <p>আপনার কাস্টমাইজড ৩ডি ছবি এবং মডিউল সহ কর্পোরেট স্ট্যান্ডার্ড স্যুভেনির বইটি পিডিএফ ফরম্যাটে সেভের জন্য তৈরি।</p>
    </div>
    <div class="console-actions">
      <button class="btn-secondary" onclick="document.body.classList.toggle('theme-white')">
        🎨 পেপার টোন পরিবর্তন (Cream/White)
      </button>
      <button class="btn-action" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span>সেভ / প্রিন্ট বুকলেট</span>
      </button>
    </div>
  </div>

  <!-- BOOK SHUTTLE CONTAINER -->
  <div class="booklet-container" id="booklet-main">
    
    <!-- ==============================================
         PAGE 1: ROYAL COVER DESIGN (রাজকীয় প্রচ্ছদ)
         ============================================== -->
    <div class="page-break cover-page">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div class="spine-crest">
        <div class="crest-icon">ATT</div>
        <div class="crest-subtitle">Astha Twin Towers</div>
      </div>
      
      <div class="cover-midsection">
        <span class="badge">${language === 'bn' ? 'অফিসিয়াল ডিরেক্টরি ও ম্যানুয়াল' : 'Official Resident Glimpse'}</span>
        <h1 class="cover-title">
          ${language === 'bn' ? 'আবাসিক গাইডবুক ও ডিজিটাল স্যুভেনির' : 'The Blueprint of Architectural Grandeur'}
        </h1>
        <p class="cover-subtitle">
          ${language === 'bn' 
            ? 'আস্থা টুইন টাওয়ার্সের পরিচালনা ব্যবস্থা, আর্থিক স্বচ্ছতার রূপরেখা, বাসিন্দাদের নিয়মতান্ত্রিক অধিকার, এবং নজিরবিহীন দ্বৈত-সুরক্ষা পোর্টালের পরিপূর্ণ গাইডবুক।'
            : 'An elegant chronicle of next-generation physical management, pristine budgeting balance, and automated security architectures designed for our premium residents.'}
        </p>
        
        <div class="cover-graphic-holder">
          <img src="${parsed3dImages[0]}" alt="Luxury Twin Towers 3D Project" />
        </div>
      </div>
      
      <div class="spine-bottom">
        <span>${language === 'bn' ? 'আস্থা টুইন টাওয়ার্স পরিষদ • ২০২৩-২০২৬' : 'ATT Association • Founded 2023'}</span>
        <span>${language === 'bn' ? 'স্মার্ট আবাসন প্রকাশনা' : 'Smart Edition v4.2'}</span>
      </div>
    </div>


    <!-- ==============================================
         PAGE 2: DEDICATION & TABLE OF CONTENTS
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'ভূমিকা ও ডাইরেক্টরি' : 'PREFACE & INDEX'}</span>
          <span>Chapter I</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter I</span>
          <h2 class="chapter-title">${language === 'bn' ? 'মহতী আবাসন সংকল্প ও সূচী' : 'The Visionary Legacy & Index'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn' 
            ? 'স ম্মানিত অধিবাসী ও সদস্যবৃন্দ, আস্থা টুইন টাওয়ার্স পরিচালনা পর্ষদের আন্তরিক অভ্যর্থনা গ্রহণ করুন। আমাদের এই সুরক্ষিত ও স্বয়ংক্রিয় ডিজিটাল টাওয়ার স্যুভেনির মূলত একটি বিজ্ঞানসম্মত অঙ্গীকার। আবাসন ব্যবস্থাপনার প্রাচীন ও বিশৃঙ্খল খাতা গুটিয়ে ডিজিটাল যুগের আধুনিক, কাগজহীন ও সততা সমৃদ্ধ পোর্টাল প্রতিষ্ঠা করাই ছিল আমাদের প্রথম উদ্দেশ্য। এই দৃষ্টিকোণে ৭টি প্রধান সোপানের সূচীমালা এখানে উপস্থাপিত হলো।'
            : 'W elcome esteemed residents and guests to the official chronicle of Astha Twin Towers. This master manual stands as a pristine commitment toward next-generation automated hospitality and zero-compromise security protocols. By transition beyond fragmented accounting folders, our bespoke board guarantees a golden standard. Below is the layout roadmap of this sovereign guidelines.'}
        </p>

        <div class="toc-block">
          <div class="toc-row">
            <span class="toc-label">১. সদস্য রেজিস্ট্রি ও স্মার্ট প্রোফাইল (Resident Directory Panel)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 03</span>
          </div>
          <div class="toc-row">
            <span class="toc-label">২. আর্থিক হিসাবনিকাশ ও ফি আদায় (Anti-Fraud Treasury Engine)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 04</span>
          </div>
          <div class="toc-row">
            <span class="toc-label">৩. ডিজিটাল নোটিশবোর্ড ও লাইভ অ্যালার্ট (Smart Bulletins Feed)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 05</span>
          </div>
          <div class="toc-row">
            <span class="toc-label">৪. ভিজিটর ও গেস্ট ম্যানেজমেন্ট (Front-Gate Logbook Entry)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 06</span>
          </div>
          <div class="toc-row">
            <span class="toc-label">৫. কমন স্পেস সমাধান ও সমস্যা বক্স (Physical Incident Helpdesk)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 07</span>
          </div>
          <div class="toc-row">
            <span class="toc-label">৬. সিকিউরিটি স্টাফ হাজিরা রেজিস্টার (Duty Guards Shift Log)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 08</span>
          </div>
          <div class="toc-row">
            <span class="toc-label">৭. প্রজেক্ট ডেভেলপমেন্ট ও নির্মাণ খরচ ট্র্যাকার (Development Auditing)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 09</span>
          </div>
          <div class="toc-row">
            <span class="toc-label">৮. ৩ডি স্থাপত্যচিত্র ও প্রজেক্ট গ্যালারি (3D Architectural Exhibits)</span>
            <span class="toc-dots"></span>
            <span class="toc-index-num">Page 10</span>
          </div>
        </div>
      </div>

      <div class="quote-footer-stamp">
         "একটি সভ্য আবাসনের আস্থার প্রধান শর্ত হচ্ছে প্রতিটি তথ্য ও হিসাবের পরম স্বচ্ছতা।"
      </div>

      <div class="running-footer">
        <span>ATT Association Guidebook</span>
        <span>Page 02</span>
      </div>
    </div>


    <!-- ==============================================
         PAGE 3: CHAPTER 1: MEMBERS
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'সদস্য রেজিস্ট্রি ও প্রোফাইল' : 'RESIDENT DIRECTORY'}</span>
          <span>Chapter II</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter II</span>
          <h2 class="chapter-title">${language === 'bn' ? '০১. সদস্য রেজিস্ট্রি ও স্মার্ট প্রোফাইল' : '01. Resident Directory & Profiles'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn'
            ? 'আ স্থা টুইন টাওয়ার্সের (ব্লক এ এবং বি) প্রতিটি ফ্ল্যাটের মালিক, ভাড়াটিয়া এবং সম্মানিত পরিবারের সদস্যদের নিয়ে গড়ে তোলা হয়েছে আমাদের সেন্ট্রাল আবাসন ডেটাবেইস। এর মাধ্যমে আবাসন ডিরেক্টরি স্বয়ংক্রিয়ভাবে রিয়েল-টাইমে আপডেট রাখা যায়। প্রতিটি পরিবারের ছবি, ইমেইল এবং ফ্ল্যাটের বিবরণ কঠোর এডমিন ভেরিফিকেশন প্যানেল দিয়ে সুরক্ষিত থাকে।'
            : 'M apping block arrays across Block A and Block B, this directory preserves comprehensive details on all tenants, flat owners, and respective co-occupants. Backed by rigorous cryptography and administration validation gates, this resident matrix restricts arbitrary profile queries to insulate owner privacy and keep high security standards.'}
        </p>

        <div class="feature-sheet-grid">
          <div class="spec-block">
            <div class="spec-title-bar">
              <div class="spec-circle">01</div>
              <div>
                <span class="spec-subtitle">Active Directory Matrix</span>
                <div class="spec-main-title">${language === 'bn' ? 'অধিবাসীদের জন্য প্রত্যক্ষ উপকারিতাসমূহ' : 'Direct Advantages for Residents'}</div>
              </div>
            </div>
            
            <ul class="bullet-columns">
              <li>{language === 'bn' ? 'ফ্ল্যাট ভিত্তিক ডিজিটাল ডেটা থাকায় ওনারশিপ বদল ও হিসেব হস্তান্তর অত্যন্ত মসৃণ।' : 'Flat-based immutable indexing ensures rapid tenancy changes and keys transfers.'}</li>
              <li>{language === 'bn' ? 'জরুরি মুহূর্তে বা অগ্নিকাণ্ডের মত বিপদে যেকোনো প্রতিবেশীর সাথে তাৎক্ষণিক দূরবর্তী যোগাযোগ।' : 'Enables immediate cross-connection with floor neighbors during localized emergencies.'}</li>
              <li>{language === 'bn' ? 'এডমিন ভেরিফিকেশন কোডের কারণে অননুমোদিত কেউ ডিরেক্টরি তথ্য দেখতে পারে না।' : 'Airtight access boundaries limit general database visibility to validated residents only.'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="quote-footer-stamp">
        "তথ্য সমৃদ্ধ ডিরেক্টরি আমাদের বাসিন্দাদের মধ্যে পারস্পরিক ভ্রাতৃত্বের এক মজবুত বন্ধন স্থাপন করে।"
      </div>

      <div class="running-footer">
        <span>ATT Smart Resident Manuel</span>
        <div class="page-number">03</div>
      </div>
    </div>


    <!-- ==============================================
         PAGE 4: CHAPTER 2: FINANCE
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'আর্থিক হিসাবনিকাশ ও ফান্ড' : 'LEDGER & BUDGETING'}</span>
          <span>Chapter III</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter III</span>
          <h2 class="chapter-title">${language === 'bn' ? '০২. আর্থিক হিসাবনিকাশ ও ফি আদায়' : '02. Anti-Fraud Corporate Ledger'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn'
            ? 'আ পনার কষ্টার্জিত পরিশোধিত টাকার প্রতি পাই-পয়সার নিরাপত্তা দেওয়া আমাদের পবিত্র দায়িত্ব। সে লক্ষ্যে সনাতনী খাতা উড্রে করে এটি রিয়েল-টাইমে প্রতি মাসের মেইনটেন্যান্স ফি, জেনারেটর ডিজেল ফান্ড, পানির বিল, এবং বিশেষ উৎসবের চাঁদা অটো-ক্যালকুলেশন করে। অধিবাসীরা নিজেদের বকেয়া দেখে সরাসরি বিকাশ, নগদ বা রকেটের মাধ্যমে পে করতে পারেন।'
            : 'F inancially transparent bookkeeping forms the bedrock of our trust. This custom banking ledger generates automatic monthly invoices, diesel reserve pools, and special event contributions. Residents get instant notifications of overdue amounts and have immediate capability to securely download premium receipts.'}
        </p>

        <div class="feature-sheet-grid">
          <div class="spec-block">
            <div class="spec-title-bar">
              <div class="spec-circle">02</div>
              <div>
                <span class="spec-subtitle">Prisinte Accounting Model</span>
                <div class="spec-main-title">${language === 'bn' ? 'ডিজিটাল হিসাবের পরম উপকারিতাসমূহ' : 'Direct Advantages for Residents'}</div>
              </div>
            </div>
            
            <ul class="bullet-columns">
              <li>{language === 'bn' ? 'বাসিন্দাগণ তাদের মোট বকেয়া, অগ্রিম এবং অতীত রসিদের কপি সবসময় প্রিন্ট করতে পারেন।' : 'Residents maintain 24/7 access to real-time statement sheets, advance credits, and PDFs.'}</li>
              <li>{language === 'bn' ? 'ম্যানুয়াল ডাবল-এন্ট্রি ক্যালকুলেশন ভুলের অবসান ঘটে এবং ক্যাশবুক স্বচ্ছ থাকে।' : 'Eliminates mathematical ledger discrepancies across all general ledger books.'}</li>
              <li>{language === 'bn' ? 'ফি পরিশোধ হওয়া মাত্র মোবাইলে রশিদ কনফার্মেশনের ফলে জালিয়াতি বন্ধ হয়।' : 'Immediate billing generation logs safeguard payments from internal cash leakage.'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="quote-footer-stamp">
        "হিসাব যখন শতভাগ উন্মুক্ত ও ডিজিটাল, তখন পারস্পরিক আস্থার পরিধি অনেক সুদূরপ্রসারী।"
      </div>

      <div class="running-footer">
        <span>ATT Smart Resident Manuel</span>
        <div class="page-number">04</div>
      </div>
    </div>


    <!-- ==============================================
         PAGE 5: CHAPTER 3: NOTICES
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'স্মার্ট ডিজিটাল নোটিশবোর্ড' : 'DIGITAL BULLETIN FEED'}</span>
          <span>Chapter IV</span>
        </div>


    <!-- ==============================================
         PAGE 6: CHAPTER 4: VISITORS
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'গেট ও গেস্ট প্রটোকল' : 'GATE VISITOR LOGBOOK'}</span>
          <span>Chapter V</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter V</span>
          <h2 class="chapter-title">${language === 'bn' ? '০৪. ভিজিটর ও অতিথি বুক এন্ট্রি' : '04. Gate Visitor Entry & Logbook'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn'
            ? 'আ বাসনে অনধিকার প্রবেশ ঠেকানো এবং প্রতিটি ভিজিটর, গাড়ি, হোম ডেলিভারি বা কাজের বুয়াদের নিরাপত্তা পরীক্ষা নিশ্চিত করতে এই গেট রেজিস্ট্রি। মেইন ফটকের নিরাপত্তার দায়িত্বে থাকা গার্ড যেকোনো মানুষের এন্ট্রি করা মাত্র সংশ্লিষ্ট ফ্ল্যাটের বাসিন্দাদের ফোনে লাইভ নোটিশ চলে যায়।'
            : 'F acilitating airtight security starts at the boundary threshold. Using our live entry-tracker, duty guards perform gate clearance procedures, photo uploads, and identity verifications of delivery executives, house helpers, and guest vehicles, directly notifying respective flats.'}
        </p>

        <div class="feature-sheet-grid">
          <div class="spec-block">
            <div class="spec-title-bar">
              <div class="spec-circle">04</div>
              <div>
                <span class="spec-subtitle">Armed Sentry Gatekeeping</span>
                <div class="spec-main-title">${language === 'bn' ? 'গেটের ডিজিটাল কার্যকারিতা' : 'Direct Advantages for Residents'}</div>
              </div>
            </div>
            
            <ul class="bullet-columns">
              <li>${language === 'bn' ? 'আপনার ফ্ল্যাটে আসা প্রতিটি ফুড ডেলিভারি বা কুরিয়ার বয়দের রিয়েল-টাইম লগ ট্র্যাকিং।' : 'Every food courier or courier executive receives active, localized tracking parameters.'}</li>
              <li>${language === 'bn' ? 'অনাকাঙ্क्षित মানুষের অননুমোদিত প্রবেশ কড়াভাবে নিয়ন্ত্রণ।' : 'Strict gates procedures prohibit non-authorized solicitors from wandering floor corridors.'}</li>
              <li>${language === 'bn' ? 'গেটের সিসিটিভি ছবির সাথে প্রহরীর ডিজিটাল এন্ট্রির নিখুঁত মিল বজায় রাখা।' : 'Correlates security guard logging with surveillance cameras to check records perfectly.'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="quote-footer-stamp">
         "যে আবাসনে কড়া প্রহরা আর ডিজিটাল গেট কিপার রয়েছে, সেখানে প্রতিটি রাত নিশ্চিন্ত ঘুমে কাটে।"
      </div>

      <div class="running-footer">
        <span>ATT Smart Resident Manuel</span>
        <div class="page-number">06</div>
      </div>
    </div>


    <!-- ==============================================
         PAGE 7: CHAPTER 5: COMPLAINTS
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'অভিযোগ সমাধান ও সাপোর্ট' : 'INCIDENT HELPDESK'}</span>
          <span>Chapter VI</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter VI</span>
          <h2 class="chapter-title">${language === 'bn' ? '০৫. মেরামত ও তাৎক্ষণিক অভিযোগ বক্স' : '05. Incident Desk & Diagnostics'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn'
            ? 'আ বাসনে বসবাস করতে গেলে লিফট বিকল হওয়া, ফ্লোরের লাইট নষ্ট হওয়া কিংবা কমন শাওয়ার বা বাথরুমের পানির লাইন ফেটে যাওয়ার মত ছোট-বড় সমস্যা হতে পারে। কিন্তু অনেক সময় উপযুক্ত মানুষ বা মেরামত কর্মীকে খুঁজে পাওয়া যায় না। আমাদের কেয়ার ডেস্কের অভিযোগ বাক্সে বাসিন্দারা যেকোনো ক্রটি ছবিসহ আপলোড করতে পারেন।'
            : 'O wing to high complexity facilities, hardware wear and tear is inevitable. Be it gym equipment maintenance, lift malfunctions, or shared power line failures, the service ticketing hub manages repair requests smoothly. Residents submit descriptive complaints complete with photo attachments directly to maintenance engineers.'}
        </p>

        <div class="feature-sheet-grid">
          <div class="spec-block">
            <div class="spec-title-bar">
              <div class="spec-circle">05</div>
              <div>
                <span class="spec-subtitle">Resident Care Protocols</span>
                <div class="spec-main-title">${language === 'bn' ? 'মেরামত সেবার প্রকৃত সুবিধা' : 'Direct Advantages for Residents'}</div>
              </div>
            </div>
            
            <ul class="bullet-columns">
              <li>${language === 'bn' ? 'আপনার জানানো সমস্যার বিপরীতে টিকিট জেনারেট হওয়া এবং তার লাইভ এডিটিং ট্র্যাক।' : 'Generate tickets and track mechanical repairs progress straight from the console.'}</li>
              <li>${language === 'bn' ? 'কমিটি বা ইঞ্জিনিয়ারদের কাজের গাফিলতি বা এড়িয়ে যাওয়া চিরতরে বিদায়।' : 'Fosters massive committee accountability, preventing service tickets from being ignored.'}</li>
              <li>${language === 'bn' ? 'দ্রুত সমাধান ও কাজের গুণগত রেটিং সরাসরি বাসিন্দার ড্যাশবোর্ডে প্রদান।' : 'Allows residents to submit satisfaction ratings upon successful closure of tasks.'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="quote-footer-stamp">
         "অভিযোগ যখন সরাসরি অ্যাকশনে রূপ নেয়, তখন আবাসনের প্রতিটি ইট-পাথরও কথা বলে।"
      </div>

      <div class="running-footer">
        <span>ATT Smart Resident Manuel</span>
        <div class="page-number">07</div>
      </div>
    </div>


    <!-- ==============================================
         PAGE 8: CHAPTER 6: STAFF
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'নিরাপত্তা কর্মী ও শিফট ট্র্যাকিং' : 'STAFF WORKFLOW & ATTENDANCE'}</span>
          <span>Chapter VII</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter VII</span>
          <h2 class="chapter-title">${language === 'bn' ? '০৬. নিরাপত্তা কর্মী ও শিফট রেজিস্টার' : '06. Security Staff Duty Register'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn'
            ? 'প ্রহরী ও কর্মীদের কর্মদক্ষতা নিশ্চিত করতে এই সার্ভিসটি তৈরি। এর মাধ্যমে গেট প্রহরী, সুইমিংপুল লাইফ গার্ড ও ইনструк্টরদের বায়োডাটা এবং প্রতিদিনের উপস্থিতি নিখুঁতভাবে সংরক্ষণ করা হয়। শিফট অনুযায়ী কে কখন ডিউটিতে এলো বা কার ছুটি ছিল তা ডাবল-চেক রেজিস্টারের মাধ্যমে স্বয়ংক্রিয়ভাবে হিসাব করা সম্ভব হয়।'
            : 'F acilitating peak workforce output is non-negotiable for modern tower complexes. By incorporating attendance templates for security guards, sanitization crews, and pools monitors, this scheduler registers check-in and check-out stamps. It manages double-shift scheduling perfectly to handle critical guard switches without manual supervision.'}
        </p>

        <div class="feature-sheet-grid">
          <div class="spec-block">
            <div class="spec-title-bar">
              <div class="spec-circle">06</div>
              <div>
                <span class="spec-subtitle">Workforce Operations Panel</span>
                <div class="spec-main-title">${language === 'bn' ? 'কর্মী ব্যবস্থাপনার প্রধান সুবিধা' : 'Direct Advantages for Residents'}</div>
              </div>
            </div>
            
            <ul class="bullet-columns">
              <li>${language === 'bn' ? 'দারোয়ান অন-ডিউটিতে ঘুমিয়ে পড়া বা অসঙ্গতিপূর্ণ কাজ শতভাগ এড়ানো সম্ভব।' : 'Keeps guards vigilant and provides an explicit paper trail of guard assignments.'}</li>
              <li>${language === 'bn' ? 'উপস্থিতির ভিত্তিতে পারফরম্যান্স বোনাস নির্ধারণ ও মাস শেষে দ্রুত বেতন ক্লিয়ারিং।' : 'Aligns monthly pay stub logs to match true clock hours, easing payroll calculations.'}</li>
              <li>${language === 'bn' ? 'যেকোনো গার্ডের নাম ও ফোন নম্বর ড্যাশবোর্ড থেকে তাৎক্ষণিকভাবে পাওয়ার সুবিধা।' : 'Grants direct calling options to reach designated security guards during midnight patrols.'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="quote-footer-stamp">
         "অনুগত কর্মী বাহিনী ও সুসংগঠিত শৃঙ্খলা আস্থার টাওয়ারকে কুমিল্লার সেরা আবাসন বানায়।"
      </div>

      <div class="running-footer">
        <span>ATT Smart Resident Manuel</span>
        <div class="page-number">08</div>
      </div>
    </div>


    <!-- ==============================================
         PAGE 9: CHAPTER 7: CONSTRUCTION
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'নির্মাণ ও খরচের অডিট' : 'CONSTRUCTION TIMELINE & LEDGER'}</span>
          <span>Chapter VIII</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter VIII</span>
          <h2 class="chapter-title">${language === 'bn' ? '০৭. প্রজেক্ট ডেভেলপমেন্ট ও নির্মাণ খরচ ট্র্যাকার' : '07. Development Growth & Expense Audit'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn'
            ? 'আ স্থা টুইন টাওয়ার্সের নির্মাণ কাজ ও গুণগত মান বৃদ্ধির প্রতিটি ধাপে কাজের লাইভ অগ্রগতি, ব্যয়কৃত রড-সিমেন্টের লেজার এবং সদস্যদের প্রদত্ত জমার পরিমাণ স্বচ্ছভাবে ট্র্যাক করতে আমাদের ডেভেলপমেন্ট লেজার প্রস্তুত করা হয়েছে। প্রতিটি ধাপে ঢালাইয়ের কাজ অগ্রগতি বা ফ্লোরের খরচ ড্যাশবোর্ড থেকেই পর্যবেক্ষণ করতে পারেন।'
            : 'F ull audit logs of physical growth keep everyone unified. The growth-meter publishes real-time construction phase percentages, raw materials ledger balance (such as cement, high tensile rebar blocks), and logs of cumulative investments contributed by the partner members, ensuring complete development alignment.'}
        </p>

        <div class="feature-sheet-grid">
          <div class="spec-block">
            <div class="spec-title-bar">
              <div class="spec-circle">07</div>
              <div>
                <span class="spec-subtitle">Structural Development Ledger</span>
                <div class="spec-main-title">${language === 'bn' ? 'নির্মাণ খরচের প্রধান সুবিধা' : 'Direct Advantages for Residents'}</div>
              </div>
            </div>
            
            <ul class="bullet-columns">
              <li>${language === 'bn' ? 'প্রজেক্টের কাজের প্রকৃত অগ্রগতি ছবির মাধ্যমে কুমিল্লা ও বিশ্বব্যাপী ঘরে বসেই দেখার সুযোগ।' : 'Tracks physical foundation steps via images, enabling virtual reviews globally.'}</li>
              <li>${language === 'bn' ? 'আইটেম অনুযায়ী রড, সিমেন্ট ও সাইট মেটেরিয়াল কেনার খরচের বিস্তারিত হিসাব।' : 'Maintains transparent materials records, guarding allocations against inflation trends.'}</li>
              <li>${language === 'bn' ? 'সম্মিলিত কাজের গতি বৃদ্ধি এবং সঠিক সময়ে ফ্ল্যাটের হস্তান্তর সম্পন্নকরণ।' : 'Expedites developmental phases to ensure keys turn-over matches delivery schedules.'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="quote-footer-stamp">
         "ভিত্তিশীল স্বচ্ছতা একটি নির্মাণ কাজকে শুধু ঘর বানায় না, তাকে ভালোবাসার ঠিকানা বানায়।"
      </div>

      <div class="running-footer">
        <span>ATT Smart Resident Manuel</span>
        <div class="page-number">09</div>
      </div>
    </div>


    <!-- ==============================================
         PAGE 10: CHAPTER 8: EXHIBIT GALLERY
         ============================================== -->
    <div class="page-break">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div>
        <div class="running-header">
          <span>${language === 'bn' ? 'স্থায়িত্ব নকশা ও ৩ডি নকশা প্রদর্শনী' : '3D ARCHITECTURAL EXHIBITS'}</span>
          <span>Chapter IX</span>
        </div>

        <div class="chapter-heading-group">
          <span class="chapter-num">Chapter IX</span>
          <h2 class="chapter-title">${language === 'bn' ? '৩ডি স্থাপত্য গ্যালারি ও পরিকল্পিত চিত্রমালা' : 'Chapter IX: Visual Exhibitions'}</h2>
        </div>

        <p class="chapter-body-p">
          ${language === 'bn' 
            ? 'আ স্থা টুইন টাওয়ার্সের ভবিষ্যৎ রাজকীয় রূপকল্পের আধুনিক ৩ডি নকশা ও স্থাপত্যগত মানদণ্ডসমূহ এখানে ছবির আকারে তুলে ধরা হলো। এই স্থাপত্য রূপরেখাটি আধুনিক ট্রিপল গ্লাস রেসিস্টেড ফ্যাসাড, ভুমিকম্প সহনশীলতা ও সবুজ প্রাকৃতিক পরিবেশের প্রতি আমাদের প্রতিজ্ঞার অনন্য স্বাক্ষর।'
            : 'S howcasing the majestic architectural model of the Astha Twin Towers. The following design drafts reveal the double-tower active layout, panoramic capsule elevators, and the eco-friendly structural designs intended to maximize resident luxury and property equity.'}
        </p>

        <!-- Dynamic Photo Portfolio loaded dynamically from uploaded images -->
        <div class="gallery-container">
          ${galleryHtml}
        </div>
      </div>

      <div class="running-footer">
        <span>ATT Smart Resident Manuel</span>
        <div class="page-number">10</div>
      </div>
    </div>


    <!-- ==============================================
         PAGE 11: EPILOGUE & BACK COVER
         ============================================== -->
    <div class="page-break back-cover">
      <div class="book-frame-overlay"></div>
      <span class="corner-ornament ornament-tl"></span>
      <span class="corner-ornament ornament-tr"></span>
      <span class="corner-ornament ornament-bl"></span>
      <span class="corner-ornament ornament-br"></span>

      <div class="back-cover-seal">
        <span>OFFICIAL SEAL</span>
        <span style="font-size:7px; letter-spacing:1px; margin-top:3px;">APPROVED 2026</span>
      </div>

      <div>
        <h2 style="font-family: 'Playfair Display', serif; font-size:24px; color: var(--primary); margin-bottom: 15px;">
          ${language === 'bn' ? 'আস্থা টুইন টাওয়ার্স - রাজকীয় সত্যতা' : 'Astha Twin Towers - Royal Credence'}
        </h2>
        <p style="font-size:13px; color:#475569; max-width:480px; margin:0 auto; line-height:1.7;">
          ${language === 'bn'
            ? 'এই দলিল বিশ্বাস ও আধুনিক বিজ্ঞানসম্মত আবাসিক ডিরেক্টরির রূপরেখা। এই ম্যানুয়ালে উল্লেখিত প্রতিটি তথ্য আমাদের আস্থা কমপ্লেক্সের সামগ্রিক সমৃদ্ধি ও দীর্ঘস্থায়ী স্থায়িত্ব রক্ষা করতে সুনিশ্চিত ভূমিকা পালন করে।'
            : 'Thank you for exploring the official resident guide. This document serves as a standard blueprint for automated community execution and represents the unwavering spirit of structural harmony.'}
        </p>
      </div>

      <div style="width:100%; border-top:1px solid rgba(146, 106, 39, 0.18); padding-top:20px; font-size:11px; color:#5b6e65; font-family:'Inter'; text-transform:uppercase; letter-spacing: 1px;">
        <span>© 2026 Astha Twin Towers Association • Khetasar, Cumilla, Bangladesh</span>
      </div>
    </div>

  </div> <!-- booklet-container end -->

  <div style="font-family: monospace; font-size: 11px; color:#64748b; margin-top:25px; text-align:center; padding-bottom: 50px;">
    © 2026 Astha Twin Towers Association • Smart Bilingual Hardcopy Handbook • Certified Genuine Product
  </div>

  <!-- Auto Initiates Print Dialogue On Load -->
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 1000);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = language === 'bn' 
      ? 'আস্থা_টুইন_টাওয়ার্স_প্রফেশনাল_ব্রোশিয়ার.html' 
      : 'Astha_Twin_Towers_Professional_Brochure.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load Leaders List
  const rawLeaders = config.leadersJson ? JSON.parse(config.leadersJson) : [];
  const leadersList: any[] = rawLeaders.length > 0 ? rawLeaders : [
    {
      "id": "leader_1",
      "initials": "AR",
      "nameEn": "Alhaj Md. Abdur Rahman",
      "nameBn": "আলহাজ্ব মো: আব্দুর রহমান",
      "roleEn": "PROJECT CHAIRMAN",
      "roleBn": "চেয়ারম্যান",
      "msgEn": "The construction of our Astha Twin Towers project in Khetasar, Cumilla is progressing with exceptional quality. Inshallah, this will stand as a landmark architectural masterclass in our region.",
      "msgBn": "খেতাসার কুমিল্লায় আমাদের এই আস্থা টুইন টাওয়ার্স প্রকল্পের কাজ অত্যন্ত মানসম্মতভাবে এগিয়ে চলছে। এটি আমাদের অঞ্চলের এক অনন্য স্থাপত্যের স্মারক হিসেবে গড়ে উঠবে ইনশাল্লাহ।"
    },
    {
      "id": "leader_2",
      "initials": "RI",
      "nameEn": "Engr. Rafiqul Islam",
      "nameBn": "ইঞ্জিঃ রফিকুল ইসলাম",
      "roleEn": "SOCIETY PRESIDENT",
      "roleBn": "সভাপতি",
      "msgEn": "Equipped with state-of-the-art society technologies, our management guarantees sheer transparency and accountability. Ensuring safety, compliance, and joy for every resident is our core vision.",
      "msgBn": "ডিজিটাল আবাসন প্রযুক্তির সমন্বয়ে আমাদের এই সোসাইটি পরিচালিত হবে অত্যন্ত স্বচ্ছ ও নিয়মতান্ত্রিক উপায়ে। প্রতিটি বাসিন্দার নিরাপত্তা এবং সুখ-শান্তি নিশ্চিত করাই আমাদের প্রধান অঙ্গীকার।"
    },
    {
      "id": "leader_3",
      "initials": "AC",
      "nameEn": "Dr. Adnan Chowdhury",
      "nameBn": "ডাঃ আদনান চৌধুরী",
      "roleEn": "SOCIETY SECRETARY",
      "roleBn": "সাধারণ সম্পাদক",
      "msgEn": "With a modern fitness hub, rooftop gardens, 24/7 CCTV surveillance, and a dedicated maintenance workforce, Astha Twin Towers will offer the ultimate serene, safe, and modern lifestyle outside of Dhaka.",
      "msgBn": "আধুনিক ফিটনেস হাব, রুফটপ গার্ডেন, ২৪/৭ সিসিটিভি পাহারা এবং আমাদের নিজস্ব হেল্পার স্কোয়াড নিয়ে আস্থা টুইন টাওয়ার্স হবে ঢাকার বাইরে আধুনিক ও নিরুপদ্রব জীবনের শ্রেষ্ঠ ঠিকানা।"
    }
  ];

  // Action Triggers
  const open3dModal = () => {
    setValBuilding3dImg(config.building3dImg || '');
    let initialImages: string[] = [];
    try {
      if (config.building3dImagesJson) {
        initialImages = JSON.parse(config.building3dImagesJson);
      } else if (config.building3dImg) {
        initialImages = [config.building3dImg];
      }
    } catch (e) {
      console.error(e);
      if (config.building3dImg) {
        initialImages = [config.building3dImg];
      }
    }
    setValBuilding3dImages(initialImages);
    setValBuilding3dTitleEn(config.building3dTitleEn || "Astha Twin Towers - Architectural Highlights");
    setValBuilding3dTitleBn(config.building3dTitleBn || "আস্থা টুইন টাওয়ার্স - স্থাপত্য মানদণ্ড");
    setValBuilding3dDescEn(config.building3dDescEn || "Astha Twin Towers is Cumilla’s pioneer dual-tower premium luxury high-rise condominium complex located in Khetasar...");
    setValBuilding3dDescBn(config.building3dDescBn || "এটি খেতাসার, কুমিল্লায় নির্মিতব্য...");
    setShow3dModal(true);
  };

  const save3dCustomizations = (e: React.FormEvent) => {
    e.preventDefault();
    const firstImg = valBuilding3dImages[0] || valBuilding3dImg || '';
    updateConfig({
      building3dImg: firstImg,
      building3dImagesJson: JSON.stringify(valBuilding3dImages),
      building3dTitleEn: valBuilding3dTitleEn,
      building3dTitleBn: valBuilding3dTitleBn,
      building3dDescEn: valBuilding3dDescEn,
      building3dDescBn: valBuilding3dDescBn
    });
    setShow3dModal(false);
  };

  const openConstructionModal = () => {
    setValConstructionImg(config.constructionImg || '');
    let initialImages: string[] = [];
    try {
      if (config.constructionImagesJson) {
        initialImages = JSON.parse(config.constructionImagesJson);
      } else if (config.constructionImg) {
        initialImages = [config.constructionImg];
      }
    } catch (e) {
      console.error(e);
      if (config.constructionImg) {
        initialImages = [config.constructionImg];
      }
    }
    setValConstructionImages(initialImages);
    setValConstructionNewUrl('');
    setConstructionProcessingCount(0);
    setValConstructionPercent(config.constructionPercent !== undefined ? config.constructionPercent : 85);
    setValConstructionDescEn(config.constructionDescEn || "Sub-grade foundation and pile capping have been 100% completed...");
    setValConstructionDescBn(config.constructionDescBn || "মাটির পাইলিং এবং ফুটিং বেইসের কাজ ১০০% সুরক্ষায় সমাপ্ত হয়েছে...");
    setShowConstructionModal(true);
  };

  const saveConstructionCustomizations = (e: React.FormEvent) => {
    e.preventDefault();
    const firstImg = valConstructionImages[0] || valConstructionImg || '';
    updateConfig({
      constructionImg: firstImg,
      constructionImagesJson: JSON.stringify(valConstructionImages),
      constructionPercent: Number(valConstructionPercent),
      constructionDescEn: valConstructionDescEn,
      constructionDescBn: valConstructionDescBn
    });
    setShowConstructionModal(false);
  };

  const openEditLeader = (leader: any) => {
    setEditingLeader(leader);
    setLeaderInitials(leader.initials || '');
    setLeaderNameEn(leader.nameEn || '');
    setLeaderNameBn(leader.nameBn || '');
    setLeaderRoleEn(leader.roleEn || '');
    setLeaderRoleBn(leader.roleBn || '');
    setLeaderMsgEn(leader.msgEn || '');
    setLeaderMsgBn(leader.msgBn || '');
    setLeaderPhoto(leader.photo || '');
    setShowLeaderModal(true);
  };

  const openAddLeader = () => {
    setEditingLeader(null);
    setLeaderInitials('');
    setLeaderNameEn('');
    setLeaderNameBn('');
    setLeaderRoleEn('');
    setLeaderRoleBn('');
    setLeaderMsgEn('');
    setLeaderMsgBn('');
    setLeaderPhoto('');
    setShowLeaderModal(true);
  };

  const saveLeaderCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    if (editingLeader) {
      updated = leadersList.map(item => item.id === editingLeader.id ? {
        ...item,
        initials: leaderInitials,
        nameEn: leaderNameEn,
        nameBn: leaderNameBn,
        roleEn: leaderRoleEn,
        roleBn: leaderRoleBn,
        msgEn: leaderMsgEn,
        msgBn: leaderMsgBn,
        photo: leaderPhoto
      } : item);
    } else {
      updated = [...leadersList, {
        id: 'leader_' + Date.now(),
        initials: leaderInitials,
        nameEn: leaderNameEn,
        nameBn: leaderNameBn,
        roleEn: leaderRoleEn,
        roleBn: leaderRoleBn,
        msgEn: leaderMsgEn,
        msgBn: leaderMsgBn,
        photo: leaderPhoto
      }];
    }
    updateConfig({ leadersJson: JSON.stringify(updated) });
    setShowLeaderModal(false);
    setEditingLeader(null);
  };

  const deleteLeaderFromDesk = (id: string) => {
    if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই বাণীটি মুছতে চান?' : 'Are you sure you want to remove this leader speech?')) {
      const updated = leadersList.filter(item => item.id !== id);
      updateConfig({ leadersJson: JSON.stringify(updated) });
    }
  };

  // Notice Quick management from login page
  const openLoginNoticeAdd = () => {
    setEditingLoginNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeType('Announcement');
    setNoticeImage('');
    setShowLoginNoticeModal(true);
  };

  const openLoginNoticeEdit = (notice: Notice) => {
    setEditingLoginNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeType(notice.type);
    setNoticeImage(notice.image || '');
    setShowLoginNoticeModal(true);
  };

  const saveLoginNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    if (editingLoginNotice) {
      updateNotice({
        ...editingLoginNotice,
        title: noticeTitle,
        content: noticeContent,
        type: noticeType,
        image: noticeImage
      });
    } else {
      addNotice({
        title: noticeTitle,
        content: noticeContent,
        type: noticeType,
        active: true,
        image: noticeImage
      });
    }
    setShowLoginNoticeModal(false);
    setEditingLoginNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
  };

  const [role, setRole] = useState<'Admin' | 'Resident' | 'Staff'>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // SECURE OTP PASSWORD RECOVERY STATES
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [otpSentStep, setOtpSentStep] = useState(false);
  const [resetPasswordStep, setResetPasswordStep] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmNewPasscode, setConfirmNewPasscode] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [selectedResetRole, setSelectedResetRole] = useState<'Admin' | 'Resident' | 'Staff'>('Admin');
  const [simulatedOtpNotification, setSimulatedOtpNotification] = useState<{ otp: string; email: string } | null>(null);

  // Active Tab for the info gallery
  const [activeTab, setActiveTab] = useState<'3d' | 'construction' | 'messages' | 'notices' | 'about' | 'videos'>('3d');
  const [activeBrochureIndex, setActiveBrochureIndex] = useState(0);
  const [showBrochureToast, setShowBrochureToast] = useState(false);

  // PROJECT LIVE VIDEO INTEGRATED STATES
  const [videos, setVideos] = useState<ProjectVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [videoSelectedCategory, setVideoSelectedCategory] = useState('All');
  const [activeWatchVideo, setActiveWatchVideo] = useState<ProjectVideo | null>(null);

  // Video Form states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ProjectVideo | null>(null);
  
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoProjectName, setVideoProjectName] = useState('Tower 1');
  const [videoCategory, setVideoCategory] = useState('Construction Progress');
  const [videoYoutubeUrl, setVideoYoutubeUrl] = useState('');
  const [videoFacebookUrl, setVideoFacebookUrl] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState(PRESET_THUMBNAILS[0].url);
  const [videoIsFeatured, setVideoIsFeatured] = useState(false);
  const [videoFormError, setVideoFormError] = useState<string | null>(null);
  const [videoIsSubmitting, setVideoIsSubmitting] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);

  // Live video Firestore subscription hook
  useEffect(() => {
    const qVideos = query(collection(db, 'project_videos'), orderBy('uploadDate', 'desc'));
    const unsubscribe = onSnapshot(qVideos, (snapshot) => {
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
          } catch (e) {
            dateStr = new Date().toISOString().split('T')[0];
          }
        } else {
          dateStr = new Date().toISOString().split('T')[0];
        }

        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          projectName: data.projectName || '',
          category: data.category || '',
          youtubeUrl: data.youtubeUrl || '',
          facebookUrl: data.facebookUrl || '',
          thumbnail: data.thumbnail || PRESET_THUMBNAILS[0].url,
          uploadDate: dateStr,
          createdBy: data.createdBy || 'Admin',
          isFeatured: !!data.isFeatured
        };
      }) as ProjectVideo[];

      setVideos(vList);
      setVideosLoading(false);
    }, (error) => {
      console.error("Firestore sync project_videos error:", error);
      setVideosLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const trimmed = url.trim();
      let videoId = '';
      
      if (trimmed.includes('youtu.be/')) {
        const parts = trimmed.split('youtu.be/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }
      
      if (!videoId && trimmed.includes('/shorts/')) {
        const parts = trimmed.split('/shorts/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }

      if (!videoId && trimmed.includes('/live/')) {
        const parts = trimmed.split('/live/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }

      if (!videoId && trimmed.includes('/embed/')) {
        const parts = trimmed.split('/embed/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }

      if (!videoId && trimmed.includes('v=')) {
        const regWatch = /[?&]v=([^#&?]*)/;
        const matchWatch = trimmed.match(regWatch);
        if (matchWatch && matchWatch[1].length === 11) {
          videoId = matchWatch[1];
        }
      }

      if (!videoId) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
        const match = trimmed.match(regExp);
        if (match && match[2].length === 11) {
          videoId = match[2];
        }
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
    }
    return '';
  };

  const getFacebookEmbedUrl = (url: string) => {
    if (!url) return '';
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&t=0&autoplay=true`;
  };

  const handleOpenAddVideo = () => {
    setEditingVideo(null);
    setVideoTitle('');
    setVideoDescription('');
    setVideoProjectName('Tower 1');
    setVideoCategory('Construction Progress');
    setVideoYoutubeUrl('');
    setVideoFacebookUrl('');
    setVideoThumbnailUrl(PRESET_THUMBNAILS[0].url);
    setVideoIsFeatured(false);
    setVideoFormError(null);
    setVideoIsSubmitting(false);
    setShowVideoModal(true);
  };

  const handleOpenEditVideo = (v: ProjectVideo) => {
    setEditingVideo(v);
    setVideoTitle(v.title);
    setVideoDescription(v.description);
    setVideoProjectName(v.projectName);
    setVideoCategory(v.category);
    setVideoYoutubeUrl(v.youtubeUrl);
    setVideoFacebookUrl(v.facebookUrl);
    setVideoThumbnailUrl(v.thumbnail);
    setVideoIsFeatured(!!v.isFeatured);
    setVideoFormError(null);
    setVideoIsSubmitting(false);
    setShowVideoModal(true);
  };

  const saveVideoData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      setVideoFormError(language === 'bn' ? 'ভিডিও শিরোনাম আবশ্যক!' : 'Video Title is required!');
      return;
    }

    let ytUrl = videoYoutubeUrl.trim();
    if (ytUrl && !ytUrl.startsWith('http://') && !ytUrl.startsWith('https://')) {
      ytUrl = 'https://' + ytUrl;
    }

    let fbUrl = videoFacebookUrl.trim();
    if (fbUrl && !fbUrl.startsWith('http://') && !fbUrl.startsWith('https://')) {
      fbUrl = 'https://' + fbUrl;
    }

    if (!ytUrl && !fbUrl) {
      setVideoFormError(language === 'bn' 
        ? 'দয়া করে ইউটিউব অথবা ফেসবুক ভিডিওর যেকোনো একটি সঠিক লিংক দিন!' 
        : 'Please provide either a YouTube or a Facebook Video Link!');
      return;
    }

    setVideoFormError(null);
    setVideoIsSubmitting(true);

    const payload = {
      title: videoTitle.trim(),
      description: videoDescription.trim(),
      projectName: videoProjectName,
      category: videoCategory,
      youtubeUrl: ytUrl,
      facebookUrl: fbUrl,
      thumbnail: videoThumbnailUrl || PRESET_THUMBNAILS[0].url,
      isFeatured: videoIsFeatured,
      createdBy: 'Admin',
      uploadDate: serverTimestamp()
    };

    try {
      if (editingVideo) {
        await updateDoc(doc(db, 'project_videos', editingVideo.id), payload);
      } else {
        await addDoc(collection(db, 'project_videos'), payload);
      }
      setVideoIsSubmitting(false);
      setShowVideoModal(false);
    } catch (err: any) {
      setVideoIsSubmitting(false);
      const errMsg = err?.message || String(err);
      setVideoFormError(language === 'bn' 
        ? `ভিডিয়ো সংরক্ষণ ব্যর্থ হয়েছে: ${errMsg}` 
        : `Failed to save video: ${errMsg}`);
    }
  };

  const deleteVideoData = async (id: string) => {
    const confirmMsg = language === 'bn' 
      ? 'আপনি কি নিশ্চিত যে এই ভিডিওটি মুছে ফেলতে চান?' 
      : 'Are you sure you want to delete this project video?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteDoc(doc(db, 'project_videos', id));
    } catch (err) {
      console.error("Error deleting video:", err);
    }
  };

  const permanentNotices = notices?.filter(n => n.active && !n.expiryDate) || [];
  const activeBulletins = notices?.filter(n => n.active) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(language === 'bn' ? 'দয়া করে সব ফিল্ড পূরণ করুন' : 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Direct login trigger
      const success = await login(email, role, password);
      if (!success) {
        setError(language === 'bn' ? 'লগইন ব্যর্থ হয়েছে। ইমেল এবং পাসওয়ার্ড চেক করুন।' : 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrorMessage('');
    setError('');
    
    if (!forgotEmail) {
      setOtpErrorMessage(language === 'bn' ? 'দয়া করে আপনার নিবন্ধিত ইমেইল প্রবেশ করান' : 'Please enter your registered email');
      return;
    }

    setLoading(true);
    try {
      const emailLower = forgotEmail.trim().toLowerCase();
      const matched = userAccounts.find(
        ua => ua.email.toLowerCase() === emailLower && ua.role === selectedResetRole
      );

      if (!matched) {
        setOtpErrorMessage(
          language === 'bn' 
            ? `এই রোল (${selectedResetRole}) এবং ইমেইলের সাথে কোনো মিল পাওয়া যায়নি!` 
            : `No matching record found under the selected role (${selectedResetRole}) and email!`
        );
        setLoading(false);
        return;
      }

      // Generate a 6-digit robust OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // valid for 5 minutes

      // Store in Firestore live_data/otp_verifications for the verification process
      const docRef = doc(db, 'live_data', 'otp_verifications');
      const docSnap = await getDoc(docRef);
      let dataPayload: Record<string, any> = {};
      if (docSnap.exists()) {
        dataPayload = docSnap.data().data || {};
      }
      
      dataPayload[emailLower] = {
        otp: generatedOtp,
        expiresAt: expiresAt
      };

      await setDoc(docRef, { data: dataPayload }, { merge: true });

      // Clean notifications trigger or custom hooks
      await resetPassword(forgotEmail.trim());

      // Launch simulated sandbox outbox notification
      setSimulatedOtpNotification({
        otp: generatedOtp,
        email: forgotEmail.trim()
      });

      // Transition OTP phase view step!
      setOtpSentStep(true);

      // Save a silent success feedback
      setOtpErrorMessage('');
    } catch (err: any) {
      console.error(err);
      setOtpErrorMessage(err.message || (language === 'bn' ? 'পাসওয়ার্ড রিসেট লিংক পাঠাতে সমস্যা হয়েছে।' : 'Failed to dispatch password recovery email.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrorMessage('');
    
    if (!enteredOtp || enteredOtp.length !== 6) {
      setOtpErrorMessage(language === 'bn' ? 'দয়া করে ৬ সংখ্যার ওটিপি কোডটি লিখুন' : 'Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'live_data', 'otp_verifications');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setOtpErrorMessage(language === 'bn' ? 'ওটিপি ডাটা পাওয়া যায়নি!' : 'No active OTP verification session found!');
        setLoading(false);
        return;
      }

      const dataPayload = docSnap.data().data || {};
      const activeRecord = dataPayload[forgotEmail.trim().toLowerCase()];

      if (activeRecord) {
        if (activeRecord.otp === enteredOtp.trim()) {
          if (Date.now() < activeRecord.expiresAt) {
            // OTP is matched and valid! Proceed to reset password screen
            setOtpErrorMessage('');
            setOtpSentStep(false);
            setResetPasswordStep(true);
          } else {
            setOtpErrorMessage(language === 'bn' ? 'ওটিপি মেয়াদোত্তীর্ণ হয়ে গেছে! নতুন ওটিপি পাঠান।' : 'OTP code has expired! Please request a new one.');
          }
        } else {
          setOtpErrorMessage(language === 'bn' ? 'ভুল ওটিপি প্রবেশ করানো হয়েছে। দয়া করে আবার চেষ্টা করুন।' : 'Invalid OTP code! Please double-check and retry.');
        }
      } else {
        setOtpErrorMessage(language === 'bn' ? 'এই ইমেইলের জন্য কোনো ওটিপি সেশন পাওয়া যায়নি।' : 'No OTP session found for this email address.');
      }
    } catch (err: any) {
      console.error(err);
      setOtpErrorMessage(language === 'bn' ? 'ওটিপি যাচাইকরণে ত্রুটি হয়েছে।' : 'Error encountered during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrorMessage('');

    if (!newPasscode || newPasscode.length < 4) {
      setOtpErrorMessage(language === 'bn' ? 'পাসকোডটি অন্তত ৪ অক্ষরের হতে হবে' : 'Passcode must be at least 4 characters long');
      return;
    }

    if (newPasscode !== confirmNewPasscode) {
      setOtpErrorMessage(language === 'bn' ? 'পাসকোড দুটি মেলেনি!' : 'Passcodes do not match!');
      return;
    }

    setLoading(true);
    try {
      const matched = userAccounts.find(
        ua => ua.email.toLowerCase() === forgotEmail.trim().toLowerCase() && ua.role === selectedResetRole
      );

      if (matched) {
        // Execute real passcode change back to database
        updateUserPassword(matched.id, newPasscode);
        
        // Clean up OTP documentation from server references
        const docRef = doc(db, 'live_data', 'otp_verifications');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dataPayload = docSnap.data().data || {};
          delete dataPayload[forgotEmail.trim().toLowerCase()];
          await setDoc(docRef, { data: dataPayload }, { merge: true });
        }

        // Successfully updated!
        setResetPasswordStep(false);
        setForgotPasswordMode(false);
        setForgotEmail('');
        setEnteredOtp('');
        setNewPasscode('');
        setConfirmNewPasscode('');
        setSimulatedOtpNotification(null);
        setError(language === 'bn' ? 'আপনার পাসকোডটি সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসকোড দিয়ে প্রবেশ করুন।' : 'Your passcode has been updated successfully. Please login with your new credentials.');
      } else {
        setOtpErrorMessage(language === 'bn' ? 'অ্যাকাউন্ট মিলানো ব্যর্থ হয়েছে।' : 'Failed to map user account context.');
      }
    } catch (err: any) {
      console.error(err);
      setOtpErrorMessage(language === 'bn' ? 'পাসকোড পরিবর্তনে সমস্যা হয়েছে।' : 'Failed to change gate passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (selectedRole: 'Admin' | 'Resident' | 'Staff') => {
    setRole(selectedRole);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. Permanent Notice Announcement Scroller */}
      {permanentNotices.length > 0 && (
        <div className="bg-emerald-950/45 border-b border-emerald-900/40 h-10 flex items-center relative z-10 overflow-hidden shadow-inner select-none shrink-0">
          <div className="absolute left-0 top-0 bottom-0 px-4 bg-emerald-900 border-r border-[#D4AF37]/30 flex items-center gap-1.5 shadow-[2px_0_5px_rgba(0,0,0,0.5)] z-20">
            <Megaphone className="h-3.5 w-3.5 text-[#D4AF37] animate-bounce" />
            <span className="text-[9px] font-black tracking-widest text-[#D4AF37] uppercase font-mono">
              {language === 'bn' ? 'জরুরী নোটিশ' : 'ALERT TICKER'}
            </span>
          </div>
          
          <div className="w-full pl-36 flex items-center overflow-hidden">
            <div className="animate-marquee-scroll inline-block whitespace-nowrap text-lg font-semibold tracking-wide py-1">
              {permanentNotices.map((notice, index) => (
                <span key={notice.id} className="inline-flex items-center text-slate-200 hover:text-white">
                  <span className="font-extrabold text-[#D4AF37] uppercase font-mono">
                    [{notice.title}]
                  </span>
                  <span className="ml-2 pr-1 font-sans">{notice.content}</span>
                  {index < permanentNotices.length - 1 && (
                    <span className="mx-12 text-emerald-600 select-none">✦✦✦</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Brand & Utility Header Panel */}
      <header className="border-b border-emerald-950 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-900 border border-emerald-500/30 shadow-inner">
              <Building className="h-5.5 w-5.5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1 font-sans">
                {t.app_name}
              </h1>
              <p className="text-[10px] text-[#D4AF37] font-semibold tracking-wider font-mono">
                {language === 'bn' ? 'খেতাসার, কুমিল্লা • আধুনিক আবাসন গেটওয়ে' : 'Khetasar, Cumilla • Elite Smart Living Portal'}
              </p>
            </div>
          </div>

          {/* Bilingual Language Switcher with Admin Toggler */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (adminEditorActive) {
                  setAdminEditorActive(false);
                } else {
                  setShowPasscodeModal(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all uppercase border cursor-pointer font-bold ${
                adminEditorActive 
                  ? 'bg-amber-950/50 text-[#D4AF37] border-[#D4AF37]/50 shadow-lg shadow-amber-950/20' 
                  : 'bg-neutral-900 text-slate-400 border-emerald-950 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Shield className={`h-3.5 w-3.5 ${adminEditorActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span>
                {adminEditorActive 
                  ? (language === 'bn' ? 'এডমিন এডিটর: সচল' : 'Live Editor: ON') 
                  : (language === 'bn' ? 'এডমিন এডিটর' : 'Admin Editor')}
              </span>
            </button>

            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-emerald-950">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-black tracking-wider uppercase transition-all ${language === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-neutral-850'}`}
              >
                <Globe className="h-3 w-3" />
                <span>EN</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-black tracking-wider uppercase transition-all ${language === 'bn' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-neutral-850'}`}
              >
                <Globe className="h-3 w-3" />
                <span>বাংলা</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Split Body Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Highly Polished Society Info & Media desk */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="rounded-2xl border border-emerald-950 bg-neutral-950/40 p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
            
            {/* Gallery Navbar Control */}
            <div className="flex flex-wrap gap-2 border-b border-emerald-950 pb-4 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('3d')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === '3d' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{language === 'bn' ? '৩ডি প্রজেক্ট ভিউ' : '3D Project Render'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('construction')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'construction' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>{language === 'bn' ? 'নির্মাণ কাজের ছবি' : 'Construction Logs'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'messages' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-teal-400" />
                <span>{language === 'bn' ? 'নেতৃবৃন্দের বাণী' : 'Leadership desk'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notices')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'notices' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Megaphone className="h-3.5 w-3.5 text-amber-500" />
                <span>{language === 'bn' ? 'নোটিশ বোর্ড' : 'Notice Board'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'about' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>{language === 'bn' ? 'আমাদের সুবিধা (About)' : 'App Brochure'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'videos' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Video className="h-3.5 w-3.5 text-rose-500" />
                <span>{language === 'bn' ? 'প্রকল্প লাইভ ভিডিও' : 'Project Live Videos'}</span>
              </button>
            </div>

            {/* TAB CONTENT SCREEN */}
            <div className="pt-6">
              
              {/* TAB 1: 3D VIEW ARCHITECTURE */}
              {activeTab === '3d' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="relative rounded-xl border border-emerald-900/45 bg-neutral-950 overflow-hidden shadow-2xl aspect-video">
                    {/* Slides container */}
                    <div className="absolute inset-0 w-full h-full">
                      {parsed3dImages.map((imgUrl, i) => {
                        const isActive = i === currentSlide3d;
                        return (
                          <div
                            key={i}
                            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                              isActive 
                                ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' 
                                : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
                            }`}
                          >
                            <img
                              src={imgUrl || null}
                              alt={`3D Render Slide ${i + 1}`}
                              className={`w-full h-full object-cover select-none ${
                                isActive ? 'animate-ken-burns-zoom' : ''
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                    {/* Lower Status Bar Overlay */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs bg-black/75 backdrop-blur-md p-2 rounded border border-emerald-900/30 z-10">
                      <span className="font-mono text-emerald-400 font-bold">
                        ● {language === 'bn' 
                          ? `আধুনিক ৩ডি নকশার পরিকল্পিত প্রতিচ্ছবি (${currentSlide3d + 1}/${parsed3dImages.length})` 
                          : `Architectural 3D Virtual Concept Mockup (${currentSlide3d + 1}/${parsed3dImages.length})`}
                      </span>
                      <span className="text-[10px] text-[#D4AF37] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-amber-950/40 border border-[#D4AF37]/30">
                        {language === 'bn' ? 'প্রস্তাবিত' : 'PROPOSED STATE'}
                      </span>
                    </div>

                    {/* Carousel Navigation Indicators (Only if more than 1 image) */}
                    {parsed3dImages.length > 1 && (
                      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                        {parsed3dImages.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentSlide3d(i)}
                            className={`w-5 h-1.5 rounded-full transition-all cursor-pointer ${
                              i === currentSlide3d 
                                ? 'bg-[#D4AF37] w-8' 
                                : 'bg-slate-500/60 hover:bg-slate-300'
                            }`}
                            title={`Slide ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-emerald-950/15 border border-emerald-950 rounded-xl space-y-2 relative">
                    {adminEditorActive && (
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          type="button"
                          onClick={open3dModal}
                          className="flex items-center gap-1 text-[10px] bg-amber-950 font-bold border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-amber-900 rounded px-2.5 py-1 cursor-pointer"
                        >
                          <Settings className="h-3 w-3 animate-spin duration-1000" />
                          <span>{language === 'bn' ? '৩ডি প্রজেক্ট এডিট করুন' : 'Customize 3D Specs'}</span>
                        </button>
                      </div>
                    )}
                    <h3 className="text-xs font-bold text-[#D4AF37] font-mono tracking-wider uppercase flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {language === 'bn' 
                          ? (config.building3dTitleBn || "আস্থা টুইন টাওয়ার্স - স্থাপত্য মানদণ্ড") 
                          : (config.building3dTitleEn || "Astha Twin Towers - Architectural Highlights")}
                      </span>
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-300 pr-24">
                      {language === 'bn' 
                        ? (config.building3dDescBn || 'এটি খেতাসার, কুমিল্লায় নির্মিতব্য অঞ্চলের প্রথম দ্বৈত টাওয়ার বিশিষ্ট অভিজাত বহুতল আবাসন কমপ্লেক্স। উন্নতমানের গ্লাস ফেসাড, প্রতি ফ্লোরে ডাবল ভেন্টিলেশন, প্রতিটি ফ্ল্যাটে সবুজ বাউন্ডারি গার্ডেন, সর্বোচ্চ ভূমিকম্প প্রতিরোধক সহনশীলতা সম্পন্ন আন্তর্জাতিক মানের নির্মাণ ফর্মুলায় করা এই ভবনে থাকবে ৩টি ক্যাপসুল লিফট।')
                        : (config.building3dDescEn || 'Astha Twin Towers is Cumilla’s pioneer dual-tower premium luxury high-rise condominium complex located in Khetasar. Architected with high-strength triple glass structural facade, active safety protocols, earthquake resistance up to 7.8 Richter, 3 luxury spacious capsule elevators, and eco-friendly landscaping.')}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CONSTRUCTION LOG PHOTOS */}
              {activeTab === 'construction' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="relative rounded-xl border border-emerald-900/45 bg-neutral-950 overflow-hidden shadow-2xl aspect-video">
                    {/* Slides container */}
                    <div className="absolute inset-0 w-full h-full">
                      {parsedConstructionImages.map((imgUrl, i) => {
                        const isActive = i === currentSlideConstruction;
                        return (
                          <div
                            key={i}
                            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                              isActive 
                                ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto shadow-inner' 
                                : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
                            }`}
                          >
                            <img
                              src={imgUrl || null}
                              alt={`Construction Progress Slide ${i + 1}`}
                              className={`w-full h-full object-cover select-none ${
                                isActive ? 'animate-ken-burns-zoom' : ''
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                    {/* Lower Status Bar Overlay */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs bg-black/75 backdrop-blur-md p-2 rounded border border-emerald-900/30 z-10 font-sans">
                      <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        🛠 {language === 'bn' 
                          ? `সাইট নির্মাণ কাজ ও গুনমান অগ্রগতি (${currentSlideConstruction + 1}/${parsedConstructionImages.length})` 
                          : `Active Civil Construction Progress Log (${currentSlideConstruction + 1}/${parsedConstructionImages.length})`}
                      </span>
                      <span className="text-[10px] text-amber-500 uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-amber-950/40 border border-[#D4AF37]/30 shrink-0">
                        {language === 'bn' ? 'চলমান অগ্রগতি' : 'LIVE CONSTRUCTION'}
                      </span>
                    </div>

                    {/* Next and Prev floating buttons to quickly cycle logs if multiple */}
                    {parsedConstructionImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCurrentSlideConstruction(prev => (prev - 1 + parsedConstructionImages.length) % parsedConstructionImages.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-black/70 hover:bg-emerald-950 border border-emerald-900/50 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentSlideConstruction(prev => (prev + 1) % parsedConstructionImages.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-black/70 hover:bg-emerald-950 border border-emerald-900/50 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          ›
                        </button>
                      </>
                    )}

                    {/* Carousel Navigation Indicators (Only if more than 1 image) */}
                    {parsedConstructionImages.length > 1 && (
                      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                        {parsedConstructionImages.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentSlideConstruction(i)}
                            className={`w-5 h-1.5 rounded-full transition-all cursor-pointer ${
                              i === currentSlideConstruction 
                                ? 'bg-amber-400 w-8' 
                                : 'bg-slate-500/60 hover:bg-slate-300'
                            }`}
                            title={`Slide ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Progress Bar widget */}
                  <div className="p-4 bg-emerald-950/15 border border-emerald-950 rounded-xl space-y-3 relative">
                    {adminEditorActive && (
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          type="button"
                          onClick={openConstructionModal}
                          className="flex items-center gap-1 text-[10px] bg-amber-950 font-bold border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-amber-900 rounded px-2.5 py-1 cursor-pointer"
                        >
                          <Settings className="h-3 w-3" />
                          <span>{language === 'bn' ? 'অগ্রগতি এডিট করুন' : 'Edit Live Status'}</span>
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs pr-24">
                      <span className="font-bold text-slate-200">{language === 'bn' ? 'সার্বিক ভৌত অবকাঠামো নির্মাণ অগ্রগতি' : 'Overall Civil Engineering Progress'}</span>
                      <span className="font-mono text-[#D4AF37] font-bold">
                        {config.constructionPercent !== undefined ? config.constructionPercent : 85}% Completed
                      </span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-emerald-950/50">
                      <div 
                        className="bg-gradient-to-r from-emerald-600 to-amber-500 h-full rounded-full animate-pulse" 
                        style={{ width: `${config.constructionPercent !== undefined ? config.constructionPercent : 85}%` }} 
                      />
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pr-24">
                      {language === 'bn' 
                        ? (config.constructionDescBn || 'মাটির পাইলিং এবং ফুটিং বেইসের কাজ ১০০% সুরক্ষায় সমাপ্ত হয়েছে। ইতিমধ্যে প্রথম টাওয়ারের ১৩ম তলা এবং দ্বিতীয় টাওয়ারের ১১ম তলার ছাদ ঢালাইয়ের কাজ সম্পন্ন হয়েছে। গুণমান যাচাইকারী টিম দ্বারা প্রতি সপ্তাহে কংক্রিট পিউরিফিকেশন পরীক্ষা সম্পন্ন হয়।')
                        : (config.constructionDescEn || 'Sub-grade foundation and pile capping have been 100% completed. Currently, structural concrete slab castings of Tower 1 is completed up to the 13th tier, and Tower 2 is completed up to the 11th tier. Lab test compression checks are generated weekly to ensure ultimate reliability.')}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: LEADERS DESK WITH MESSAGES */}
              {activeTab === 'messages' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  
                  {leadersList.map((leader) => (
                    <div key={leader.id} className="p-4 bg-neutral-900/60 rounded-xl border border-emerald-950/40 flex flex-col sm:flex-row gap-4 items-start relative hover:border-emerald-900/40 transition-all">
                      {adminEditorActive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditLeader(leader)}
                            className="bg-neutral-950 border border-amber-500/30 hover:border-amber-500 text-[#D4AF37] text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            {language === 'bn' ? 'সংশোধন' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLeaderFromDesk(leader.id)}
                            className="bg-neutral-950 border border-rose-500/30 hover:border-rose-500 text-rose-500 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            {language === 'bn' ? 'মুছুন' : 'Delete'}
                          </button>
                        </div>
                      )}
                      {leader.photo ? (
                        <img 
                          src={leader.photo || null} 
                          alt={leader.nameEn} 
                          className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-emerald-900" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-emerald-700 to-amber-700 flex items-center justify-center font-bold text-white text-sm border-2 border-emerald-950">
                          {leader.initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white leading-none">
                            {language === 'bn' ? leader.nameBn : leader.nameEn}
                          </h4>
                          <span className="text-[9px] px-2 py-0.5 bg-amber-950/30 text-[#D4AF37] border border-amber-800/40 font-mono font-bold rounded uppercase">
                            {language === 'bn' ? leader.roleBn : leader.roleEn}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300 italic leading-relaxed pr-24">
                          &quot;{language === 'bn' ? leader.msgBn : leader.msgEn}&quot;
                        </p>
                      </div>
                    </div>
                  ))}

                  {adminEditorActive && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={openAddLeader}
                        className="flex items-center gap-1 text-[10px] bg-emerald-950 hover:bg-emerald-900 font-bold border border-emerald-500/50 text-emerald-400 rounded px-4 py-2 uppercase font-mono cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{language === 'bn' ? 'নতুন বক্তা যোগ করুন (+)' : 'Add Leader Address (+)'}</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: COMPREHENSIVE NOTICE BOARD LIST */}
              {activeTab === 'notices' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                      <Megaphone className="h-4 w-4 text-emerald-400" />
                      <span>{language === 'bn' ? 'সিস্টেম এবং সোসাইটি নোটিশসমূহ' : 'Official Communications & Advisories'}</span>
                    </h3>
                    {adminEditorActive && (
                      <button
                        type="button"
                        onClick={openLoginNoticeAdd}
                        className="flex items-center gap-1.5 text-[9px] bg-emerald-900 border border-emerald-500/50 hover:bg-emerald-800 font-bold text-white px-2.5 py-1 rounded cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{language === 'bn' ? '+ নোটিশ যোগ করুন' : '+ Post Notice'}</span>
                      </button>
                    )}
                  </div>

                  {activeBulletins.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-mono bg-neutral-900/30 rounded-xl border border-dashed border-emerald-950">
                      {language === 'bn' ? 'এই মুহূর্তে নোটিশ বোর্ডে নতুন কোনো নোটিশ নেই।' : 'No active bulletins listed at this moment.'}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-950">
                      {activeBulletins.map(notice => (
                        <div key={notice.id} className="p-4 rounded-xl border border-emerald-950/40 bg-neutral-900/45 hover:border-emerald-850 transition-all space-y-2 relative group">
                          {adminEditorActive && (
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openLoginNoticeEdit(notice)}
                                className="bg-neutral-950 border border-amber-500/30 hover:border-amber-500 text-[#D4AF37] text-[8px] font-bold px-1 rounded cursor-pointer"
                              >
                                {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(language === 'bn' ? 'Are you sure?' : 'Confirm delete?')) {
                                    deleteNotice(notice.id);
                                  }
                                }}
                                className="bg-neutral-950 border border-rose-500/30 hover:border-rose-500 text-rose-500 text-[8px] font-bold px-1 rounded cursor-pointer"
                              >
                                {language === 'bn' ? 'মুছুন' : 'Delete'}
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-between pr-24">
                            <span className="font-bold text-white text-xs">{notice.title}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                                notice.type === 'Emergency' 
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800/55' 
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800/55'
                              }`}>
                                {notice.type}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{notice.date}</span>
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{notice.content}</p>
                          {notice.image && (
                            <div className="mt-2 text-center">
                              <img 
                                src={notice.image || null} 
                                alt={notice.title} 
                                className="max-h-48 max-w-full rounded-lg object-cover mx-auto border border-emerald-950/45 shadow"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: DYNAMIC APP BROCHURE & FEATURES INDEX */}
              {activeTab === 'about' && (() => {
                const brochureFeatures = [
                  {
                    id: 'members',
                    titleEn: 'Member Registry & Smart Profiles',
                    titleBn: 'সদস্য রেজিস্ট্রি ও স্মার্ট প্রোফাইল',
                    icon: Users,
                    color: 'text-teal-400 border-teal-900/50 bg-teal-950/20',
                    badgeEn: 'Resident Gateway',
                    badgeBn: 'বাসিন্দা নিবন্ধন',
                    descEn: 'A fully centralized directory mapping every Flat Owner, Family Member, and Tenant across the Dual Towers (Blocks A & B). It enables self-service updates for contact information and modern profile configurations.',
                    descBn: 'আস্থা টুইন টাওয়ার্সের (ব্লক এ এবং বি) প্রতিটি ফ্ল্যাটের মালিক, ভাড়াটিয়া এবং পরিবারের সদস্যদের সেন্ট্রাল ডিরেক্টরি। এর মাধ্যমে সহজে নিজেদের যোগাযোগের তথ্য ও প্রোফাইল ছবি স্বয়ংক্রিয়ভাবে আপডেট করা যায়।',
                    benefitsEn: [
                      'Instant transparency with block-wise digital flat registers.',
                      'Immediate cross-communication with neighboring units in emergencies.',
                      'Secure authorization strictly guarded by admin approval protocols.'
                    ],
                    benefitsBn: [
                      'ফ্ল্যাট ভিত্তিক ডিজিটাল ডেটা থাকায় কমিটির জবাবদিহিতা ও শতভাগ স্বচ্ছতা তৈরি হয়।',
                      'জরুরি মুহূর্তে প্রতিবেশী ফ্ল্যাটের সাথে তাৎক্ষণিক যোগাযোগ স্থাপন।',
                      'এডমিন ভেরিফিকেশন সিস্টেম দ্বারা সম্পূর্ণ ফাইল ও ব্যক্তিগত তথ্যের নিরাপত্তা।'
                    ],
                    valueEn: 'Fosters a closely-knit, trusted, and digital-first neighborly community.',
                    valueBn: 'সকল অধিবাসীদের মধ্যে ঐক্যবদ্ধ, নিরাপদ এবং আধুনিক ডিজিটাল মেলবন্ধন তৈরি করে।'
                  },
                  {
                    id: 'finance',
                    titleEn: 'Ledgers & Automated Billing',
                    titleBn: 'আর্থিক হিসাবনিকাশ ও ফি আদায়',
                    icon: CreditCard,
                    color: 'text-amber-400 border-amber-900/50 bg-amber-950/20',
                    badgeEn: 'Automated Accounting',
                    badgeBn: 'স্বয়ংক্রিয় হিসাব',
                    descEn: 'Eliminates paper-based accounts. It automatically generates monthly maintenance dues, community utility fees, and special project funds. Tracks real-time payments and allows downloading of instant digital receipts.',
                    descBn: 'সনাতন কাগজের হিসাব খাতা বাতিল করে এটি স্বয়ংক্রিয়ভাবে প্রতি মাসের মেইনটেন্যান্স ফি, ইউটিলিটি চার্জ এবং প্রজেক্টের জরুরি ফান্ড হিসাব করে। অধিবাসীরা নিজেদের বকেয়া দেখে মুহূর্তেই রশিদ সংগ্রহ করতে পারেন।',
                    benefitsEn: [
                      'Provides real-time personal balance statements and transaction histories.',
                      'Secure digital ledgers leave zero room for accounting errors or transparency disputes.',
                      'Instant print-friendly or downloadable receipts for every paid quota.'
                    ],
                    benefitsBn: [
                      'বাসিন্দাগণ তাদের মোট বকেয়া, অগ্রিম এবং পূর্ববর্তী হিসাবের স্পষ্ট বিবরণ দেখতে পান।',
                      'ডিজিটাল ক্যাশলেজার থাকার কারণে হিসাবের কোনো গড়মিল বা তছরুপ হবার সুযোগ থাকে না।',
                      'ফি পরিশোধের সাথে সাথেই মোবাইলে কনফার্মেশন ও ডিজিটাল রসিদ ডাউনলোডের সুবিধা।'
                    ],
                    valueEn: 'Ensures absolute financial integrity and zero administrative delay.',
                    valueBn: 'সোসাইটির ফান্ড ব্যবস্থাপনায় শতভাগ সততা ও স্বচ্ছতা নিশ্চিত করে।'
                  },
                  {
                    id: 'notices',
                    titleEn: 'Smart Notice Board & Alerts',
                    titleBn: 'ডিজিটাল নোটিশবোর্ড ও লাইভ অ্যালার্ট',
                    icon: Megaphone,
                    color: 'text-rose-400 border-rose-900/50 bg-rose-950/20',
                    badgeEn: 'Live Broadcast',
                    badgeBn: 'তাৎক্ষণিক বার্তা',
                    descEn: 'A real-time bulletin center ensuring no important decision goes unseen. Key announcements are highlighted with color-coded tags and scrolling ticker bars on the login screen for instant attention.',
                    descBn: 'একটি রিয়েল-টাইম নোটিশ পোর্টাল যার সাহায্যে কমিটির গুরুত্বপূর্ণ নোটিশ সবার কাছে দ্রুত পৌঁছায়। জরুরি ঘোষণাগুলো ভিন্ন রঙে বিশেষভাবে চিহ্নিত থাকে এবং ওয়েবসাইটের ওপরে স্ক্রল আকারে সচল থাকে।',
                    benefitsEn: [
                      'Color category labels differentiate general alerts from high-priority developer memos.',
                      'Prevents verbal communication gaps and keeps all historical notices archived.',
                      'Responsive layout supports uploading dynamic diagrams and explanatory documents.'
                    ],
                    benefitsBn: [
                      'সাধারণ নোটিশ ও জরুরি সতর্কবার্তার মধ্যে পার্থক্য সহজে বুঝা যায়।',
                      'মৌখিক যোগাযোগের ভুল বোঝাবুঝি দূর করে এবং অতীতের সকল নোটিশ সংরক্ষিত থাকে।',
                      'নোটিশের সাথে প্রাসঙ্গিক ছবি বা নির্দেশাবলী যুক্ত করার আধুনিক সুবিধা।'
                    ],
                    valueEn: 'Drives maximum collaboration and awareness across Astha Twin Towers.',
                    valueBn: 'টাওয়ারের যেকোনো জরুরি সিদ্ধান্ত ও খবরাখবর তাৎক্ষণিকভাবে সবার কাছে পৌঁছে দেয়।'
                  },
                  {
                    id: 'visitors',
                    titleEn: 'Visitor & Gate Pass Register',
                    titleBn: 'ভিজিটর ও গেস্ট ম্যানেজমেন্ট',
                    icon: Shield,
                    color: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20',
                    badgeEn: 'Fortified Security',
                    badgeBn: 'স্মার্ট গেট প্রটোকল',
                    descEn: 'Digitizes building front-desk entrance diaries. Security staff logs visitor names, phone numbers, visiting flats, car numbers, entry reasons, and precise check-in/out timestamps.',
                    descBn: 'দারোয়ান বা গেটরক্ষকদের সনাতন খাতা পরিবর্তন করে ডিজিটালভাবে সকল অতিথি, ডেলিভারি কর্মী এবং গৃহকর্মীদের নাম, ফোন নম্বর, ফ্ল্যাট নম্বর, গাড়ির নম্বর ও প্রবেশের সময় নথিভুক্ত করার আধুনিক ব্যবস্থা।',
                    benefitsEn: [
                      'A fully searchable log database to audit building foot traffic.',
                      'Identifies delivery personnel, technicians, and temporary laborers block-wise.',
                      'Provides residents peace of mind with documented guest records.'
                    ],
                    benefitsBn: [
                      'কে কখন প্রবেশ করলো তা সহজে সার্চ ও মনিটর করার সুরক্ষিত ডেডিকেটেড ড্যাশবোর্ড।',
                      'ডেলিভারি ম্যান, টেকনিশিয়ান বা ক্যাজুয়াল শ্রমিকদের ব্লক-ভিত্তিক ট্র্যাকিং ব্যবস্থা।',
                      'সন্দোহভাজন প্রবেশকারীদের চিহ্নিত করা সহজ হয় এবং ভবনের সামগ্রিক নিরাপত্তা বাড়ে।'
                    ],
                    valueEn: 'Transforms the Twin Towers into a secure, gated digital fortress.',
                    valueBn: 'টাওয়ারকে সিসিটিভি ক্যামেরার পাশাপাশি ডিজিটাল সিকিউরিটি চাদরে আবৃত করে।'
                  },
                  {
                    id: 'complaints',
                    titleEn: 'Incident Box & Service Portal',
                    titleBn: 'মেরামত ও তাৎক্ষণিক অভিযোগ বক্স',
                    icon: AlertCircle,
                    color: 'text-indigo-400 border-indigo-900/50 bg-indigo-950/20',
                    badgeEn: 'Resident Care',
                    badgeBn: 'কমিউনিটি সেবা',
                    descEn: 'Allows residents to report physical maintenance issues (e.g., elevator glitches, pipe leaks, dynamic cleaning requirements) with photo uploads and direct priority levels.',
                    descBn: 'বাসিন্দাদের জন্য কমন স্পেসের সমস্যা (যেমন- লিফটের ক্রটি, পানির লাইনের লিকেজ, বা ময়লার সমস্যা) সরাসরি ছবি ও বিবরণ সহ কমিটির কাছে ডিজিটাল অভিযোগ বক্সে সাবমিট করার সুবিধা।',
                    benefitsEn: [
                      'Transparent ticket statuses from "Pending Review" to "In Progress" and "Resolved".',
                      'Eliminates verbal forgetfulness or lost complaint slips.',
                      'Holds the building maintenance team accountable with timestamps.'
                    ],
                    benefitsBn: [
                      'কমিটি অভিযোগটি কদ্দূর সমাধান করলো তা লাইভ ট্র্যাক করার অটোমেটেড ড্যাশবোর্ড।',
                      'সব ধরণের অভিযোগ লিখিত রেকর্ডে থাকায় তা এড়িয়ে যাওয়ার কোনো সুযোগ থাকে না।',
                      'দ্রুত ও গুণগত মানসম্পন্ন মেরামতের নিশ্চয়তা নিশ্চিত করা যায়।'
                    ],
                    valueEn: 'Guarantees that your complaints are heard, acted upon, and resolved fast.',
                    valueBn: 'বাসিন্দাদের জীবনযাত্রার মান উন্নত করতে দ্রুত সেবা ও সমাধান নিশ্চিত করে।'
                  },
                  {
                    id: 'staff',
                    titleEn: 'Security & Shift Register',
                    titleBn: 'নিরাপত্তা কর্মী ও শিফট রেজিস্টার',
                    icon: UserCheck,
                    color: 'text-sky-400 border-sky-900/50 bg-sky-950/20',
                    badgeEn: 'Workforce Hub',
                    badgeBn: 'কর্মী তদারকি',
                    descEn: 'Maintains comprehensive records for security personnel, cleaning squads, and technical staff. Logs salary details and manages robust, daily attendance logs with check-in/out timestamps.',
                    descBn: 'ভবনের সার্বক্ষণিক নিরাপত্তা প্রহরী, সুইপার এবং সুইমিংপুল-ফিটনেস ইনস্ট্রাক্টরদের বায়োডাটা, বেতন এবং প্রতিদিনের ডাবল-শিফট হাজিরা খাতা (চেক-ইন ও আউট সময় সহ) ট্র্যাক করার মডিউল।',
                    benefitsEn: [
                      'Ensures constant perimeter security coverage with verified shift logs.',
                      'Transparent salary disbursement ledgers correlated to active attendance days.',
                      'Quick lookups during emergency staff re-allocations.'
                    ],
                    benefitsBn: [
                      'কর্মীদের ডিউটি শিফট শতভাগ ট্র্যাকিং থাকায় ঢিলেমি বা অনুপস্থিতির সুযোগ থাকে না।',
                      'হাজিরা অনুযায়ী মাসের শেষ দিনে সঠিক বেতন প্রদান প্রক্রিয়া মেইনটেইন করা।',
                      'যেকোনো জরুরি পরিস্থিতিতে দ্রুত সিকিউরিটি স্পেশালিস্টদের খুঁজে বের করা।'
                    ],
                    valueEn: 'Maintains elite operational discipline and top-tier hospitality standards.',
                    valueBn: 'সোসাইটির সেবকদের পরিচালনা শৃঙ্খলা ও কর্তব্যপরায়ণতার শীর্ষে নিয়ে যায়।'
                  },
                  {
                    id: 'construction',
                    titleEn: 'Digital Twin & Expense Audit',
                    titleBn: 'প্রজেক্ট ডেভলপমেন্ট ও নির্মাণ ট্র্যাকার',
                    icon: Sparkles,
                    color: 'text-violet-400 border-violet-900/50 bg-violet-950/20',
                    badgeEn: 'Project Transparency',
                    badgeBn: 'নির্মাণ উন্নয়ন',
                    descEn: 'Tracks the construction progress of the twin towers in real-time. Logs building phases, budget allocations, expenditure ledger, and records of deposits contributed by owner members.',
                    descBn: 'ভবন নির্মাণাধীন বা ডেভলপমেন্ট ধাপে থাকলে এই ডিজিটাল ক্যাটাগরির মাধ্যমে প্রজেক্টের লাইভ অগ্রগতি, ব্যয়কৃত খরচের লেজার এবং সদস্যদের প্রদত্ত জমা টাকার পরিমাণ স্বচ্ছভাবে ট্র্যাক করা সম্ভব।',
                    benefitsEn: [
                      'Shows overall progress percentages alongside real progress photos.',
                      'Itemized materials expense ledger ensures maximum budgetary transparency.',
                      'Maintains absolute trust between developers, committee members, and future buyers.'
                    ],
                    benefitsBn: [
                      'প্রজেক্টের কাজের প্রকৃত অগ্রগতি ছবির মাধ্যমে ঘরে বসেই দেখার সুযোগ।',
                      'আইটেম অনুযায়ী রড, সিমেন্ট ও নির্মাণ ব্যয়ের স্পষ্ট ডিজিটাল হিসাব।',
                      'ভুল ধারণার অবসান ঘটিয়ে প্রজেক্টের দ্রুত বাস্তবায়ন ও সঠিক সময় চাবি হস্তান্তর।'
                    ],
                    valueEn: 'Bridges physical blueprints to absolute clarity of fund utilization.',
                    valueBn: 'প্রজেক্টের নির্মাণ শুরু থেকে ফ্ল্যাট হস্তান্তর পর্যন্ত আর্থিক ও নির্মাণ কাজের পরম স্বচ্ছতা।'
                  }
                ];

                const currentFeature = brochureFeatures[activeBrochureIndex] || brochureFeatures[0];
                const IconComponent = currentFeature.icon;

                return (
                  <div className="space-y-6 animate-fade-in text-xs">
                    {/* Dynamic Success Toast for offline brochure formulation */}
                    {showBrochureToast && (
                      <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-[#D4AF37] relative overflow-hidden flex items-start gap-3 animate-fade-in shadow-lg">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 animate-pulse">
                          <Award className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs font-sans text-white">
                            {language === 'bn' ? '🎉 ব্রোশিয়ার জেনারেশন সফল!' : '🎉 Brochure Formulated Successfully!'}
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-normal font-sans">
                            {language === 'bn' 
                              ? 'আপনার আস্থা টুইন টাওয়ার্সের স্মার্ট বুকলেট ফাইলটি ডাউনলোড হয়েছে। পিডিএফ আকারে সংরক্ষণের জন্য ফাইলটি ওপেন করে সরাসরি প্রিন্ট করুন।'
                              : 'The custom dual-tower booklet HTML file is downloaded. Double-click the file to open and instantly print to premium PDF format.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Header Banner inside Tab */}
                    <div className="p-5 rounded-xl bg-white border-2 border-emerald-950 shadow-[6px_6px_0px_0px_rgba(5,46,22,1)] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono font-black tracking-widest text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 font-black" />
                          {language === 'bn' ? 'আস্থা টুইন টাওয়ার সোসাইটি পরিচালনা পরিষদ' : 'Astha Twin Towers Management Committee'}
                        </span>
                        <h3 className="text-sm font-extrabold text-emerald-950 font-sans tracking-tight">
                          {language === 'bn' ? 'ফিচার নির্দেশিকা ও প্রফেশনাল ডিজিটাল বুশিয়ার' : 'Smart App Feature Index & Resident Guide'}
                        </h3>
                        <p className="text-[11.5px] text-emerald-900 font-medium leading-relaxed max-w-xl font-sans">
                          {language === 'bn' 
                            ? 'আমাদের আবাসন কমপ্লেক্সের সামগ্রিক নিরাপত্তা, হিসাবের স্বচ্ছতা, পারস্পরিক ভ্রাতৃত্ব ও টেকসই অটোমেশন নিশ্চিত করতে তৈরি এই পোর্টালের প্রধান মডিউল ও অধিবাসীদের জন্য প্রত্যক্ষ উপকারিতাসমূহ নিচে উপস্থাপন করা হলো।'
                            : 'Explore how our integrated management portal establishes airtight building security, complete fiscal transparency, and flawless maintenance dispatching.'}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border-2 border-emerald-950 text-center font-mono shadow-[2px_2px_0px_0px_rgba(5,46,22,1)]">
                          <span className="block text-[8px] text-emerald-800 font-black uppercase tracking-wider">{language === 'bn' ? 'মোট অনুচ্ছেদ' : 'INDEX SECTIONS'}</span>
                          <span className="text-xs font-black text-amber-800">{brochureFeatures.length} Modules</span>
                        </div>
                      </div>
                    </div>

                    {/* Double-Split Interactive Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      
                      {/* Left: Interactive Tab Index Menu */}
                      <div className="md:col-span-12 lg:col-span-5 space-y-2">
                        <div className="text-[10px] uppercase font-mono font-bold text-[#D4AF37] pb-1.5 border-b border-emerald-950/40 flex items-center justify-between">
                          <span>{language === 'bn' ? 'ফিচার ইনডেক্স (সূচিপত্র)' : 'BROCHURE TABLE OF CONTENTS'}</span>
                          <span className="text-[9px] text-slate-500 font-normal">{language === 'bn' ? 'ক্লিক করে জানুন' : 'Click to read details'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                          {brochureFeatures.map((feat, index) => {
                            const FeatIcon = feat.icon;
                            const isActive = activeBrochureIndex === index;
                            return (
                              <button
                                key={feat.id}
                                type="button"
                                onClick={() => setActiveBrochureIndex(index)}
                                className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer select-none group ${
                                  isActive
                                    ? 'bg-emerald-950/55 border-[#D4AF37]/80 text-white shadow-md shadow-emerald-950/50'
                                    : 'bg-neutral-900/40 border-emerald-950/40 text-slate-400 hover:text-white hover:border-emerald-900/60 hover:bg-neutral-900/80'
                                }`}
                              >
                                <div className={`p-2 rounded-lg border shrink-0 transition-transform ${
                                  isActive ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37] scale-105' : 'bg-neutral-950 border-emerald-950 text-slate-400 group-hover:scale-105'
                                }`}>
                                  <FeatIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider">0{index + 1} / {language === 'bn' ? feat.badgeBn : feat.badgeEn}</span>
                                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                                  </div>
                                  <p className="font-bold text-xs font-sans truncate tracking-tight">{language === 'bn' ? feat.titleBn : feat.titleEn}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Dynamic High-Contrast Editorial Content Page */}
                      <div className="md:col-span-12 lg:col-span-7 rounded-xl border border-emerald-900/30 bg-neutral-900/15 p-5 space-y-4 shadow-inner min-h-[360px] flex flex-col justify-between">
                        <div className="space-y-4">
                          {/* Feature Main Title Details */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2.5 rounded-xl border ${currentFeature.color}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="inline-block text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 uppercase tracking-widest mb-0.5 animate-pulse">
                                  {language === 'bn' ? currentFeature.badgeBn : currentFeature.badgeEn}
                                </span>
                                <h4 className="text-sm font-black text-white font-sans tracking-tight">
                                  {language === 'bn' ? currentFeature.titleBn : currentFeature.titleEn}
                                </h4>
                              </div>
                            </div>
                          </div>

                          {/* App Scope Description */}
                          <div className="space-y-2">
                            <p className="text-xs font-mono text-[#D4AF37] font-bold uppercase tracking-wider select-none">
                              {language === 'bn' ? '✦ মডিউলের বিবরণ ও লক্ষ্য' : '✦ Module Overview & Purpose'}
                            </p>
                            <p className="text-slate-300 leading-relaxed font-sans font-medium text-[11px] sm:text-xs">
                              {language === 'bn' ? currentFeature.descBn : currentFeature.descEn}
                            </p>
                          </div>

                          {/* Key Core Member Benefits */}
                          <div className="space-y-2 pt-2 bg-gradient-to-b from-neutral-950/20 to-transparent p-3 rounded-lg border border-emerald-950/25">
                            <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider select-none flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-[#D4AF37]" />
                              <span>{language === 'bn' ? 'বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ' : 'Core Resident Benefits'}</span>
                            </p>
                            <ul className="space-y-1.5 pl-0.5">
                              {(language === 'bn' ? currentFeature.benefitsBn : currentFeature.benefitsEn).map((benefit, bIndex) => (
                                <li key={bIndex} className="text-slate-300 flex items-start gap-2 font-sans font-medium text-[11px] leading-relaxed">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Value Proposition Statement */}
                          <div className="border-l-2 border-[#D4AF37] bg-[#D4AF37]/5 px-3 py-2.5 rounded-r">
                            <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-none">{language === 'bn' ? 'অভিজাত আবাসনের স্মার্ট মানদণ্ড' : 'Smart Living Standard'}</span>
                            <p className="text-[11px] text-[#D4AF37] font-serif italic leading-relaxed font-bold">
                              "{language === 'bn' ? currentFeature.valueBn : currentFeature.valueEn}"
                            </p>
                          </div>
                        </div>

                        {/* Interactive Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-emerald-950/40 text-[10px] font-mono">
                          <span className="text-slate-500 font-bold">
                            Astha Twin Towers • 2026
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleDownloadBrochureHtml}
                              className="px-3 py-1.5 rounded bg-amber-950/20 text-[#D4AF37] hover:text-white border border-[#D4AF37]/50 hover:bg-[#D4AF37]/20 hover:border-amber-400 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                            >
                              <span>{language === 'bn' ? '🖨️ প্রিন্ট ও বুশিয়ার ডাউনলোড' : '🖨️ Print & Download Booklet'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById('login-panel-anchor')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 rounded bg-emerald-900 border border-emerald-600/50 text-white font-bold hover:bg-emerald-800 transition-all cursor-pointer shadow hover:shadow-emerald-900/30"
                            >
                              {language === 'bn' ? 'লগইন করুন ➔' : 'Access Form ➔'}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'videos' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  
                  {/* Title Header area */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-emerald-950">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-emerald-400 animate-pulse" />
                        <span>
                          {language === 'bn' ? 'প্রকল্পের গুরুত্বপূর্ণ লাইভ ভিডিওসমূহ' : 'Project Live Media Hub'}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {language === 'bn' 
                          ? 'আস্থা টুইন টাওয়ার্স খেতাসার কোয়ার্টার নির্মাণ ও উন্নয়নকাজের সরাসরি ভিডিও সংগ্রহশালা।' 
                          : 'Official live progress streams, milestones, and architectural updates of the towers.'}
                      </p>
                    </div>

                    {adminEditorActive && (
                      <button
                        type="button"
                        onClick={handleOpenAddVideo}
                        className="flex items-center gap-1 text-[10px] bg-emerald-950 hover:bg-emerald-900 font-bold border border-emerald-500/50 text-emerald-400 rounded px-3 py-1.5 uppercase font-[#D4AF37] font-mono cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{language === 'bn' ? 'নতুন ভিডিও যোগ করুন' : 'Upload Video'}</span>
                      </button>
                    )}
                  </div>

                  {/* SEARCH AND FILTERS TOOLBAR */}
                  <div className="bg-neutral-950/45 border border-emerald-950 p-3 rounded-xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs font-sans">
                    {/* Search Input Box */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 font-bold" />
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-755/90 rounded-lg py-1.5 pl-9 pr-8 text-[11px] font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        placeholder={language === 'bn' ? 'শিরোনাম, প্রকল্প অথবা বিবরণী দিয়ে খুজুন...' : 'Search videos by title, project, or description...'}
                        value={videoSearchQuery}
                        onChange={(e) => setVideoSearchQuery(e.target.value)}
                      />
                      {videoSearchQuery && (
                        <button 
                          onClick={() => setVideoSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Category Horizontal Badges */}
                    <div className="flex gap-1 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
                      <button
                        onClick={() => setVideoSelectedCategory('All')}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-tight border transition-all cursor-pointer whitespace-nowrap ${
                          videoSelectedCategory === 'All' 
                            ? 'bg-emerald-700/80 text-white border-emerald-500' 
                            : 'bg-neutral-900 text-slate-400 border-slate-800 hover:bg-[#043327]/30 hover:text-white'
                        }`}
                      >
                        {language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Updates'}
                      </button>
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setVideoSelectedCategory(cat)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-tight border transition-all cursor-pointer whitespace-nowrap ${
                            videoSelectedCategory === cat 
                              ? 'bg-emerald-700/80 text-white border-emerald-500' 
                              : 'bg-neutral-900 text-slate-400 border-slate-800 hover:bg-[#043327]/30 hover:text-white'
                          }`}
                        >
                          {language === 'bn' 
                            ? (cat === 'Construction Progress' ? 'নির্মাণ অগ্রগতি' : 
                               cat === 'Architectural Tour' ? 'স্থাপত্য নকশা ট্যুর' : 
                               cat === 'Security Briefing' ? 'নিরাপত্তা তথ্য' : 
                               cat === 'Society Events' ? 'সোসাইটি অনুষ্ঠান' : 'সাধারণ কমপ্লেক্স') 
                            : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {videosLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-2 bg-neutral-950/20 border border-emerald-950 rounded-xl animate-pulse">
                      <div className="h-6 w-6 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin" />
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none">Syncing database collections...</span>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-emerald-950 bg-neutral-950/20">
                      <Video className="h-8 w-8 text-slate-700 animate-bounce mb-2" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{language === 'bn' ? 'কোন ভিডিও ফাইল নেই' : 'No Media Records Posted'}</h4>
                      <p className="text-[10px] text-slate-500 font-sans max-w-sm mt-1">
                        {language === 'bn' 
                          ? 'ডাটাবেজে কোন ভিডিও রেকর্ড যুক্ত করা হয়নি।' 
                          : 'There are currently no videos linked in the project directory.'}
                      </p>
                    </div>
                  ) : (() => {
                    const filtered = videos.filter(v => {
                      const matchesSearch = v.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
                                            v.description.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
                                            v.projectName.toLowerCase().includes(videoSearchQuery.toLowerCase());
                      const matchesCategory = videoSelectedCategory === 'All' || v.category === videoSelectedCategory;
                      return matchesSearch && matchesCategory;
                    });

                    // Pin Featured Video (If explicitly checked, or the absolute latest video)
                    const featuredVideo = filtered.find(v => v.isFeatured) || filtered[0];
                    const displayedVideos = filtered.filter(v => v.id !== (videoSelectedCategory === 'All' && videoSearchQuery === '' ? featuredVideo?.id : ''));

                    return (
                      <div className="space-y-4">
                        {/* FEATURED VIDEO SPOTLIGHT HERO CARD */}
                        {featuredVideo && videoSearchQuery === '' && videoSelectedCategory === 'All' && (
                          <div className="rounded-xl border border-emerald-950 bg-[#064e3b]/10 hover:border-emerald-900 transition-all p-4 shadow-xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Badge Overlay */}
                            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded bg-amber-500 border border-amber-600 px-1.5 py-0.5 text-[8px] font-bold text-slate-950 uppercase tracking-wider font-mono">
                              <Sparkles className="h-2.5 w-2.5 fill-slate-950 text-slate-950" />
                              <span>{language === 'bn' ? 'নির্বাচিত ছবি/ভিডিও' : 'Featured Spotlight'}</span>
                            </div>

                            {/* Left Video Thumbnail area */}
                            <div 
                              onClick={() => setActiveWatchVideo(featuredVideo)}
                              className="md:col-span-7 relative rounded-lg border border-slate-800 bg-neutral-900 overflow-hidden cursor-pointer group shadow-lg aspect-video"
                            >
                              <img 
                                src={featuredVideo.thumbnail} 
                                alt={featuredVideo.title} 
                                className="w-full h-full object-cover transition-transform duration-505 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-all flex items-center justify-center">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-600 group-hover:bg-emerald-500 group-hover:scale-110 flex items-center justify-center text-white shadow-xl transition-all border border-emerald-400">
                                  <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-white translate-x-0.5" />
                                </div>
                              </div>
                            </div>

                            {/* Right Video Info Area */}
                            <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1 font-mono text-[9px] uppercase font-bold">
                                  <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-900 px-1.5 py-0.5">
                                    {featuredVideo.projectName}
                                  </span>
                                  <span className="rounded bg-neutral-900 text-slate-400 border border-slate-800 px-1.5 py-0.5">
                                    {featuredVideo.category}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-white leading-normal line-clamp-2">
                                  {featuredVideo.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-normal line-clamp-3">
                                  {featuredVideo.description || (language === 'bn' ? 'কোন বিস্তারিত বিবরণ নেই।' : 'No descriptive overview recorded.')}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono border-t border-emerald-950/40 pt-2 text-slate-500">
                                <span>{featuredVideo.uploadDate}</span>
                                {adminEditorActive && (
                                  <div className="flex gap-1.5">
                                    <button 
                                      type="button"
                                      onClick={() => handleOpenEditVideo(featuredVideo)}
                                      className="text-amber-500 hover:text-amber-400 font-bold"
                                    >
                                      {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => deleteVideoData(featuredVideo.id)}
                                      className="text-rose-500 hover:text-rose-400 font-bold"
                                    >
                                      {language === 'bn' ? 'মুছুন' : 'Delete'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* OTHER VIDEOS GRID */}
                        {filtered.length === 0 ? (
                          <div className="p-4 text-center text-[10px] text-slate-500 font-mono bg-neutral-900/30 rounded-xl border border-dashed border-emerald-950">
                            {language === 'bn' ? 'ম্যাচিং কোন ভিডিও পাওয়া যায়নি।' : 'No matching video progress updates.'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-950">
                            {displayedVideos.map(video => (
                              <div key={video.id} className="p-3 rounded-lg border border-emerald-950/45 bg-neutral-900/40 hover:border-emerald-800 hover:scale-[1.01] transition-all flex flex-col space-y-2 relative group">
                                <div 
                                  onClick={() => setActiveWatchVideo(video)}
                                  className="relative aspect-video rounded-md bg-neutral-950 border border-emerald-950 overflow-hidden cursor-pointer shadow"
                                >
                                  <img 
                                    src={video.thumbnail} 
                                    alt={video.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <div className="h-8 w-8 rounded-full bg-emerald-600/95 group-hover:bg-emerald-500 flex items-center justify-center text-white border border-emerald-400/50">
                                      <Play className="h-3 w-3 fill-white translate-x-0.5" />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex gap-1.5 font-mono text-[8px] uppercase">
                                    <span className="text-emerald-400">{video.projectName}</span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-400">{video.category}</span>
                                  </div>
                                  <h4 className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                    {video.title}
                                  </h4>
                                </div>

                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-emerald-950/20 pt-2 mt-auto">
                                  <span>{video.uploadDate}</span>
                                  {adminEditorActive && (
                                    <div className="flex gap-2">
                                      <button 
                                        type="button"
                                        onClick={() => handleOpenEditVideo(video)}
                                        className="text-amber-500 hover:text-amber-400 font-bold"
                                      >
                                        {language === 'bn' ? 'সংশোধন' : 'Edit'}
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => deleteVideoData(video.id)}
                                        className="text-rose-500 hover:text-rose-400 font-bold"
                                      >
                                        {language === 'bn' ? 'মুছুন' : 'Delete'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Stats Banner card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'মোট টাওয়ার্স' : 'DUAL TOWERS'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">02 Blocks</span>
            </div>
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'ফ্ল্যাট সংখ্যা' : 'SOCIETY APARTMENTS'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">72 Units</span>
            </div>
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'পার্কিং স্পেস' : 'UNDERGROUND PARKING'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">48 Bays</span>
            </div>
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'জরুরী জেনারেটর' : 'BACKUP GENERATORS'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">550 KVA</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Ultra-Premium Security Login Panel Form */}
        <section id="login-panel-anchor" className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="rounded-3xl border-2 border-emerald-800/70 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.95),_inset_0_1px_2px_rgba(255,255,255,0.15),_0_0_100px_rgba(16,185,129,0.12)] hover:shadow-[0_45px_90px_rgba(0,0,0,1),_inset_0_1px_3px_rgba(255,255,255,0.25),_0_0_140px_rgba(212,175,55,0.25)] hover:border-[#D4AF37]/90 hover:-translate-y-2.5 transition-all duration-500 ease-out relative overflow-hidden group/login-card">
            
            {/* 3D ambient radial glow backdrops */}
            <span className="absolute -top-24 -left-24 h-48 w-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover/login-card:bg-emerald-500/20" />
            <span className="absolute -bottom-24 -right-24 h-48 w-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover/login-card:bg-[#D4AF37]/15" />
            
            {/* Glossy linear overlay reflection */}
            <div className="absolute top-0 left-0 w-full h-[150%] bg-gradient-to-b from-white/[0.03] via-transparent to-transparent -translate-y-1/2 pointer-events-none skew-y-12 transition-transform duration-700 group-hover/login-card:translate-y-[-40%]" />

            <div className="text-center pb-6 border-b border-emerald-950/70">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-850 to-neutral-950 border-2 border-amber-500/50 shadow-[0_8px_20px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.1)] ring-8 ring-amber-500/5 transform group-hover/login-card:scale-110 group-hover/login-card:rotate-[360deg] transition-all duration-700">
                <Shield className="h-7 w-7 text-[#D4AF37] filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]" />
              </div>
              <div className="mt-4">
                <h2 className="inline-block px-5 py-2 text-[18px] font-bold tracking-wide text-white bg-emerald-600 rounded-xl border border-emerald-500 shadow-lg font-sans uppercase">
                  {language === 'bn' ? 'সুরক্ষিত সিস্টেমে প্রবেশ' : 'Secure Resident Sign-In'}
                </h2>
              </div>
              <p className="mt-2 text-[16px] font-bold text-[#D4AF37] font-sans tracking-wide leading-relaxed filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {language === 'bn' ? 'খেতাসার, কুমিল্লা পোর্টালে স্বাগত' : 'Welcome to Khetasar, Cumilla Portal'}
              </p>
            </div>

            {!forgotPasswordMode ? (
              <>
                {/* Portal Role Selector pills */}
                <div className="space-y-2 mt-6 animate-fadeIn">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] font-mono flex items-center gap-1">
                    <Info className="h-3 w-3 text-emerald-400" />
                    <span>{language === 'bn' ? 'ইউজার রোল সিলেক্ট করুন' : 'SELECT SECURITY PORTAL ROLE'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-emerald-950">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('Admin')}
                      className={`rounded-md py-2 text-center text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer ${role === 'Admin' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('Resident')}
                      className={`rounded-md py-2 text-center text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer ${role === 'Resident' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      Resident
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('Staff')}
                      className={`rounded-md py-2 text-center text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer ${role === 'Staff' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      Staff
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-450 border-r-4">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                      <span className="font-sans font-semibold text-[11px]">{error}</span>
                    </div>
                  )}

                  {/* Email/ID Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                      {language === 'bn' ? 'রেজিস্টার্ড ইমেইল ঠিকানা' : 'Official Email Address'}
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail className="h-4 w-4 text-emerald-500" />
                      </div>
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@astha.com"
                        className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        {language === 'bn' ? 'সিকিউরিটি পাসকোড' : 'Gate Passcode'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordMode(true);
                          setForgotEmail(email);
                          setSelectedResetRole(role);
                          setOtpSentStep(false);
                          setResetPasswordStep(false);
                          setOtpErrorMessage('');
                        }}
                        className="text-[10px] text-[#D4AF37] hover:underline font-bold"
                      >
                        {language === 'bn' ? 'কোড ভুলে গেছেন?' : 'Forgot Passcode?'}
                      </button>
                    </div>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Key className="h-4 w-4 text-emerald-500" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* LogIn Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-lg border border-[#D4AF37]/35 bg-emerald-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-55"
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5 font-mono text-[10px]">
                        VERIFYING PERMIT CRIT...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 uppercase font-mono">
                        <UserCheck className="h-4 w-4 text-[#D4AF37]" />
                        <span>{language === 'bn' ? 'সিস্টেমে প্রবেশ করুন' : 'VALIDATE SECURITY ACCESS'}</span>
                      </span>
                    )}
                  </button>

                  {/* Sign Up / Registration Action Button */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-emerald-950/45"></div>
                    <span className="flex-shrink mx-4 text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                      {language === 'bn' ? 'অথবা' : 'OR'}
                    </span>
                    <div className="flex-grow border-t border-emerald-950/45"></div>
                  </div>

                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="flex w-full items-center justify-center rounded-lg border border-emerald-700/60 bg-emerald-900/10 hover:bg-emerald-900/30 py-3 text-xs font-mono font-black tracking-widest text-[#D4AF37] transition-all cursor-pointer"
                  >
                    <UserPlus className="mr-2 h-4 w-4 text-[#D4AF37]" />
                    <span>{language === 'bn' ? 'সাইন-আপ করুন (নতুন অ্যাকাউন্ট)' : 'CREATE ACCOUNT / SIGN UP'}</span>
                  </button>
                </form>

                {/* Route Transition Footer to Register */}
                <div className="text-center pt-2 border-t border-emerald-950/45 mt-3">
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {language === 'bn' 
                      ? 'নতুন অ্যাকাউন্ট খুলে আপনার ফ্ল্যাটের ডিজিটাল সেবা চালু করুন।' 
                      : "Open a new account to unlock your flat's digital services."}
                  </p>
                </div>
              </>
            ) : (
              /* SECURE OTP PASSWORD RESET WIZARD */
              <div className="space-y-4 animate-fadeIn mt-4">
                {/* Back to Login Link */}
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setOtpSentStep(false);
                    setResetPasswordStep(false);
                    setForgotEmail('');
                    setEnteredOtp('');
                    setNewPasscode('');
                    setConfirmNewPasscode('');
                    setOtpErrorMessage('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline font-bold mb-2 cursor-pointer"
                >
                  ← {language === 'bn' ? 'লগইন পেজে ফিরে যান' : 'Back to Login'}
                </button>

                <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider text-center border-b border-emerald-950 pb-2">
                  {resetPasswordStep 
                    ? (language === 'bn' ? 'নতুন পাসকোড সেট করুন' : 'SET NEW PASSWORD')
                    : (otpSentStep 
                      ? (language === 'bn' ? '৬-ডিজিট ওটিপি কোড দিন' : 'ENTER VERIFICATION OTP')
                      : (language === 'bn' ? 'পাসকোড পুনরুদ্ধার ফোরাম' : 'RESET SECURITY CODE'))}
                </h3>

                {otpErrorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-450 border-r-4">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span className="font-sans font-semibold text-[11px]">{otpErrorMessage}</span>
                  </div>
                )}

                {!otpSentStep && !resetPasswordStep && (
                  /* STEP 1: Enter email and choose role */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <p className="text-[11px] text-slate-405 leading-relaxed font-sans">
                      {language === 'bn'
                        ? 'আপনার অ্যাকাউন্ট রোল সিলেক্ট করে নিবন্ধিত ইমেইল ঠিকানাটি লিখুন। আমরা ঐ ইমেইলে ১টি ওয়ান-টাইম পাসওয়ার্ড (OTP) কোড পাঠাবো।'
                        : 'Select your registered portal role and input your Gmail address. We will verify your credentials and dispatch a 6-digit secure registration OTP.'}
                    </p>

                    {/* Reset Role Selector pills */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] font-mono block">
                        {language === 'bn' ? 'পুনরুদ্ধার রোল সিলেক্ট করুন' : 'SELECT RECOVERY PROFILE ROLE'}
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-emerald-950">
                        {(['Admin', 'Resident', 'Staff'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedResetRole(r)}
                            className={`rounded-md py-1.5 text-center text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${selectedResetRole === r ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        {language === 'bn' ? 'নিবন্ধিত জিমেইল ইমেইল' : 'Registered Gmail Address'}
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Mail className="h-4 w-4 text-amber-500" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="your-gmail@gmail.com"
                          className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded-lg border border-amber-600 bg-amber-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-amber-900/10 transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-55"
                    >
                      {loading ? (
                        <span className="font-mono text-[10px] uppercase">SENDING SECURE OTP...</span>
                      ) : (
                        <span className="flex items-center gap-1.5 uppercase font-mono">
                          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                          <span>{language === 'bn' ? 'নিরাপত্তা কোড পাঠান' : 'SEND SECURITY OTP'}</span>
                        </span>
                      )}
                    </button>
                  </form>
                )}

                {otpSentStep && !resetPasswordStep && (
                  /* STEP 2: Enter OTP Code */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {language === 'bn'
                        ? `আমরা ${forgotEmail} ঠিকানায় ৬ অঙ্কের একটি নিরাপত্তা কোড (OTP) পাঠিয়েছি। অনুগ্রহ করে ৫ মিনিটের মধ্যে সেটি নিচে এন্টার করুন।`
                        : `A 6-digit secure verification passcode has been generated for ${forgotEmail}. Please review your inbox and input it below (expires in 5 mins).`}
                    </p>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-450 font-mono block text-center tracking-widest">
                        {language === 'bn' ? '৬-ডিজিট নিরাপত্তা ওটিপি কোড লেখেন' : 'ENTER 6-DIGIT OTP CODE'}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="block w-44 mx-auto rounded-md border border-emerald-950 bg-neutral-950 py-2.5 text-center text-lg font-mono font-black tracking-[0.25em] text-emerald-400 placeholder-slate-800 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded-lg border border-emerald-600 bg-emerald-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-55"
                    >
                      {loading ? (
                        <span className="font-mono text-[10px] uppercase">VERIFYING OTP CODE...</span>
                      ) : (
                        <span className="flex items-center gap-1.5 uppercase font-mono">
                          <CheckCircle className="h-4 w-4 text-[#D4AF37]" />
                          <span>{language === 'bn' ? 'কোড যাচাই করুন' : 'VERIFY SECURITY CODE'}</span>
                        </span>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[9px] text-slate-450 hover:text-white font-mono uppercase tracking-wider underline cursor-pointer"
                      >
                        {language === 'bn' ? 'ওটিপি কোড পুনরায় পাঠান' : 'RESEND OTP CODE'}
                      </button>
                    </div>
                  </form>
                )}

                {resetPasswordStep && (
                  /* STEP 3: Enter New Passcode */
                  <form onSubmit={handleResetPasscode} className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {language === 'bn'
                        ? 'আপনার নিরাপত্তা ওটিপি সফলভাবে যাচাই করা হয়েছে! অনুগ্রহ করে আপনার প্রোফাইলের জন্য একটি নতুন পাসকোড নির্ধারণ করুন।'
                        : 'Your secure verification OTP has been verified successfully! Set a new strong Gate Passcode for your account profile.'}
                    </p>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        {language === 'bn' ? 'নতুন গেট পাসকোড' : 'New Gate Passcode'}
                      </label>
                      <input
                        type="password"
                        required
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        placeholder="••••••"
                        className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 px-3 text-xs text-white placeholder-slate-700 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        {language === 'bn' ? 'নতুন পাসকোড নিশ্চিত করুন' : 'Confirm New Passcode'}
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPasscode}
                        onChange={(e) => setConfirmNewPasscode(e.target.value)}
                        placeholder="••••••"
                        className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 px-3 text-xs text-white placeholder-slate-700 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded-lg border border-emerald-600 bg-emerald-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-55"
                    >
                      {loading ? (
                        <span className="font-mono text-[10px] uppercase">UPDATING GATE PASSCODE...</span>
                      ) : (
                        <span className="flex items-center gap-1.5 uppercase font-mono">
                          <UserCheck className="h-4 w-4 text-[#D4AF37]" />
                          <span>{language === 'bn' ? 'নতুন পাসকোড সেভ করুন' : 'SECURE NEW PASSWORD'}</span>
                        </span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          <div className="mt-4 p-4 rounded-xl bg-neutral-900/20 border border-emerald-950 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {language === 'bn' ? 'নিরাপত্তা মানদণ্ড অনুযায়ী সুরক্ষিত' : 'SECURITY STANDARDS COMPLIANT'}
          </div>


        </section>

      </main>

      {/* 4. Portal Footer Section */}
      <footer className="mt-auto border-t border-emerald-950/80 bg-neutral-950/40 py-6 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-slate-450 uppercase text-[10px] tracking-widest">
            © 2026 Astha Twin Towers Association • All Rights Reserved
          </p>
          <p className="text-[10px] text-slate-500 tracking-wide font-sans">
            {language === 'bn' ? 'কারিগরি সহায়তায়: আস্থা ইঞ্জিনিয়ারিং গ্রুপ' : 'Power Engineering Support: Astha Systems Group'}
          </p>
        </div>
      </footer>

      {/* SECURITY ACCESS CODE PROMPT */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#D4AF37]" />
                <span>{language === 'bn' ? 'এডমিন ভেরিফিকেশন অ্যাক্সেস' : 'Admin Security Access'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowPasscodeModal(false);
                  setPasscode('');
                  setPasscodeError('');
                }} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passcode === 'admin123') {
                setAdminEditorActive(true);
                setShowPasscodeModal(false);
                setPasscodeError('');
                setPasscode('');
              } else {
                setPasscodeError(language === 'bn' ? 'ভুল সিকিউরিটি কোড! পুনরায় চেষ্টা করুন।' : 'Incorrect security key. Hint: admin123');
              }
            }} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                  {language === 'bn' ? 'এডমিন সিকিউরিটি কোড লিখুন' : 'Enter Admin Passcode'}
                </label>
                <input
                  type="password"
                  required
                  placeholder="admin123"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                {passcodeError && <p className="text-[10px] text-rose-500 font-bold mt-1">{passcodeError}</p>}
                <p className="text-[9px] text-slate-500 italic mt-1 home-hint">
                  {language === 'bn' ? 'ডিমো এডমিন পাসকোড: admin123' : 'Demo administrator passcode is: admin123'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasscodeModal(false);
                    setPasscode('');
                    setPasscodeError('');
                  }}
                  className="px-3.5 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold border border-[#D4AF37]/35 rounded cursor-pointer"
                >
                  {language === 'bn' ? 'নিশ্চিত করুন' : 'Unlock Editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D RENDERING PANEL CONFIGURATION MODAL */}
      {show3dModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <span>{language === 'bn' ? '৩ডি প্রজেক্ট ভিউ কাস্টমাইজেশন' : 'Edit 3D Structural View'}</span>
              </h3>
              <button type="button" onClick={() => setShow3dModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={save3dCustomizations} className="space-y-4 text-xs font-sans">
              <div className="space-y-4 bg-neutral-900/60 p-4 rounded-lg border border-emerald-900/35">
                <label className="text-[10px] uppercase font-mono font-bold text-[#D4AF37] block">
                  {language === 'bn' ? 'ছবি গ্যালারি (একাধিক ছবি আপলোড)' : 'Image Gallery (Upload Multiple Images)'}
                </label>

                {/* CURRENT LIST GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-neutral-950/70 rounded-md border border-emerald-950/40">
                  {valBuilding3dImages.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                      {language === 'bn' ? 'কোনো ছবি আপলোড করা হয়নি' : 'No images uploaded yet'}
                    </div>
                  ) : (
                    valBuilding3dImages.map((img, idx) => (
                      <div key={idx} className="relative group aspect-video rounded overflow-hidden border border-slate-800 bg-neutral-900">
                        <img 
                          src={img} 
                          alt={`Render preview ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1 left-1 bg-black/75 text-emerald-400 font-mono text-[9px] px-1 rounded font-bold">
                          #{idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setValBuilding3dImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-red-650 hover:bg-rose-700 text-white rounded p-1 shadow transition-all cursor-pointer opacity-90 hover:scale-105"
                          title="Remove image"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* ADD ACTIONS */}
                <div className="space-y-2">
                  {/* Local file upload */}
                  <div className="flex items-center gap-3">
                    <label htmlFor="building-3d-upload-input" className="flex items-center gap-1.5 px-3 py-2 rounded bg-emerald-750 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                      <Upload className="h-3.5 w-3.5 text-amber-400" />
                      <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি যুক্ত করুন' : 'Attach from Local Computer'}</span>
                    </label>
                    <input
                      id="building-3d-upload-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 1000;
                              const MAX_HEIGHT = 1000;
                              let width = img.width;
                              let height = img.height;
                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                              setValBuilding3dImages(prev => [...prev, compressedDataUrl]);
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.readAsDataURL(file as any);
                        });
                      }}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">
                      {language === 'bn' ? '✓ একাধিক ফাইল নির্বাচন করতে পারেন' : '✓ Bulk select supported'}
                    </span>
                  </div>

                  {/* Add via Web URL */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'অনলাইন ছবির লিঙ্ক পেস্ট করুন...' : 'Paste image web URL here...'}
                      value={valBuilding3dNewUrl}
                      onChange={(e) => setValBuilding3dNewUrl(e.target.value)}
                      className="flex-grow rounded border border-emerald-950 bg-neutral-950 py-1.5 px-2.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (valBuilding3dNewUrl.trim()) {
                          setValBuilding3dImages(prev => [...prev, valBuilding3dNewUrl.trim()]);
                          setValBuilding3dNewUrl('');
                        }
                      }}
                      className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {language === 'bn' ? 'যুক্ত করুন' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Title (English)</label>
                  <input
                    type="text"
                    required
                    value={valBuilding3dTitleEn}
                    onChange={(e) => setValBuilding3dTitleEn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Title (বাংলা)</label>
                  <input
                    type="text"
                    required
                    value={valBuilding3dTitleBn}
                    onChange={(e) => setValBuilding3dTitleBn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Description (English)</label>
                <textarea
                  required
                  rows={3}
                  value={valBuilding3dDescEn}
                  onChange={(e) => setValBuilding3dDescEn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Description (বাংলা)</label>
                <textarea
                  required
                  rows={3}
                  value={valBuilding3dDescBn}
                  onChange={(e) => setValBuilding3dDescBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShow3dModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-555 font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Apply Specifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CIVIL WORK CONSTRUCTION MONITOR CONIFG MODAL */}
      {showConstructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>{language === 'bn' ? 'নির্মাণ কাজের তথ্য পরিবর্তন' : 'Edit Construction Milestones'}</span>
              </h3>
              <button type="button" onClick={() => setShowConstructionModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveConstructionCustomizations} className="space-y-4 text-xs font-sans">
              <div className="space-y-4 bg-neutral-900/60 p-4 rounded-lg border border-emerald-900/35 font-sans">
                <label className="text-[10px] uppercase font-mono font-bold text-[#D4AF37] block">
                  {language === 'bn' ? 'নির্মাণ কাজের ছবি গ্যালারি (একাধিক ছবি আপলোড)' : 'Construction Log Photo Gallery (Add Multiple Images)'}
                </label>

                {/* CURRENT LIST GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-neutral-950/70 rounded-md border border-emerald-950/40">
                  {valConstructionImages.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                      {language === 'bn' ? 'কোনো ছবি আপলোড করা হয়নি' : 'No images uploaded yet'}
                    </div>
                  ) : (
                    valConstructionImages.map((img, idx) => (
                      <div key={idx} className="relative group aspect-video rounded overflow-hidden border border-slate-800 bg-neutral-900">
                        <img 
                          src={img} 
                          alt={`Construction progress preview ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1 left-1 bg-black/75 text-emerald-400 font-mono text-[9px] px-1 rounded font-bold">
                          #{idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setValConstructionImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-rose-700 text-white rounded p-1 shadow transition-all cursor-pointer opacity-90 hover:scale-105"
                          title="Remove image"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* ADD ACTIONS */}
                <div className="space-y-2">
                  {/* Local file upload */}
                  <div className="flex items-center gap-3">
                    <label htmlFor="construction-upload-input" className="flex items-center gap-1.5 px-3 py-2 rounded bg-emerald-750 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                      <Upload className="h-3.5 w-3.5 text-amber-400" />
                      <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি যুক্ত করুন' : 'Attach from Local Computer'}</span>
                    </label>
                    <input
                      id="construction-upload-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        
                        const incomingLength = files.length;
                        if (valConstructionImages.length + incomingLength > 12) {
                          alert(language === 'bn' 
                            ? `সর্বোচ্চ ১২টি ছবি গ্যালারিতে রাখা সম্ভব। অতিরিক্ত ছবি যোগ করা যাবে না।`
                            : `Maximum of 12 images can be loaded in the gallery to ensure high performance.`
                          );
                        }

                        let unprocessed = incomingLength;
                        setConstructionProcessingCount(unprocessed);

                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              // Scale down to 600 max width/height for amazing speed, mobile optimization and tiny storage footprints
                              const MAX_WIDTH = 600;
                              const MAX_HEIGHT = 600;
                              let width = img.width;
                              let height = img.height;
                              if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                  }
                              } else {
                                  if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                  }
                              }
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              
                              // Compress to high-efficiency jpeg @ 0.40 (~12KB per image without losing structural features)
                              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.40);
                              setValConstructionImages(prev => {
                                if (prev.length >= 12) return prev;
                                return [...prev, compressedDataUrl];
                              });
                              
                              unprocessed = Math.max(0, unprocessed - 1);
                              setConstructionProcessingCount(unprocessed);
                            };
                            img.onerror = () => {
                              unprocessed = Math.max(0, unprocessed - 1);
                              setConstructionProcessingCount(unprocessed);
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.onerror = () => {
                            unprocessed = Math.max(0, unprocessed - 1);
                            setConstructionProcessingCount(unprocessed);
                          };
                          reader.readAsDataURL(file as any);
                        });
                      }}
                    />
                    <span className="text-[9px] text-slate-500 font-mono font-bold">
                      {language === 'bn' ? '✓ একাধিক ফাইল নির্বাচন করতে পারেন' : '✓ Bulk select supported'}
                    </span>
                  </div>

                  {/* Add via Web URL */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'অনলাইন ছবির লিঙ্ক পেস্ট করুন...' : 'Paste image web URL here...'}
                      value={valConstructionNewUrl}
                      onChange={(e) => setValConstructionNewUrl(e.target.value)}
                      className="flex-grow rounded border border-emerald-950 bg-neutral-950 py-1.5 px-2.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (valConstructionNewUrl.trim()) {
                          setValConstructionImages(prev => [...prev, valConstructionNewUrl.trim()]);
                          setValConstructionNewUrl('');
                        }
                      }}
                      className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer select-none"
                    >
                      {language === 'bn' ? 'যুক্ত করুন' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Progress Percentage (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={valConstructionPercent}
                    onChange={(e) => setValConstructionPercent(Number(e.target.value))}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Status Description (English)</label>
                <textarea
                  required
                  rows={3}
                  value={valConstructionDescEn}
                  onChange={(e) => setValConstructionDescEn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Status Description (বাংলা)</label>
                <textarea
                  required
                  rows={3}
                  value={valConstructionDescBn}
                  onChange={(e) => setValConstructionDescBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950 items-center">
                {constructionProcessingCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono animate-pulse mr-auto">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    {language === 'bn' 
                      ? `ছবি প্রসেস হচ্ছে (${constructionProcessingCount}টি বাকি)...` 
                      : `Processing images (${constructionProcessingCount} left)...`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowConstructionModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={constructionProcessingCount > 0}
                  className={`px-4 py-1.5 rounded border font-bold cursor-pointer transition-all ${
                    constructionProcessingCount > 0
                      ? 'bg-neutral-800 border-amber-500/30 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 border-[#D4AF37]/35 text-white hover:bg-emerald-500 hover:scale-[1.02]'
                  }`}
                >
                  {constructionProcessingCount > 0 
                    ? (language === 'bn' ? 'প্রসেস হচ্ছে...' : 'Processing...') 
                    : (language === 'bn' ? 'অগ্রগতি হালনাগাদ করুন' : 'Confirm Milestones')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEADERSHIP MEMBER OPINIONS MODAL */}
      {showLeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#D4AF37]" />
                <span>
                  {editingLeader 
                    ? (language === 'bn' ? 'বাণী সংশোধন করুন' : 'Configure Executive Speech') 
                    : (language === 'bn' ? 'নতুন বক্তা ও বাণী সংযোজন' : 'Add Executive Panelist')}
                </span>
              </h3>
              <button type="button" onClick={() => setShowLeaderModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveLeaderCustomization} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Initials (e.g. AR)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={leaderInitials}
                    onChange={(e) => setLeaderInitials(e.target.value.toUpperCase())}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Role/Designation (English)</label>
                  <input
                    type="text"
                    required
                    placeholder="SOCIETY PRESIDENT"
                    value={leaderRoleEn}
                    onChange={(e) => setLeaderRoleEn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-neutral-900/60 p-3.5 rounded-lg border border-emerald-900/35">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-300 block">Leader Profile Photo (নেতার ছবি)</label>
                  {leaderPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত ছবি ডিলিট করতে চান?' : 'Are you sure you want to delete this profile photograph?')) {
                          setLeaderPhoto('');
                        }
                      }}
                      className="text-[9px] text-red-500 hover:text-red-400 font-bold font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      [ {language === 'bn' ? 'ছবি ডিলিট' : 'Delete Photo'} ]
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste profile photo URL or upload from local drive..."
                  value={leaderPhoto || ''}
                  onChange={(e) => setLeaderPhoto(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2 px-3 text-white focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                />
                
                {/* Local file uploader wrapper */}
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="leader-upload-input" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-white font-semibold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                    <Upload className="h-3.5 w-3.5 text-amber-400 font-bold" />
                    <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি আপলোড' : 'Upload from Local Drive'}</span>
                  </label>
                  <input
                    id="leader-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setLeaderPhoto)}
                  />
                  {leaderPhoto?.startsWith('data:image') && (
                    <span className="text-[10px] text-emerald-400 font-mono">✓ Base64 Loaded</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Full Name (English)</label>
                  <input
                    type="text"
                    required
                    value={leaderNameEn}
                    onChange={(e) => setLeaderNameEn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">পদবি/পদমর্যাদা (বাংলা)</label>
                  <input
                    type="text"
                    required
                    placeholder="সভাপতি"
                    value={leaderRoleBn}
                    onChange={(e) => setLeaderRoleBn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">নাম (বাংলা)</label>
                <input
                  type="text"
                  required
                  value={leaderNameBn}
                  onChange={(e) => setLeaderNameBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Message Speech (English)</label>
                <textarea
                  required
                  rows={2}
                  value={leaderMsgEn}
                  onChange={(e) => setLeaderMsgEn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">বক্তব্য বাণী (বাংলা)</label>
                <textarea
                  required
                  rows={2}
                  value={leaderMsgBn}
                  onChange={(e) => setLeaderMsgBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowLeaderModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-555 font-bold cursor-pointer"
                >
                  {editingLeader ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes') : (language === 'bn' ? 'বাণী প্রকাশ করুন' : 'Publish Speech')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK LOGIN BOARD BULLETIN MODAL */}
      {showLoginNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950 font-mono">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-emerald-400" />
                <span>
                  {editingLoginNotice 
                    ? (language === 'bn' ? 'নোটিশ সংশোধন' : 'Edit Live Advisory') 
                    : (language === 'bn' ? 'নতুন নোটিশ পোস্ট' : 'Publish Urgent Bulletin')}
                </span>
              </h3>
              <button type="button" onClick={() => setShowLoginNoticeModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveLoginNotice} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Notice Heading</label>
                <input
                  type="text"
                  required
                  placeholder="Water shut down notice / গ্যাস মেরামত কাজ"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Bulletin Category</label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as Notice['type'])}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Announcement">Announcement (সাধারণ ঘোষণা)</option>
                  <option value="Emergency">Emergency (জরুরী নোটিশ)</option>
                  <option value="Meeting">Meeting (সাধারণ সভা)</option>
                </select>
              </div>

              <div className="space-y-2 bg-neutral-900/60 p-3.5 rounded-lg border border-emerald-900/35">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-300 block">Notice Attachment Image (নোটিশে ছবি যুক্ত করুন)</label>
                  {noticeImage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত এই নোটিশের ছবি ডিলিট বা রিমুভ করতে চান?' : 'Are you sure you want to remove the image attachment from this notice?')) {
                          setNoticeImage('');
                        }
                      }}
                      className="text-[9px] text-red-500 hover:text-red-400 font-bold font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      [ {language === 'bn' ? 'ছবি ডিলিট / রিমুভ' : 'Remove Image'} ]
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste notice attachment URL or upload from local drive..."
                  value={noticeImage}
                  onChange={(e) => setNoticeImage(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2 px-3 text-white focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                />
                
                {/* Local file uploader wrapper */}
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="notice-upload-input" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-white font-semibold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                    <Upload className="h-3.5 w-3.5 text-amber-400 font-bold" />
                    <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি আপলোড' : 'Upload from Local Drive'}</span>
                  </label>
                  <input
                    id="notice-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setNoticeImage)}
                  />
                  {noticeImage?.startsWith('data:image') && (
                    <span className="text-[10px] text-emerald-400 font-mono">✓ Base64 Loaded</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Notice Description Contents</label>
                <textarea
                  required
                  rows={4}
                  placeholder="write details here..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="block w-full rounded-md border border-[#D4AF37]/30 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowLoginNoticeModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-555 font-bold cursor-pointer"
                >
                  {editingLoginNotice ? (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Details') : (language === 'bn' ? 'বুলেটিন প্রকাশ করুন' : 'Announce Advisory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      {/* SIMULATED SMTP SECURE SANDBOX EMAIL/OTP OUTBOX DRAWER */}
      {simulatedOtpNotification && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl border border-amber-500/55 bg-neutral-950 p-5 shadow-2xl ring-4 ring-amber-500/10 animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-amber-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SECURE SMTP SANDBOX OUTBOX</span>
            </div>
            <button
              onClick={() => setSimulatedOtpNotification(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 space-y-2 text-xs font-sans">
            <div className="bg-neutral-900 p-2.5 rounded border border-emerald-950">
              <span className="block text-[9px] text-[#D4AF37] font-mono uppercase tracking-wider">Mail Delivery Dispatch Status</span>
              <span className="text-[11px] text-emerald-400 font-medium">Delivered to client mail server successfully!</span>
            </div>
            <div className="text-slate-350 space-y-1 bg-neutral-900/50 p-2.5 rounded border border-neutral-900">
              <p>
                <strong className="text-slate-400">Recipient Email:</strong>{' '}
                <span className="font-mono text-white text-[11px]">{simulatedOtpNotification.email}</span>
              </p>
              <p>
                <strong className="text-slate-400">Security Subject:</strong>{' '}
                <span className="text-white text-[11px]">Digital Society Gate Key Passcode Reset Recovery Code (OTP)</span>
              </p>
              <p className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between">
                <span className="font-bold text-amber-500">OTP Code:</span>
                <span className="font-mono text-base font-black px-3 py-1 bg-neutral-900 text-[#D4AF37] border border-[#D4AF37]/30 rounded tracking-widest select-all animate-pulse">
                  {simulatedOtpNotification.otp}
                </span>
              </p>
            </div>
            <p className="text-[9px] text-slate-500 font-mono italic leading-normal text-center pt-1">
              * This sandbox outbox intercepts real-time SMTP emails to display OTPs inside your current preview session instantly.
            </p>
          </div>
        </div>
      )}

      {/* 🎬 WATCH VIDEO POPUP OVERLAY MODAL */}
      {activeWatchVideo && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          
          <div className="w-full max-w-4xl bg-neutral-900 border border-emerald-950 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
            {/* Modal Heading Control bar */}
            <div className="bg-neutral-950 px-5 py-4 border-b border-emerald-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-bold">
                  {activeWatchVideo.projectName} • {activeWatchVideo.category}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setActiveWatchVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-neutral-900 transition-colors cursor-pointer"
                title="Close Player"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub Content Frame / Player layout */}
            <div className="aspect-video w-full bg-black relative">
              {activeWatchVideo.youtubeUrl ? (
                <iframe
                  className="w-full h-full border-none"
                  src={getYoutubeEmbedUrl(activeWatchVideo.youtubeUrl)}
                  title={activeWatchVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : activeWatchVideo.facebookUrl ? (
                <iframe
                  className="w-full h-full border-none"
                  src={getFacebookEmbedUrl(activeWatchVideo.facebookUrl) || undefined}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-900 border-t border-b border-emerald-950/20">
                  <span className="text-xs text-slate-300 font-sans mb-4 max-w-sm leading-relaxed px-4">
                    {language === 'bn' ? 'কোনো ভিডিও লিংক পাওয়া যায়নি।' : 'No playable link. Please check direct settings.'}
                  </span>
                </div>
              )}
            </div>

            {/* Video description text box footer */}
            <div className="bg-neutral-950 p-5 border-t border-emerald-950/60 space-y-2 max-h-[160px] overflow-y-auto">
              <h3 className="text-sm font-extrabold text-white leading-snug">{activeWatchVideo.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{activeWatchVideo.description}</p>
              <div className="text-[10px] text-emerald-500 font-mono mt-1">Uploaded Date: {activeWatchVideo.uploadDate}</div>
            </div>

          </div>
        </div>
      )}

      {/* 🛠️ UPLOAD / EDIT VIDEO DIALOG MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/45 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950 font-mono">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Video className="h-4 w-4 text-emerald-400" />
                <span>
                  {editingVideo 
                    ? (language === 'bn' ? 'ভিডিও তথ্য পরিবর্তন করুন' : 'Edit Project Video') 
                    : (language === 'bn' ? 'নতুন ভিডিও ফাইল যুক্ত করুন' : 'Register New Progress Video')}
                </span>
              </h3>
              <button type="button" onClick={() => setShowVideoModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {videoFormError && (
              <div className="p-3 bg-rose-950/30 border border-rose-900 text-rose-400 rounded text-xs">
                {videoFormError}
              </div>
            )}

            <form onSubmit={saveVideoData} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Video Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Tower 1 Concrete Slab Casting Complete / ছাঁদ ঢালাই"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Relative Project Spec</label>
                  <select
                    value={videoProjectName}
                    onChange={(e) => setVideoProjectName(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Tower 1">Tower A (Tower 1)</option>
                    <option value="Tower 2">Tower B (Tower 2)</option>
                    <option value="Twin Towers Complex">Twin Towers Complex (Compound)</option>
                    <option value="Underground Parking">Underground Double Basements</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Advisory Video Category</label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Feature Spotlight Pinned</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="videoIsFeatured"
                      checked={videoIsFeatured}
                      onChange={(e) => setVideoIsFeatured(e.target.checked)}
                      className="rounded border-emerald-950 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-neutral-900 cursor-pointer"
                    />
                    <label htmlFor="videoIsFeatured" className="text-[11px] text-slate-300 font-mono cursor-pointer select-none">
                      Pin Video to Highlights Top
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">YouTube Video URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or youtu.be"
                  value={videoYoutubeUrl}
                  onChange={(e) => setVideoYoutubeUrl(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Facebook Watch URL (Optional alternative)</label>
                <input
                  type="text"
                  placeholder="https://www.facebook.com/username/videos/xxx/"
                  value={videoFacebookUrl}
                  onChange={(e) => setVideoFacebookUrl(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Video Cover Thumbnail Unsplash Image</label>
                <select
                  value={videoThumbnailUrl}
                  onChange={(e) => setVideoThumbnailUrl(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none mb-1.5"
                >
                  {PRESET_THUMBNAILS.map(preset => (
                    <option key={preset.url} value={preset.url}>{preset.label}</option>
                  ))}
                </select>
                <div className="h-20 w-fit rounded-lg overflow-hidden border border-emerald-950/50">
                  <img src={videoThumbnailUrl} alt="Thumbnail preview" className="h-full aspect-video object-cover" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Detailed description / পরিমাপ ও বিবরণী</label>
                <textarea
                  rows={2}
                  placeholder="Briefly summarize what this live construction update covers..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950/40">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-3.5 py-2 rounded bg-neutral-900 text-slate-400 hover:text-white border border-slate-800 font-bold tracking-wider cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={videoIsSubmitting}
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {videoIsSubmitting ? '...' : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Confirm & Save')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


    </div>
  );
}
