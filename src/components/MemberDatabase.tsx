import React, { useState, useEffect } from 'react';
import UsersIcon from './icons/UsersIcon';
import SearchIcon from './icons/SearchIcon';

// Interface untuk struktur data anggota sesuai permintaan
interface Member {
    foto: string;
    nama: string;
    niat: string;
    kecamatan: string;
}

// PENTING: Ganti URL ini dengan URL Google Sheet Anda yang sudah dipublikasikan sebagai CSV.
// Cara mempublikasikan: Di Google Sheets, buka File > Bagikan > Publikasikan ke web.
// Pilih sheet yang relevan, lalu pilih format "Comma-separated values (.csv)", kemudian klik Publikasikan.
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7GWOjmvjpe1EqAKtzD8yCadGYpU90oTIIkGSeL0oYriDGCBitjrGpDgrljx8O5LDXgyI4hZu2mmw3/pub?gid=0&single=true&output=csv';

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

const MemberDatabase: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await fetch(SPREADSHEET_URL);

                if (!response.ok) {
                    throw new Error('Gagal mengambil data. Pastikan URL benar dan sheet sudah dipublikasikan ke web.');
                }

                const csvText = await response.text();
                const parsedMembers: Member[] = [];
                // Pisahkan per baris, dan lewati baris header (paling atas)
                const rows = csvText.trim().split('\n').slice(1); 

                for (const row of rows) {
                    if (row.trim() === '') continue; // Lewati baris kosong
                    const columns = parseCsvRow(row);

                    // Pastikan baris memiliki cukup kolom untuk menghindari error
                    if (columns.length >= 4) {
                        parsedMembers.push({
                            foto: columns[0]?.trim() || '',
                            nama: columns[1]?.trim() || '',
                            niat: columns[2]?.trim() || '',
                            kecamatan: columns[3]?.trim() || '',
                        });
                    }
                }
                setMembers(parsedMembers);
            } catch (err: any) {
                setError(err.message);
                 // Menambahkan data contoh jika terjadi error, agar UI tidak kosong saat demonstrasi
                console.warn("Gagal mengambil data dari spreadsheet, menampilkan data contoh.");
                setMembers([
                    { foto: 'https://picsum.photos/seed/10/200', nama: 'Tedi', niat: '123225425', kecamatan: 'Ciruas' },
                    { foto: 'https://picsum.photos/seed/11/200', nama: 'Budi Santoso', niat: '987654321', kecamatan: 'Kragilan' },
                    { foto: 'https://picsum.photos/seed/12/200', nama: 'Citra Lestari', niat: '555444333', kecamatan: 'Waringinkurung' },
                    { foto: 'https://picsum.photos/seed/13/200', nama: 'Doni Firmansyah', niat: '111222333', kecamatan: 'Pontang' },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredMembers = members.filter(member =>
        member.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.niat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-purple-100 p-3 rounded-full">
                        <UsersIcon className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800">DATABASE ANGGOTA</h2>
                <p className="text-center text-gray-500 mt-2">TAGANA KABUPATEN SERANG</p>
                 <div className="mt-6 max-w-lg mx-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari anggota (nama, kecamatan, NIAT)..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-600">Memuat data anggota...</p>
                </div>
            )}

            {error && (
                <div className="text-center py-10 bg-red-100 text-red-700 p-4 rounded-lg">
                    <p className="font-bold">Terjadi Kesalahan</p>
                    <p>{error}</p>
                    <p className="mt-2 text-sm">Menampilkan data contoh.</p>
                </div>
            )}

            {!isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredMembers.length > 0 ? (
                        filteredMembers.map((member, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden text-center transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                <img src={member.foto} alt={member.nama} className="w-full aspect-square object-cover bg-gray-200" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200'; }}/>
                                <div className="p-3">
                                    <h3 className="text-base font-bold text-gray-900 truncate">{member.nama}</h3>
                                    <p className="text-blue-600 font-semibold text-xs">{member.kecamatan}</p>
                                    <p className="text-xs text-gray-500 mt-1">NIAT: {member.niat}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-xl text-gray-500">Anggota tidak ditemukan.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemberDatabase;