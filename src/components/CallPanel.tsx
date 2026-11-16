import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { SessionRow } from "@/lib/api";

type CallState = "idle" | "starting" | "connecting" | "connected" | "failed";

function VideoTile({ stream, muted, label }: { stream: MediaStream | null; muted?: boolean; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="size-full object-cover" />
      {!stream ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Camera is off</div>
      ) : null}
      <span className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2 text-xs font-medium">{label}</span>
    </div>
  );
}

export function CallPanel({ session, userId }: { session: SessionRow; userId: string }) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isHost = session.host_id === userId;

  useEffect(() => {
    const channel = supabase
      .channel(`call-${session.id}-${userId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_call_signals",
          filter: `session_id=eq.${session.id}`,
        },
        (event) => {
          const row = event.new as {
            sender_id: string;
            signal_type: string;
            payload: Json;
          };
          if (row.sender_id === userId) return;

          void (async () => {
            try {
              if (row.signal_type === "offer" && !isHost && !peerRef.current) {
                setCallState("starting");
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                streamRef.current = stream;
                setLocalStream(stream);
                const peer = makePeer(stream);
                await peer.setRemoteDescription(row.payload as RTCSessionDescriptionInit);
                for (const candidate of pendingCandidates.current) {
                  await peer.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidates.current = [];
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                await sendSignal("answer", answer);
                setCallState("connecting");
              } else if (row.signal_type === "answer" && isHost && peerRef.current) {
                await peerRef.current.setRemoteDescription(row.payload as RTCSessionDescriptionInit);
                for (const candidate of pendingCandidates.current) {
                  await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidates.current = [];
              } else if (row.signal_type === "ice-candidate") {
                const candidate = row.payload as RTCIceCandidateInit;
                if (peerRef.current?.remoteDescription) {
                  await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                  pendingCandidates.current.push(candidate);
                }
              }
            } catch (error) {
              setCallState("failed");
              toast.error("Could not connect the call", {
                description: error instanceof Error ? error.message : "Allow microphone and camera access, then try again.",
              });
            }
          })();
        },
      )
      .subscribe();

    function makePeer(stream: MediaStream) {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        const [streamFromPeer] = event.streams;
        if (streamFromPeer) setRemoteStream(streamFromPeer);
      };
      peer.onicecandidate = (event) => {
        if (event.candidate) void sendSignal("ice-candidate", event.candidate.toJSON());
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") setCallState("connected");
        if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
          setCallState("failed");
        }
      };
      return peer;
    }

    async function sendSignal(signalType: "offer" | "answer" | "ice-candidate", payload: unknown) {
      const safePayload = JSON.parse(JSON.stringify(payload)) as Json;
      const { error } = await supabase.from("session_call_signals").insert({
        session_id: session.id,
        sender_id: userId,
        signal_type: signalType,
        payload: safePayload,
      });
      if (error) throw error;
    }

    return () => {
      void supabase.removeChannel(channel);
      peerRef.current?.close();
      peerRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isHost, session.id, userId]);

  async function startCall() {
    setCallState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      setLocalStream(stream);
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        const [incoming] = event.streams;
        if (incoming) setRemoteStream(incoming);
      };
      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        const payload = JSON.parse(JSON.stringify(event.candidate.toJSON())) as Json;
        void supabase.from("session_call_signals").insert({
          session_id: session.id,
          sender_id: userId,
          signal_type: "ice-candidate",
          payload,
        });
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") setCallState("connected");
        if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
          setCallState("failed");
        }
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const payload = JSON.parse(JSON.stringify(offer)) as Json;
      const { error } = await supabase.from("session_call_signals").insert({
        session_id: session.id,
        sender_id: userId,
        signal_type: "offer",
        payload,
      });
      if (error) throw error;
      setCallState("connecting");
    } catch (error) {
      setCallState("failed");
      toast.error("Could not start the call", {
        description: error instanceof Error ? error.message : "Allow microphone and camera access, then try again.",
      });
    }
  }

  function toggleTrack(kind: "audio" | "video") {
    const tracks = kind === "audio" ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
    const nextEnabled = !(tracks?.[0]?.enabled ?? false);
    tracks?.forEach((track) => { track.enabled = nextEnabled; });
    if (kind === "audio") setMuted(!nextEnabled);
    else setCameraOff(!nextEnabled);
  }

  function leaveCall() {
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setMuted(false);
    setCameraOff(false);
  }

  const guestName = session.guest?.full_name || "Your student partner";

  return (
    <section className="space-y-4" aria-label="Live call">
      <div className="grid gap-3 sm:grid-cols-2">
        <VideoTile stream={localStream} muted label="You" />
        <VideoTile stream={remoteStream} label={isHost ? guestName : session.host?.full_name || "Session host"} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {callState === "idle" || callState === "failed" ? (
          isHost ? (
            <Button onClick={() => void startCall()}>
              <Phone className="size-4" /> Start call
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting for the host to start the call.</p>
          )
        ) : (
          <>
            <Button variant="outline" size="icon" aria-label={muted ? "Unmute microphone" : "Mute microphone"} onClick={() => toggleTrack("audio")}>
              {muted ? <MicOff /> : <Mic />}
            </Button>
            <Button variant="outline" size="icon" aria-label={cameraOff ? "Turn camera on" : "Turn camera off"} onClick={() => toggleTrack("video")}>
              {cameraOff ? <CameraOff /> : <Camera />}
            </Button>
            <Button variant="destructive" onClick={leaveCall}><PhoneOff className="size-4" /> Leave call</Button>
          </>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          {callState === "starting" ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {callState === "connected" ? "Connected" : callState === "connecting" ? "Connecting…" : callState === "failed" ? "Connection failed" : callState === "starting" ? "Opening camera…" : "Call not started"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Calls connect directly between students; some networks may block the connection.</p>
    </section>
  );
}