import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PDFUploadProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export function PDFUpload({ onTextExtracted, disabled }: PDFUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractText = async (file: File) => {
    setExtracting(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      onTextExtracted(fullText.trim());
    } catch (err) {
      setError('PDF konnte nicht gelesen werden. Versuche eine textbasierte PDF.');
    } finally {
      setExtracting(false);
    }
  };

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Bitte eine PDF-Datei wählen.');
      return;
    }
    extractText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onClick = () => fileInputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="pdf-upload">
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={onChange} disabled={disabled || extracting} style={{ display: 'none' }} />
      
      <div
        className={`drop-zone ${dragActive ? 'active' : ''} ${extracting ? 'extracting' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        {extracting ? (
          <div className="spinner">PDF wird analysiert…</div>
        ) : (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p>Stelleninserat als PDF hochladen</p>
            <span className="hint">Drag & Drop oder klicken</span>
          </>
        )}
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}