/**
 * Bufferbloat & Network Congestion Diagnostic Service
 * Measures latency degradation during active download and upload saturation
 * Designed for Sri Lankan broadband (SLT Fiber, Dialog 4G, Hutch)
 */

export function getBufferbloatGrade(deltaMs) {
  if (deltaMs <= 5) {
    return {
      grade: 'A+',
      label: 'Ultra Low Bufferbloat',
      color: '#00ff88',
      bgColor: 'rgba(0, 255, 136, 0.12)',
      description: 'Flawless traffic management. You will never experience lag spikes even when multiple people download or stream in your house.',
    };
  }
  if (deltaMs <= 18) {
    return {
      grade: 'A',
      label: 'Low Bufferbloat',
      color: '#2BEE34',
      bgColor: 'rgba(43, 238, 52, 0.12)',
      description: 'Excellent for competitive FPS (Valorant, CS2). Gaming packet delay remains minimal under standard household activity.',
    };
  }
  if (deltaMs <= 40) {
    return {
      grade: 'B',
      label: 'Moderate Bufferbloat',
      color: '#eab308',
      bgColor: 'rgba(234, 179, 8, 0.12)',
      description: 'Noticeable micro-stutter when cloud syncs (Google Drive, iCloud) or large media downloads occur during matches.',
    };
  }
  if (deltaMs <= 90) {
    return {
      grade: 'C',
      label: 'High Bufferbloat',
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.12)',
      description: 'Noticeable rubber-banding and delayed hit registration. If someone streams Netflix or YouTube, your ping will jump by +40ms to +90ms.',
    };
  }
  if (deltaMs <= 160) {
    return {
      grade: 'D',
      label: 'Severe Bufferbloat',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.12)',
      description: 'Severe packet queuing typical of unthrottled 4G or congested router buffers. Game ping will double or triple during household downloads.',
    };
  }
  return {
    grade: 'F',
    label: 'Critical Bufferbloat',
    color: '#ff2a2a',
    bgColor: 'rgba(255, 42, 42, 0.15)',
    description: 'Catastrophic queue bloat (+160ms+). Packets get trapped in router memory. Enable QoS/SQM on your router or limit upload bandwidth to 85%.',
  };
}

export class BufferbloatEngine {
  constructor(targetEndpoint, onProgress, onComplete) {
    this.targetEndpoint = targetEndpoint || 'dynamodb.ap-south-1.amazonaws.com';
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.isRunning = false;
    this.abortController = null;
  }

  async probeSinglePing(signal) {
    const start = performance.now();
    try {
      await fetch(`https://${this.targetEndpoint}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal,
      });
      const end = performance.now();
      return { rtt: Math.round(end - start), success: true };
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      // In no-cors mode, type errors on network completion still reflect RTT
      const end = performance.now();
      return { rtt: Math.round(end - start), success: true };
    }
  }

  async runTrafficWorker(type, durationMs, signal) {
    const startTime = Date.now();
    const payload = new Uint8Array(200 * 1024); // 200KB upload chunks

    while (Date.now() - startTime < durationMs && !signal.aborted) {
      try {
        if (type === 'download') {
          // Fetch 1MB download chunk from Colombo/regional edge
          const url = `https://speed.cloudflare.com/__down?bytes=1000000&t=${Date.now()}`;
          const res = await fetch(url, { cache: 'no-store', signal });
          await res.arrayBuffer();
        } else {
          // Send 200KB upload chunk
          const url = `https://speed.cloudflare.com/__up?t=${Date.now()}`;
          await fetch(url, {
            method: 'POST',
            body: payload,
            signal,
          });
        }
      } catch (err) {
        if (signal.aborted) break;
        await new Promise((r) => setTimeout(r, 80));
      }
    }
  }

  async start() {
    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      // PHASE 1: IDLE / UNLOADED BASELINE
      this.onProgress({
        phase: 'idle',
        phaseName: 'Testing Idle Baseline Ping',
        percent: 10,
        currentPing: 0,
        idlePing: 0,
        downloadPing: null,
        uploadPing: null,
      });

      const idlePings = [];
      for (let i = 0; i < 6; i++) {
        if (signal.aborted) return;
        const res = await this.probeSinglePing(signal);
        if (res.success && res.rtt < 2000) idlePings.push(res.rtt);
        this.onProgress({
          phase: 'idle',
          phaseName: 'Testing Idle Baseline Ping',
          percent: Math.round(10 + (i / 6) * 20),
          currentPing: res.rtt,
          idlePing: Math.round(idlePings.reduce((a, b) => a + b, 0) / (idlePings.length || 1)),
          downloadPing: null,
          uploadPing: null,
        });
        await new Promise((r) => setTimeout(r, 220));
      }

      const idleAvg = Math.round(idlePings.reduce((a, b) => a + b, 0) / (idlePings.length || 1));

      // PHASE 2: DOWNLOAD BUFFERBLOAT
      this.onProgress({
        phase: 'download',
        phaseName: 'Saturating Download Streams',
        percent: 35,
        currentPing: idleAvg,
        idlePing: idleAvg,
        downloadPing: idleAvg,
        uploadPing: null,
      });

      // Launch 3 concurrent download generators for 4.5 seconds
      const downloadWorkers = [
        this.runTrafficWorker('download', 4500, signal),
        this.runTrafficWorker('download', 4500, signal),
        this.runTrafficWorker('download', 4500, signal),
      ];

      const downloadPings = [];
      const dlStartTime = Date.now();

      while (Date.now() - dlStartTime < 4200 && !signal.aborted) {
        const res = await this.probeSinglePing(signal);
        if (res.success && res.rtt < 3000) downloadPings.push(res.rtt);

        const currentDlAvg = Math.round(
          downloadPings.reduce((a, b) => a + b, 0) / (downloadPings.length || 1)
        );

        const elapsed = Date.now() - dlStartTime;
        this.onProgress({
          phase: 'download',
          phaseName: 'Saturating Download Streams (Active Load)',
          percent: Math.round(35 + (elapsed / 4200) * 30),
          currentPing: res.rtt,
          idlePing: idleAvg,
          downloadPing: currentDlAvg,
          uploadPing: null,
        });

        await new Promise((r) => setTimeout(r, 280));
      }

      await Promise.allSettled(downloadWorkers);
      const downloadAvg = Math.round(
        downloadPings.reduce((a, b) => a + b, 0) / (downloadPings.length || 1)
      );

      // Cool-down pause
      await new Promise((r) => setTimeout(r, 500));

      // PHASE 3: UPLOAD BUFFERBLOAT
      this.onProgress({
        phase: 'upload',
        phaseName: 'Saturating Upload Streams',
        percent: 68,
        currentPing: idleAvg,
        idlePing: idleAvg,
        downloadPing: downloadAvg,
        uploadPing: idleAvg,
      });

      // Launch 3 concurrent upload generators for 4.5 seconds
      const uploadWorkers = [
        this.runTrafficWorker('upload', 4500, signal),
        this.runTrafficWorker('upload', 4500, signal),
        this.runTrafficWorker('upload', 4500, signal),
      ];

      const uploadPings = [];
      const ulStartTime = Date.now();

      while (Date.now() - ulStartTime < 4200 && !signal.aborted) {
        const res = await this.probeSinglePing(signal);
        if (res.success && res.rtt < 3000) uploadPings.push(res.rtt);

        const currentUlAvg = Math.round(
          uploadPings.reduce((a, b) => a + b, 0) / (uploadPings.length || 1)
        );

        const elapsed = Date.now() - ulStartTime;
        this.onProgress({
          phase: 'upload',
          phaseName: 'Saturating Upload Streams (Active Load)',
          percent: Math.round(68 + (elapsed / 4200) * 30),
          currentPing: res.rtt,
          idlePing: idleAvg,
          downloadPing: downloadAvg,
          uploadPing: currentUlAvg,
        });

        await new Promise((r) => setTimeout(r, 280));
      }

      await Promise.allSettled(uploadWorkers);
      const uploadAvg = Math.round(
        uploadPings.reduce((a, b) => a + b, 0) / (uploadPings.length || 1)
      );

      // FINAL RESULTS
      const downloadDelta = Math.max(0, downloadAvg - idleAvg);
      const uploadDelta = Math.max(0, uploadAvg - idleAvg);
      const maxDelta = Math.max(downloadDelta, uploadDelta);
      const gradeInfo = getBufferbloatGrade(maxDelta);

      const finalResult = {
        idlePing: idleAvg,
        downloadPing: downloadAvg,
        downloadDelta,
        uploadPing: uploadAvg,
        uploadDelta,
        maxDelta,
        grade: gradeInfo.grade,
        label: gradeInfo.label,
        color: gradeInfo.color,
        bgColor: gradeInfo.bgColor,
        description: gradeInfo.description,
        timestamp: new Date().toISOString(),
      };

      this.isRunning = false;
      this.onProgress({
        phase: 'complete',
        phaseName: 'Diagnostic Complete',
        percent: 100,
        ...finalResult,
      });

      if (this.onComplete) {
        this.onComplete(finalResult);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Bufferbloat test error:', err);
      }
      this.isRunning = false;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
