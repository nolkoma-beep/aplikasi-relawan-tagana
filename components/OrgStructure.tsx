import React, { useState, useEffect } from 'react';
import UserGroupIcon from './icons/UserGroupIcon';
import SearchIcon from './icons/SearchIcon';

// Interface untuk struktur data pengurus dari spreadsheet
interface Pengurus {
    nama: string;
    jabatan: string;
    foto: string;
}

// PENTING: Ganti URL ini dengan URL Google Sheet Anda yang berisi data pengurus.
// Publikasikan sebagai CSV seperti yang Anda lakukan untuk database anggota.
const PENGURUS_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=945316663&single=true&output=csv';

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


const OrgStructure: React.FC = () => {
    const [pengurusList, setPengurusList] = useState<Pengurus[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPengurus = async () => {
            // FIX: Removed unreachable code block that checks for a placeholder URL.
            // The constant PENGURUS_SPREADSHEET_URL is already defined with a valid URL,
            // so the check against a placeholder string was causing a compile-time error.
            try {
                const response = await fetch(PENGURUS_SPREADSHEET_URL);
                if (!response.ok) {
                    throw new Error('Gagal mengambil data. Pastikan URL benar dan sheet sudah dipublikasikan ke web.');
                }

                const csvText = await response.text();
                const parsedPengurus: Pengurus[] = [];
                const rows = csvText.trim().split('\n').slice(1); // Lewati header

                for (const row of rows) {
                    if (row.trim() === '') continue;
                    const columns = parseCsvRow(row);
                    if (columns.length >= 3) {
                        parsedPengurus.push({
                            nama: columns[0]?.trim() || '',
                            jabatan: columns[1]?.trim() || '',
                            foto: columns[2]?.trim() || '',
                        });
                    }
                }
                setPengurusList(parsedPengurus);
            } catch (err: any) {
                setError(err.message);
                 console.warn("Gagal mengambil data dari spreadsheet, menampilkan data contoh.");
                setPengurusList([
                    { nama: 'Budi Santoso (Contoh)', jabatan: 'Ketua Umum', foto: 'https://picsum.photos/seed/ketua/300' },
                    { nama: 'Citra Lestari (Contoh)', jabatan: 'Wakil Ketua', foto: 'https://picsum.photos/seed/wakil/300' },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPengurus();
    }, []);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredPengurus = pengurusList.filter(pengurus =>
        pengurus.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pengurus.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
         <div className="max-w-7xl mx-auto">
             <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-indigo-100 p-3 rounded-full">
                        <UserGroupIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800">Susunan Pengurus</h2>
                <p className="text-center text-gray-500 mt-2">Struktur Organisasi Tagana Kabupaten Serang</p>
                <div className="mt-6 max-w-lg mx-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari pengurus (nama, jabatan)..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>
            
            {isLoading && <p className="text-center text-gray-600">Memuat data pengurus...</p>}

            {error && (
                <div className="text-center py-10 bg-red-100 text-red-700 p-4 rounded-lg">
                    <p className="font-bold">Terjadi Kesalahan</p>
                    <p>{error}</p>
                    <p className="mt-2 text-sm">Menampilkan data contoh.</p>
                </div>
            )}
            
            {!isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredPengurus.length > 0 ? (
                        filteredPengurus.map((pengurus, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden text-center transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                <img src={pengurus.foto} alt={pengurus.nama} className="w-full aspect-square object-cover bg-gray-200" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}/>
                                <div className="p-3">
                                    <h3 className="text-base font-bold text-gray-900 truncate">{pengurus.nama}</h3>
                                    <p className="text-blue-600 font-semibold text-xs">{pengurus.jabatan}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-xl text-gray-500">Pengurus tidak ditemukan.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrgStructure;