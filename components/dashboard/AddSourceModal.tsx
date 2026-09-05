'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  CloudUpload,
  FileText,
  Globe,
  BookOpen,
  Check
} from 'lucide-react';

export type SourceType = 'document' | 'web' | 'note';

export interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource?: (source: { 
    title: string; 
    type: 'pdf' | 'web' | 'note'; 
    fileName?: string;
    extractedText?: string;
  }) => void;
}

export default function AddSourceModal({
  isOpen,
  onClose,
  onAddSource
}: AddSourceModalProps) {
  const [sourceType, setSourceType] = useState<SourceType>('document');
  const [titleOrUrl, setTitleOrUrl] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadedFileName(file.name);
      setUploadError(null);
      if (!titleOrUrl) {
        setTitleOrUrl(file.name);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadedFileName(file.name);
      setUploadError(null);
      if (!titleOrUrl) {
        setTitleOrUrl(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    let extractedText = '';

    // If Document type and a file was selected, send to /api/upload
    if (sourceType === 'document' && selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to parse educational document.');
        }

        extractedText = data.text || '';
      } catch (err: any) {
        console.error('File upload error:', err);
        setUploadError(err.message || 'Failed to upload and parse file.');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const finalTitle = titleOrUrl.trim() || uploadedFileName || (sourceType === 'note' ? 'Pasted Study Note' : 'Untitled Source');

    const mappedType: 'pdf' | 'web' | 'note' = 
      sourceType === 'document' ? 'pdf' : sourceType === 'web' ? 'web' : 'note';

    if (onAddSource) {
      onAddSource({
        title: finalTitle,
        type: mappedType,
        fileName: uploadedFileName || undefined,
        extractedText: extractedText || (sourceType === 'note' ? noteContent : undefined)
      });
    }

    // Reset & close
    setTitleOrUrl('');
    setNoteContent('');
    setUploadedFileName(null);
    setSelectedFile(null);
    setUploadError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
      
      {/* Modal Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        className="bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#2d2f31] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-800 dark:text-[#e3e3e3] font-sans animate-scaleIn transition-colors"
      >
        
        {/* 1. Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 id="modal-headline" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>+ Add Sources to AI Teacher</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8e918f] leading-relaxed">
              Upload educational materials or paste website URLs. AI Teacher grounds all answers strictly in these materials.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#8e918f] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 2. Source Title or URL Input */}
          <div className="space-y-1.5">
            <label 
              htmlFor="source-input"
              className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase"
            >
              SOURCE TITLE OR URL
            </label>
            <input
              id="source-input"
              type="text"
              value={titleOrUrl}
              onChange={(e) => setTitleOrUrl(e.target.value)}
              placeholder="e.g. MIT_Algorithms_Lecture_4.pdf or https://..."
              className="w-full bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8e918f] text-xs sm:text-sm outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] transition-colors"
            />
          </div>

          {/* 3. Source Type Selector (Segmented Control) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase">
              SOURCE TYPE
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#131314] border border-slate-200 dark:border-[#2d2f31]">
              
              {/* Document */}
              <button
                type="button"
                onClick={() => setSourceType('document')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  sourceType === 'document'
                    ? 'bg-blue-600 dark:bg-[#a8c7fa] text-white dark:text-black shadow-sm font-bold'
                    : 'bg-transparent text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-200/70 dark:hover:bg-[#282a2c]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document</span>
              </button>

              {/* Web */}
              <button
                type="button"
                onClick={() => setSourceType('web')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  sourceType === 'web'
                    ? 'bg-blue-600 dark:bg-[#a8c7fa] text-white dark:text-black shadow-sm font-bold'
                    : 'bg-transparent text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-200/70 dark:hover:bg-[#282a2c]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web</span>
              </button>

              {/* Text Note */}
              <button
                type="button"
                onClick={() => setSourceType('note')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  sourceType === 'note'
                    ? 'bg-blue-600 dark:bg-[#a8c7fa] text-white dark:text-black shadow-sm font-bold'
                    : 'bg-transparent text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-200/70 dark:hover:bg-[#282a2c]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Text Note</span>
              </button>

            </div>
          </div>

          {/* 4. Dynamic File Upload Zone (Visible when "Document" is selected) */}
          {sourceType === 'document' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-dashed border-2 rounded-xl p-6 text-center transition-all cursor-pointer select-none ${
                isDragging
                  ? 'border-blue-500 dark:border-[#a8c7fa] bg-blue-50/50 dark:bg-[#282a2c]'
                  : 'border-slate-300 dark:border-[#444746] hover:bg-slate-50 dark:hover:bg-[#282a2c] hover:border-slate-400 dark:hover:border-[#8e918f]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                onChange={handleFileChange}
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#131314] flex items-center justify-center text-blue-600 dark:text-[#a8c7fa] border border-slate-200 dark:border-[#444746]">
                  <CloudUpload className="w-5 h-5" />
                </div>

                <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                  {uploadedFileName ? (
                    <span className="text-blue-600 dark:text-[#a8c7fa] font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Selected: {uploadedFileName}
                    </span>
                  ) : (
                    'Click to upload or drag and drop'
                  )}
                </div>

                {/* Supported Materials List (CRITICAL REQUIREMENT) */}
                <p className="text-[11px] text-slate-500 dark:text-[#8e918f] max-w-sm mx-auto leading-relaxed pt-1">
                  Supported: Books, Textbooks, PDF documents, Lecture notes, DOC/DOCX files, PPT/PPTX files, Research papers, and Course material.
                </p>
              </div>
            </div>
          )}

          {/* Alternative Input Zone for Text Note */}
          {sourceType === 'note' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase">
                PASTE TEXT CONTENT OR TRANSCRIPT
              </label>
              <textarea
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Paste lecture excerpts, syllabus points, or study notes here..."
                className="w-full bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8e918f] text-xs outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] transition-colors"
              />
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs">
              <span className="font-semibold">Upload failed: </span>
              <span>{uploadError}</span>
            </div>
          )}

          {/* 5. Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#2d2f31]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-full bg-transparent border border-slate-300 dark:border-[#444746] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#282a2c] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-[#0b57d0] dark:hover:bg-[#1b6ef3] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isUploading ? 'Ingesting & Parsing...' : 'Ingest Source'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
