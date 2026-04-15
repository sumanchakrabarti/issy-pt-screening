import { useState, useRef } from 'react';

interface Props {
  label: string;
  onRecorded: (blob: Blob) => void;
}

export function VideoCapture({ label, onRecorded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<'idle' | 'previewing' | 'recording' | 'done'>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    } catch (err) {
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
      onRecorded(blob);
      stopStream();
      setState('done');
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

  return (
    <div className="video-capture">
      <h4>{label}</h4>
      <div className="video-container">
        {state === 'idle' && (
          <div className="video-placeholder" onClick={startCamera}>
            <span>📹 Tap to open camera</span>
          </div>
        )}
        {(state === 'previewing' || state === 'recording') && (
          <video ref={videoRef} muted playsInline className="video-preview" />
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
        {state === 'done' && (
          <button className="btn-secondary" onClick={retake}>↻ Retake</button>
        )}
      </div>
    </div>
  );
}
