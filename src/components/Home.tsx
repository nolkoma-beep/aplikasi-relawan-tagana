
import React from 'react';
import { Page } from '../types';
import DocumentReportIcon from './icons/DocumentReportIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';

interface HomeProps {
    setCurrentPage: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ setCurrentPage }) => {
  const features = [
    {
      page: Page.LAPORAN_BENCANA,
      title: 'Lapor Bencana',
      description: 'Laporkan kejadian bencana di sekitar Anda secara cepat dan akurat.',
      icon: DocumentReportIcon,
      color: 'bg-red-500',
    },
    {
      page: Page.LAPORAN_KEGIATAN,
      title: 'Lapor Kegiatan',
      description: 'Dokumentasikan dan laporkan kegiatan kerelawanan yang telah dilaksanakan.',
      icon: CalendarIcon,
      color: 'bg-blue-500',
    },
    {
      page: Page.ABSEN_PIKET,
      title: 'Absensi Piket',
      description: 'Catat kehadiran Anda saat bertugas piket dengan mudah.',
      icon: ClipboardListIcon,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="text-center">
      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-2">TAGANA KAB. SERANG</h2>
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Selamat Datang, Taruna Siaga Bencana!</h1>
        <p className="text-lg text-gray-600">Aplikasi ini didedikasikan untuk memudahkan koordinasi dan pelaporan dalam setiap aksi kemanusiaan.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <button
            key={feature.page}
            onClick={() => setCurrentPage(feature.page)}
            className="group text-left p-6 bg-white rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${feature.color} text-white mb-4`}>
              <feature.icon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">{feature.title}</h2>
            <p className="text-gray-600">{feature.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;