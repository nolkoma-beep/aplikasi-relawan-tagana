
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
const ATTENDANCE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=56452246&single=true&output=csv';
const DISASTER_REPORT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=1608310799&single=true&output=csv';
const ACTIVITY_REPORT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=798569145&single=true&output=csv';


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

// Fungsi parsing tanggal yang lebih canggih dan fleksibel
const parseDateFromString = (dateString: string): Date | null => {
    if (!dateString) return null;

    const cleanedString = dateString.trim();

    // Attempt 1: Standard new Date() constructor (handles ISO like YYYY-MM-DD)
    const standardDate = new Date(cleanedString);
    if (!isNaN(standardDate.getTime()) && cleanedString.includes('-')) {
        return standardDate;
    }

    // Attempt 2: Handle formats like DD/MM/YYYY or MM/DD/YYYY
    // Split by slash, dash, dot, or space
    const parts = cleanedString.split(/[\/\-\.\s]+/);
    
    // Cari bagian yang terlihat seperti tahun (4 digit)
    let yearIndex = -1;
    parts.forEach((p, i) => {
        if (/^\d{4}$/.test(p)) yearIndex = i;
    });

    if (yearIndex !== -1 && parts.length >= 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        
        // Format YYYY-MM-DD
        if (yearIndex === 0) {
            return new Date(p0, p1 - 1, p2);
        }
        
        // Format diakhiri Tahun (DD/MM/YYYY atau MM/DD/YYYY)
        if (yearIndex === 2) {
            const year = p2;
            let day, month;

            // Heuristik: Jika angka pertama > 12, pasti itu Tanggal (DD/MM/YYYY)
            if (p0 > 12) {
                day = p0;
                month = p1 - 1;
            } 
            // Heuristik: Jika angka kedua > 12, pasti itu Tanggal (MM/DD/YYYY)
            else if (p1 > 12) {
                month = p0 - 1;
                day = p1;
            }
            // Jika ambigu (misal 5/6/2024), default ke format Indonesia (DD/MM/YYYY)
            else {
                day = p0;
                month = p1 - 1;
            }
            
            // Cek waktu jika ada
            const timeMatch = cleanedString.match(/(\d{1,2}):(\d{2}):?(\d{2})?/);
            let hours = 0, minutes = 0, seconds = 0;
            if (timeMatch) {
                hours = parseInt(timeMatch[1], 10);
                minutes = parseInt(timeMatch[2], 10);
                seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
            }

            const result = new Date(year, month, day, hours, minutes, seconds);
            if (!isNaN(result.getTime())) return result;
        }
    }

    // Attempt 3: Format teks Indonesia ("30 Juli 2024")
    const monthMap: { [key: string]: number } = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
        'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'agu': 7, 'sep': 8, 'oct': 9, 'okt': 9, 'nov': 10, 'dec': 11, 'des': 11
    };
    
    const lowerStr = cleanedString.toLowerCase();
    for (const [mName, mIdx] of Object.entries(monthMap)) {
        if (lowerStr.includes(mName)) {
            const dayMatch = lowerStr.match(/(\d{1,2})/);
            const yearMatch = lowerStr.match(/(\d{4})/);
            if (dayMatch && yearMatch) {
                return new Date(parseInt(yearMatch[1]), mIdx, parseInt(dayMatch[1]));
            }
        }
    }

    console.warn(`Gagal mem-parsing tanggal: "${dateString}"`);
    return null;
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
    // Fungsi untuk membuat URL unik agar tidak di-cache (cache busting)
    const getNoCacheUrl = (url: string) => `${url}&t=${Date.now()}`;

    const fetchLatestAnnouncement = async () => {
        try {
            const response = await fetch(getNoCacheUrl(PENGUMUMAN_SPREADSHEET_URL));
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
            const response = await fetch(getNoCacheUrl(ATTENDANCE_URL));
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
                if (!columns || columns.length === 0) continue;
                
                // Coba parsing kolom pertama (biasanya timestamp Google Form)
                // Atau kolom waktuDatang jika menggunakan script custom
                const dateString = columns[0]; // Kolom pertama (Timestamp)
                
                if (dateString) {
                    const recordDate = parseDateFromString(dateString);
                    if (recordDate) {
                        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                            count++;
                        }
                    }
                }
            }
            setMonthlyAttendance(count);
        } catch (error) {
            console.error("Gagal mengambil data absensi:", error);
            setMonthlyAttendance(null); // Set ke null jika error
        } finally {
            setIsAttendanceLoading(false);
        }
    };

    const fetchYearlyDisasterReports = async () => {
        setIsDisasterLoading(true);
        try {
            const response = await fetch(getNoCacheUrl(DISASTER_REPORT_URL));
            if (!response.ok) throw new Error('Gagal memuat laporan bencana.');
            
            const csvText = await response.text();
            const currentYear = new Date().getFullYear();

            const rows = csvText.trim().split('\n').slice(1);
            let count = 0;
            for (const row of rows) {
                if (row.trim() === '') continue;
                const columns = parseCsvRow(row);
                if (!columns || columns.length === 0) continue;
                const timestamp = columns[0]; // Kolom pertama adalah timestamp
                if (timestamp) {
                    const recordDate = parseDateFromString(timestamp);
                    if (recordDate) {
                        if (recordDate.getFullYear() === currentYear) {
                            count++;
                        }
                    }
                }
            }
            setYearlyDisasterReports(count);
        } catch (error) {
            console.error("Gagal mengambil data laporan bencana:", error);
            setYearlyDisasterReports(null); // Set ke null jika error
        } finally {
            setIsDisasterLoading(false);
        }
    };

    const fetchYearlyActivityReports = async () => {
        setIsActivityLoading(true);
        try {
            const response = await fetch(getNoCacheUrl(ACTIVITY_REPORT_URL));
            if (!response.ok) throw new Error('Gagal memuat laporan kegiatan.');
            
            const csvText = await response.text();
            const currentYear = new Date().getFullYear();

            const rows = csvText.trim().split('\n').slice(1);
            let count = 0;
            for (const row of rows) {
                if (row.trim() === '') continue;
                const columns = parseCsvRow(row);
                if (!columns || columns.length === 0) continue;
                const timestamp = columns[0]; // Kolom pertama adalah timestamp
                if (timestamp) {
                    const recordDate = parseDateFromString(timestamp);
                    if (recordDate) {
                        if (recordDate.getFullYear() === currentYear) {
                            count++;
                        }
                    }
                }
            }
            setYearlyActivityReports(count);
        } catch (error) {
            console.error("Gagal mengambil data laporan kegiatan:", error);
            setYearlyActivityReports(null); // Set ke null jika error
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

  const renderStatCard = (
    isLoading: boolean,
    data: number | null,
    title: string,
    Icon: React.FC<{className?: string}>,
    colorClasses: { text: string; darkText: string }
  ) => {
      return (
          <>
              <div className="flex items-center mb-4">
                  <Icon className={`w-6 h-6 ${colorClasses.text} dark:${colorClasses.darkText} mr-3`} />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
              </div>
              {isLoading ? (
                  <p className="text-center text-gray-500 dark:text-gray-400">Memuat...</p>
              ) : data !== null ? (
                  <div className="text-center">
                      <p className={`text-5xl font-bold ${colorClasses.text} ${colorClasses.darkText}`}>{data}</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">Total {title.includes('Piket') ? 'Kehadiran' : 'Laporan'}</p>
                  </div>
              ) : (
                  <div className="text-center text-red-500 dark:text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm font-semibold">Gagal Memuat Data</p>
                  </div>
              )}
          </>
      );
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {renderStatCard(isAttendanceLoading, monthlyAttendance, 'Piket Bulan Ini', UsersIcon, { text: 'text-teal-600', darkText: 'dark:text-teal-400' })}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {renderStatCard(isDisasterLoading, yearlyDisasterReports, 'Bencana Tahun Ini', DocumentReportIcon, { text: 'text-red-600', darkText: 'dark:text-red-400' })}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {renderStatCard(isActivityLoading, yearlyActivityReports, 'Kegiatan Tahun Ini', CalendarIcon, { text: 'text-blue-600', darkText: 'dark:text-blue-400' })}
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
