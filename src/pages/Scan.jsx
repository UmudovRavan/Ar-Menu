import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';

// Fake scan zamanı əlavə olunacaq yeməklər
const scannedFoods = [
    {
        name: "Scanned Burger",
        description: "Kamera ilə skan edilmiş burger",
        price: 12.99,
        category: "Skan Edilənlər",
        thumbnail: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
        model3D: ""
    },
    {
        name: "Scanned Pizza",
        description: "Kamera ilə skan edilmiş pizza",
        price: 15.99,
        category: "Skan Edilənlər",
        thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
        model3D: ""
    },
    {
        name: "Scanned Salad",
        description: "Kamera ilə skan edilmiş salat",
        price: 9.99,
        category: "Skan Edilənlər",
        thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
        model3D: ""
    }
];

const Scan = () => {
    const navigate = useNavigate();
    const { addMenuItem } = useMenu();

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [status, setStatus] = useState('idle'); // idle, camera, scanning, success, error
    const [errorMessage, setErrorMessage] = useState('');

    // Kamera bağlama funksiyası
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Komponent unmount olduqda kameranı bağla
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Kamera açma funksiyası
    const startCamera = async () => {
        try {
            setStatus('camera');
            setErrorMessage('');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Arxa kamera
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Kamera xətası:', error);
            setStatus('error');
            setErrorMessage('Kamera açıla bilmədi. Zəhmət olmasa icazə verin.');
        }
    };

    // Fake scan başlatma
    const startScan = () => {
        setStatus('scanning');

        // 3 saniyə fake scan
        setTimeout(() => {
            // Kameranı bağla
            stopCamera();

            // Random yemək seç və əlavə et
            const randomFood = scannedFoods[Math.floor(Math.random() * scannedFoods.length)];
            addMenuItem(randomFood);

            // Success göstər
            setStatus('success');

            // 2 saniyə sonra menyuya yönləndir
            setTimeout(() => {
                navigate('/menu');
            }, 2000);
        }, 3000);
    };

    // İptal et
    const cancelScan = () => {
        stopCamera();
        setStatus('idle');
    };

    return (
        <div className="page scan-page">
            <h1>📷 Yemək Skan Et</h1>

            {/* IDLE State */}
            {status === 'idle' && (
                <div className="scan-idle">
                    <div className="scan-placeholder">
                        <div className="camera-icon">📱</div>
                        <p>Yeməyi skan etmək üçün kameranı açın</p>
                    </div>
                    <button className="btn btn-primary btn-large" onClick={startCamera}>
                        📷 Scan Food
                    </button>
                </div>
            )}

            {/* CAMERA State */}
            {status === 'camera' && (
                <div className="scan-camera">
                    <div className="camera-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="camera-feed"
                        />
                        <div className="camera-overlay">
                            <div className="scan-frame"></div>
                            <p>Yeməyi çərçivəyə yerləşdirin</p>
                        </div>
                    </div>
                    <div className="camera-actions">
                        <button className="btn btn-primary btn-large" onClick={startScan}>
                            🔍 Scan Et
                        </button>
                        <button className="btn btn-secondary" onClick={cancelScan}>
                            ✕ Ləğv Et
                        </button>
                    </div>
                </div>
            )}

            {/* SCANNING State */}
            {status === 'scanning' && (
                <div className="scan-camera">
                    <div className="camera-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="camera-feed"
                        />
                        <div className="scanning-overlay">
                            <div className="scanner-animation">
                                <div className="scanner-ring"></div>
                                <div className="scanner-ring"></div>
                                <div className="scanner-ring"></div>
                            </div>
                            <p className="scanning-text">Scanning food...</p>
                            <div className="scanning-progress">
                                <div className="progress-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS State */}
            {status === 'success' && (
                <div className="scan-success">
                    <div className="success-animation">
                        <div className="success-icon">✓</div>
                    </div>
                    <h2>Food successfully added to menu!</h2>
                    <p>Menyuya yönləndirilirsiniz...</p>
                </div>
            )}

            {/* ERROR State */}
            {status === 'error' && (
                <div className="scan-error">
                    <div className="error-icon">⚠️</div>
                    <p>{errorMessage}</p>
                    <button className="btn btn-primary" onClick={startCamera}>
                        Yenidən cəhd et
                    </button>
                    <button className="btn btn-secondary" onClick={() => setStatus('idle')}>
                        Geri qayıt
                    </button>
                </div>
            )}

            <p className="scan-note">
                * Bu demo versiyasıdır. Real AI skan sonradan əlavə olunacaq.
            </p>
        </div>
    );
};

export default Scan;
