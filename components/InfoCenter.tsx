import React, { useState, useEffect } from 'react';
import InformationCircleIcon from './icons/InformationCircleIcon';

interface Pengumuman {
    tanggal: string;
    judul: string;
    isi: string;
    kategori: string;
}

// PENTING: Buat Google Sheet baru untuk pengumuman dengan kolom: Tanggal, Judul, Isi, Kategori.
// Lalu publikasikan sebagai CSV dan ganti URL di bawah ini.
const PENGUMUMAN_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=222245556&single=true&output=csv';

// Helper function to parse a single CSV row, handling quoted fields.
const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
                // This is an escaped quote, add a single quote to the field
                currentField += '"';
                i++; // Skip the next quote
            } else {
                // This is a starting or ending quote
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of a field
            result.push(currentField);
            currentField = '';
        } else {
            // Regular character, add to the field
            currentField += char;
        }
    }
    // Add the last field
    result.push(currentField);
    return result;
};

const InfoCenter: React.FC = () => {
    const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPengumuman = async () => {
            try {
                const response = await fetch(PENGUMUMAN_SPREADSHEET_URL);
                if (!response.ok) {
                    throw new Error('Gagal mengambil data. Pastikan URL benar dan sheet sudah dipublikasikan.');
                }

                const csvText = await response.text();
                const parsedPengumuman: Pengumuman[] = [];
                const rows = csvText.trim().split('\n').slice(1);

                for (const row of rows) {
                    if (row.trim() === '') continue;
                    const columns = parseCsvRow(row);
                    if (columns.length >= 4) {
                        parsedPengumuman.push({
                            tanggal: columns[0]?.trim() || '',
                            judul: columns[1]?.trim() || '',
                            isi: columns[2]?.trim() || '',
                            kategori: columns[3]?.trim() || 'Info',
                        });
                    }
                }
                setPengumumanList(parsedPengumuman.reverse()); // Menampilkan yang terbaru di atas
            } catch (err: any) {
                setError(err.message);
                console.warn("Gagal mengambil data, menampilkan data contoh.", err);
                setPengumumanList([
                    { tanggal: '25/07/2024', judul: 'Jadwal Piket Terbaru (Contoh)', isi: 'Jadwal piket bulan Agustus telah terbit. Silakan periksa pembagian tugas masing-masing.', kategori: 'Jadwal' },
                    { tanggal: '24/07/2024', judul: 'Apel Siaga Bencana (Contoh)', isi: 'Diwajibkan kepada seluruh anggota untuk mengikuti Apel Siaga Bencana pada hari Sabtu, 27 Juli 2024 di Lapangan Utama. Pakaian PDL Lengkap.', kategori: 'PENTING' },
                    { tanggal: '23/07/2024', judul: 'Pelatihan Pertolongan Pertama (Contoh)', isi: 'Akan diadakan pelatihan P3K dasar bagi anggota baru. Pendaftaran dibuka hingga akhir bulan.', kategori: 'Info' },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPengumuman();
    }, []);

    const getCategoryClass = (kategori: string) => {
        switch (kategori.toUpperCase()) {
            case 'PENTING':
                return 'bg-red-100 text-red-800';
            case 'JADWAL':
                return 'bg-blue-100 text-blue-800';
            case 'INFO':
            default:
                return 'bg-green-100 text-green-800';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                        <InformationCircleIcon className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Papan Informasi</h2>
                <p className="text-gray-500 mt-2">Pengumuman, jadwal, dan informasi penting lainnya.</p>
            </div>

            {isLoading && <p className="text-center text-gray-600">Memuat pengumuman...</p>}

            {error && (
                <div className="text-center bg-red-100 text-red-700 p-4 rounded-lg">
                    <p className="font-bold">Terjadi Kesalahan</p>
                    <p>{error}</p>
                    <p className="mt-2 text-sm">Menampilkan data contoh.</p>
                </div>
            )}

            {!isLoading && (
                <div className="space-y-6">
                    {pengumumanList.length > 0 ? (
                        pengumumanList.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getCategoryClass(item.kategori)}`}>
                                            {item.kategori}
                                        </span>
                                        <p className="text-sm text-gray-500">{item.tanggal}</p>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.judul}</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{item.isi}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-500">Belum ada pengumuman.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InfoCenter;