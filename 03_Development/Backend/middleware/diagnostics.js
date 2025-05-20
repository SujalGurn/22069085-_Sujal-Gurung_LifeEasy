export const qrScannerLogger = (req, res, next) => {
    const scanData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        origin: req.headers.origin
      }
    };
  
    console.log('QR Scan Attempt:', scanData);
    next();
  };