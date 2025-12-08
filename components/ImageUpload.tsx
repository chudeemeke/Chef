import React, { useState, useCallback } from 'react';
import { CameraIcon, UploadIcon } from './icons';
import CameraModal from './CameraModal';

interface ImageUploadProps {
  onImageUpload: (base64Image: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [showCamera, setShowCamera] = useState(false);

  // Check if likely mobile device to prefer native camera intent
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onImageUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleTakePhotoClick = (e: React.MouseEvent) => {
      // If desktop, prevent default file input and show modal
      if (!isMobile) {
          e.preventDefault();
          setShowCamera(true);
      }
      // If mobile, let the label click trigger the hidden input with capture="environment"
  };

  return (
    <>
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center transition-colors duration-200">
        <div className="max-w-md w-full">
            <div className="w-24 h-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <CameraIcon className="w-12 h-12 text-gray-500 dark:text-gray-300" />
            </div>
        
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">What's in your fridge?</h2>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Snap a photo of your fridge, and our AI will suggest delicious recipes based on what you have.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full">
            {/* Camera Button */}
            <label
                htmlFor="camera-input"
                onClick={handleTakePhotoClick}
                className="cursor-pointer flex-1 flex items-center justify-center px-6 py-4 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus-within:ring-4 focus-within:ring-blue-500/50 transition-all transform hover:scale-105"
            >
                <CameraIcon className="w-6 h-6 mr-2" />
                <span>Take Photo</span>
                <input
                id="camera-input"
                name="camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handleFileChange}
                disabled={!isMobile && showCamera} // Disable input if showing modal to avoid double trigger
                />
            </label>

            {/* Upload Button */}
            <label
                htmlFor="file-upload"
                className="cursor-pointer flex-1 flex items-center justify-center px-6 py-4 border-2 border-blue-600 text-lg font-medium rounded-xl text-blue-600 bg-white hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700 focus-within:ring-4 focus-within:ring-blue-500/50 transition-all transform hover:scale-105"
            >
                <UploadIcon className="w-6 h-6 mr-2" />
                <span>Upload File</span>
                <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                />
            </label>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Supported formats: JPG, PNG, HEIC
            </p>
        </div>
        </div>
        
        {showCamera && (
            <CameraModal 
                onCapture={onImageUpload} 
                onClose={() => setShowCamera(false)} 
            />
        )}
    </>
  );
};

export default ImageUpload;