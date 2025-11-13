import React, { useState } from 'react';
import CameraIcon from './icons/CameraIcon';
import CalendarIcon from './icons/CalendarIcon';

// PENTING: Ganti URL ini dengan URL Web App dari Google Apps Script yang Anda deploy.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwmdyNEn_lyrkVAI1ZwwGlp9dPJTsStvCjS-a3WAXEVNCd4ERz0m6acVj3Qg3dBr05Z1w/exec';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const ActivityReportForm: React.FC = () => {
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

        // FIX: Removed unreachable code block that checks for a placeholder URL.
        // The constant APPS_SCRIPT_URL is already defined with a valid URL,
        // so the check against a placeholder string was causing a compile-time error.
        
        const form = e.currentTarget;
        const formData = new FormData(form);

        // Tambahkan foto ke form data
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
                setSubmitMessage({ type: 'success', text: "Laporan kegiatan berhasil dikirim!" });
                // Reset form
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

    const renderImageUploader = (index: number) => {
        const isRequired = index === 0;
        return (
            <div className="border-2 border-gray-300 border-dashed rounded-md p-4 text-center h-full flex flex-col justify-center items-center">
                {imagePreviews[index] ? (
                    <img src={imagePreviews[index]} alt={`Preview ${index + 1}`} className="mx-auto h-24 w-auto rounded-md object-cover mb-2" />
                ) : (
                    <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <label htmlFor={`file-upload-activity-${index}`} className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 text-sm mt-2 block">
                    <span>Unggah Foto {index + 1} {isRequired && '(Wajib)'}</span>
                    <input 
                        id={`file-upload-activity-${index}`} 
                        name={`file-upload-activity-${index}`} 
                        type="file" 
                        accept="image/*" 
                        className="sr-only" 
                        onChange={(e) => handleFileChange(e, index)} 
                        required={isRequired} 
                    />
                </label>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center justify-center mb-6">
                 <div className="bg-blue-100 p-3 rounded-full">
                    <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Laporan Kegiatan</h2>
            <p className="text-center text-gray-500 mb-8">Dokumentasikan kegiatan yang telah Anda laksanakan.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <input type="text" id="fullName" name="fullName" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label htmlFor="nia" className="block text-sm font-medium text-gray-700">Nomor Induk Anggota</label>
                    <input type="text" id="nia" name="nia" required placeholder="Masukkan N.I.A Anda" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="activityName" className="block text-sm font-medium text-gray-700">Nama Kegiatan</label>
                    <input type="text" id="activityName" name="activityName" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label htmlFor="activityLocation" className="block text-sm font-medium text-gray-700">Tempat Kegiatan</label>
                    <input type="text" id="activityLocation" name="activityLocation" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="activityTime" className="block text-sm font-medium text-gray-700">Waktu Kegiatan</label>
                    <input type="datetime-local" id="activityTime" name="activityTime" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dokumentasi</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {renderImageUploader(0)}
                        {renderImageUploader(1)}
                        {renderImageUploader(2)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF hingga 10MB.</p>
                </div>
                 <div>
                    <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                        {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                    </button>
                </div>
                {submitMessage && (
                    <p className={`text-center font-medium ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {submitMessage.text}
                    </p>
                )}
            </form>
        </div>
    );
};

export default ActivityReportForm;