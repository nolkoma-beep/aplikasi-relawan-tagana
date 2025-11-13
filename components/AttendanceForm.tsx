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
    clockOutTime: string | null;
    clockInPhoto: string | null;
    clockOutPhoto: string | null;
}

const AttendanceForm: React.FC = () => {
    // State untuk form
    const [nama, setNama] = useState('');
    const [nia, setNia] = useState('');
    const [clockInTime, setClockInTime] = useState<Date | null>(null);
    const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
    const [clockInPhoto, setClockInPhoto] = useState<string | null>(null);
    const [clockOutPhoto, setClockOutPhoto] = useState<string | null>(null);
    
    // State untuk UI/UX
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [locationStatus, setLocationStatus] = useState('Mencari lokasi...');
    const [currentCoords, setCurrentCoords] = useState<{ latitude: number, longitude: number } | null>(null);

    const locationWatchIdRef = useRef<number | null>(null);
    const storageKey = getTodaysStorageKey();

    // Efek untuk memperbarui waktu setiap menit agar validasi jam selalu akurat
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update setiap 60 detik
        return () => clearInterval(timer);
    }, []);

    // Efek untuk memuat state dari localStorage saat komponen pertama kali dimuat
    useEffect(() => {
        try {
            const savedDataJSON = localStorage.getItem(storageKey);
            if (savedDataJSON) {
                const savedData: AttendanceState = JSON.parse(savedDataJSON);
                setNama(savedData.nama || '');
                setNia(savedData.nia || '');
                setClockInTime(savedData.clockInTime ? new Date(savedData.clockInTime) : null);
                setClockOutTime(savedData.clockOutTime ? new Date(savedData.clockOutTime) : null);
                setClockInPhoto(savedData.clockInPhoto || null);
                setClockOutPhoto(savedData.clockOutPhoto || null);
            }
        } catch (error) {
            console.error("Gagal memuat data absensi dari localStorage", error);
        }
    }, [storageKey]);

    // Efek untuk menyimpan state ke localStorage setiap kali ada perubahan
    useEffect(() => {
        try {
            const dataToSave: AttendanceState = {
                nama,
                nia,
                clockInTime: clockInTime ? clockInTime.toISOString() : null,
                clockOutTime: clockOutTime ? clockOutTime.toISOString() : null,
                clockInPhoto,
                clockOutPhoto,
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error("Gagal menyimpan data absensi ke localStorage", error);
        }
    }, [nama, nia, clockInTime, clockOutTime, clockInPhoto, clockOutPhoto, storageKey]);


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
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'clockIn' | 'clockOut') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Gunakan createObjectURL untuk efisiensi memori, mencegah crash browser
            const objectUrl = URL.createObjectURL(file);
            
            const img = new Image();
            img.src = objectUrl;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                // PERBAIKAN: Mengurangi ukuran gambar untuk mencegah crash memori
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
                    URL.revokeObjectURL(objectUrl); // Bersihkan memori
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                // PERBAIKAN: Mengurangi kualitas untuk ukuran file yang lebih kecil
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                
                const now = new Date();
                if (type === 'clockIn') {
                    setClockInPhoto(dataUrl);
                    setClockInTime(now);
                } else if (type === 'clockOut') {
                    setClockOutPhoto(dataUrl);
                    setClockOutTime(now);
                }
                
                URL.revokeObjectURL(objectUrl); // Bersihkan memori setelah berhasil
            };

            img.onerror = () => {
                setSubmitMessage({ type: 'error', text: 'File yang dipilih bukan gambar yang valid.' });
                URL.revokeObjectURL(objectUrl); // Bersihkan memori jika terjadi error
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

        // Kirim foto dalam format data URL lengkap (dengan header)
        if (clockInTime) formData.append('waktuDatang', clockInTime.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' }));
        if (clockInPhoto) formData.append('fotoDatang', clockInPhoto);
        
        if (clockOutTime) formData.append('waktuPulang', clockOutTime.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' }));
        if (clockOutPhoto) formData.append('fotoPulang', clockOutPhoto);
        
        try {
            const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.status === "SUCCESS") {
                setSubmitMessage({ type: 'success', text: "Absensi piket berhasil dicatat!" });
                setTimeout(() => {
                    localStorage.removeItem(storageKey);
                    window.location.reload();
                }, 2000);
            } else {
                 throw new Error(result.message || 'Terjadi kesalahan pada server.');
            }
        } catch (error: any) {
            setSubmitMessage({ type: 'error', text: `Gagal mengirim: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReset = () => {
        if (window.confirm("Yakin ingin mereset absensi hari ini? Foto dan waktu yang tersimpan akan hilang.")) {
            // Hapus data dari localStorage terlebih dahulu untuk memastikan data tidak dimuat ulang.
            localStorage.removeItem(storageKey);

            // Reset state komponen secara manual untuk membersihkan UI sebelum reload.
            setNama('');
            setNia('');
            setClockInTime(null);
            setClockOutTime(null);
            setClockInPhoto(null);
            setClockOutPhoto(null);
            setSubmitMessage(null);

            // Muat ulang halaman untuk memulai sesi absensi baru.
            window.location.reload();
        }
    };

    const renderCard = (
        title: string, 
        id: 'clock-in' | 'clock-out',
        time: Date | null, 
        photo: string | null, 
        buttonText: string
    ) => {
        const isFormFilled = nama.trim() !== '' && nia.trim() !== '';
        let isButtonEnabled = true;
        let disabledReason = '';
        
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        if (id === 'clock-in') {
            // Active from 15:00 to 19:59
            const isClockInTime = currentHour >= 15 && currentHour < 20;
            if (!isFormFilled) {
                isButtonEnabled = false;
                disabledReason = 'Isi Nama dan N.I.A terlebih dahulu.';
            } else if (!isClockInTime) {
                isButtonEnabled = false;
                disabledReason = 'Clock In hanya aktif pukul 15:00 - 19:59.';
            }
        } else if (id === 'clock-out') {
            // Active from 20:30 to 22:00
            const totalCurrentMinutes = currentHour * 60 + currentMinute;
            const clockOutStartMinutes = 20 * 60 + 30; // 1230
            const clockOutEndMinutes = 22 * 60;       // 1320
            const isClockOutTime = totalCurrentMinutes >= clockOutStartMinutes && totalCurrentMinutes <= clockOutEndMinutes;

            // BUG FIX: Ensure clockInTime is not just truthy, but a valid Date object.
            // This prevents issues if localStorage contains corrupted data.
            const hasValidClockIn = clockInTime && !isNaN(clockInTime.getTime());

            if (!hasValidClockIn) {
                isButtonEnabled = false;
                disabledReason = 'Lakukan Clock In terlebih dahulu.';
            } else if (!isClockOutTime) {
                isButtonEnabled = false;
                disabledReason = 'Clock Out hanya aktif pukul 20:30 - 22:00.';
            }
        }

        return (
             <div className="border border-gray-200 rounded-lg p-4 flex flex-col">
                <h3 className="font-bold text-lg text-gray-700">{title}</h3>
                {time && photo ? (
                     <div className="mt-4 space-y-2">
                        <img src={photo} alt={title} className="w-full h-auto rounded-md object-cover" />
                        <p className="text-sm text-gray-600">Waktu: <span className="font-medium">{time.toLocaleTimeString('id-ID')}</span></p>
                    </div>
                ) : (
                    <div className="mt-4 flex flex-col items-center justify-center h-full flex-grow bg-gray-50 rounded-md p-4 text-center">
                        <CameraIcon className="w-12 h-12 text-gray-400 mb-2"/>
                        <label 
                            htmlFor={`${id}-file-upload`}
                            className={`mt-2 inline-block px-4 py-2 text-white rounded-md shadow-sm ${!isButtonEnabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
                            aria-disabled={!isButtonEnabled}
                        >
                            {buttonText}
                        </label>
                         <input 
                            id={`${id}-file-upload`}
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="sr-only" 
                            onChange={(e) => handleFileChange(e, id === 'clock-in' ? 'clockIn' : 'clockOut')} 
                            disabled={!isButtonEnabled}
                        />
                         {!isButtonEnabled && (
                            <p 
                              id={`${id}-reason`}
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
                            {clockOutTime && <p><strong>Waktu Pulang:</strong> {clockOutTime.toLocaleString('id-ID')}</p>}
                        </div>
                        <div className="flex justify-center gap-4 mt-6">
                            {clockInPhoto && <img src={clockInPhoto} alt="Foto Datang" className="w-24 h-24 rounded-md object-cover"/>}
                            {clockOutPhoto && <img src={clockOutPhoto} alt="Foto Pulang" className="w-24 h-24 rounded-md object-cover"/>}
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setIsConfirmDialogOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                            <button onClick={handleConfirmSubmit} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Ya, Simpan</button>
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderCard('Clock In (Datang)', 'clock-in', clockInTime, clockInPhoto, 'Ambil Foto & Clock In')}
                        {renderCard('Clock Out (Pulang)', 'clock-out', clockOutTime, clockOutPhoto, 'Ambil Foto & Clock Out')}
                    </div>

                    {clockInTime && (
                         <button type="button" onClick={handleReset} className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100">
                           Reset Absensi Hari Ini
                        </button>
                    )}

                    <div>
                        <button type="submit" disabled={isSubmitting || !clockInPhoto || nama.trim() === '' || nia.trim() === ''} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Mengirim...' : 'Simpan Absensi'}
                        </button>
                    </div>
                    {submitMessage && (
                        <p className={`text-center font-medium ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {submitMessage.text}
                        </p>
                    )}
                </form>
            </div>
        </>
    );
};

export default AttendanceForm;