import { useState, useRef } from 'react';

interface Props {
  label: string;
  sessionId: string;
  viewType: 'front' | 'side';
  existingVideoUrl?: string;
  onUploaded?: () => void;
  disabled?: boolean;
}

export function VideoCapture({ label, sessionId, viewType, existingVideoUrl, onUploaded, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<'idle' | 'previewing' | 'recording' | 'uploading' | 'done'>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const uploadBlob = async (blob: Blob) => {
    setState('uploading');
    const formData = new FormData();
    formData.append('video', blob, `${viewType}.webm`);
    formData.append('viewType', viewType);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/sessions/${sessionId}/videos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      setState('done');
      onUploaded?.();
    } catch {
      alert('Video upload failed. Please try again.');
      setState('done');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setState('previewing');
    } catch {
      alert('Camera access denied or unavailable. Please allow camera permissions.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      stopStream();
      uploadBlob(blob);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setState('recording');
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const retake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setState('idle');
  };

  // If there's an existing video and we haven't started recording, show playback
  if (existingVideoUrl && state === 'idle' && !recordedUrl) {
    const token = localStorage.getItem('token');
    return (
      <div className="video-capture">
        <h4>{label}</h4>
        <div className="video-container">
          <video
            controls
            playsInline
            className="video-preview"
            src={`${existingVideoUrl}${existingVideoUrl.includes('?') ? '&' : '?'}token=${token}`}
          />
        </div>
        {!disabled && (
          <div className="video-controls">
            <button className="btn-secondary" onClick={() => { setState('idle'); startCamera(); }}>
              ↻ Re-record
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="video-capture">
      <h4>{label}</h4>
      <div className="video-container">
        {state === 'idle' && !disabled && (
          <div className="video-placeholder" onClick={startCamera}>
            <span>📹 Tap to open camera</span>
          </div>
        )}
        {state === 'idle' && disabled && (
          <div className="video-placeholder">
            <span>No video recorded</span>
          </div>
        )}
        {(state === 'previewing' || state === 'recording') && (
          <video ref={videoRef} muted playsInline className="video-preview" />
        )}
        {state === 'uploading' && (
          <div className="video-placeholder">
            <span>⏳ Uploading…</span>
          </div>
        )}
        {state === 'done' && recordedUrl && (
          <video src={recordedUrl} controls playsInline className="video-preview" />
        )}
      </div>
      <div className="video-controls">
        {state === 'previewing' && (
          <button className="btn-record" onClick={startRecording}>⏺ Start Recording</button>
        )}
        {state === 'recording' && (
          <button className="btn-record recording" onClick={stopRecording}>⏹ Stop Recording</button>
        )}
        {state === 'done' && !disabled && (
          <button className="btn-secondary" onClick={retake}>↻ Retake</button>
        )}
      </div>
    </div>
  );
}
