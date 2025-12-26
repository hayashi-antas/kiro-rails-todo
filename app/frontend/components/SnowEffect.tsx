import React, { useEffect, useRef, useCallback } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftX: number;
  swingPhase: number;
}

interface SnowEffectProps {
  particleCount?: number;
  className?: string;
}

export function SnowEffect({
  particleCount = 60, // 思い切って減らす（必要なら増やす）
  className = '',
}: SnowEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationRef = useRef<number>();
  const sizeRef = useRef({ width: 0, height: 0 });
  const timeRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);

  const createSnowflake = useCallback(
    (width: number, height: number, startAtTop = false): Snowflake => {
      const radius = 1 + Math.random() * 2; // 1〜3px
      const speedY = 0.4 + Math.random() * 0.8; // 落ちる速度
      const driftX = (Math.random() - 0.5) * 0.3; // 横方向のゆるい流れ

      return {
        x: Math.random() * width,
        y: startAtTop ? -radius * 2 : Math.random() * height,
        radius,
        speedY,
        driftX,
        swingPhase: Math.random() * Math.PI * 2,
      };
    },
    []
  );

  const initSnowflakes = useCallback(
    (width: number, height: number) => {
      snowflakesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        snowflakesRef.current.push(createSnowflake(width, height, false));
      }
    },
    [particleCount, createSnowflake]
  );

  const updateSnowflake = useCallback(
    (flake: Snowflake, width: number, height: number, dt: number): boolean => {
      // dt は秒数。小さいのでそのまま掛ける
      flake.y += flake.speedY * (dt * 60); // おおよそ60fps基準
      flake.x += flake.driftX * (dt * 60);

      // 画面外に落ちたらリセット
      if (flake.y > height + flake.radius * 2) {
        return true;
      }

      // 横にはみ出したらラップ
      if (flake.x < -20) {
        flake.x = width + 20;
      } else if (flake.x > width + 20) {
        flake.x = -20;
      }

      return false;
    },
    []
  );

  const drawSnowflake = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      flake: Snowflake,
      time: number
    ) => {
      // ごく軽い揺れだけ追加（sin 1回）
      const swingX =
        Math.sin(flake.swingPhase + time * 0.5) * flake.radius * 1.5;

      const drawX = flake.x + swingX;
      const drawY = flake.y;

      ctx.beginPath();
      ctx.arc(drawX, drawY, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      // 🔴 超軽量のため DPR は 1 に固定（Retina捨てる）
      const dpr = 1;
      const rect = canvas.getBoundingClientRect();

      sizeRef.current.width = rect.width;
      sizeRef.current.height = rect.height;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0); // 念のためリセット
      // dpr 1 なので scale も不要（書くなら ctx.scale(dpr, dpr)）

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      initSnowflakes(rect.width, rect.height);
    };

    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = performance.now();
      if (lastFrameRef.current == null) {
        lastFrameRef.current = now;
      }
      const deltaMs = now - lastFrameRef.current;

      // 🔻 30fps 相当まで落とす（これだけでもかなり軽くなる）
      const frameInterval = 1000 / 30;
      if (deltaMs < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = deltaMs / 1000; // 秒
      lastFrameRef.current = now;
      timeRef.current += dt;

      ctx.clearRect(0, 0, width, height);

      const snowflakes = snowflakesRef.current;

      for (let i = snowflakes.length - 1; i >= 0; i--) {
        const flake = snowflakes[i];
        const shouldReset = updateSnowflake(flake, width, height, dt);
        if (shouldReset) {
          snowflakes[i] = createSnowflake(width, height, true);
        }
        drawSnowflake(ctx, flake, timeRef.current);
      }

      // 粒子不足時だけ少しずつ補充
      if (snowflakes.length < particleCount && Math.random() < 0.05) {
        snowflakes.push(createSnowflake(width, height, true));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, initSnowflakes, createSnowflake, updateSnowflake, drawSnowflake]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
}
