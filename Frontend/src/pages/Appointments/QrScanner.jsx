import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../style/QR.css';

const QrScanner = () => {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [isScannerStarting, setIsScannerStarting] = useState(true);
  const navigate = useNavigate();
  const html5QrCodeRef = useRef(null);
  const cancelTokenRef = useRef(null);
  const qrRegionId = 'qr-reader';

  // Refs for stale closure prevention
  const processingRef = useRef(processing);
  processingRef.current = processing;
  const lastScannedRef = useRef(lastScanned);
  lastScannedRef.current = lastScanned;

  const handleScan = useCallback(async (data) => {
    setProcessing(true);
    setError('');
    setLastScanned(data);

    try {
      cancelTokenRef.current = axios.CancelToken.source();
      const response = await axios.get(`/api/appointments/verify`, {
        params: { token: data },
        timeout: 5000,
        cancelToken: cancelTokenRef.current.token
      });
      // /appointment/verified
      const result = response.data;
      if (result.success) {
        await html5QrCodeRef.current?.stop();
        navigate(`/booking-details/${result.appointmentId}`);

;
        return;
      }
      setError(result.message || 'Verification failed');
      setLastScanned(null); // Reset to allow rescan
    } catch (err) {
      if (!axios.isCancel(err)) {
        let errorMessage = 'Scan failed. Please try again.';
        if (err.response) {
          errorMessage = err.response.data?.message || `Error: ${err.response.statusText}`;
        } else if (err.request) {
          errorMessage = 'No response from server';
        } else {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setLastScanned(null); // Reset to allow rescan
      }
    } finally {
      setProcessing(false);
    }
  }, [navigate]);

  const handleScanRef = useRef(handleScan);
  handleScanRef.current = handleScan;

  const startScanner = useCallback(async () => {
    try {
      setIsScannerStarting(true);
      setError('');
      
      const devices = await Html5Qrcode.getCameras();
      if (!devices?.length) {
        throw new Error('No cameras found');
      }

      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }

      const cameraId = devices[0].id;
      html5QrCodeRef.current = new Html5Qrcode(qrRegionId);

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (!processingRef.current && decodedText !== lastScannedRef.current) {
            handleScanRef.current(decodedText);
          }
        },
        (errorMsg) => {
          console.debug('QR scanner error:', errorMsg);
        }
      );
      setIsScannerStarting(false);
    } catch (err) {
      setError(err.message || 'Unable to access camera');
      setIsScannerStarting(false);
      console.error('Scanner error:', err);
    }
  }, []);

  const handleRetry = async () => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current.clear();
    }
    await startScanner();
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, [startScanner]);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Scan Appointment QR Code</h1>

      <div className="bg-white rounded-xl shadow-lg p-4">
        {isScannerStarting && (
          <div className="mb-4 text-center">
            <LoadingSpinner size="medium" />
            <p className="text-gray-600 mt-2">Initializing scanner...</p>
          </div>
        )}

        {processing && (
          <div className="mb-4 text-center">
            <LoadingSpinner size="medium" />
            <p className="text-gray-600 mt-2">Verifying appointment...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-600 font-medium">{error}</p>
            {error.includes('camera') && (
              <button
                onClick={handleRetry}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Camera Access
              </button>
            )}
          </div>
        )}

        <div 
          id={qrRegionId} 
          className="relative rounded-lg overflow-hidden bg-gray-100" 
          style={{ width: '100%', height: '300px' }}
        >
          {!isScannerStarting && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-blue-400 rounded-lg" style={{
                width: '250px',
                height: '250px',
                boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.5)'
              }} />
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Align the QR code within the frame to scan
          </p>
          <p className="text-gray-500 text-xs mt-2">
            QR codes expire 1 hour after appointment time
          </p>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;