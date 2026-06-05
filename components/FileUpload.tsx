
import React, { useState, useRef } from 'react';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface FileUploadProps {
  onFileSelect: (base64: string, mimeType: string) => void;
  customInstruction?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, customInstruction }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;

    const supportedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!supportedTypes.includes(file.type)) {
      alert("Lütfen sadece JPG, PNG veya PDF dosyası yükleyin! 🎈");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`Dosya boyutu ${MAX_FILE_SIZE_MB}MB'ı aşamaz. Lütfen daha küçük bir dosya seçin.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result && result.includes(',')) {
        const base64 = result.split(',')[1];
        onFileSelect(base64, file.type);
      }
    };
    reader.onerror = () => {
      console.error("Dosya okuma hatası");
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      onClick={onButtonClick}
      className={`relative w-full max-w-2xl mx-auto p-8 sm:p-16 border-4 border-dashed rounded-[2rem] sm:rounded-[3rem] transition-all duration-300 flex flex-col items-center justify-center space-y-4 sm:space-y-6 cursor-pointer group px-4 ${
        dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50 shadow-xl shadow-slate-100/50'
      }`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 sm:w-10 sm:h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      </div>
      <div className="text-center space-y-1 sm:space-y-2">
        <h3 className="text-xl sm:text-2xl font-black text-slate-800">Ders Notlarını Yükle</h3>
        <p className="text-slate-500 text-sm sm:text-lg font-medium max-w-sm mx-auto">
          {customInstruction || "Görsel veya PDF dosyasını yüklemek için tıkla ya da buraya sürükle bırak!"}
        </p>
      </div>
      <div className="bg-indigo-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-colors shadow-lg shadow-indigo-100 group-hover:bg-indigo-700">
        Dosya Seç
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleChange}
      />
      <div className="flex space-x-2 sm:space-x-3 items-center">
        <span className="bg-slate-100 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black text-slate-400">JPG</span>
        <span className="bg-slate-100 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black text-slate-400">PNG</span>
        <span className="bg-slate-100 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black text-slate-400">PDF</span>
        <span className="bg-slate-100 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black text-slate-400">Maks {MAX_FILE_SIZE_MB}MB</span>
      </div>
    </div>
  );
};

export default FileUpload;
