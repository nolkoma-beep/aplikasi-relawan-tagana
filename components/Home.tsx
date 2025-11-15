import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import DocumentReportIcon from './icons/DocumentReportIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import PhoneIcon from './icons/PhoneIcon';
import UsersIcon from './icons/UsersIcon';

interface HomeProps {
    setCurrentPage: (page: Page) => void;
}

// Data & Tipe Data dari komponen lain
interface Pengumuman {
    tanggal: string;
    judul: string;
    isi: string;
    kategori: string;
}

const PENGUMUMAN_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=222245556&single=true&output=csv';
const ATTENDANCE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=1386561575&single=true&output=csv';
const DISASTER_REPORT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=1883301017&single=true&output=csv';
// PENTING: Ganti gid ini dengan gid dari sheet Laporan Kegiatan Anda
const ACTIVITY_REPORT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=1122334455&single=true&output=csv';


const emergencyContacts = [
    { name: 'BPBD Kab. Serang', number: '0254-123-456' },
    { name: 'Damkar Kab. Serang', number: '0254-113' },
    { name: 'Polres Serang', number: '0254-110' },
];

// Helper function untuk parsing CSV
const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
                currentField += '"';
                i++; 
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }
    result.push(currentField);
    return result;
};


const Home: React.FC<HomeProps> = ({ setCurrentPage }) => {
  const [latestAnnouncement, setLatestAnnouncement] = useState<Pengumuman | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [monthlyAttendance, setMonthlyAttendance] = useState<number | null>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  
  const [yearlyDisasterReports, setYearlyDisasterReports] = useState<number | null>(null);
  const [isDisasterLoading, setIsDisasterLoading] = useState(true);

  const [yearlyActivityReports, setYearlyActivityReports] = useState<number | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(true);


  useEffect(() => {
    const fetchLatestAnnouncement = async () => {
        try {
            const response = await fetch(PENGUMUMAN_SPREADSHEET_URL);
            if (!response.ok) throw new Error('Gagal memuat data pengumuman.');
            
            const csvText = await response.text();
            const rows = csvText.trim().split('\n').slice(1);
            if (rows.length > 0) {
                const latestRow = rows[rows.length - 1]; // Ambil baris terakhir sebagai yang terbaru
                const columns = parseCsvRow(latestRow);
                if (columns.length >= 4) {
                    setLatestAnnouncement({
                        tanggal: columns[0]?.trim() || '',
                        judul: columns[1]?.trim() || '',
                        isi: columns[2]?.trim() || '',
                        kategori: columns[3]?.trim() || 'Info',
                    });
                }
            }
        } catch (error) {
            console.error("Gagal mengambil pengumuman:", error);
            // Set pengumuman contoh jika gagal fetch
            setLatestAnnouncement({ tanggal: '25/07/2024', judul: 'Jadwal Piket Terbaru (Contoh)', isi: 'Jadwal piket bulan Agustus telah terbit...', kategori: 'Jadwal' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMonthlyAttendance = async () => {
        setIsAttendanceLoading(true);
        try {
            const response = await fetch(ATTENDANCE_URL);
            if (!response.ok) throw new Error('Gagal memuat data absensi.');
            
            const csvText = await response.text();
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const rows = csvText.trim().split('\n').slice(1);
            let count = 0;
            for (const row of rows) {
                if (row.trim() === '') continue;
                const columns = parseCsvRow(row);
                const timestamp = columns[0]; // Kolom pertama adalah timestamp
                if (timestamp) {
                    const recordDate = new Date(timestamp);
                    if (!isNaN(recordDate.getTime())) {
                        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                            count++;
                        }
                    }
                }
            }
            setMonthlyAttendance(count);
        } catch (error) {
            console.error("Gagal mengambil data absensi:", error);
            setMonthlyAttendance(0);
        } finally {
            setIsAttendanceLoading(false);
        }
    };

    const fetchYearlyDisasterReports = async () => {
        setIsDisasterLoading(true);
        try {
            const response = await fetch(DISASTER_REPORT_URL);
            if (!response.ok) throw new Error('Gagal memuat laporan bencana.');
            
            const csvText = await response.text();
            const currentYear = new Date().getFullYear();

            const rows = csvText.trim().split('\n').slice(1);
            let count = 0;
            for (const row of rows) {
                if (row.trim() === '') continue;
                const columns = parseCsvRow(row);
                const timestamp = columns[0]; // Kolom pertama adalah timestamp
                if (timestamp) {
                    const recordDate = new Date(timestamp);
                    if (!isNaN(recordDate.getTime())) {
                        if (recordDate.getFullYear() === currentYear) {
                            count++;
                        }
                    }
                }
            }
            setYearlyDisasterReports(count);
        } catch (error) {
            console.error("Gagal mengambil data laporan bencana:", error);
            setYearlyDisasterReports(0);
        } finally {
            setIsDisasterLoading(false);
        }
    };

    const fetchYearlyActivityReports = async () => {
        setIsActivityLoading(true);
        try {
            const response = await fetch(ACTIVITY_REPORT_URL);
            if (!response.ok) throw new Error('Gagal memuat laporan kegiatan.');
            
            const csvText = await response.text();
            const currentYear = new Date().getFullYear();

            const rows = csvText.trim().split('\n').slice(1);
            let count = 0;
            for (const row of rows) {
                if (row.trim() === '') continue;
                const columns = parseCsvRow(row);
                const timestamp = columns[0]; // Kolom pertama adalah timestamp
                if (timestamp) {
                    const recordDate = new Date(timestamp);
                    if (!isNaN(recordDate.getTime())) {
                        if (recordDate.getFullYear() === currentYear) {
                            count++;
                        }
                    }
                }
            }
            setYearlyActivityReports(count);
        } catch (error) {
            console.error("Gagal mengambil data laporan kegiatan:", error);
            setYearlyActivityReports(0);
        } finally {
            setIsActivityLoading(false);
        }
    };


    fetchLatestAnnouncement();
    fetchMonthlyAttendance();
    fetchYearlyDisasterReports();
    fetchYearlyActivityReports();
  }, []);

  const features = [
    {
      page: Page.ABSEN_PIKET,
      title: 'Absensi Piket',
      description: 'Catat kehadiran Anda saat bertugas piket dengan mudah.',
      icon: ClipboardListIcon,
      color: 'bg-green-500',
    },
    {
      page: Page.LAPORAN_BENCANA,
      title: 'Lapor Bencana',
      description: 'Laporkan kejadian bencana di sekitar Anda secara cepat.',
      icon: DocumentReportIcon,
      color: 'bg-red-500',
    },
    {
      page: Page.LAPORAN_KEGIATAN,
      title: 'Lapor Kegiatan',
      description: 'Dokumentasikan kegiatan kerelawanan yang telah dilaksanakan.',
      icon: CalendarIcon,
      color: 'bg-blue-500',
    },
  ];
  
  const getCategoryClass = (kategori: string) => {
    switch (kategori.toUpperCase()) {
        case 'PENTING': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case 'JADWAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case 'INFO': default: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <img 
          src="https://iili.io/f9CMskX.png" 
          alt="Logo TAGANA" 
          className="mx-auto h-24 w-auto mb-4" 
        />
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">TAGANA KABUPATEN SERANG</h2>
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">Selamat Datang, Taruna Siaga Bencana!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Aplikasi ini didedikasikan untuk memudahkan koordinasi dan pelaporan dalam setiap aksi kemanusiaan.</p>
      </div>

      {/* Pengumuman Terbaru */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <InformationCircleIcon className="w-6 h-6 text-yellow-500 mr-3"/>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Pengumuman Terbaru</h2>
        </div>
        {isLoading ? <p className="text-gray-500 dark:text-gray-400">Memuat pengumuman...</p> : 
          latestAnnouncement ? (
            <div>
              <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getCategoryClass(latestAnnouncement.kategori)}`}>
                      {latestAnnouncement.kategori}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{latestAnnouncement.tanggal}</p>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{latestAnnouncement.judul}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 truncate">{latestAnnouncement.isi}</p>
              <button onClick={() => setCurrentPage(Page.PENGUMUMAN)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm mt-3">
                Lihat Semua Pengumuman &rarr;
              </button>
            </div>
          ) : <p className="text-gray-500 dark:text-gray-400">Tidak ada pengumuman baru.</p>
        }
      </div>

      {/* Rekap Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rekap Piket Bulanan */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
                <UsersIcon className="w-6 h-6 text-teal-500 mr-3"/>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Piket Bulan Ini</h2>
            </div>
            {isAttendanceLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Memuat...</p>
            ) : (
                <div className="text-center">
                    <p className="text-5xl font-bold text-teal-600 dark:text-teal-400">{monthlyAttendance ?? 0}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Total Kehadiran</p>
                </div>
            )}
        </div>

        {/* Rekap Bencana Tahunan */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
                <DocumentReportIcon className="w-6 h-6 text-red-500 mr-3"/>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Bencana Tahun Ini</h2>
            </div>
            {isDisasterLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Memuat...</p>
            ) : (
                <div className="text-center">
                    <p className="text-5xl font-bold text-red-600 dark:text-red-400">{yearlyDisasterReports ?? 0}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Total Laporan</p>
                </div>
            )}
        </div>
        
        {/* Rekap Kegiatan Tahunan */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
                <CalendarIcon className="w-6 h-6 text-blue-500 mr-3"/>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Kegiatan Tahun Ini</h2>
            </div>
            {isActivityLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Memuat...</p>
            ) : (
                <div className="text-center">
                    <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{yearlyActivityReports ?? 0}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Total Laporan</p>
                </div>
            )}
        </div>
      </div>
      
      {/* Fitur Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <button
            key={feature.page}
            onClick={() => setCurrentPage(feature.page)}
            className="group text-left p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl dark:hover:shadow-blue-500/20 transform hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${feature.color} text-white mb-4`}>
              <feature.icon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">{feature.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
          </button>
        ))}
      </div>
      
      {/* Kontak Darurat */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Kontak Darurat</h2>
          <ul className="space-y-3">
              {emergencyContacts.map(contact => (
                   <li key={contact.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{contact.name}</span>
                      <a href={`tel:${contact.number.replace(/-/g, '')}`} className="flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                          <PhoneIcon className="w-4 h-4 mr-2" />
                          {contact.number}
                      </a>
                  </li>
              ))}
          </ul>
           <button onClick={() => setCurrentPage(Page.PANDUAN_DARURAT)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm mt-4 w-full text-center">
                Lihat Panduan Lengkap & Kontak Lainnya &rarr;
            </button>
      </div>

    </div>
  );
};

export default Home;