import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ARView = () => {
    const location = useLocation();
    const food = location.state?.food;

    const [arStatus, setArStatus] = useState('idle');
    const [arSupported, setArSupported] = useState(null);
    const [modelPlaced, setModelPlaced] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const modelRef = useRef(null);
    const reticleRef = useRef(null);
    const hitTestSourceRef = useRef(null);
    const mixerRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());
    const xrSessionRef = useRef(null);

    // Touch rotation
    const touchStartRef = useRef({ x: 0, y: 0 });
    const rotationRef = useRef({ x: 0, y: 0 });
    const isRotatingRef = useRef(false);

    // WebXR dəstəyini yoxla
    useEffect(() => {
        const checkARSupport = async () => {
            if ('xr' in navigator) {
                try {
                    const supported = await navigator.xr.isSessionSupported('immersive-ar');
                    setArSupported(supported);
                } catch (e) {
                    setArSupported(false);
                }
            } else {
                setArSupported(false);
            }
        };
        checkARSupport();
    }, []);

    // GLB model yüklə
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
                    const scale = maxDim > 0 ? 0.3 / maxDim : 0.3;
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

    // Procedural pizza modeli
    const createPizzaModel = useCallback(() => {
        const pizzaGroup = new THREE.Group();

        const baseGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
        const base = new THREE.Mesh(baseGeom, baseMaterial);
        pizzaGroup.add(base);

        const sauceGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.003, 32);
        const sauceMaterial = new THREE.MeshStandardMaterial({ color: 0xB22222 });
        const sauce = new THREE.Mesh(sauceGeom, sauceMaterial);
        sauce.position.y = 0.012;
        pizzaGroup.add(sauce);

        const cheeseGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.004, 32);
        const cheeseMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
        const cheese = new THREE.Mesh(cheeseGeom, cheeseMaterial);
        cheese.position.y = 0.015;
        pizzaGroup.add(cheese);

        const pepperoniGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.006, 16);
        const pepperoniMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
        const positions = [[0.05, 0.04], [-0.06, 0.03], [0.03, -0.06], [-0.04, -0.05], [0.07, -0.03]];
        positions.forEach(([x, z]) => {
            const pepperoni = new THREE.Mesh(pepperoniGeom, pepperoniMaterial);
            pepperoni.position.set(x, 0.02, z);
            pizzaGroup.add(pepperoni);
        });

        return pizzaGroup;
    }, []);

    // Reticle (yerləşdirmə indikatoru) yarat
    const createReticle = useCallback(() => {
        const geometry = new THREE.RingGeometry(0.08, 0.1, 32);
        geometry.rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        const reticle = new THREE.Mesh(geometry, material);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        return reticle;
    }, []);

    // Touch hadisələri
    const handleTouchStart = useCallback((e) => {
        if (!modelPlaced || !modelRef.current) return;
        if (e.touches.length === 1) {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            isRotatingRef.current = true;
        }
    }, [modelPlaced]);

    const handleTouchMove = useCallback((e) => {
        if (!isRotatingRef.current || !modelRef.current) return;
        if (e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - touchStartRef.current.x;
            rotationRef.current.y += deltaX * 0.01;
            modelRef.current.rotation.y = rotationRef.current.y;
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        isRotatingRef.current = false;
    }, []);

    // WebXR AR sessiyasını başlat
    const startAR = async () => {
        if (!arSupported) {
            setErrorMessage('Bu cihazda AR dəstəklənmir');
            setArStatus('error');
            return;
        }

        try {
            setArStatus('loading');

            // Renderer yarat
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.xr.enabled = true;
            rendererRef.current = renderer;

            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(renderer.domElement);
            }

            // Scene yarat
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            // Camera yarat
            const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
            cameraRef.current = camera;

            // İşıqlandırma
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);

            // Reticle əlavə et
            const reticle = createReticle();
            scene.add(reticle);
            reticleRef.current = reticle;

            // Model yüklə
            let model;
            const modelPath = food?.model3D?.trim() || '/models/pizza.glb';

            try {
                model = await loadGLBModel(modelPath);
            } catch (e) {
                model = createPizzaModel();
            }

            model.visible = false;
            scene.add(model);
            modelRef.current = model;

            // XR Session başlat
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: containerRef.current }
            });

            xrSessionRef.current = session;
            renderer.xr.setReferenceSpaceType('local');
            await renderer.xr.setSession(session);

            // Hit test source al
            const viewerSpace = await session.requestReferenceSpace('viewer');
            const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
            hitTestSourceRef.current = hitTestSource;

            setArStatus('running');

            // Select hadisəsi - masa səthində yerləşdir
            session.addEventListener('select', () => {
                if (reticleRef.current?.visible && modelRef.current && !modelPlaced) {
                    modelRef.current.position.setFromMatrixPosition(reticleRef.current.matrix);
                    modelRef.current.visible = true;
                    reticleRef.current.visible = false;
                    setModelPlaced(true);
                }
            });

            session.addEventListener('end', () => {
                setArStatus('idle');
                setModelPlaced(false);
                hitTestSourceRef.current = null;
            });

            // Animasiya loop
            renderer.setAnimationLoop((timestamp, frame) => {
                if (frame && hitTestSourceRef.current && !modelPlaced) {
                    const referenceSpace = renderer.xr.getReferenceSpace();
                    const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);

                    if (hitTestResults.length > 0) {
                        const hit = hitTestResults[0];
                        const pose = hit.getPose(referenceSpace);
                        if (pose && reticleRef.current) {
                            reticleRef.current.visible = true;
                            reticleRef.current.matrix.fromArray(pose.transform.matrix);
                        }
                    } else {
                        if (reticleRef.current) reticleRef.current.visible = false;
                    }
                }

                if (mixerRef.current) {
                    mixerRef.current.update(clockRef.current.getDelta());
                }

                renderer.render(scene, camera);
            });

        } catch (error) {
            console.error('AR xətası:', error);
            setArStatus('error');
            setErrorMessage(error.message || 'AR başladıla bilmədi');
        }
    };

    const stopAR = async () => {
        if (xrSessionRef.current) {
            await xrSessionRef.current.end();
        }
        if (rendererRef.current) {
            rendererRef.current.dispose();
        }
        setArStatus('idle');
        setModelPlaced(false);
    };

    // Touch event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (container && arStatus === 'running') {
            container.addEventListener('touchstart', handleTouchStart);
            container.addEventListener('touchmove', handleTouchMove);
            container.addEventListener('touchend', handleTouchEnd);
            return () => {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [arStatus, handleTouchStart, handleTouchMove, handleTouchEnd]);

    // Cleanup
    useEffect(() => {
        return () => {
            stopAR();
        };
    }, []);

    if (!food) {
        return (
            <div className="page ar-page">
                <h1>🥽 AR Görünüş</h1>
                <div className="ar-empty">
                    <div className="ar-empty-icon">🍽️</div>
                    <h2>Yemək Seçilməyib</h2>
                    <p>Zəhmət olmasa menyudan yemək seçin</p>
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

                        {arSupported === false && (
                            <div className="ar-warning">
                                ⚠️ Bu cihazda AR dəstəklənmir. AR üçün Android Chrome və ya iOS Safari istifadə edin.
                            </div>
                        )}

                        {arSupported && (
                            <div className="ar-actions">
                                <button className="btn btn-primary btn-large ar-start-btn" onClick={startAR}>
                                    🥽 AR-ni Başlat
                                </button>
                                <Link to="/menu" className="btn btn-secondary">← Menyuya Qayıt</Link>
                            </div>
                        )}

                        <div className="ar-marker-info">
                            <h4>📌 AR istifadəsi:</h4>
                            <ol>
                                <li>AR-ni başladın</li>
                                <li>Kameranı stol və ya masa səthinə yönəldin</li>
                                <li>Yaşıl dairə görünəndə ekrana toxunun</li>
                                <li>3D modeli barmağınızla fırladın!</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {arStatus === 'loading' && (
                <div className="ar-loading">
                    <div className="ar-loading-spinner"></div>
                    <p>AR yüklənir...</p>
                </div>
            )}

            {arStatus === 'running' && (
                <div className="ar-container" ref={containerRef}>
                    <div className="ar-hud">
                        {!modelPlaced && (
                            <div className="ar-instruction">
                                <span>📍 Masa səthinə yönəldin və yaşıl dairəyə toxunun</span>
                            </div>
                        )}
                        {modelPlaced && (
                            <div className="ar-instruction success">
                                <span>✓ {food.name} yerləşdirildi! Fırlatmaq üçün sürüşdürün</span>
                            </div>
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
