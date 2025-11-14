
import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);

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
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
