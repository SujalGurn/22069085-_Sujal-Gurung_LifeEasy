import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../style/QR.css';

const QrScanner = () => {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const navigate = useNavigate();
  const html5QrCodeRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());
  const lastScanTimestamp = useRef(0);
  const SCAN_THROTTLE_TIME = 3000;
  const qrRegionId = 'qr-reader';

  // Error message durations
  const ERROR_TIMEOUT = 8000;
  const SCANNER_TIMEOUT = 45000;

  // Enhanced token validation
  const validateAndExtractToken = (data) => {
    try {
      const url = new URL(data);
      return url.searchParams.get('token');
    } catch {
      const jwtMatch = data.match(/(eyJ[\w-]*\.[\w-]*\.[\w-]*)/);
      return jwtMatch ? jwtMatch[0] : null;
    }
  };

  // Optimized scan handler
  const handleScan = useCallback(async (decodedText) => {
    const now = Date.now();
    const rawToken = decodedText.split('?token=')[1] || decodedText;
    const cleanToken = rawToken.replace(/[^A-Za-z0-9-_\.]/g, '');
    if (now - lastScanTimestamp.current < SCAN_THROTTLE_TIME) return;
    lastScanTimestamp.current = now;

    setProcessing(true);
    setError('');
    
    try {
      const token = validateAndExtractToken(decodedText);
      if (!token || !/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
        throw new Error('INVALID_TOKEN_FORMAT');
      }

      const encodedToken = encodeURIComponent(decodedText);

      const response = await axios.get('http://localhost:3002/api/appointments/verify', {
        params: { token: encodeURIComponent(token) },
        signal: abortControllerRef.current.signal,
        timeout: 10000
    });


    console.log("Server Response:", response);

      setScanSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate(`/booking-details/${response.data.data.appointmentId}`);
    } catch (error) {
      handleScanError(error);
    } finally {
      setProcessing(false);
    }
  }, [navigate]);

  // Centralized error handling
  const handleScanError = useCallback((error) => {
    const errorMap = {
      'INVALID_TOKEN_FORMAT': 'Invalid QR code format',
      'EXPIRED': 'QR code expired',
      'ALREADY_USED': 'Already verified',
      'NETWORK_ERROR': 'Connection failed',
      'AbortError': 'Scan canceled',
      'NotAllowedError': 'Camera access denied',
      'NotFoundError': 'No cameras available',
      default: 'Verification failed'
    };

    const errorCode = error.response?.data?.code || 
                     error.code || 
                     error.message.split(' ')[0];
    
    setError(errorMap[errorCode] || errorMap.default);
    setTimeout(() => setError(''), ERROR_TIMEOUT);
  }, []);

  // Scanner lifecycle management
  const startScanner = useCallback(async () => {
    try {
      await safeStopScanner();
      abortControllerRef.current = new AbortController();

      const devices = await Html5Qrcode.getCameras();
      if (!devices.length) throw new Error('NO_CAMERAS_FOUND');

      html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      await html5QrCodeRef.current.start(
        devices[0].id,
        {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1.33,
          disableFlip: false,
          focusMode: 'continuous'
        },
        handleScan,
        () => {} // Quiet console
      );

      setIsScannerActive(true);
    } catch (error) {
      handleScanError(error);
    }
  }, [handleScan, handleScanError]);

  // Safe scanner cleanup
  const safeStopScanner = useCallback(async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      }
      document.getElementById(qrRegionId).innerHTML = '';
    } catch (error) {
      console.debug('Scanner cleanup:', error.message);
    }
    setIsScannerActive(false);
  }, []);

  // Component lifecycle
  useEffect(() => {
    startScanner();
    return () => {
      abortControllerRef.current.abort();
      safeStopScanner();
    };
  }, [startScanner, safeStopScanner]);

  // Scanner timeout handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isScannerActive && !processing && !scanSuccess && !error) {
        setError('Position QR code within frame');
        startScanner();
      }
    }, SCANNER_TIMEOUT);

    return () => clearTimeout(timer);
  }, [isScannerActive, processing, scanSuccess, error, startScanner]);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Scan Appointment QR Code</h1>

      <div className="bg-white rounded-xl shadow-lg p-4">
        {processing && (
          <div className="mb-4 text-center">
            <LoadingSpinner size="medium" />
            <p className="text-gray-600 mt-2">Verifying appointment...</p>
          </div>
        )}

        {scanSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-600 font-medium">Appointment Verified!</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-600 font-medium" role="alert">{error}</p>
            <button
              onClick={startScanner}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry Scan
            </button>
          </div>
        )}

        <div
          id={qrRegionId}
          className="relative rounded-lg overflow-hidden bg-gray-100 qr-video-container"
          aria-label="QR code scanning area"
        >
          <div className="qr-overlay">
            <div className="qr-frame" />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Align QR code within the frame
          </p>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;