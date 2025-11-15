
import React, { useState } from 'react';
import CameraIcon from './icons/CameraIcon';
import DocumentReportIcon from './icons/DocumentReportIcon';

// PENTING: Ganti URL ini dengan URL Web App dari Google Apps Script Anda yang disiapkan untuk Laporan Bencana.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1OpIHyaNfD_h0pnEZddKTlIZpgIIiUDQLPd9eFUMYWHr6wWGNlmzIQcI0kc6pxHJ-5g/exec';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const DisasterReportForm: React.FC = () => {
    const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToBase64(file);
            const newImagePreviews = [...imagePreviews];
            newImagePreviews[index] = base64;
            setImagePreviews(newImagePreviews);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage(null);

        const form = e.currentTarget;
        const formData = new FormData(form);
        
        imagePreviews.forEach((img, index) => {
            if (img) {
                formData.append(`foto${index + 1}`, img);
            }
        });

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.status === "SUCCESS") {
                setSubmitMessage({ type: 'success', text: "Laporan bencana berhasil dikirim!" });
                form.reset();
                setImagePreviews([null, null, null]);
            } else {
                 throw new Error(result.message || 'Terjadi kesalahan pada server.');
            }
        } catch (error: any) {
            console.error('Error submitting report:', error);
            setSubmitMessage({ type: 'error', text: `Gagal mengirim laporan: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const disasterTypes = [
        "Puting Beliung", "Rumah Roboh", "Banjir", "Kebakaran", "Longsor",
        "Hanyut Tenggelam", "Kecelakaan", "Tersambar Petir",
        "Konflik Sosial", "Penyakit Luar Biasa", "Lainnya..."
    ];
    
    const renderImageUploader = (index: number) => {
        const isRequired = index === 0;
        return (
            <div className="border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md p-4 text-center h-full flex flex-col justify-center items-center">
                {imagePreviews[index] ? (
                    <img src={imagePreviews[index]} alt={`Preview ${index + 1}`} className="mx-auto h-24 w-auto rounded-md object-cover mb-2" />
                ) : (
                    <CameraIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                )}
                <label htmlFor={`file-upload-${index}`} className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm mt-2 block px-2 py-1">
                    <span>Unggah Foto {index + 1} {isRequired && '(Wajib)'}</span>
                    <input 
                        id={`file-upload-${index}`} 
                        name={`file-upload-${index}`} 
                        type="file" 
                        accept="image/*" 
                        className="sr-only" 
                        onChange={(e) => handleFileChange(e, index)} 
                        required={isRequired} 
                    />
                </label>
            </div>
        );
    }
    const isSubmitDisabled = isSubmitting;

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="flex items-center justify-center mb-6">
                 <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                    <DocumentReportIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-1">Laporan Bencana</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Isi formulir di bawah ini untuk melaporkan kejadian bencana.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                    <input type="text" id="fullName" name="fullName" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-gray-400" />
                </div>
                <div>
                    <label htmlFor="nia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Induk Anggota</label>
                    <input type="text" id="nia" name="nia" required placeholder="Masukkan N.I.A Anda" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-gray-400" />
                </div>
                <div>
                    <label htmlFor="disasterType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jenis Bencana</label>
                    <select id="disasterType" name="disasterType" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white">
                        <option value="">Pilih jenis bencana</option>
                        {disasterTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="disasterTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Waktu Bencana</label>
                    <input type="datetime-local" id="disasterTime" name="disasterTime" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="disasterLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tempat Bencana</label>
                    <input type="text" id="disasterLocation" name="disasterLocation" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-gray-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="affectedHouseholds" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jumlah KK Terdampak</label>
                        <input type="number" id="affectedHouseholds" name="affectedHouseholds" min="0" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-gray-400" />
                    </div>
                    <div>
                        <label htmlFor="affectedPeople" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jumlah Jiwa Terdampak</label>
                        <input type="number" id="affectedPeople" name="affectedPeople" min="0" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-gray-400" />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dokumentasi</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {renderImageUploader(0)}
                        {renderImageUploader(1)}
                        {renderImageUploader(2)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG, GIF hingga 10MB.</p>
                </div>
                <div>
                    <button type="submit" disabled={isSubmitDisabled} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 dark:disabled:bg-red-800 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                    </button>
                </div>
                {submitMessage && (
                    <p className={`text-center font-medium ${submitMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {submitMessage.text}
                    </p>
                )}
            </form>
        </div>
    );
};

export default DisasterReportForm;