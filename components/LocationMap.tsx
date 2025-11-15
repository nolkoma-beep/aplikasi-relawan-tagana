import React, { useState, useEffect } from 'react';
import MapIcon from './icons/MapIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentReportIcon from './icons/DocumentReportIcon';

// --- INTERFACES ---
interface DisasterReport {
    timestamp: string;
    nama: string;
    nia: string;
    jenisBencana: string;
    waktuBencana: string;
    lokasiBencana: string;
    lokasiCoords: string;
}

interface AttendanceRecord {
    timestamp: string;
    nama: string;
    nia: string;
    lokasi: string;
    waktuDatang: string;
}

// --- PENGATURAN URL SPREADSHEET ---
// PENTING: URL ini harus mengarah ke CSV dari Google Sheet Laporan Bencana
const DISASTER_REPORTS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=1608310799&single=true&output=csv';

// PENTING: URL ini harus mengarah ke CSV dari Google Sheet Absensi Piket
const ATTENDANCE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=56452246&single=true&output=csv';

// --- FUNGSI BANTUAN PARSE CSV ---
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


const LocationMap: React.FC = () => {
    const [disasterReports, setDisasterReports] = useState<DisasterReport[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch Laporan Bencana
                const disasterResponse = await fetch(DISASTER_REPORTS_URL);
                if (!disasterResponse.ok) throw new Error('Gagal memuat laporan bencana.');
                const disasterCsv = await disasterResponse.text();
                const disasterRows = disasterCsv.trim().split('\n').slice(1);
                const parsedDisasters = disasterRows.map(row => {
                    const cols = parseCsvRow(row);
                    return {
                        timestamp: cols[0] || '',
                        nama: cols[1] || '',
                        nia: cols[2] || '',
                        jenisBencana: cols[3] || '',
                        waktuBencana: cols[4] || '',
                        lokasiBencana: cols[5] || '',
                        lokasiCoords: cols[8] || '' // Asumsi kolom lokasi ada di index 8 (I)
                    };
                }).filter(report => report.lokasiCoords && report.lokasiCoords.includes(',')).reverse();
                setDisasterReports(parsedDisasters.slice(0, 15)); // Batasi 15 laporan terbaru

                // Fetch Absensi Piket
                const attendanceResponse = await fetch(ATTENDANCE_URL);
                if (!attendanceResponse.ok) throw new Error('Gagal memuat data absensi.');
                const attendanceCsv = await attendanceResponse.text();
                const attendanceRows = attendanceCsv.trim().split('\n').slice(1);
                const todayStr = new Date().toLocaleDateString('id-ID');

                const allAttendance = attendanceRows.map(row => {
                    const cols = parseCsvRow(row);
                    return {
                        timestamp: cols[0] || '',
                        nama: cols[1] || '',
                        nia: cols[2] || '',
                        lokasi: cols[3] || '',
                        waktuDatang: cols[4] || ''
                    };
                });
                
                const todaysAttendance = allAttendance.filter(att => {
                    try {
                        const attDate = new Date(att.waktuDatang.split(', ')[1]).toLocaleDateString('id-ID');
                        return attDate === todayStr && att.lokasi && att.lokasi.includes(',');
                    } catch (e) {
                        return false;
                    }
                }).reverse();
                
                setAttendanceRecords(todaysAttendance);

            } catch (err: any) {
                setError("Gagal memuat data. Periksa kembali URL Spreadsheet dan pastikan sudah dipublikasikan sebagai CSV.");
                console.error("Error fetching location data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 300000); // Refresh data setiap 5 menit
        return () => clearInterval(interval);
    }, []);
    
    const MapLinkButton = ({ coords }: { coords: string }) => (
        <a
            href={`https://www.google.com/maps?q=${coords}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex-shrink-0"
        >
            Lihat Peta
        </a>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <MapIcon className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Peta Lokasi Terpadu</h2>
                <p className="text-gray-500 mt-2">Pantau lokasi laporan bencana dan kehadiran anggota piket.</p>
            </div>

            {isLoading && <p className="text-center text-gray-600">Memuat data lokasi...</p>}
            {error && <p className="text-center text-red-600 p-4 bg-red-100 rounded-lg">{error}</p>}
            
            {!isLoading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Kolom Laporan Bencana */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center mb-4">
                            <DocumentReportIcon className="w-6 h-6 text-red-500 mr-3"/>
                            <h3 className="text-xl font-bold text-gray-800">Laporan Bencana Terbaru</h3>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {disasterReports.length > 0 ? disasterReports.map((report, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-grow">
                                            <p className="font-bold text-gray-900">{report.jenisBencana}</p>
                                            <p className="text-sm text-gray-600">{report.lokasiBencana}</p>
                                            <p className="text-xs text-gray-500 mt-1">Oleh: {report.nama} | {new Date(report.waktuBencana).toLocaleString('id-ID')}</p>
                                        </div>
                                        <MapLinkButton coords={report.lokasiCoords} />
                                    </div>
                                </div>
                            )) : <p className="text-gray-500">Tidak ada laporan bencana terbaru dengan data lokasi.</p>}
                        </div>
                    </div>

                    {/* Kolom Absensi Piket */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center mb-4">
                            <ClipboardListIcon className="w-6 h-6 text-green-500 mr-3"/>
                            <h3 className="text-xl font-bold text-gray-800">Kehadiran Piket Hari Ini</h3>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                           {attendanceRecords.length > 0 ? attendanceRecords.map((att, index) => (
                               <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                   <div className="flex justify-between items-start gap-4">
                                       <div className="flex-grow">
                                            <p className="font-bold text-gray-900">{att.nama}</p>
                                            <p className="text-sm text-gray-600">N.I.A: {att.nia}</p>
                                            <p className="text-xs text-gray-500 mt-1">Absen pada: {new Date(att.waktuDatang).toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' })}</p>
                                       </div>
                                       <MapLinkButton coords={att.lokasi} />
                                   </div>
                               </div>
                           )) : <p className="text-gray-500">Belum ada anggota yang absen piket hari ini dengan data lokasi.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationMap;
