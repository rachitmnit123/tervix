'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { STARTER_TEMPLATES, LANGUAGE_LABELS, LANGUAGE_EXTENSIONS } from '@/lib/judge0';
import { useTheme } from '@/components/ThemeProvider';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container-lowest flex items-center justify-center">
      <div className="text-on-surface-variant text-sm animate-pulse">Loading editor...</div>
    </div>
  ),
});

const LANGUAGES = ['python', 'cpp', 'java'] as const;
type Language = typeof LANGUAGES[number];
const MONACO_LANG: Record<Language, string> = { python: 'python', cpp: 'cpp', java: 'java' };

// PeerJS data channel event types
type PeerEvent =
  | { type: 'session_end' }
  | { type: 'role_change'; roles: Record<string, string> }
  | { type: 'language_change'; language: string }
  | { type: 'ping' };

interface Question {
  id: string;
  title: string;
  difficulty: string;
  topic: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: string;
}

interface Interview {
  id: string;
  status: string;
  codeState: Record<string, string> | null;
  language: string;
  interviewerQuestion: Question;
  candidateQuestion: Question;
  bookings: { role: string; user: { id: string; name: string; title: string } }[];
  peerIds?: string[];
}

function ElapsedTimer({ startedAt }: { startedAt?: string | null }) {
  const [elapsed, setElapsed] = useState('00:00:00');
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      setElapsed([
        String(Math.floor(diff / 3600000)).padStart(2, '0'),
        String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      ].join(':'));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="font-mono text-on-surface font-bold text-sm">{elapsed}</span>;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY:   'bg-green-400/20 text-green-400',
  MEDIUM: 'bg-amber-400/20 text-amber-400',
  HARD:   'bg-error/20 text-error',
};

type ExecStatus = 'idle' | 'running' | 'success' | 'error';

export default function InterviewRoomPage({ params }: { params: { id: string } }) {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [userRole, setUserRole] = useState<string>('CANDIDATE');
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Code state
  const [codeState, setCodeState] = useState<Record<Language, string>>({
    python: STARTER_TEMPLATES.python,
    cpp:    STARTER_TEMPLATES.cpp,
    java:   STARTER_TEMPLATES.java,
  });
  const [language, setLanguage] = useState<Language>('python');
  const [switchingLang, setSwitchingLang] = useState(false);

  // Execution
  const [execStatus, setExecStatus] = useState<ExecStatus>('idle');
  const [execOutput, setExecOutput] = useState('');
  const [execTime, setExecTime] = useState('');
  const [showConsole, setShowConsole] = useState(false);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Video
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef        = useRef<any>(null);
  const mediaCallRef   = useRef<any>(null);
  const dataConnRef    = useRef<any>(null); // PeerJS data channel
  const localStreamRef = useRef<MediaStream | null>(null);

  // Resizable panel
  const [questionWidth, setQuestionWidth] = useState(340);
  const isResizing = useRef(false);

  // Sync
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const lastSaveRef     = useRef<number>(0);
  const saveTimerRef    = useRef<NodeJS.Timeout>();
  const isSyncingRef    = useRef(false);
  const eventHandledRef = useRef<Set<string>>(new Set()); // prevent duplicate events

  const { theme } = useTheme();
  const router = useRouter();

  // Collapse sidebar
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '4rem');
    return () => document.documentElement.style.setProperty('--sidebar-width', '16rem');
  }, []);

  // ── Load interview data ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/interviews/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.interview) return;
        const iv: Interview = data.interview;
        setInterview(iv);

        const role = data.userRole as string;
        setUserRole(role);
        setQuestion(role === 'INTERVIEWER' ? iv.interviewerQuestion : iv.candidateQuestion);

        const savedLang = (iv.language || 'python') as Language;
        setLanguage(savedLang);

        if (iv.codeState && typeof iv.codeState === 'object') {
          setCodeState({
            python: (iv.codeState as any).python || STARTER_TEMPLATES.python,
            cpp:    (iv.codeState as any).cpp    || STARTER_TEMPLATES.cpp,
            java:   (iv.codeState as any).java   || STARTER_TEMPLATES.java,
          });
        }
        if ((iv as any).startedAt) setStartedAt((iv as any).startedAt);
        if (iv.status === 'COMPLETED') handleSessionEndedLocally();
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  // ── Auto-start ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (interview && interview.status === 'SCHEDULED') {
      fetch(`/api/interviews/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      }).then(() => setStartedAt(new Date().toISOString()));
    }
  }, [interview, params.id]);

  // ── Sync polling (fallback for when data channel fails) ──────────────────
  useEffect(() => {
    syncIntervalRef.current = setInterval(async () => {
      if (isSyncingRef.current || sessionEnded) return;
      isSyncingRef.current = true;
      try {
        const res  = await fetch(`/api/interviews/${params.id}/sync`);
        const data = await res.json();
        if (!data) return;

        // Session ended by peer via DB
        if (data.status === 'COMPLETED' && !sessionEnded) {
          handleSessionEndedLocally();
          return;
        }

        // Role changed by peer
        const myNewRole = data.roles?.[interview?.bookings?.find(b => b.user)?.user?.id ?? ''];
        if (myNewRole && myNewRole !== userRole) {
          applyRoleChange(myNewRole, data.roles);
        }

        // Language changed by peer (only if not recently saved by us)
        if (data.language && data.language !== language && Date.now() - lastSaveRef.current > 5000) {
          setLanguage(data.language as Language);
        }
      } catch {}
      finally { isSyncingRef.current = false; }
    }, 2500);
    return () => clearInterval(syncIntervalRef.current);
  }, [params.id, sessionEnded, userRole, language, interview]);

  // ── PeerJS WebRTC + Data Channel ─────────────────────────────────────────
  useEffect(() => {
    let peer: any;
    const initPeer = async () => {
      const { Peer } = await import('peerjs');
      const myId = `tervix-${params.id}-${Date.now()}`;

      peer = new Peer(myId, {
        host: '0.peerjs.com', port: 443, path: '/', secure: true, debug: 0,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
      });
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        // Register peer ID
        fetch(`/api/interviews/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'setPeerId', peerId: id }),
        });
        pollForPeer(id);
      });

      // Incoming media call
      peer.on('call', (call: any) => {
        mediaCallRef.current = call;
        call.answer(localStreamRef.current || undefined);
        call.on('stream', (s: MediaStream) => {
          setRemoteStream(s); setPeerConnected(true);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = s;
        });
        call.on('close', () => { setPeerConnected(false); setRemoteStream(null); });
      });

      // Incoming data connection
      peer.on('connection', (conn: any) => {
        setupDataConnection(conn);
      });

      peer.on('error', (err: any) => console.log('PeerJS error:', err.type));
    };

    initPeer();
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [params.id]);

  function setupDataConnection(conn: any) {
    dataConnRef.current = conn;
    conn.on('data', (raw: any) => {
      try {
        const event: PeerEvent = typeof raw === 'string' ? JSON.parse(raw) : raw;
        handlePeerEvent(event);
      } catch {}
    });
    conn.on('close', () => { dataConnRef.current = null; });
  }

  // ── Handle incoming peer events ──────────────────────────────────────────
  function handlePeerEvent(event: PeerEvent) {
    const key = JSON.stringify(event);
    if (eventHandledRef.current.has(key)) return; // prevent duplicates
    eventHandledRef.current.add(key);
    setTimeout(() => eventHandledRef.current.delete(key), 3000);

    switch (event.type) {
      case 'session_end':
        handleSessionEndedLocally();
        break;
      case 'role_change':
        applyRoleChange(event.roles[getCurrentUserId()] ?? userRole, event.roles);
        break;
      case 'language_change':
        setLanguage(event.language as Language);
        break;
    }
  }

  function getCurrentUserId(): string {
    return interview?.bookings?.find(b => b.role === userRole)?.user?.id ?? '';
  }

  // ── Send event to peer via data channel ─────────────────────────────────
  function sendToPeer(event: PeerEvent) {
    if (dataConnRef.current?.open) {
      dataConnRef.current.send(JSON.stringify(event));
    }
    // DB is always updated too (polling fallback)
  }

  // ── Session end logic ────────────────────────────────────────────────────
  function handleSessionEndedLocally() {
    if (sessionEnded) return;
    setSessionEnded(true);
    clearInterval(syncIntervalRef.current);

    // Stop media
    localStream?.getTracks().forEach(t => t.stop());
    if (peerRef.current) peerRef.current.destroy();

    // Redirect after short delay
    setTimeout(() => router.push(`/feedback/${params.id}`), 1500);
  }

  async function endSession() {
    if (ending || sessionEnded) return;
    setEnding(true);

    // 1. Update DB
    await fetch(`/api/interviews/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end', codeState }),
    });

    // 2. Notify peer via data channel
    sendToPeer({ type: 'session_end' });

    // 3. End locally
    handleSessionEndedLocally();
  }

  // ── Role switch logic ────────────────────────────────────────────────────
  async function switchRole() {
    const res = await fetch(`/api/interviews/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'switchRole' }),
    });

    if (!res.ok) return;

    // Compute new roles
    const newRole = userRole === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER';
    const newRoles: Record<string, string> = {};
    interview?.bookings.forEach(b => {
      newRoles[b.user.id] = b.role === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER';
    });

    // Apply locally
    applyRoleChange(newRole, newRoles);

    // Notify peer
    sendToPeer({ type: 'role_change', roles: newRoles });
  }

  function applyRoleChange(newRole: string, allRoles: Record<string, string>) {
    setUserRole(newRole);
    if (interview) {
      const newQ = newRole === 'INTERVIEWER'
        ? interview.interviewerQuestion
        : interview.candidateQuestion;
      setQuestion(newQ);
    }
  }

  // ── Poll for peer and connect ────────────────────────────────────────────
  async function pollForPeer(myId: string) {
    let attempts = 0;
    const poll = async () => {
      if (attempts++ > 60 || sessionEnded) return;
      try {
        const res  = await fetch(`/api/interviews/${params.id}`);
        const data = await res.json();
        const peerIds: string[] = data.interview?.peerIds || [];
        const otherId = peerIds.find((id: string) => id !== myId);

        if (otherId && peerRef.current) {
          // Open data channel
          const conn = peerRef.current.connect(otherId, { reliable: true });
          setupDataConnection(conn);
          conn.on('open', () => { conn.send(JSON.stringify({ type: 'ping' })); });

          // Open media call
          if (!mediaCallRef.current) {
            const call = peerRef.current.call(otherId, localStreamRef.current || new MediaStream());
            mediaCallRef.current = call;
            call.on('stream', (s: MediaStream) => {
              setRemoteStream(s); setPeerConnected(true);
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = s;
            });
            call.on('close', () => { setPeerConnected(false); mediaCallRef.current = null; });
          }
        } else {
          setTimeout(poll, 3000);
        }
      } catch { setTimeout(poll, 3000); }
    };
    setTimeout(poll, 2000);
  }

  // ── Camera / Mic ─────────────────────────────────────────────────────────
  async function toggleCamera() {
    if (camOn) {
      localStream?.getVideoTracks().forEach(t => t.stop());
      setCamOn(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
    } else {
      try {
        setMediaError('');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        localStreamRef.current = stream;
        setLocalStream(stream); setCamOn(true);
        if (!micOn) stream.getAudioTracks().forEach(t => t.enabled = false);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch { setMediaError('Camera access denied.'); }
    }
  }

  async function toggleMic() {
    if (micOn) {
      localStream?.getAudioTracks().forEach(t => t.enabled = false);
      setMicOn(false);
    } else {
      try {
        setMediaError('');
        if (localStream) {
          if (localStream.getAudioTracks().length === 0) {
            const a = await navigator.mediaDevices.getUserMedia({ audio: true });
            a.getAudioTracks().forEach(t => localStream.addTrack(t));
          } else {
            localStream.getAudioTracks().forEach(t => t.enabled = true);
          }
          setMicOn(true);
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream; setLocalStream(stream); setMicOn(true);
        }
      } catch { setMediaError('Microphone access denied.'); }
    }
  }

  // ── Language switch ──────────────────────────────────────────────────────
  async function handleLanguageSwitch(newLang: Language) {
    if (newLang === language || switchingLang) return;
    setSwitchingLang(true);
    setLanguage(newLang);
    setSwitchingLang(false);
    lastSaveRef.current = Date.now();

    await fetch(`/api/interviews/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'switchLanguage', language: newLang, codeState }),
    });

    sendToPeer({ type: 'language_change', language: newLang });
  }

  // ── Code change ──────────────────────────────────────────────────────────
  const handleCodeChange = useCallback((value: string | undefined) => {
    const v = value ?? '';
    setCodeState(prev => ({ ...prev, [language]: v }));
    lastSaveRef.current = Date.now();

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setCodeState(current => {
        fetch(`/api/interviews/${params.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateCodeState', codeState: current, language }),
        });
        return current;
      });
    }, 2000);
  }, [language, params.id]);

  // ── Run code ─────────────────────────────────────────────────────────────
  async function runCode() {
    const currentCode = codeState[language]?.trim();
    if (!currentCode) {
      setExecOutput('⚠ Cannot run empty code.'); setExecStatus('error'); setShowConsole(true);
      return;
    }
    setExecStatus('running'); setShowConsole(true); setExecOutput(''); setExecTime('');

    try {
      const res = await fetch('/api/interviews/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode, language, stdin }),
      });
      const data = await res.json();

      if (data.clientSideExec) {
        await runCodeClientSide(currentCode, data.languageId);
        return;
      }
      setExecOutput(data.output || '(no output)');
      setExecTime(data.executionTime || '');
      setExecStatus(data.isError ? 'error' : 'success');
    } catch {
      await runCodeClientSide(currentCode);
    }
  }

  async function runCodeClientSide(currentCode: string, langId?: number) {
    const IDS: Record<string, number> = { python: 71, cpp: 54, java: 62 };
    const languageId = langId || IDS[language] || 71;
    try {
      const res = await fetch(
        'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ source_code: currentCode, language_id: languageId, stdin: stdin || '' }),
        }
      );
      if (!res.ok) { setExecOutput(`Error: ${res.status}`); setExecStatus('error'); return; }
      const r = await res.json();
      let output = '';
      let isError = false;
      if (r?.compile_output?.trim()) { output = r.compile_output; isError = true; }
      else if (r?.stderr?.trim())   { output = r.stderr; isError = true; }
      else if (r?.status?.id === 5) { output = 'Time Limit Exceeded'; isError = true; }
      else                           { output = r?.stdout?.trim() || '(no output)'; }
      setExecOutput(output);
      setExecTime(r?.time ? `${Math.round(parseFloat(r.time) * 1000)}ms` : 'N/A');
      setExecStatus(isError ? 'error' : 'success');
    } catch (err: any) {
      setExecOutput('Execution failed: ' + (err?.message || 'Unknown'));
      setExecStatus('error');
    }
  }

  // ── Run test cases ─────────────────────────────────────────────────────────
  async function runTests() {
    const currentCode = codeState[language]?.trim();
    if (!currentCode) return;
    setRunningTests(true);
    setShowTestPanel(true);
    setTestResults(null);

    try {
      const res = await fetch('/api/interviews/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          language,
          interviewId: interview?.id,
          mode: 'test',
        }),
      });
      const data = await res.json();
      setTestResults(data);
    } catch {
      setTestResults({ error: 'Failed to run tests' });
    } finally {
      setRunningTests(false);
    }
  }

  // ── Drag resize ──────────────────────────────────────────────────────────
  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startW = questionWidth;
    const onMove = (e: MouseEvent) => { if (isResizing.current) setQuestionWidth(Math.min(600, Math.max(180, startW + e.clientX - startX))); };
    const onUp   = () => { isResizing.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return <div className="h-screen flex items-center justify-center text-on-surface-variant">Interview not found.</div>;
  }

  // ── Session ended overlay ────────────────────────────────────────────────
  if (sessionEnded) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-2xl font-headline font-black text-on-surface mb-2">Session Ended</h2>
          <p className="text-on-surface-variant mb-4">Redirecting to feedback form...</p>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const peer = interview.bookings.find(b => b.role !== userRole);
  const currentCode = codeState[language] ?? STARTER_TEMPLATES[language];

  const execStatusColors: Record<ExecStatus, string> = {
    idle: 'text-on-surface-variant', running: 'text-primary animate-pulse',
    success: 'text-green-400', error: 'text-error',
  };

  return (
    <div className="h-screen flex flex-col bg-surface-container-lowest overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center px-4 py-2 bg-surface border-b border-outline-variant/10 z-10 shrink-0 gap-3">
        <div className="flex items-center gap-2 bg-error/10 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
          <span className="text-[10px] font-black text-error uppercase tracking-wider">Live</span>
        </div>
        <ElapsedTimer startedAt={startedAt} />

        {peerConnected && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-400/10 text-green-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Peer Connected
          </div>
        )}

        {/* Language switcher */}
        <div className="flex items-center gap-1 ml-4 bg-surface-container rounded-xl p-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => handleLanguageSwitch(lang)}
              disabled={switchingLang}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                language === lang
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {lang === 'python' ? 'Python' : lang === 'cpp' ? 'C++' : 'Java'}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-on-surface-variant">
          solution{LANGUAGE_EXTENSIONS[language]}
        </span>

        <span className={`text-[10px] font-bold uppercase tracking-wider ${execStatusColors[execStatus]}`}>
          {execStatus !== 'idle' && execStatus}
          {execTime && execStatus === 'success' && <span className="ml-1 text-on-surface-variant normal-case">· {execTime}</span>}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowStdin(s => !s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              showStdin ? 'border-primary/40 text-primary bg-primary/10' : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            stdin
          </button>
          <button
            onClick={() => { setCodeState(prev => ({ ...prev, [language]: STARTER_TEMPLATES[language] })); lastSaveRef.current = Date.now(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high transition-colors"
          >
            Reset
          </button>
          <button
            onClick={runCode}
            disabled={execStatus === 'running'}
            className="px-4 py-1.5 rounded-lg text-xs font-bold btn-primary flex items-center gap-1.5 disabled:opacity-60"
          >
            {execStatus === 'running' ? (
              <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Running...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_arrow</span>Run Code</>
            )}
          </button>
          <button
            onClick={runTests}
            disabled={runningTests}
            className="px-4 py-1.5 rounded-lg text-xs font-bold border border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            {runningTests ? (
              <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Testing...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>checklist</span>Run Tests</>
            )}
          </button>
          <button
            onClick={() => setShowEndConfirm(true)}
            className="px-4 py-1.5 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/80 transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      {mediaError && (
        <div className="px-4 py-2 bg-error/10 text-error text-xs flex items-center gap-2 border-b border-error/20 shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>warning</span>
          {mediaError}
          <button onClick={() => setMediaError('')} className="ml-auto">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
          </button>
        </div>
      )}

      {/* ── Main 3-panel layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Question */}
        <div className="shrink-0 bg-surface overflow-y-auto border-r border-outline-variant/10" style={{ width: questionWidth }}>
          <div className="p-5">
            {question ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${DIFFICULTY_COLORS[question.difficulty]}`}>
                    {question.difficulty}
                  </span>
                  <span className="text-xs text-on-surface-variant">{question.topic}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    userRole === 'INTERVIEWER' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                  }`}>
                    {userRole === 'INTERVIEWER' ? 'Ask This' : 'Solve This'}
                  </span>
                </div>
                <h3 className="text-xl font-headline font-black text-on-surface mb-4">{question.title}</h3>
                <div className="text-sm text-on-surface-variant leading-relaxed mb-5 whitespace-pre-wrap">{question.description}</div>
                {question.examples.map((ex, i) => (
                  <div key={i} className="mb-4">
                    <p className="text-xs font-bold text-on-surface mb-1.5">Example {i + 1}:</p>
                    <div className="bg-surface-container rounded-xl p-3 text-xs font-mono space-y-1">
                      <p><span className="text-on-surface-variant">Input: </span><span className="text-on-surface">{ex.input}</span></p>
                      <p><span className="text-on-surface-variant">Output: </span><span className="text-on-surface">{ex.output}</span></p>
                      {ex.explanation && <p><span className="text-on-surface-variant">Explanation: </span><span className="text-on-surface">{ex.explanation}</span></p>}
                    </div>
                  </div>
                ))}
                <p className="text-xs font-bold text-on-surface mb-2">Constraints:</p>
                <ul className="list-disc list-inside space-y-1">
                  {question.constraints.map((c, i) => <li key={i} className="text-xs text-on-surface-variant font-mono">{c}</li>)}
                </ul>
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div onMouseDown={startResize} className="w-1.5 shrink-0 bg-outline-variant/10 hover:bg-primary/40 cursor-col-resize transition-colors relative group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-outline-variant/40 group-hover:bg-primary/60 transition-colors" />
        </div>

        {/* CENTER: Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {showStdin && (
            <div className="shrink-0 border-b border-outline-variant/10 bg-surface">
              <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Standard Input (stdin)</span>
                <button onClick={() => setShowStdin(false)}><span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '16px' }}>close</span></button>
              </div>
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="Enter input for your program..."
                className="w-full h-20 px-4 py-3 text-xs font-mono text-on-surface bg-surface-container-lowest resize-none outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              key={language}
              height="100%"
              language={MONACO_LANG[language]}
              value={currentCode}
              onChange={handleCodeChange}
              theme={theme === "dark" ? "vs-dark" : "vs"}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineNumbers: 'on', minimap: { enabled: false },
                scrollBeyondLastLine: false, padding: { top: 16, bottom: 16 },
                lineNumbersMinChars: 3, glyphMargin: false, folding: true,
                cursorBlinking: 'smooth', smoothScrolling: true,
                wordWrap: 'on', automaticLayout: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {showConsole && (
            <div className="h-48 bg-surface-container-lowest border-t border-outline-variant/10 flex flex-col shrink-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Output</span>
                  {execTime && <span className="text-[10px] text-on-surface-variant">· {execTime}</span>}
                  {execStatus !== 'idle' && (
                    <span className={`text-[10px] font-bold uppercase ${execStatusColors[execStatus]}`}>{execStatus}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setExecOutput(''); setExecStatus('idle'); }} className="text-[10px] text-on-surface-variant hover:text-on-surface">Clear</button>
                  <button onClick={() => setShowConsole(false)}><span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '16px' }}>close</span></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {execStatus === 'running' ? (
                  <div className="flex items-center gap-2 text-primary text-xs">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Executing...
                  </div>
                ) : (
                  <pre className={`text-xs font-mono leading-relaxed whitespace-pre-wrap ${execStatus === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
                    {execOutput || 'Run your code to see output here.'}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Test results panel */}
          {showTestPanel && (
            <div className="shrink-0 border-t border-outline-variant/10 bg-surface-container-lowest flex flex-col" style={{ maxHeight: '320px' }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/10 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Test Results</span>
                  {testResults && !testResults.error && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${testResults.allPassed ? 'bg-green-400/10 text-green-400' : 'bg-error/10 text-error'}`}>
                      {testResults.totalPassed}/{testResults.totalTests} passed
                    </span>
                  )}
                </div>
                <button onClick={() => setShowTestPanel(false)}>
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {runningTests ? (
                  <div className="flex items-center gap-2 text-primary text-xs py-4 justify-center">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Running test cases...
                  </div>
                ) : testResults?.compilationError ? (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                    <p className="text-[10px] font-bold text-error uppercase mb-1">Compilation Error</p>
                    <pre className="text-xs text-error font-mono whitespace-pre-wrap">{testResults.compilationError}</pre>
                  </div>
                ) : testResults?.error ? (
                  <p className="text-xs text-error">{testResults.error}</p>
                ) : testResults?.visibleResults ? (
                  <>
                    {/* Visible test results */}
                    {testResults.visibleResults.map((r: any, i: number) => (
                      <div key={i} className={`p-3 rounded-xl border ${
                        r.status === 'PASS' ? 'bg-green-400/5 border-green-400/20'
                        : r.status === 'ERROR' ? 'bg-amber-400/5 border-amber-400/20'
                        : 'bg-error/5 border-error/20'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-on-surface">Test Case {i + 1}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            r.status === 'PASS' ? 'bg-green-400/20 text-green-400'
                            : r.status === 'ERROR' ? 'bg-amber-400/20 text-amber-400'
                            : 'bg-error/20 text-error'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                          <div>
                            <p className="text-[9px] text-on-surface-variant uppercase mb-0.5">Input</p>
                            <p className="text-on-surface bg-surface-container rounded px-1.5 py-1 truncate">{r.input || '(empty)'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-on-surface-variant uppercase mb-0.5">Expected</p>
                            <p className="text-green-400 bg-surface-container rounded px-1.5 py-1 truncate">{r.expectedOutput}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-on-surface-variant uppercase mb-0.5">Got</p>
                            <p className={`bg-surface-container rounded px-1.5 py-1 truncate ${r.status === 'PASS' ? 'text-green-400' : 'text-error'}`}>
                              {r.actualOutput || '(no output)'}
                            </p>
                          </div>
                        </div>
                        {r.error && <p className="text-[10px] text-amber-400 mt-1">{r.error}</p>}
                        {r.executionTime && <p className="text-[9px] text-on-surface-variant mt-1">⏱ {r.executionTime}</p>}
                      </div>
                    ))}
                    {/* Hidden tests summary */}
                    {testResults.hiddenTotal > 0 && (
                      <div className={`p-3 rounded-xl border ${testResults.hiddenPassed ? 'bg-green-400/5 border-green-400/20' : 'bg-error/5 border-error/20'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-on-surface">Hidden Test Cases</p>
                            <p className="text-[9px] text-on-surface-variant mt-0.5">Results hidden for evaluation integrity</p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${testResults.hiddenPassed ? 'bg-green-400/20 text-green-400' : 'bg-error/20 text-error'}`}>
                            {testResults.hiddenPassedCount}/{testResults.hiddenTotal} passed
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Overall verdict */}
                    <div className={`p-3 rounded-xl text-center font-bold text-sm ${testResults.allPassed ? 'bg-green-400/10 text-green-400' : 'bg-surface-container text-on-surface-variant'}`}>
                      {testResults.allPassed
                        ? '🎉 All test cases passed!'
                        : `${testResults.totalPassed}/${testResults.totalTests} test cases passed`}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {!showConsole && (
            <div className="shrink-0 border-t border-outline-variant/10 bg-surface px-4 py-1.5 flex items-center justify-between">
              <button onClick={() => setShowConsole(true)} className="text-[10px] text-on-surface-variant hover:text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>terminal</span>
                Show Output
              </button>
              {execStatus !== 'idle' && (
                <span className={`text-[10px] font-bold uppercase ${execStatusColors[execStatus]}`}>{execStatus}</span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Video + Role */}
        <div className="w-72 shrink-0 bg-surface flex flex-col border-l border-outline-variant/10">
          {/* Remote */}
          <div className="relative bg-surface-container-lowest overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-cover ${remoteStream ? '' : 'hidden'}`} />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-surface-container to-surface-bright flex items-center justify-center text-xl font-headline font-black text-on-surface-variant">
                  {peer?.user.name?.[0] ?? '?'}
                </div>
                <p className="text-xs text-on-surface-variant mt-2">{peerConnected ? 'Camera Off' : 'Waiting...'}</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60">
              <p className="text-[10px] font-bold text-white">{peer?.user.name ?? 'Peer'} · {peer?.role === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}</p>
            </div>
          </div>

          {/* Local */}
          <div className="relative bg-surface-container overflow-hidden border-b border-outline-variant/10" style={{ height: '136px' }}>
            <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${camOn ? '' : 'hidden'}`} />
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">You</div>
                <p className="text-[10px] text-on-surface-variant mt-1">Camera Off</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/40 text-[10px] text-white">
              You · {userRole === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <button onClick={toggleMic} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-primary text-on-primary' : 'bg-surface-bright text-on-surface-variant'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{micOn ? 'mic' : 'mic_off'}</span>
              </button>
              <button onClick={toggleCamera} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${camOn ? 'bg-primary text-on-primary' : 'bg-surface-bright text-on-surface-variant'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{camOn ? 'videocam' : 'videocam_off'}</span>
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="p-4 border-b border-outline-variant/10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Active Role</p>
            <p className="text-base font-headline font-black text-on-surface mb-1">{userRole === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}</p>
            <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
              {userRole === 'INTERVIEWER' ? 'Ask the question shown. Observe and guide the candidate.' : 'Solve the problem shown. Think out loud.'}
            </p>
            <button onClick={switchRole} className="w-full py-1.5 rounded-xl text-xs font-bold border border-outline-variant/20 text-on-surface hover:bg-surface-container-high transition-colors">
              Switch to {userRole === 'INTERVIEWER' ? 'Candidate' : 'Interviewer'}
            </button>
          </div>

          {userRole === 'INTERVIEWER' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Quick Feedback</p>
              <div className="flex flex-wrap gap-1.5">
                {['Excellent Approach', 'Consider Edge Cases', 'Optimize Complexity', 'Good Communication', 'Think Out Loud', 'Check Base Cases'].map(tag => (
                  <button key={tag} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors">{tag}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End session modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-headline font-black text-on-surface mb-2">End Session?</h3>
            <p className="text-sm text-on-surface-variant mb-1">This will end the session for <strong className="text-on-surface">both participants</strong> immediately.</p>
            <p className="text-xs text-on-surface-variant/60 mb-6">Both users will be redirected to the feedback form.</p>
            <div className="flex gap-3">
              <button onClick={endSession} disabled={ending} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/80 disabled:opacity-60 transition-colors">
                {ending ? 'Ending...' : 'End for Both'}
              </button>
              <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-outline-variant/20 text-on-surface hover:bg-surface-container transition-colors">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
