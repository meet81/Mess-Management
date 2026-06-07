import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { Card, Spinner, Button } from '../../components/ui/BaseComponents';
import { QrCode, Download, Printer, User as UserIcon, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

const DigitalIdCard = () => {
    const { user } = useAuth();
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchQrData = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get(`/users/qrcode/${user.id}`);
            setQrData(res.data);
        } catch (error) {
            toast.error('Failed to load digital ID card details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchQrData();
        }
    }, [user]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-[300px] flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData?.qrToken || '')}`;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Digital ID Card</h1>
                    <p className="text-gray-500 text-sm mt-1">Use this QR code at the scanner to verify meals and record your attendance.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handlePrint} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm font-semibold flex items-center gap-2">
                        <Printer size={18} /> Print Card
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* ID Card Wrapper */}
                <div className="flex justify-center print:block print:w-[350px]">
                    <div className="w-[340px] h-[500px] rounded-3xl bg-gradient-to-b from-gray-900 via-gray-900 to-orange-950 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-between p-6 border border-gray-800">
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Top Bar */}
                        <div className="w-full flex justify-between items-center border-b border-gray-800/80 pb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    M
                                </div>
                                <span className="text-sm font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    MESS MANAGER
                                </span>
                            </div>
                            <span className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">DIGITAL ID</span>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 w-full">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-xl relative">
                                <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-900">
                                    {qrData?.name?.charAt(0) || 'U'}
                                </div>
                                <span className="absolute bottom-0 right-0 px-2 py-0.5 bg-emerald-500 text-[8px] font-black tracking-wider text-white uppercase rounded-full border border-gray-950">
                                    {qrData?.activeStatus}
                                </span>
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-bold text-white tracking-tight">{qrData?.name}</h3>
                                <p className="text-orange-400 text-xs font-bold uppercase tracking-widest">{qrData?.designation || qrData?.role}</p>
                                <p className="text-gray-400 text-xs">{qrData?.department || 'Mess Division'}</p>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center shrink-0 border border-gray-800">
                            <img src={qrImageUrl} alt="Verification QR Code" className="w-36 h-36 select-none" />
                        </div>

                        {/* Footer */}
                        <div className="w-full text-center text-[9px] text-gray-500 tracking-wider pt-4 border-t border-gray-800/80 shrink-0">
                            ID: #{qrData?.userId} • System verified barcode
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                    <Card className="p-6 bg-white border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-lg text-gray-900 border-b pb-2">How to use your Smart QR</h3>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                <p className="text-sm text-gray-600">Present this QR code to the scanner terminal located at the entrance of the mess hall.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                <p className="text-sm text-gray-600">Wait for the green visual indicator or affirmative sound signal confirming verification status.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                <p className="text-sm text-gray-600">Upon successful scan, your attendance is logged, your meal count is updated, and matching inventory ingredients are deducted.</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-amber-50/50 border border-amber-100 shadow-sm flex gap-4 text-amber-900">
                        <Shield className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-sm">Security Notice</h4>
                            <p className="text-xs text-amber-700 mt-0.5">Please do not share your QR code or screenshot. The code contains secure encrypted timestamps to prevent duplicate scan usage and unauthorized cafeteria access.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DigitalIdCard;
