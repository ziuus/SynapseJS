'use client';

import { useEffect, useRef, useState } from 'react';
import type { Application } from '@splinetool/runtime';

declare global {
  interface Window {
    SynapseSplineInterop?: {
      app: Application | null;
      emitEvent: (action: string, targetName: string) => void;
      setVariable: (name: string, value: string | number) => void;
    };
  }
}

// Lazy load Spline component dynamically to avoid SSR hydration issues
let SplineComponent: any = null;

export default function SplineScene() {
  const [SplineLoaded, setSplineLoaded] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const appRef = useRef<Application | null>(null);

  // Dynamically import Spline on the client side only
  useEffect(() => {
    import('@splinetool/react-spline').then((mod) => {
      setSplineLoaded(() => mod.default);
    });

    return () => {
      delete window.SynapseSplineInterop;
    };
  }, []);

  function onLoad(app: Application) {
    appRef.current = app;
    setIsLoaded(true);

    window.SynapseSplineInterop = {
      app,
      emitEvent: (action: string, targetName: string) => {
        try {
          app.emitEvent(action as any, targetName);
          console.log(`[Axon 3D] Emitted '${action}' on '${targetName}'`);
        } catch (e) {
          console.warn(`[Axon 3D] emitEvent failed`, e);
        }
      },
      setVariable: (name: string, value: string | number) => {
        try {
          app.setVariable(name, value as any);
          console.log(`[Axon 3D] Set '${name}' = '${value}'`);
        } catch (e) {
          console.warn(`[Axon 3D] setVariable failed`, e);
        }
      }
    };
  }

  return (
    <div
      id="hero-3d-scene"
      className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden bg-slate-900 border-b border-slate-800/60"
      data-axon-3d="true"
      data-3d-events="mouseHover (trigger hover animations), mouseDown (trigger click actions)"
    >
      {/* Gradient background fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-slate-900 to-purple-900/20" />

      {/* Spline Scene */}
      {SplineLoaded && (
        <SplineLoaded
          scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
          onLoad={onLoad}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />

      {/* Hero Text */}
      <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-md">
          Spatial Web
        </h2>
        <p className="text-slate-300 text-sm max-w-sm drop-shadow">
          {isLoaded
            ? 'AI can now see and control 3D scenes. Try asking it to trigger an animation.'
            : 'Loading 3D scene…'}
        </p>
      </div>

      {/* 3D loaded indicator */}
      {isLoaded && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          3D Scene Live
        </div>
      )}
    </div>
  );
}
