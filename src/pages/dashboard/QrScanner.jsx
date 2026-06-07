import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axiosClient from '../../api/axiosClient';
import { Card, Button, Spinner } from '../../components/ui/BaseComponents';
import {
    Camera, Scan, Users, CheckCircle, AlertCircle,
    Play, Volume2, VolumeX, Video, List, RefreshCw,
    Zap, X, Monitor
} from 'lucide-react';
import { toast } from 'react-toastify';

const SCAN_COOLDOWN_MS = 3000; // Prevent duplicate scans within 3 seconds

const QrScanner = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState('camera');

    // Camera scanner state
    const [cameraStarted, setCameraStarted] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [cameraError, setCameraError] = useState('');
    const scannerRef = useRef(null);
    const lastScanTimeRef = useRef(0);
    const scanHandlerRef = useRef(null);

    // Mock scanner state
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [manualToken, setManualToken] = useState('');

    // Shared state
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [totalScans, setTotalScans] = useState(0);

    // ─── Audio Feedback ───
    const playBeep = useCallback((type) => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
            }
        } catch (e) {
            console.error('AudioContext beep error', e);
        }
    }, [soundEnabled]);

    // ─── Scan Handler ───
    const handleScan = useCallback(async (token) => {
        if (!token) return;

        // Cooldown check for camera auto-scans
        const now = Date.now();
        if (now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) return;
        lastScanTimeRef.current = now;

        try {
            setScanning(true);
            setScanResult(null);

            const res = await axiosClient.post('/qr-attendance/scan', {
                qrToken: token,
                deviceInfo: activeTab === 'camera' ? 'Camera Scanner Terminal' : 'Manual Entry Terminal'
            });

            const result = {
                success: true,
                data: res.data,
                time: new Date().toLocaleTimeString()
            };
            setScanResult(result);
            setScanHistory(prev => [result, ...prev].slice(0, 20));
            setTotalScans(prev => prev + 1);
            playBeep('success');
            toast.success(res.data.message || 'Meal verified successfully!');
        } catch (error) {
            playBeep('error');
            const errMsg = error.response?.data?.message || error.response?.data || 'Verification rejected';
            const result = {
                success: false,
                message: typeof errMsg === 'string' ? errMsg : 'Verification failed',
                time: new Date().toLocaleTimeString()
            };
            setScanResult(result);
            setScanHistory(prev => [result, ...prev].slice(0, 20));
            toast.error(typeof errMsg === 'string' ? errMsg : 'Verification failed');
        } finally {
            setScanning(false);
        }
    }, [activeTab, playBeep]);

    // Keep a ref to the latest handleScan so the camera callback always uses the current version
    useEffect(() => {
        scanHandlerRef.current = handleScan;
    }, [handleScan]);

    // ─── Camera Functions ───
    const getCameras = useCallback(async () => {
        try {
            const devices = await Html5Qrcode.getCameras();
            setCameras(devices);
            if (devices.length > 0) {
                const backCam = devices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment')
                );
                setSelectedCameraId(backCam ? backCam.id : devices[0].id);
            }
            setCameraError('');
        } catch (err) {
            setCameraError('Camera access denied. Please allow camera permissions in your browser settings.');
            console.error('Camera enumeration error:', err);
        }
    }, []);

    const stopCamera = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) { // SCANNING state
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                console.error('Stop camera error:', e);
                try { scannerRef.current.clear(); } catch (_) {}
            }
            scannerRef.current = null;
        }
        setCameraStarted(false);
    }, []);

    const startCamera = useCallback(async (cameraId) => {
        const targetCameraId = cameraId || selectedCameraId;
        if (!targetCameraId) return;

        try {
            setCameraLoading(true);
            setCameraError('');

            // Stop existing scanner if any
            await stopCamera();

            // Small delay to let DOM settle after stopCamera clears the container
            await new Promise(resolve => setTimeout(resolve, 200));

            const html5QrCode = new Html5Qrcode('qr-camera-reader');
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                targetCameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Use ref to always call the latest handler (avoids stale closures)
                    if (scanHandlerRef.current) {
                        scanHandlerRef.current(decodedText);
                    }
                },
                () => {
                    // QR parse error — ignore, keep scanning
                }
            );

            setCameraStarted(true);
        } catch (err) {
            console.error('Camera start error:', err);
            const msg = String(err?.message || err || '');
            if (msg.includes('NotAllowed') || msg.includes('Permission')) {
                setCameraError('Camera permission denied. Please enable camera access in browser settings.');
            } else if (msg.includes('NotFound') || msg.includes('NotReadable')) {
                setCameraError('Camera not found or already in use by another app.');
            } else {
                setCameraError(`Camera error: ${msg}`);
            }
        } finally {
            setCameraLoading(false);
        }
    }, [selectedCameraId, stopCamera]);

    // ─── Effects ───
    useEffect(() => {
        getCameras();
    }, [getCameras]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(() => {});
                    scannerRef.current.clear();
                } catch (e) { /* ignore */ }
            }
        };
    }, []);

    // Stop camera when switching to manual tab
    useEffect(() => {
        if (activeTab !== 'camera' && cameraStarted) {
            stopCamera();
        }
    }, [activeTab, cameraStarted, stopCamera]);

    // Fetch users for mock tab
    useEffect(() => {
        if (activeTab === 'manual' && users.length === 0) {
            const fetchUsers = async () => {
                try {
                    setLoadingUsers(true);
                    const res = await axiosClient.get('/user');
                    setUsers(res.data);
                } catch (error) {
                    toast.error('Failed to load user list.');
                } finally {
                    setLoadingUsers(false);
                }
            };
            fetchUsers();
        }
    }, [activeTab, users.length]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">QR Attendance Scanner</h1>
                    <p className="text-gray-500 text-sm mt-1">Scan student/staff QR codes with camera or use manual entry for meal verification.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
                        <Zap size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-orange-700">{totalScans} Scans</span>
                    </div>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-bold transition-all ${
                            soundEnabled
                                ? 'bg-orange-50 border-orange-200 text-orange-600'
                                : 'bg-gray-100 border-gray-200 text-gray-400'
                        }`}
                    >
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-gray-100 rounded-2xl p-1 max-w-md">
                <button
                    onClick={() => setActiveTab('camera')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'camera'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Camera size={16} />
                    Camera Scan
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'manual'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <List size={16} />
                    Manual / Mock
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Scanner Area (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                    {activeTab === 'camera' ? (
                        /* ══════════ CAMERA SCANNER TAB ══════════ */
                        <Card className="p-0 bg-gray-950 text-white rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
                            {/* Camera Header Bar */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/60">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${cameraStarted ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        {cameraStarted ? 'Live Camera Feed' : 'Camera Offline'}
                                    </span>
                                </div>
                                {cameras.length > 1 && cameraStarted && (
                                    <select
                                        value={selectedCameraId}
                                        onChange={async (e) => {
                                            const newId = e.target.value;
                                            setSelectedCameraId(newId);
                                            await stopCamera();
                                            setTimeout(() => startCamera(newId), 300);
                                        }}
                                        className="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    >
                                        {cameras.map(cam => (
                                            <option key={cam.id} value={cam.id}>
                                                {cam.label || `Camera ${cam.id.slice(0, 8)}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Camera Viewfinder Area */}
                            <div className="relative min-h-[400px] bg-gray-900">
                                {/*
                                    IMPORTANT: This div must ALWAYS be in the DOM and visible
                                    for html5-qrcode to render the camera feed into it.
                                    We overlay UI on top of it instead of hiding it.
                                */}
                                <div
                                    id="qr-camera-reader"
                                    style={{ width: '100%', minHeight: '400px' }}
                                ></div>

                                {/* "Not started" overlay — shown ON TOP when camera is off */}
                                {!cameraStarted && !cameraLoading && (
                                    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-5 z-10">
                                        <div className="relative w-56 h-56 flex items-center justify-center">
                                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-orange-500 rounded-tl-xl"></div>
                                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-orange-500 rounded-tr-xl"></div>
                                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-orange-500 rounded-bl-xl"></div>
                                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-orange-500 rounded-br-xl"></div>
                                            <Camera size={64} className="text-gray-700" />
                                        </div>

                                        {cameraError ? (
                                            <div className="text-center px-6 max-w-sm">
                                                <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
                                                <p className="text-red-400 text-sm font-medium">{cameraError}</p>
                                                <button
                                                    onClick={() => { setCameraError(''); getCameras(); }}
                                                    className="mt-3 text-xs text-orange-400 hover:text-orange-300 underline font-semibold"
                                                >
                                                    Retry Camera Access
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startCamera()}
                                                disabled={cameras.length === 0}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Video size={18} />
                                                {cameras.length === 0 ? 'No Camera Found' : 'Start Camera Scanner'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Loading overlay */}
                                {cameraLoading && (
                                    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4 z-10">
                                        <RefreshCw size={32} className="text-orange-500 animate-spin" />
                                        <span className="text-orange-400 text-sm font-bold uppercase tracking-wider">Starting Camera...</span>
                                    </div>
                                )}

                                {/* Scanning/verifying overlay */}
                                {scanning && cameraStarted && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                        <div className="flex flex-col items-center gap-3 bg-gray-900/90 px-8 py-6 rounded-2xl border border-gray-700">
                                            <Spinner size="lg" className="text-orange-500" />
                                            <span className="text-orange-400 text-sm font-bold uppercase tracking-wider">Verifying...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Camera Footer */}
                            {cameraStarted && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800/60">
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        Point camera at QR code — auto-scans instantly
                                    </span>
                                    <button
                                        onClick={stopCamera}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <X size={12} />
                                        Stop Camera
                                    </button>
                                </div>
                            )}
                        </Card>
                    ) : (
                        /* ══════════ MANUAL / MOCK TAB ══════════ */
                        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                                <Monitor className="text-orange-500" size={20} />
                                Manual Token Entry & Mock Simulator
                            </h3>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualToken}
                                    placeholder="Paste or type QR token here..."
                                    onChange={e => setManualToken(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && manualToken) {
                                            handleScan(manualToken);
                                            setManualToken('');
                                        }
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-mono"
                                />
                                <Button
                                    onClick={() => {
                                        handleScan(manualToken);
                                        setManualToken('');
                                    }}
                                    disabled={!manualToken || scanning}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-1 border-0"
                                >
                                    <Play size={16} /> Scan
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Click User to Simulate QR Scan:</h4>

                                {loadingUsers ? (
                                    <div className="py-6 flex justify-center"><Spinner /></div>
                                ) : users.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No users registered.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                                        {users.map(u => {
                                            const mockToken = `USER_QR_CODE:${u.id}:${Date.now()}`;
                                            return (
                                                <button
                                                    key={u.id}
                                                    onClick={() => handleScan(mockToken)}
                                                    disabled={scanning}
                                                    className="w-full flex items-center justify-between p-3 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 text-left rounded-xl transition-all select-none group"
                                                >
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-gray-900 block truncate group-hover:text-orange-600 text-sm">{u.fullName}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">ID #{u.id} • {u.role}</span>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                        u.role === 'Admin' ? 'bg-orange-50 text-orange-600' :
                                                        u.role === 'Staff' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        Scan
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Scan Result Card */}
                    {scanResult && (
                        <Card className={`p-5 rounded-2xl shadow-md border animate-fade-in ${
                            scanResult.success
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                        } flex gap-4 items-start`}>
                            {scanResult.success ? (
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                                    <CheckCircle size={24} className="text-emerald-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                                    <AlertCircle size={24} className="text-rose-600" />
                                </div>
                            )}
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-base">
                                        {scanResult.success ? '✅ Access Granted' : '❌ Access Denied'}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 font-mono">{scanResult.time}</span>
                                </div>
                                <p className="text-sm mt-1">
                                    {scanResult.success
                                        ? `${scanResult.data.userName} verified for ${scanResult.data.mealType} at ${scanResult.data.scanTime}.`
                                        : scanResult.message
                                    }
                                </p>
                                {scanResult.success && scanResult.data.deductedInventory && (
                                    <div className="mt-3 pt-2.5 border-t border-emerald-200/50">
                                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Auto Stock Deductions:</span>
                                        <ul className="text-xs list-disc pl-4 mt-1 space-y-0.5">
                                            {scanResult.data.deductedItems.map(item => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Panel: Scan History (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="p-4 bg-white border border-gray-100 shadow-sm text-center">
                            <span className="text-2xl font-black text-gray-900">{totalScans}</span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Total Scans</p>
                        </Card>
                        <Card className="p-4 bg-white border border-gray-100 shadow-sm text-center">
                            <span className="text-2xl font-black text-emerald-600">
                                {scanHistory.filter(s => s.success).length}
                            </span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Verified</p>
                        </Card>
                    </div>

                    <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-3xl">
                        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-3 flex items-center gap-2">
                            <List size={16} className="text-orange-500" />
                            Recent Scan Activity
                        </h3>

                        {scanHistory.length === 0 ? (
                            <div className="py-10 text-center">
                                <Scan size={36} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">No scans yet</p>
                                <p className="text-xs text-gray-300 mt-1">Scan a QR code to see activity here</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                                {scanHistory.map((scan, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            scan.success
                                                ? 'bg-emerald-50/50 border-emerald-100'
                                                : 'bg-rose-50/50 border-rose-100'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            scan.success ? 'bg-emerald-100' : 'bg-rose-100'
                                        }`}>
                                            {scan.success ? (
                                                <CheckCircle size={14} className="text-emerald-600" />
                                            ) : (
                                                <AlertCircle size={14} className="text-rose-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">
                                                {scan.success ? scan.data.userName : 'Denied'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {scan.success ? scan.data.mealType : scan.message}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400 shrink-0">{scan.time}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {activeTab === 'camera' && (
                        <Card className="p-5 bg-amber-50/50 border border-amber-100 rounded-3xl">
                            <h4 className="font-bold text-sm text-amber-900 mb-3">📸 How to use Camera Scanner</h4>
                            <div className="space-y-2">
                                {[
                                    'Click "Start Camera Scanner" to activate your device camera',
                                    'Allow camera permission when browser asks',
                                    'Point camera at the student\'s QR code on their phone or ID card',
                                    'Scanner auto-detects the QR code — no button needed',
                                    'Success beep = attendance recorded, Buzzer = rejected'
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                                        <p className="text-xs text-amber-800">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QrScanner;
