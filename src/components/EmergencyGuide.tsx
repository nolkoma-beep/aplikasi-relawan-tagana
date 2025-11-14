
import React from 'react';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import PhoneIcon from './icons/PhoneIcon';

const emergencyContacts = [
    { name: 'BPBD Kab. Serang', number: '0254-123-456' },
    { name: 'Damkar Kab. Serang', number: '0254-113' },
    { name: 'PMI Kab. Serang', number: '0254-789-101' },
    { name: 'Polres Serang', number: '0254-110' },
    { name: 'RSUD dr. Drajat Prawiranegara', number: '0254-200-353' },
];

const sopGuides = [
    {
        title: 'Saat Terjadi Banjir',
        steps: [
            'Pindahkan barang berharga ke tempat yang lebih tinggi.',
            'Matikan aliran listrik untuk menghindari korsleting.',
            'Evakuasi diri ke dataran yang lebih tinggi dan aman.',
            'Jangan berjalan atau mengemudi melalui genangan air deras.',
        ],
    },
    {
        title: 'Saat Terjadi Gempa Bumi',
        steps: [
            'Jika di dalam ruangan: berlindung di bawah meja yang kokoh, jauhi jendela.',
            'Jika di luar ruangan: cari area terbuka, jauhi bangunan, pohon, dan tiang listrik.',
            'Jika sedang mengemudi: menepi dan berhenti, tetap di dalam mobil.',
            'Setelah gempa berhenti, periksa kondisi sekitar dan waspada gempa susulan.',
        ],
    },
     {
        title: 'Saat Terjadi Angin Puting Beliung',
        steps: [
            'Segera masuk ke dalam bangunan yang kokoh.',
            'Jauhi jendela dan berlindung di bagian tengah bangunan atau basement.',
            'Jika tidak ada tempat berlindung, cari dataran rendah dan lindungi kepala Anda.',
            'Waspada terhadap benda-benda yang beterbangan.',
        ],
    },
];

const EmergencyGuide: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg mb-8 text-center">
                 <div className="flex items-center justify-center mb-4">
                    <div className="bg-cyan-100 p-3 rounded-full">
                        <ShieldCheckIcon className="w-8 h-8 text-cyan-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Panduan & Kontak Darurat</h2>
                <p className="text-gray-500 mt-2">Informasi penting untuk kesiapsiagaan bencana.</p>
            </div>

            {/* Kontak Penting */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Kontak Penting</h3>
                <ul className="space-y-3">
                    {emergencyContacts.map(contact => (
                         <li key={contact.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">{contact.name}</span>
                            <a href={`tel:${contact.number.replace(/-/g, '')}`} className="flex items-center text-blue-600 font-semibold text-sm hover:text-blue-800 transition-colors">
                                <PhoneIcon className="w-4 h-4 mr-2" />
                                {contact.number}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Panduan Singkat (SOP) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Panduan Singkat (SOP)</h3>
                <div className="space-y-3">
                    {sopGuides.map(guide => (
                        <details key={guide.title} className="group bg-gray-50 rounded-lg p-3 cursor-pointer">
                            <summary className="font-bold text-gray-700 list-none flex justify-between items-center">
                                {guide.title}
                                <span className="transform transition-transform duration-200 group-open:rotate-180">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </span>
                            </summary>
                            <ul className="mt-3 pl-5 list-disc space-y-1 text-gray-600">
                                {guide.steps.map((step, index) => <li key={index}>{step}</li>)}
                            </ul>
                        </details>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default EmergencyGuide;
