"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// Base Waveform Props
export interface WaveformProps {
  data?: number[];
  barWidth?: number;
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  onBarClick?: (index: number, value: number) => void;
  className?: string;
}

// Base Waveform Component (Canvas-based)
export function Waveform({
  data = [],
  barWidth = 4,
  barHeight = 4,
  barGap = 2,
  barRadius = 2,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 128,
  onBarClick,
  className,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const dprRef = useRef<number>(1);

  // Get computed color
  const getBarColor = () => {
    if (barColor) return barColor;
    // Try to get CSS variable, fallback to gray
    if (typeof window !== "undefined") {
      const style = getComputedStyle(document.documentElement);
      const foreground = style.getPropertyValue("--foreground").trim();
      if (foreground) {
        return `hsl(${foreground})`;
      }
    }
    return "#9ca3af"; // gray-400
  };

  // Draw waveform
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width); // Ensure width is at least 1
    const actualHeight = typeof height === "number" ? height : parseInt(height) || 128;

    // Always set dimensions to ensure proper rendering
    if (canvas.width !== width * dpr || canvas.height !== actualHeight * dpr) {
      canvas.width = width * dpr;
      canvas.height = actualHeight * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${actualHeight}px`;
    }
    
    // Always scale context
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, actualHeight);

    const color = getBarColor();
    const totalBarWidth = barWidth + barGap;
    const numBars = Math.ceil(width / totalBarWidth);
    // Use data cyclically if needed to fill width
    const barsToDraw = numBars;

    // Optimize: batch draw operations
    ctx.fillStyle = color;
    ctx.beginPath();

    // Draw bars (optimized - use fillRect for better performance)
    for (let i = 0; i < barsToDraw; i++) {
      // Cycle through data if needed
      const dataIndex = data.length > 0 ? i % data.length : 0;
      const value = Math.max(0, Math.min(1, data[dataIndex] || 0));
      const barHeight = value * actualHeight;
      if (barHeight <= 0) continue;
      
      const x = i * totalBarWidth;
      const y = (actualHeight - barHeight) / 2;

      // Use simple fillRect for better performance
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Apply fade gradient
    if (fadeEdges) {
      const fadeGradient = ctx.createLinearGradient(0, 0, width, 0);
      fadeGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      fadeGradient.addColorStop(fadeWidth / width, "rgba(255, 255, 255, 0)");
      fadeGradient.addColorStop(1 - fadeWidth / width, "rgba(255, 255, 255, 0)");
      fadeGradient.addColorStop(1, "rgba(255, 255, 255, 1)");
      
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fadeGradient;
      ctx.fillRect(0, 0, width, actualHeight);
      ctx.globalCompositeOperation = "source-over";
    }
  }, [data, barWidth, barHeight, barGap, barRadius, barColor, fadeEdges, fadeWidth, height]);

  // Handle resize with throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      // Throttle resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        draw();
      }, 16); // ~60fps
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [draw]);

  // Draw on data/params change (throttled)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      draw();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [draw]);

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onBarClick || !canvasRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const totalBarWidth = barWidth + barGap;
      const barIndex = Math.floor(x / totalBarWidth);

      if (barIndex >= 0 && barIndex < data.length) {
        onBarClick(barIndex, data[barIndex]);
      }
    },
    [onBarClick, barWidth, barGap, data]
  );

  const actualHeight = typeof height === "number" ? height : parseInt(height) || 128;

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full", className)} 
      style={{ height: `${actualHeight}px`, width: "100%" }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={cn("w-full h-full block", onBarClick && "cursor-pointer")}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

// ScrollingWaveform
export interface ScrollingWaveformProps extends Omit<WaveformProps, "data" | "onBarClick"> {
  speed?: number;
  barCount?: number;
}

export function ScrollingWaveform({
  speed = 50,
  barCount = 60,
  height = 80,
  barWidth = 4,
  barGap = 2,
  barColor = "hsl(var(--primary))",
  fadeEdges = true,
  className,
}: ScrollingWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const offsetRef = useRef(0);
  const lastTimeRef = useRef<number>();
  const dataRef = useRef<number[]>(Array.from({ length: barCount }, () => Math.random() * 0.8 + 0.2));
  const dprRef = useRef<number>(1);

  const getBarColor = () => {
    if (barColor) return barColor;
    if (typeof window !== "undefined") {
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue("--primary").trim();
      if (primary) {
        return `hsl(${primary})`;
      }
    }
    return "#3b82f6"; // blue-500
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const actualHeight = typeof height === "number" ? height : parseInt(height) || 80;

    canvas.width = width * dpr;
    canvas.height = actualHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${actualHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, actualHeight);

    const color = getBarColor();
    const totalBarWidth = barWidth + barGap;
    const numBars = Math.ceil(width / totalBarWidth) + 5; // Extra bars for seamless scrolling

    // Draw bars with offset
    for (let i = -2; i < numBars; i++) {
      const dataIndex = Math.floor((offsetRef.current + i * totalBarWidth) / totalBarWidth) % dataRef.current.length;
      const value = Math.max(0, Math.min(1, dataRef.current[dataIndex] || 0));
      const barHeight = value * actualHeight;
      const x = i * totalBarWidth - (offsetRef.current % totalBarWidth);
      const y = (actualHeight - barHeight) / 2;

      if (x + barWidth >= 0 && x <= width && barHeight > 0) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // Apply fade edges
    if (fadeEdges) {
      const fadeWidth = 24;
      const leftGradient = ctx.createLinearGradient(0, 0, fadeWidth, 0);
      leftGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      leftGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      const rightGradient = ctx.createLinearGradient(width - fadeWidth, 0, width, 0);
      rightGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      rightGradient.addColorStop(1, "rgba(255, 255, 255, 1)");

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = leftGradient;
      ctx.fillRect(0, 0, fadeWidth, actualHeight);
      ctx.fillStyle = rightGradient;
      ctx.fillRect(width - fadeWidth, 0, fadeWidth, actualHeight);
      ctx.globalCompositeOperation = "source-over";
    }
  }, [height, barWidth, barGap, barColor, fadeEdges]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      draw();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [draw]);

  useEffect(() => {
    if (speed === 0) {
      draw();
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === undefined) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = timestamp;

      const totalBarWidth = barWidth + barGap;
      offsetRef.current = (offsetRef.current + speed * delta) % (totalBarWidth * dataRef.current.length);

      // Periodically generate new random data
      if (Math.random() < 0.1) {
        const index = Math.floor(Math.random() * dataRef.current.length);
        dataRef.current[index] = Math.random() * 0.8 + 0.2;
      }

      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, draw, barWidth, barGap]);

  const actualHeight = typeof height === "number" ? height : parseInt(height) || 80;

  return (
    <div ref={containerRef} className={cn("relative w-full overflow-hidden", className)} style={{ height: `${actualHeight}px` }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// AudioScrubber
export interface AudioScrubberProps extends WaveformProps {
  currentTime: number;
  duration?: number;
  onSeek: (time: number) => void;
  showHandle?: boolean;
}

export function AudioScrubber({
  data = [],
  currentTime,
  duration = 100,
  onSeek,
  showHandle = true,
  height = 128,
  barWidth = 4,
  barGap = 2,
  barColor = "hsl(var(--primary))",
  className,
  ...props
}: AudioScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSeek(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleSeek(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSeek = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      onSeek(newTime);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, duration, onSeek]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full cursor-pointer overflow-hidden", className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ 
        height: typeof height === "number" ? `${height}px` : height,
        width: "100%"
      }}
    >
      <div className="absolute inset-0 w-full h-full">
        <Waveform
          data={data}
          barWidth={barWidth}
          barGap={barGap}
          height={height}
          barColor={barColor}
          className="w-full h-full"
          {...props}
        />
      </div>
      {/* Progress overlay - darker gray for played section */}
      <div
        className="absolute top-0 left-0 h-full bg-gray-400/30 pointer-events-none z-0"
        style={{ width: `${progress}%` }}
      />
      {/* Handle - black vertical line */}
      {showHandle && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-black pointer-events-none z-20"
          style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
        />
      )}
    </div>
  );
}

// MicrophoneWaveform
export interface MicrophoneWaveformProps extends Omit<WaveformProps, "data"> {
  active?: boolean;
  fftSize?: number;
  smoothingTimeConstant?: number;
  sensitivity?: number;
  onError?: (error: Error) => void;
}

export function MicrophoneWaveform({
  active = false,
  fftSize = 256,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  onError,
  height = 100,
  barWidth = 4,
  barGap = 2,
  className,
  ...props
}: MicrophoneWaveformProps) {
  const [data, setData] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!active) {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setData([]);
      return;
    }

    let mounted = true;

    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
          if (!mounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          // Convert to normalized values (0-1)
          const normalizedData = Array.from(dataArray).map((value) => {
            return Math.min(1, (value / 255) * sensitivity);
          });

          setData(normalizedData);
          animationRef.current = requestAnimationFrame(update);
        };

        animationRef.current = requestAnimationFrame(update);
      } catch (error) {
        if (mounted && onError) {
          onError(error as Error);
        }
      }
    };

    initMicrophone();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [active, fftSize, smoothingTimeConstant, sensitivity, onError]);

  // Calculate number of bars based on container width
  const containerRef = useRef<HTMLDivElement>(null);
  const [barCount, setBarCount] = useState(50);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateBarCount = () => {
      const width = container.offsetWidth;
      const totalBarWidth = barWidth + barGap;
      const count = Math.floor(width / totalBarWidth);
      setBarCount(count);
    };

    updateBarCount();
    const resizeObserver = new ResizeObserver(updateBarCount);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [barWidth, barGap]);

  const displayData = data.slice(0, barCount).length > 0 ? data.slice(0, barCount) : Array(barCount).fill(0.1);

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <Waveform data={displayData} barWidth={barWidth} barGap={barGap} height={height} {...props} />
    </div>
  );
}

// StaticWaveform
export interface StaticWaveformProps extends Omit<WaveformProps, "data"> {
  bars?: number;
  seed?: number;
}

// Simple seeded random number generator
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function StaticWaveform({
  bars = 40,
  seed = 42,
  height = 128,
  barWidth = 4,
  barGap = 2,
  className,
  ...props
}: StaticWaveformProps) {
  const random = seededRandom(seed);
  const data = Array.from({ length: bars }, () => random() * 0.8 + 0.2);

  return <Waveform data={data} barWidth={barWidth} barGap={barGap} height={height} className={className} {...props} />;
}

// LiveMicrophoneWaveform
export interface LiveMicrophoneWaveformProps extends ScrollingWaveformProps {
  active?: boolean;
  historySize?: number;
  updateRate?: number;
  enableAudioPlayback?: boolean;
  playbackRate?: number;
  savedHistoryRef?: React.MutableRefObject<number[]>;
  dragOffset?: number;
  setDragOffset?: (offset: number) => void;
}

export function LiveMicrophoneWaveform({
  active = false,
  historySize = 150,
  updateRate = 50,
  enableAudioPlayback = true,
  playbackRate = 1,
  savedHistoryRef,
  dragOffset = 0,
  setDragOffset,
  speed = 50,
  height = 100,
  barWidth = 4,
  barGap = 2,
  className,
  ...props
}: LiveMicrophoneWaveformProps) {
  const [history, setHistory] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (savedHistoryRef) {
      savedHistoryRef.current = history;
    }
  }, [history, savedHistoryRef]);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      return;
    }

    let mounted = true;

    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        intervalRef.current = setInterval(() => {
          if (!mounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / bufferLength / 255;
          const normalized = Math.min(1, avg * 2);

          setHistory((prev) => {
            const newHistory = [...prev, normalized];
            return newHistory.slice(-historySize);
          });
        }, updateRate);
      } catch (error) {
        console.error("Microphone error:", error);
      }
    };

    initMicrophone();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [active, historySize, updateRate]);

  const displayData = history.length > 0 ? history : Array(60).fill(0.1);

  return (
    <ScrollingWaveform
      speed={active ? speed : 0}
      barCount={displayData.length}
      height={height}
      barWidth={barWidth}
      barGap={barGap}
      className={className}
      {...props}
    />
  );
}

// RecordingWaveform
export interface RecordingWaveformProps extends WaveformProps {
  recording?: boolean;
  onRecordingComplete?: (data: number[]) => void;
  showHandle?: boolean;
  updateRate?: number;
}

export function RecordingWaveform({
  recording = false,
  onRecordingComplete,
  showHandle = true,
  updateRate = 50,
  height = 100,
  barWidth = 4,
  barGap = 2,
  className,
  ...props
}: RecordingWaveformProps) {
  const [data, setData] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!recording) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (data.length > 0 && onRecordingComplete) {
        onRecordingComplete(data);
      }
      return;
    }

    let mounted = true;

    const initRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        startTimeRef.current = Date.now();
        setData([]);
        setCurrentTime(0);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        intervalRef.current = setInterval(() => {
          if (!mounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / bufferLength / 255;
          const normalized = Math.min(1, avg * 2);

          setData((prev) => [...prev, normalized]);
          setCurrentTime((Date.now() - startTimeRef.current) / 1000);
        }, updateRate);
      } catch (error) {
        console.error("Recording error:", error);
      }
    };

    initRecording();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [recording, updateRate, onRecordingComplete, data.length]);

  return (
    <AudioScrubber
      data={data}
      currentTime={currentTime}
      duration={currentTime || 100}
      onSeek={() => {}}
      showHandle={showHandle}
      height={height}
      barWidth={barWidth}
      barGap={barGap}
      className={className}
      {...props}
    />
  );
}
