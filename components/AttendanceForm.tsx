import React, { useState, useEffect, useRef } from 'react';
import CameraIcon from './icons/CameraIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import MapPinIcon from './icons/MapPinIcon';

// --- PENGATURAN SPREADSHEET ---
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkeEzeP0m6kbcFKFqyNGaVmV1LBDUV8Xraiw5NksZw4IUmXFod9e3QwAEz_nkjVzt_Vg/exec'; 

// --- FUNGSI BANTUAN ---
const getTodaysStorageKey = () => {
    const today = new Date();
    return `attendanceData-${today.toISOString().split('T')[0]}`;
};

interface AttendanceState {
    nama: string;
    nia: string;
    clockInTime: string | null;
    clockInPhoto: string | null;
}

const AttendanceForm: React.FC = () => {
    // State untuk form
    const [nama, setNama] = useState('');
    const [nia, setNia] = useState('');
    const [clockInTime, setClockInTime] = useState<Date | null>(null);
    const [clockInPhoto, setClockInPhoto] = useState<string | null>(null);
    
    // State untuk UI/UX
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [locationStatus, setLocationStatus] = useState('Mencari lokasi...');
    const [currentCoords, setCurrentCoords] = useState<{ latitude: number, longitude: number } | null>(null);

    const locationWatchIdRef = useRef<number | null>(null);
    const storageKey = getTodaysStorageKey();

    // Efek untuk memuat state dari localStorage saat komponen pertama kali dimuat
    useEffect(() => {
        try {
            const savedDataJSON = localStorage.getItem(storageKey);
            if (savedDataJSON) {
                const savedData: AttendanceState = JSON.parse(savedDataJSON);
                setNama(savedData.nama || '');
                setNia(savedData.nia || '');
                const savedClockInTime = savedData.clockInTime ? new Date(savedData.clockInTime) : null;
                const savedClockInPhoto = savedData.clockInPhoto || null;

                setClockInTime(savedClockInTime);
                setClockInPhoto(savedClockInPhoto);

                // Jika sudah ada data absen lengkap (waktu dan foto) untuk hari ini,
                // kunci form dan tampilkan pesan sukses.
                if (savedClockInTime && savedClockInPhoto) {
                    setSubmitMessage({ type: 'success', text: "Absensi piket berhasil dicatat!" });
                }
            }
        } catch (error) {
            console.error("Gagal memuat data absensi dari localStorage", error);
        }
    }, [storageKey]);

    // Efek untuk menyimpan state ke localStorage setiap kali ada perubahan
    useEffect(() => {
        // Hanya simpan jika belum ada pesan submit (artinya proses belum selesai)
        if (!submitMessage) {
            try {
                const dataToSave: AttendanceState = {
                    nama,
                    nia,
                    clockInTime: clockInTime ? clockInTime.toISOString() : null,
                    clockInPhoto,
                };
                localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            } catch (error) {
                console.error("Gagal menyimpan data absensi ke localStorage", error);
            }
        }
    }, [nama, nia, clockInTime, clockInPhoto, storageKey, submitMessage]);


    // Efek untuk mendapatkan lokasi
    useEffect(() => {
        if (navigator.geolocation) {
            locationWatchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentCoords({ latitude, longitude });
                    setLocationStatus('Lokasi terdeteksi dan akan dicatat.');
                },
                () => {
                    setLocationStatus('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
                }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationStatus('Geolocation tidak didukung oleh browser ini.');
        }

        return () => {
            if (locationWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(locationWatchIdRef.current);
            }
        };
    }, []);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const objectUrl = URL.createObjectURL(file);
            
            const img = new Image();
            img.src = objectUrl;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * (MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setSubmitMessage({ type: 'error', text: 'Gagal memproses gambar.' });
                    URL.revokeObjectURL(objectUrl);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                
                const now = new Date();
                setClockInPhoto(dataUrl);
                setClockInTime(now);
                
                URL.revokeObjectURL(objectUrl);
            };

            img.onerror = () => {
                setSubmitMessage({ type: 'error', text: 'File yang dipilih bukan gambar yang valid.' });
                URL.revokeObjectURL(objectUrl);
            };
            
            e.target.value = '';
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setIsConfirmDialogOpen(false);
        setIsSubmitting(true);
        setSubmitMessage(null);
        
        const formData = new FormData();
        formData.append('nama', nama);
        formData.append('nia', nia);
        const locationString = currentCoords ? `${currentCoords.latitude}, ${currentCoords.longitude}` : 'Lokasi tidak dapat diakses';
        formData.append('lokasi', locationString);

        if (clockInTime) formData.append('waktuDatang', clockInTime.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' }));
        if (clockInPhoto) formData.append('fotoDatang', clockInPhoto);
        
        try {
            const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.status === "SUCCESS") {
                setSubmitMessage({ type: 'success', text: "Absensi piket berhasil dicatat!" });
                // Simpan data final ke localStorage setelah sukses submit
                const finalData: AttendanceState = {
                    nama,
                    nia,
                    clockInTime: clockInTime!.toISOString(),
                    clockInPhoto: clockInPhoto!,
                };
                localStorage.setItem(storageKey, JSON.stringify(finalData));
            } else {
                 throw new Error(result.message || 'Terjadi kesalahan pada server.');
            }
        } catch (error: any) {
            setSubmitMessage({ type: 'error', text: `Gagal mengirim: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderClockInCard = () => {
        const isFormFilled = nama.trim() !== '' && nia.trim() !== '';
        // Tombol dinonaktifkan jika form belum diisi, sudah absen, atau lokasi tidak terdeteksi
        const isButtonEnabled = isFormFilled && !submitMessage && !!currentCoords; 
        let disabledReason = '';

        if (!isFormFilled) {
            disabledReason = 'Isi Nama dan N.I.A terlebih dahulu.';
        } else if (!currentCoords) {
            disabledReason = 'Lokasi tidak terdeteksi. Pastikan GPS aktif.';
        } else if (submitMessage) {
            disabledReason = 'Anda sudah absen hari ini.';
        }

        return (
             <div className="border border-gray-200 rounded-lg p-4 flex flex-col">
                <h3 className="font-bold text-lg text-gray-700">Absen Datang</h3>
                {clockInTime && clockInPhoto ? (
                     <div className="mt-4 space-y-2">
                        <img src={clockInPhoto} alt="Foto Absen Datang" className="w-full h-auto rounded-md object-cover" />
                        <p className="text-sm text-gray-600">Waktu: <span className="font-medium">{clockInTime.toLocaleTimeString('id-ID')}</span></p>
                    </div>
                ) : (
                    <div className="mt-4 flex flex-col items-center justify-center h-full flex-grow bg-gray-50 rounded-md p-4 text-center">
                        <CameraIcon className="w-12 h-12 text-gray-400 mb-2"/>
                        <label 
                            htmlFor="clock-in-file-upload"
                            className={`mt-2 inline-block px-4 py-2 text-white rounded-md shadow-sm ${!isButtonEnabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
                            aria-disabled={!isButtonEnabled}
                        >
                            Ambil Foto & Absen
                        </label>
                         <input 
                            id="clock-in-file-upload"
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="sr-only" 
                            onChange={handleFileChange} 
                            disabled={!isButtonEnabled}
                        />
                         {!isButtonEnabled && (
                            <p 
                              id="clock-in-reason"
                              className="text-xs mt-2 text-gray-500"
                            >
                                {disabledReason}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            {isConfirmDialogOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Konfirmasi Absensi</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Nama:</strong> {nama}</p>
                            <p><strong>N.I.A:</strong> {nia}</p>
                            {currentCoords && <p><strong>Lokasi:</strong> {`${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`}</p>}
                            {clockInTime && <p><strong>Waktu Datang:</strong> {clockInTime.toLocaleString('id-ID')}</p>}
                        </div>
                        <div className="flex justify-center gap-4 mt-6">
                            {clockInPhoto && <img src={clockInPhoto} alt="Foto Datang" className="w-24 h-24 rounded-md object-cover"/>}
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setIsConfirmDialogOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                            <button onClick={handleConfirmSubmit} disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">
                                {isSubmitting ? 'Menyimpan...' : 'Ya, Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-center mb-6">
                    <div className="bg-green-100 p-3 rounded-full">
                        <ClipboardListIcon className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Absensi Piket</h2>
                <p className="text-center text-gray-500 mb-8">Lokasi Anda akan dicatat saat melakukan absensi.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" id="fullName" name="fullName" value={nama} onChange={(e) => setNama(e.target.value)} required readOnly={!!clockInTime} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-100 read-only:cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="nia" className="block text-sm font-medium text-gray-700">Nomor Induk Anggota</label>
                        <input type="text" id="nia" name="nia" value={nia} onChange={(e) => setNia(e.target.value)} required readOnly={!!clockInTime} placeholder="Masukkan N.I.A Anda" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-100 read-only:cursor-not-allowed" />
                    </div>
                    
                    <div className="flex items-center text-sm p-3 rounded-md transition-colors duration-300 bg-blue-100 text-blue-800">
                        <MapPinIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="font-medium">{locationStatus}</span>
                    </div>
                    
                    <div>
                        {renderClockInCard()}
                    </div>

                    <div>
                        <button type="submit" disabled={isSubmitting || !clockInPhoto || !!submitMessage || nama.trim() === '' || nia.trim() === '' || !currentCoords} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Mengirim...' : 'Simpan & Kirim Absensi'}
                        </button>
                    </div>
                    {submitMessage && (
                        <div className={`text-center p-4 rounded-md ${submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <p className="font-medium">{submitMessage.text}</p>
                            {submitMessage.type === 'success' && <p className="text-sm mt-1">Anda sudah tercatat absen hari ini. Terima kasih!</p>}
                        </div>
                    )}
                </form>
            </div>
        </>
    );
};

export default AttendanceForm;