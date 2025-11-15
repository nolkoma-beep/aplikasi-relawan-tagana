
import React, { useState, useEffect } from 'react';
import { Page } from './types';
import Navbar from './components/Navbar';
import Home from './components/Home';
import DisasterReportForm from './components/DisasterReportForm';
import ActivityReportForm from './components/ActivityReportForm';
import AttendanceForm from './components/AttendanceForm';
import OrgStructure from './components/OrgStructure';
import MemberDatabase from './components/MemberDatabase';
import InfoCenter from './components/InfoCenter';
import EmergencyGuide from './components/EmergencyGuide';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPrefs = window.localStorage.getItem('theme');
      if (storedPrefs === 'light' || storedPrefs === 'dark') {
        return storedPrefs;
      }
      const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (userMedia.matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);


  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return <Home setCurrentPage={setCurrentPage} />;
      case Page.LAPORAN_BENCANA:
        return <DisasterReportForm />;
      case Page.LAPORAN_KEGIATAN:
        return <ActivityReportForm />;
      case Page.ABSEN_PIKET:
        return <AttendanceForm />;
      case Page.PENGUMUMAN:
        return <InfoCenter />;
      case Page.PANDUAN_DARURAT:
        return <EmergencyGuide />;
      case Page.SUSUNAN_PENGURUS:
        return <OrgStructure />;
      case Page.DATA_BASE_ANGGOTA:
        return <MemberDatabase />;
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} theme={theme} setTheme={setTheme} />
      <main className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;