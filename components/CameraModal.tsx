import React, { useRef, useEffect, useState } from 'react';
import { XIcon } from './icons';

interface CameraModalProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setError(null);
      try {
        // Try environment camera first
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
        } catch (envError) {
            console.warn("Environment camera not found, falling back to any video source.", envError);
            // Fallback to any camera
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: false
            });
        }

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please ensure you have granted camera permissions in your browser settings.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const base64 = dataUrl.split(',')[1];
            onCapture(base64);
            onClose();
        } catch (e) {
            console.error("Error creating image from canvas", e);
            setError("Failed to capture image. Please try again.");
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center bg-black/40 absolute top-0 left-0 right-0 z-10">
            <span className="text-white font-medium px-2">Take Photo</span>
            <button 
                onClick={onClose} 
                className="p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700 transition"
            >
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Video Area */}
        <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden">
             {error ? (
                 <div className="text-center p-8 max-w-md">
                     <div className="text-red-500 mb-4 text-5xl">📷</div>
                     <p className="text-red-400 mb-6 text-lg">{error}</p>
                     <button onClick={onClose} className="px-6 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 text-white font-medium transition">Close</button>
                 </div>
             ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                />
             )}
        </div>

        {/* Footer/Controls */}
        {!error && (
            <div className="p-8 flex justify-center bg-black/80 border-t border-gray-800 z-10">
                <button 
                    onClick={handleCapture}
                    className="group w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                    aria-label="Capture photo"
                >
                    <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform duration-200"></div>
                </button>
            </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraModal;