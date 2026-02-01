import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ARView = () => {
    const location = useLocation();
    const food = location.state?.food;

    const [arStatus, setArStatus] = useState('idle');
    const [modelStatus, setModelStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [markerDetected, setMarkerDetected] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const modelRef = useRef(null);
    const mixerRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());
    const detectionIntervalRef = useRef(null);
    const markerDetectedRef = useRef(false);

    useEffect(() => {
        markerDetectedRef.current = markerDetected;
    }, [markerDetected]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        if (rendererRef.current) {
            rendererRef.current.dispose();
            rendererRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // 3D Burger modeli yarat (GLB əvəzinə)
    const createBurgerModel = useCallback(() => {
        const burgerGroup = new THREE.Group();

        // Alt çörək (bun bottom)
        const bunBottomGeom = new THREE.CylinderGeometry(1, 1.1, 0.3, 32);
        const bunMaterial = new THREE.MeshPhongMaterial({ color: 0xD4A574 });
        const bunBottom = new THREE.Mesh(bunBottomGeom, bunMaterial);
        bunBottom.position.y = -0.4;
        burgerGroup.add(bunBottom);

        // Kotlet (patty)
        const pattyGeom = new THREE.CylinderGeometry(0.95, 0.95, 0.25, 32);
        const pattyMaterial = new THREE.MeshPhongMaterial({ color: 0x4A3728 });
        const patty = new THREE.Mesh(pattyGeom, pattyMaterial);
        patty.position.y = -0.1;
        burgerGroup.add(patty);

        // Pendir (cheese)
        const cheeseGeom = new THREE.BoxGeometry(1.4, 0.08, 1.4);
        const cheeseMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
        const cheese = new THREE.Mesh(cheeseGeom, cheeseMaterial);
        cheese.position.y = 0.1;
        cheese.rotation.y = Math.PI / 4;
        burgerGroup.add(cheese);

        // Kahı (lettuce)
        const lettuceGeom = new THREE.TorusGeometry(0.9, 0.15, 8, 32);
        const lettuceMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const lettuce = new THREE.Mesh(lettuceGeom, lettuceMaterial);
        lettuce.position.y = 0.25;
        lettuce.rotation.x = Math.PI / 2;
        burgerGroup.add(lettuce);

        // Pomidor (tomato)
        const tomatoGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.12, 32);
        const tomatoMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6347 });
        const tomato = new THREE.Mesh(tomatoGeom, tomatoMaterial);
        tomato.position.y = 0.4;
        burgerGroup.add(tomato);

        // Üst çörək (bun top)
        const bunTopGeom = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bunTop = new THREE.Mesh(bunTopGeom, bunMaterial);
        bunTop.position.y = 0.55;
        burgerGroup.add(bunTop);

        // Küncüt toxumları
        const seedGeom = new THREE.SphereGeometry(0.04, 8, 8);
        const seedMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFACD });
        for (let i = 0; i < 15; i++) {
            const seed = new THREE.Mesh(seedGeom, seedMaterial);
            const angle = (i / 15) * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.5;
            seed.position.x = Math.cos(angle) * radius;
            seed.position.z = Math.sin(angle) * radius;
            seed.position.y = 0.9 + Math.random() * 0.2;
            bunTop.add(seed);
        }

        burgerGroup.scale.set(0.8, 0.8, 0.8);
        return burgerGroup;
    }, []);

    // 3D Pizza modeli yarat
    const createPizzaModel = useCallback(() => {
        const pizzaGroup = new THREE.Group();

        // Pizza bazası
        const baseGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xDEB887 });
        const base = new THREE.Mesh(baseGeom, baseMaterial);
        pizzaGroup.add(base);

        // Sous
        const sauceGeom = new THREE.CylinderGeometry(1.1, 1.1, 0.02, 32);
        const sauceMaterial = new THREE.MeshPhongMaterial({ color: 0xB22222 });
        const sauce = new THREE.Mesh(sauceGeom, sauceMaterial);
        sauce.position.y = 0.09;
        pizzaGroup.add(sauce);

        // Pendir
        const cheeseGeom = new THREE.CylinderGeometry(1.05, 1.05, 0.03, 32);
        const cheeseMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
        const cheese = new THREE.Mesh(cheeseGeom, cheeseMaterial);
        cheese.position.y = 0.11;
        pizzaGroup.add(cheese);

        // Pepperoni
        const pepperoniGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
        const pepperoniMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
        const positions = [
            [0.4, 0.3], [-0.5, 0.2], [0.2, -0.5], [-0.3, -0.4],
            [0.6, -0.2], [-0.6, 0.5], [0, 0.6], [0.5, 0.6]
        ];
        positions.forEach(([x, z]) => {
            const pepperoni = new THREE.Mesh(pepperoniGeom, pepperoniMaterial);
            pepperoni.position.set(x, 0.15, z);
            pizzaGroup.add(pepperoni);
        });

        pizzaGroup.scale.set(0.9, 0.9, 0.9);
        return pizzaGroup;
    }, []);

    // 3D Salat modeli yarat
    const createSaladModel = useCallback(() => {
        const saladGroup = new THREE.Group();

        // Qab
        const bowlGeom = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bowlMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            side: THREE.DoubleSide
        });
        const bowl = new THREE.Mesh(bowlGeom, bowlMaterial);
        bowl.rotation.x = Math.PI;
        bowl.position.y = 0.3;
        saladGroup.add(bowl);

        // Yaşıl yarpaqlar
        const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        for (let i = 0; i < 8; i++) {
            const leafGeom = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8);
            const leaf = new THREE.Mesh(leafGeom, leafMaterial);
            const angle = (i / 8) * Math.PI * 2;
            leaf.position.x = Math.cos(angle) * 0.5;
            leaf.position.z = Math.sin(angle) * 0.5;
            leaf.position.y = 0.5 + Math.random() * 0.3;
            leaf.scale.y = 0.5;
            saladGroup.add(leaf);
        }

        // Pomidor dilimləri
        const tomatoGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const tomatoMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6347 });
        for (let i = 0; i < 5; i++) {
            const tomato = new THREE.Mesh(tomatoGeom, tomatoMaterial);
            tomato.position.x = (Math.random() - 0.5) * 0.8;
            tomato.position.z = (Math.random() - 0.5) * 0.8;
            tomato.position.y = 0.6 + Math.random() * 0.2;
            saladGroup.add(tomato);
        }

        saladGroup.scale.set(0.8, 0.8, 0.8);
        return saladGroup;
    }, []);

    // 3D Kabab modeli yarat
    const createKebabModel = useCallback(() => {
        const kebabGroup = new THREE.Group();

        // Şiş
        const skewGeom = new THREE.CylinderGeometry(0.03, 0.03, 3, 8);
        const skewMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const skew = new THREE.Mesh(skewGeom, skewMaterial);
        skew.rotation.z = Math.PI / 2;
        kebabGroup.add(skew);

        // Ət parçaları
        const meatGeom = new THREE.BoxGeometry(0.35, 0.35, 0.3);
        const meatMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

        const onionGeom = new THREE.BoxGeometry(0.25, 0.25, 0.15);
        const onionMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFE0 });

        const pepperGeom = new THREE.BoxGeometry(0.3, 0.3, 0.2);
        const pepperMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4500 });

        for (let i = -4; i <= 4; i++) {
            let piece;
            if (i % 3 === 0) {
                piece = new THREE.Mesh(pepperGeom, pepperMaterial);
            } else if (i % 2 === 0) {
                piece = new THREE.Mesh(onionGeom, onionMaterial);
            } else {
                piece = new THREE.Mesh(meatGeom, meatMaterial);
            }
            piece.position.x = i * 0.3;
            piece.rotation.y = Math.random() * 0.5;
            kebabGroup.add(piece);
        }

        kebabGroup.scale.set(0.7, 0.7, 0.7);
        return kebabGroup;
    }, []);

    // Universal yemək modeli seç
    const createFoodModel = useCallback((foodName) => {
        const name = foodName?.toLowerCase() || '';

        if (name.includes('burger') || name.includes('hamburger')) {
            return createBurgerModel();
        } else if (name.includes('pizza')) {
            return createPizzaModel();
        } else if (name.includes('salat') || name.includes('salad')) {
            return createSaladModel();
        } else if (name.includes('kabab') || name.includes('kebab')) {
            return createKebabModel();
        } else {
            // Default - burger
            return createBurgerModel();
        }
    }, [createBurgerModel, createPizzaModel, createSaladModel, createKebabModel]);

    // GLB model yükləməyə çalış
    const loadGLBModel = useCallback((modelPath) => {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                modelPath,
                (gltf) => {
                    const model = gltf.scene;
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = maxDim > 0 ? 2 / maxDim : 1;
                    model.scale.setScalar(scale);

                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center.multiplyScalar(scale));

                    if (gltf.animations?.length > 0) {
                        const mixer = new THREE.AnimationMixer(model);
                        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
                        mixerRef.current = mixer;
                    }
                    resolve(model);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }, []);

    // Three.js səhnəsi qur
    const setupThreeJS = useCallback(async () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        rendererRef.current = renderer;

        // Işıqlandırma
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, 3, -5);
        scene.add(directionalLight2);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);

        setModelStatus('loading');

        let model;
        const modelPath = food?.model3D?.trim();

        // Əvvəlcə GLB yükləməyə çalış
        if (modelPath) {
            try {
                model = await loadGLBModel(modelPath);
                console.log('✅ GLB model yükləndi:', modelPath);
            } catch (e) {
                console.log('⚠️ GLB tapılmadı, procedural model yaradılır');
            }
        }

        // GLB yoxdursa, procedural model yarat
        if (!model) {
            model = createFoodModel(food?.name);
            console.log('✅ Procedural model yaradıldı:', food?.name);
        }

        model.visible = false;
        scene.add(model);
        modelRef.current = model;
        setModelStatus('loaded');

        // Animasiya
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            const delta = clockRef.current.getDelta();

            if (mixerRef.current) mixerRef.current.update(delta);

            if (modelRef.current?.visible) {
                modelRef.current.rotation.y += 0.015;
            }

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

    }, [food, loadGLBModel, createFoodModel]);

    // Marker aşkarlama
    const startMarkerDetection = useCallback(() => {
        let detectionCount = 0;
        const DETECTION_THRESHOLD = 3;

        detectionIntervalRef.current = setInterval(() => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;

            const video = videoRef.current;
            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            try {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = video.videoWidth;
                tempCanvas.height = video.videoHeight;
                tempCtx.drawImage(video, 0, 0);

                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const pixels = imageData.data;

                let darkPixels = 0;
                const sampleRate = 16;
                const totalSamples = Math.floor(pixels.length / 4 / (sampleRate / 4));

                for (let i = 0; i < pixels.length; i += sampleRate) {
                    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
                    if (brightness < 60) darkPixels++;
                }

                const darkRatio = darkPixels / totalSamples;

                if (darkRatio > 0.05 && darkRatio < 0.4) {
                    detectionCount++;
                    if (detectionCount >= DETECTION_THRESHOLD && !markerDetectedRef.current) {
                        console.log('🎯 Marker detected!');
                        setMarkerDetected(true);
                        setArStatus('detected');
                        if (modelRef.current) modelRef.current.visible = true;
                    }
                } else {
                    if (detectionCount > 0) detectionCount--;
                    if (detectionCount === 0 && markerDetectedRef.current) {
                        console.log('❌ Marker lost');
                        setMarkerDetected(false);
                        setArStatus('running');
                        if (modelRef.current) modelRef.current.visible = false;
                    }
                }
            } catch (e) { }
        }, 150);
    }, []);

    // AR başlat - MÜTLƏQ button click içində çağırılmalıdır
    const startAR = async () => {
        // Əgər artıq başlayıbsa, ikinci dəfə başlatma
        if (streamRef.current) {
            console.log('⚠️ Kamera artıq açıqdır');
            return;
        }

        try {
            setArStatus('loading');
            setErrorMessage('');

            // Kamera dəstəyini yoxla
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Bu cihazda kamera dəstəklənmir');
            }

            console.log('📷 Kamera permission istənilir...');

            // Kamera stream-i al - bu MÜTLƏQ user gesture (click) içində olmalıdır
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 }
                },
                audio: false
            });

            console.log('✅ Kamera permission verildi!');
            streamRef.current = stream;

            // Əvvəlcə running state-ə keç ki video element DOM-da olsun
            setArStatus('running');

        } catch (error) {
            console.error('❌ AR xətası:', error);
            setArStatus('error');

            // Xəta mesajlarını tərcümə et
            let errorMsg = 'Kamera açıla bilmədi';

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMsg = 'Kamera icazəsi verilmədi. Zəhmət olmasa brauzer ayarlarından kamera icazəsini verin.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMsg = 'Kamera tapılmadı. Bu cihazda kamera yoxdur.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMsg = 'Kamera başqa proqram tərəfindən istifadə olunur.';
            } else if (error.name === 'OverconstrainedError') {
                errorMsg = 'Kamera tələb olunan keyfiyyəti dəstəkləmir.';
            } else if (error.name === 'TypeError') {
                errorMsg = 'HTTPS əlaqəsi tələb olunur. Saytı https:// ilə açın.';
            } else if (error.message) {
                errorMsg = error.message;
            }

            setErrorMessage(errorMsg);

            // Stream varsa təmizlə
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    };

    // Video element DOM-da olduqda stream-i bağla
    useEffect(() => {
        const attachStream = async () => {
            if (arStatus === 'running' && videoRef.current && streamRef.current) {
                const video = videoRef.current;

                // Stream artıq bağlıdırsa, yenidən bağlama
                if (video.srcObject === streamRef.current) {
                    return;
                }

                try {
                    console.log('🎬 Stream video elementə bağlanır...');
                    video.srcObject = streamRef.current;

                    // Video yüklənənə qədər gözlə
                    await new Promise((resolve, reject) => {
                        video.onloadedmetadata = () => {
                            console.log('📹 Video metadata yükləndi');
                            resolve();
                        };

                        video.onerror = (e) => {
                            console.error('❌ Video error:', e);
                            reject(new Error('Video yüklənə bilmədi'));
                        };

                        // Timeout - 5 saniyə
                        setTimeout(() => reject(new Error('Video timeout')), 5000);
                    });

                    // Video-nu oynat
                    await video.play();
                    console.log('▶️ Video play başladı!');

                    // Three.js və marker detection-ı başlat
                    setTimeout(async () => {
                        await setupThreeJS();
                        startMarkerDetection();
                    }, 300);

                } catch (error) {
                    console.error('❌ Video bağlama xətası:', error);
                    setArStatus('error');
                    setErrorMessage('Video başladıla bilmədi: ' + error.message);
                }
            }
        };

        attachStream();
    }, [arStatus, setupThreeJS, startMarkerDetection]);

    const stopAR = () => {
        stopCamera();
        setArStatus('idle');
        setModelStatus('idle');
        setMarkerDetected(false);
        markerDetectedRef.current = false;
    };

    if (!food) {
        return (
            <div className="page ar-page">
                <h1>🥽 AR Görünüş</h1>
                <div className="ar-empty">
                    <div className="ar-empty-icon">🍽️</div>
                    <h2>Yemək Seçilməyib</h2>
                    <p>Please select a food from menu</p>
                    <Link to="/menu" className="btn btn-primary">📋 Menyuya Keç</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page ar-page">
            <h1>🥽 AR Görünüş - {food.name}</h1>

            {arStatus === 'idle' && (
                <div className="ar-content">
                    <div className="ar-preview">
                        <div className="ar-placeholder">
                            <img src={food.thumbnail} alt={food.name} className="ar-preview-image" />
                            <div className="ar-overlay">
                                <div className="ar-overlay-content">
                                    <span className="ar-3d-icon">🥽</span>
                                    <p>AR-ni başlatmaq üçün düyməyə basın</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ar-info">
                        <div className="ar-info-header">
                            <h2>{food.name}</h2>
                            <span className="ar-category-badge">{food.category}</span>
                        </div>
                        {food.description && <p className="ar-description">{food.description}</p>}
                        <p className="ar-price">{food.price.toFixed(2)} ₼</p>

                        <div className="ar-actions">
                            <button className="btn btn-primary btn-large ar-start-btn" onClick={startAR}>
                                🥽 AR-ni Başlat
                            </button>
                            <Link to="/menu" className="btn btn-secondary">← Menyuya Qayıt</Link>
                        </div>

                        <div className="ar-marker-info">
                            <h4>📌 AR istifadəsi:</h4>
                            <ol>
                                <li>AR-ni başladın</li>
                                <li>Tünd naxışlı bir şey kameraya göstərin</li>
                                <li>3D {food.name} modelini görün!</li>
                            </ol>
                        </div>

                        <div className="ar-model-info">
                            <span>🎮 3D Model: {food.name} (Hazır)</span>
                        </div>
                    </div>
                </div>
            )}

            {arStatus === 'loading' && (
                <div className="ar-loading">
                    <div className="ar-loading-spinner"></div>
                    <p>Kamera açılır...</p>
                </div>
            )}

            {(arStatus === 'running' || arStatus === 'detected') && (
                <div className="ar-container">
                    <video ref={videoRef} className="ar-video" playsInline muted />
                    <canvas ref={canvasRef} className="ar-canvas" />

                    <div className="ar-status-overlay">
                        {modelStatus === 'loading' && (
                            <div className="ar-status-message model-loading">
                                <div className="ar-model-spinner"></div>
                                <p>Loading 3D model...</p>
                            </div>
                        )}

                        {modelStatus === 'loaded' && arStatus === 'running' && !markerDetected && (
                            <div className="ar-status-message">
                                <div className="ar-scan-icon">📷</div>
                                <p>Türk naxışı kameraya göstərin</p>
                            </div>
                        )}

                        {markerDetected && (
                            <div className="ar-detected-badge">✓ {food.name} - 3D Model</div>
                        )}
                    </div>

                    <div className="ar-food-badge">
                        <span className="ar-food-name">{food.name}</span>
                        <span className="ar-food-price">{food.price.toFixed(2)} ₼</span>
                    </div>

                    <button className="ar-close-btn" onClick={stopAR}>✕</button>
                </div>
            )}

            {arStatus === 'error' && (
                <div className="ar-error">
                    <div className="error-icon">⚠️</div>
                    <p>{errorMessage}</p>
                    <div className="ar-error-actions">
                        <button className="btn btn-primary" onClick={startAR}>Yenidən Cəhd Et</button>
                        <Link to="/menu" className="btn btn-secondary">Menyuya Qayıt</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ARView;
