import React, { useEffect, useRef } from 'react';

interface InteractiveBlueprintCanvasProps {
  isDark?: boolean;
  activeModel?: 'turbine' | 'gearbox' | 'avionics';
}

export const InteractiveBlueprintCanvas: React.FC<InteractiveBlueprintCanvasProps> = ({ 
  isDark = true,
  activeModel = 'turbine'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    let angle = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Floating technical CAD coordinate nodes
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1.2,
      id: Math.floor(Math.random() * 900 + 100),
    }));

    // Generate 3D wireframe vertices based on activeModel
    const getVertices = (model: string) => {
      const v: [number, number, number][] = [];
      const edges: [number, number][] = [];

      if (model === 'turbine') {
        // Multi-ring turbine rotor
        const rings = 4;
        const blades = 10;
        for (let r = 0; r < rings; r++) {
          const radius = 60 + r * 35;
          const z = (r - 1.5) * 25;
          for (let b = 0; b < blades; b++) {
            const theta = (b / blades) * Math.PI * 2;
            v.push([Math.cos(theta) * radius, Math.sin(theta) * radius, z]);
            const currIdx = r * blades + b;
            const nextIdx = r * blades + ((b + 1) % blades);
            edges.push([currIdx, nextIdx]);
            if (r > 0) {
              edges.push([currIdx, (r - 1) * blades + b]);
            }
          }
        }
      } else if (model === 'gearbox') {
        // Planetary gear carrier wireframe
        const teeth = 14;
        const radius = 130;
        for (let i = 0; i < teeth; i++) {
          const a1 = (i / teeth) * Math.PI * 2;
          const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
          v.push([Math.cos(a1) * (radius - 15), Math.sin(a1) * (radius - 15), -20]);
          v.push([Math.cos(a2) * radius, Math.sin(a2) * radius, -20]);
          v.push([Math.cos(a1) * (radius - 15), Math.sin(a1) * (radius - 15), 20]);
          v.push([Math.cos(a2) * radius, Math.sin(a2) * radius, 20]);
          const base = i * 4;
          edges.push([base, base + 1]);
          edges.push([base + 2, base + 3]);
          edges.push([base, base + 2]);
          edges.push([base + 1, base + 3]);
        }
      } else {
        // Avionics Chassis / Hex Prism Cage
        const sides = 8;
        const rad = 110;
        for (let i = 0; i < sides; i++) {
          const th = (i / sides) * Math.PI * 2;
          v.push([Math.cos(th) * rad, Math.sin(th) * rad, -55]);
          v.push([Math.cos(th) * rad, Math.sin(th) * rad, 55]);
          v.push([Math.cos(th) * (rad * 0.6), Math.sin(th) * (rad * 0.6), 0]);
          const base = i * 3;
          const next = ((i + 1) % sides) * 3;
          edges.push([base, base + 1]);
          edges.push([base, next]);
          edges.push([base + 1, next + 1]);
          edges.push([base, base + 2]);
          edges.push([base + 1, base + 2]);
        }
      }
      return { vertices: v, edges };
    };

    const render = () => {
      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      angle += 0.007;

      ctx.clearRect(0, 0, width, height);

      // Colors tailored to dark/light theme
      const primaryColor = isDark ? 'rgba(6, 182, 212, ' : 'rgba(2, 132, 199, ';
      const subtleLineColor = isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(203, 213, 225, 0.45)';
      const crosshairColor = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.35)';

      // 1. Draw Cartesian Datum Grid across entire screen
      const gridSize = 80;
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = subtleLineColor;

      // Vertical lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Coordinate Crosshairs at intersections
      const crossSize = 4;
      ctx.strokeStyle = crosshairColor;
      ctx.lineWidth = 0.8;
      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();
        }
      }

      // 2. Interactive CAD Nodes & Vector Lines in margins
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw node
        ctx.fillStyle = primaryColor + '0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = primaryColor + (1 - dist / 130) * 0.18 + ')';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Connect to mouse if near
        const dmx = p.x - mouseX;
        const dmy = p.y - mouseY;
        const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy);
        if (mouseDist < 160) {
          ctx.strokeStyle = primaryColor + (1 - mouseDist / 160) * 0.35 + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }
      });

      // 3. Rotating 3D Isometric CAD Wireframe Projection in the Background
      // Placed slightly to the left/center background
      const { vertices, edges } = getVertices(activeModel);
      const centerX = width > 1200 ? width * 0.28 : width * 0.5;
      const centerY = height * 0.5;
      const rotX = 0.45 + (mouseY - height / 2) * 0.0004;
      const rotY = angle + (mouseX - width / 2) * 0.0005;

      const projected = vertices.map(([vx, vy, vz]) => {
        // Rotate Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = vx * cosY + vz * sinY;
        const z1 = -vx * sinY + vz * cosY;

        // Rotate X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = vy * cosX - z1 * sinX;
        const z2 = vy * sinX + z1 * cosX;

        // Isometric perspective projection
        const scale = 400 / (400 + z2);
        return [centerX + x1 * scale, centerY + y2 * scale];
      });

      // Draw wireframe edges
      ctx.lineWidth = 0.9;
      edges.forEach(([i1, i2]) => {
        const p1 = projected[i1];
        const p2 = projected[i2];
        if (!p1 || !p2) return;
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.14)';
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      });

      // Center datum ring around rotating model
      ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(2, 132, 199, 0.1)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark, activeModel]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 block w-full h-full"
    />
  );
};
