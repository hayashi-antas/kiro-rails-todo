import React, { useEffect, useRef, useCallback } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
  swing: number;
  swingSpeed: number;
  swingOffset: number;
  blur: number;
  wobble: number;
  wobbleSpeed: number;
}

interface SnowEffectProps {
  particleCount?: number;
  className?: string;
}

export function SnowEffect({ particleCount = 150, className = '' }: SnowEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const timeRef = useRef(0);
  const windRef = useRef({ current: 0, target: 0 });

  const createSnowflake = useCallback((canvas: HTMLCanvasElement, startAtTop = false): Snowflake => {
    const isLarge = Math.random() > 0.85;
    const isMedium = !isLarge && Math.random() > 0.6;

    let radius: number;
    let speed: number;
    let blur: number;
    let opacity: number;

    if (isLarge) {
      radius = 3 + Math.random() * 3;
      speed = 0.8 + Math.random() * 0.6;
      blur = 0;
      opacity = 0.9 + Math.random() * 0.1;
    } else if (isMedium) {
      radius = 1.5 + Math.random() * 1.5;
      speed = 0.5 + Math.random() * 0.5;
      blur = 0.5;
      opacity = 0.6 + Math.random() * 0.3;
    } else {
      radius = 0.5 + Math.random() * 1;
      speed = 0.2 + Math.random() * 0.4;
      blur = 1;
      opacity = 0.3 + Math.random() * 0.3;
    }

    return {
      x: Math.random() * canvas.width,
      y: startAtTop ? -radius * 2 : Math.random() * canvas.height,
      radius,
      speed,
      wind: (Math.random() - 0.5) * 0.3,
      opacity,
      swing: Math.random() * Math.PI * 2,
      swingSpeed: 0.01 + Math.random() * 0.02,
      swingOffset: 20 + Math.random() * 30,
      blur,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
    };
  }, []);

  const initSnowflakes = useCallback((canvas: HTMLCanvasElement) => {
    snowflakesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      snowflakesRef.current.push(createSnowflake(canvas, false));
    }
  }, [particleCount, createSnowflake]);

  const drawSnowflake = useCallback((
    ctx: CanvasRenderingContext2D,
    flake: Snowflake,
    time: number
  ) => {
    const swingX = Math.sin(flake.swing + time * flake.swingSpeed) * flake.swingOffset * (flake.radius / 3);
    const wobbleScale = 1 + Math.sin(flake.wobble + time * flake.wobbleSpeed) * 0.1;

    ctx.save();

    if (flake.blur > 0) {
      ctx.filter = `blur(${flake.blur}px)`;
    }

    const gradient = ctx.createRadialGradient(
      flake.x + swingX, flake.y,
      0,
      flake.x + swingX, flake.y,
      flake.radius * wobbleScale
    );

    gradient.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity})`);
    gradient.addColorStop(0.4, `rgba(255, 255, 255, ${flake.opacity * 0.8})`);
    gradient.addColorStop(0.7, `rgba(230, 240, 255, ${flake.opacity * 0.4})`);
    gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);

    ctx.beginPath();
    ctx.arc(
      flake.x + swingX,
      flake.y,
      flake.radius * wobbleScale * 1.5,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = gradient;
    ctx.fill();

    if (flake.radius > 2) {
      ctx.beginPath();
      ctx.arc(
        flake.x + swingX - flake.radius * 0.3,
        flake.y - flake.radius * 0.3,
        flake.radius * 0.2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity * 0.5})`;
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const updateSnowflake = useCallback((
    flake: Snowflake,
    canvas: HTMLCanvasElement,
    globalWind: number
  ): boolean => {
    flake.y += flake.speed;
    flake.x += flake.wind + globalWind * (flake.radius / 3);

    if (mouseRef.current.active) {
      const dx = flake.x - mouseRef.current.x;
      const dy = flake.y - mouseRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 100;

      if (distance < maxDistance) {
        const force = (1 - distance / maxDistance) * 2;
        flake.x += (dx / distance) * force;
        flake.y += (dy / distance) * force * 0.5;
      }
    }

    if (flake.y > canvas.height + flake.radius * 2) {
      return true;
    }
    if (flake.x < -50) {
      flake.x = canvas.width + 50;
    } else if (flake.x > canvas.width + 50) {
      flake.x = -50;
    }

    return false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    initSnowflakes(canvas);

    const handleResize = () => {
      resizeCanvas();
      initSnowflakes(canvas);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      timeRef.current += 1;

      if (Math.random() < 0.005) {
        windRef.current.target = (Math.random() - 0.5) * 2;
      }
      windRef.current.current += (windRef.current.target - windRef.current.current) * 0.01;

      const snowflakes = snowflakesRef.current;

      for (let i = snowflakes.length - 1; i >= 0; i--) {
        const flake = snowflakes[i];
        const shouldReset = updateSnowflake(flake, canvas, windRef.current.current);

        if (shouldReset) {
          snowflakes[i] = createSnowflake(canvas, true);
        }

        drawSnowflake(ctx, flake, timeRef.current);
      }

      const targetCount = particleCount;
      if (snowflakes.length < targetCount && Math.random() < 0.1) {
        snowflakes.push(createSnowflake(canvas, true));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, initSnowflakes, createSnowflake, updateSnowflake, drawSnowflake]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
}
