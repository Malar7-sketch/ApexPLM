import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  X,
  Eye,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Box,
  FileText,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Info,
  Calendar,
  User,
  Hash,
  Award,
  Search
} from 'lucide-react';
import type { EngineeringDocument, PartItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';
import { generateEngineeringDrawingPdf } from '../utils/engineeringDrawingPdf';
import { INITIAL_PARTS } from '../data/mockPlmData';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EngineeringDocument;
  part?: PartItem;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  part: propPart
}) => {
  const { isDark } = useTheme();
  const part = propPart || INITIAL_PARTS.find(p => p.id === doc.linkedPartId) || INITIAL_PARTS[0];

  // Detect file type
  const getFileType = (): 'cad' | 'pdf' | 'doc' | 'fmea' | 'inspection' | 'compliance' | 'other' => {
    const ext = (doc.fileExtension || doc.title.split('.').pop() || '').toLowerCase();
    const typeLower = (doc.type || '').toLowerCase();
    const titleLower = (doc.title || '').toLowerCase();

    if (
      ['step', 'stp', 'sldprt', 'sldasm', 'iges', 'igs', 'dwg', 'dxf', 'stl', 'obj'].includes(ext) ||
      typeLower.includes('cad') ||
      typeLower.includes('step') ||
      typeLower.includes('model') ||
      typeLower.includes('3d') ||
      titleLower.includes('.step') ||
      titleLower.includes('.stp') ||
      titleLower.includes('.sldprt')
    ) {
      return 'cad';
    }

    if (
      typeLower.includes('dfmea') ||
      typeLower.includes('pfmea') ||
      titleLower.includes('dfmea') ||
      titleLower.includes('fmea')
    ) {
      return 'fmea';
    }

    if (
      typeLower.includes('inspection') ||
      titleLower.includes('inspection') ||
      titleLower.includes('cmm')
    ) {
      return 'inspection';
    }

    if (
      typeLower.includes('rohs') ||
      typeLower.includes('reach') ||
      typeLower.includes('cert') ||
      titleLower.includes('compliance') ||
      titleLower.includes('rohs')
    ) {
      return 'compliance';
    }

    if (
      ['doc', 'docx', 'odt', 'rtf'].includes(ext) ||
      typeLower.includes('specification') ||
      typeLower.includes('statement of work') ||
      typeLower.includes('manual') ||
      titleLower.includes('.docx') ||
      titleLower.includes('.doc')
    ) {
      return 'doc';
    }

    if (
      ext === 'pdf' ||
      typeLower.includes('pdf') ||
      typeLower.includes('drawing') ||
      typeLower.includes('report')
    ) {
      return 'pdf';
    }

    return 'pdf'; // Default fallback to PDF drawing sheet
  };

  const fileType = getFileType();

  // State for different viewers
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activePdfSheet, setActivePdfSheet] = useState<number>(1);
  const [cadRenderMode, setCadRenderMode] = useState<'solid' | 'wireframe' | 'xray'>('solid');
  const [cadAutoRotate, setCadAutoRotate] = useState<boolean>(true);
  const [cadExploded, setCadExploded] = useState<boolean>(false);
  const [activeDocSection, setActiveDocSection] = useState<string>('scope');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // 3D Three.js canvas ref
  const mountRef = useRef<HTMLDivElement>(null);

  // Initialize Three.js scene for CAD files
  useEffect(() => {
    if (!isOpen || fileType !== 'cad' || !mountRef.current) return;

    let animationFrameId: number;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x0a101d : 0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 45, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Clear previous canvas
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(50, 80, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-50, -30, -50);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(120, 24, 0x38bdf8, isDark ? 0x1e293b : 0xcbd5e1);
    grid.position.y = -25;
    scene.add(grid);

    // Dynamic Geometry Group representing the CAD Part
    const cadGroup = new THREE.Group();

    // Primary central body
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: cadRenderMode === 'xray' ? 0x06b6d4 : 0x38bdf8,
      metalness: 0.8,
      roughness: 0.25,
      wireframe: cadRenderMode === 'wireframe',
      transparent: cadRenderMode === 'xray',
      opacity: cadRenderMode === 'xray' ? 0.35 : 1.0
    });

    const isSunGear = doc.title.toLowerCase().includes('sun') || part.partNumber === 'PN-1004';

    if (isSunGear) {
      // Sun Pinion Gear 3D Model
      const cylinderGeom = new THREE.CylinderGeometry(16, 16, 24, 32);
      const mainCylinder = new THREE.Mesh(cylinderGeom, bodyMaterial);
      cadGroup.add(mainCylinder);

      // Bore through center
      const boreGeom = new THREE.CylinderGeometry(6, 6, 26, 24);
      const boreMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2,
        wireframe: cadRenderMode === 'wireframe'
      });
      const bore = new THREE.Mesh(boreGeom, boreMat);
      cadGroup.add(bore);

      // Involute Gear Teeth
      const numTeeth = 18;
      for (let i = 0; i < numTeeth; i++) {
        const toothGeom = new THREE.BoxGeometry(3.5, 24, 5);
        const tooth = new THREE.Mesh(toothGeom, bodyMaterial);
        const angle = (i / numTeeth) * Math.PI * 2;
        tooth.position.set(Math.cos(angle) * 16.5, 0, Math.sin(angle) * 16.5);
        tooth.rotation.y = -angle;
        cadGroup.add(tooth);
      }
    } else {
      // Planetary Gearbox Assembly 3D Model
      // Outer Casing
      const outerRingGeom = new THREE.CylinderGeometry(28, 28, 14, 32, 1, true);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.85,
        roughness: 0.3,
        side: THREE.DoubleSide,
        wireframe: cadRenderMode === 'wireframe',
        transparent: cadRenderMode === 'xray',
        opacity: cadRenderMode === 'xray' ? 0.3 : 1
      });
      const ringMesh = new THREE.Mesh(outerRingGeom, ringMat);
      cadGroup.add(ringMesh);

      // Sun Gear in center
      const sunGeom = new THREE.CylinderGeometry(8, 8, 16, 24);
      const sunMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.7,
        roughness: 0.3,
        wireframe: cadRenderMode === 'wireframe'
      });
      const sunMesh = new THREE.Mesh(sunGeom, sunMat);
      cadGroup.add(sunMesh);

      // 3 Planet Gears orbiting around sun
      const planetPositions = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      planetPositions.forEach((posAngle, idx) => {
        const dist = cadExploded ? 34 : 17;
        const planetGeom = new THREE.CylinderGeometry(6, 6, 12, 20);
        const planetMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.8,
          roughness: 0.3,
          wireframe: cadRenderMode === 'wireframe'
        });
        const planetMesh = new THREE.Mesh(planetGeom, planetMat);
        planetMesh.position.set(
          Math.cos(posAngle) * dist,
          cadExploded ? (idx - 1) * 8 : 0,
          Math.sin(posAngle) * dist
        );
        cadGroup.add(planetMesh);
      });

      // Shaft Carrier
      const shaftGeom = new THREE.CylinderGeometry(3, 3, cadExploded ? 48 : 32, 24);
      const shaftMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        metalness: 0.9,
        roughness: 0.2,
        wireframe: cadRenderMode === 'wireframe'
      });
      const shaftMesh = new THREE.Mesh(shaftGeom, shaftMat);
      shaftMesh.position.y = cadExploded ? 12 : 0;
      cadGroup.add(shaftMesh);
    }

    scene.add(cadGroup);

    // Mouse rotation interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      cadGroup.rotation.y += deltaX * 0.01;
      cadGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (cadAutoRotate && !isDragging) {
        cadGroup.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [isOpen, fileType, isDark, cadRenderMode, cadAutoRotate, cadExploded, doc.title, part.partNumber]);

  if (!isOpen) return null;

  // Handle Download PDF
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
        const link = window.document.createElement('a');
        link.href = doc.fileUrl;
        link.download = doc.title;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        return;
      }

      const { blob, filename } = await generateEngineeringDrawingPdf({
        part,
        revision: doc.revision || part.currentRev,
        authorName: doc.author
      });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download document:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#0B132B] border-[#1E293B] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Top Header Bar */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-[#111B2E] border-[#1E293B]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2 rounded-xl border shrink-0 ${
                fileType === 'cad'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : fileType === 'pdf'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : fileType === 'doc'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : fileType === 'fmea'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {fileType === 'cad' ? (
                <Box className="w-5 h-5" />
              ) : fileType === 'pdf' ? (
                <FileText className="w-5 h-5" />
              ) : fileType === 'doc' ? (
                <FileText className="w-5 h-5" />
              ) : fileType === 'fmea' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{doc.docNumber}</span>
                <span className="badge-status badge-active text-[10px]">{doc.revision}</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                  {doc.type}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold truncate mt-0.5" title={doc.title}>
                {doc.title}
              </h2>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg border border-slate-500/20 hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary btn-sm flex items-center space-x-1.5"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-500/20 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Dynamic Viewer per File Type */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {/* ======================= CAD 3D VIEWER ======================= */}
          {fileType === 'cad' && (
            <div className="flex-1 flex flex-col min-h-[520px]">
              {/* CAD Control Toolbar */}
              <div
                className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
                  isDark ? 'bg-[#0E1726] border-[#1E293B]' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-slate-400">Shading Mode:</span>
                  <div className="flex rounded-lg border border-slate-500/20 overflow-hidden">
                    <button
                      onClick={() => setCadRenderMode('solid')}
                      className={`px-2.5 py-1 text-xs font-semibold ${
                        cadRenderMode === 'solid' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-500/10'
                      }`}
                    >
                      Solid B-Rep
                    </button>
                    <button
                      onClick={() => setCadRenderMode('wireframe')}
                      className={`px-2.5 py-1 text-xs font-semibold ${
                        cadRenderMode === 'wireframe' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-500/10'
                      }`}
                    >
                      Wireframe
                    </button>
                    <button
                      onClick={() => setCadRenderMode('xray')}
                      className={`px-2.5 py-1 text-xs font-semibold ${
                        cadRenderMode === 'xray' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-500/10'
                      }`}
                    >
                      X-Ray
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCadExploded(!cadExploded)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                      cadExploded
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'border-slate-500/20 hover:bg-slate-500/10 text-slate-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{cadExploded ? 'Collapse Assembly' : 'Explode View'}</span>
                  </button>

                  <button
                    onClick={() => setCadAutoRotate(!cadAutoRotate)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                      cadAutoRotate
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'border-slate-500/20 hover:bg-slate-500/10 text-slate-300'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{cadAutoRotate ? 'Rotating' : 'Static'}</span>
                  </button>
                </div>
              </div>

              {/* 3D WebGL Canvas Area */}
              <div className="flex-1 relative min-h-[460px] bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 flex">
                <div ref={mountRef} className="w-full h-full min-h-[460px]" />

                {/* Floating CAD Overlay Specs */}
                <div className="absolute top-4 left-4 pointer-events-none bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 text-xs text-slate-200 space-y-1.5 font-mono shadow-xl max-w-xs">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                    <Box className="w-4 h-4" />
                    <span>3D CAD Model Geometry</span>
                  </div>
                  <div>Part: <span className="text-white font-semibold">{part.partNumber}</span> ({part.name})</div>
                  <div>Format: <span className="text-purple-400 font-semibold">{doc.fileExtension?.toUpperCase() || 'STEP AP242'}</span></div>
                  <div>Material: <span className="text-amber-400 font-semibold">{part.material || 'AISI 4140 Alloy Steel'}</span></div>
                  <div>B-Rep Faces: <span className="text-emerald-400 font-semibold">1,248</span> &bull; Vertices: <span className="text-emerald-400 font-semibold">3,892</span></div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    Left Click + Drag to rotate &bull; Scroll to Zoom
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 pointer-events-none bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 text-[11px] font-mono text-slate-300 flex items-center space-x-2 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Apex 3D CAD WebGL Engine v2.4</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================= PDF MULTI-PAGE VIEWER ======================= */}
          {fileType === 'pdf' && (
            <div className="flex-1 flex flex-col">
              {/* PDF Toolbar */}
              <div
                className={`px-5 py-2.5 border-b flex items-center justify-between gap-3 text-xs shrink-0 ${
                  isDark ? 'bg-[#0E1726] border-[#1E293B]' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 bg-slate-500/10 rounded-lg p-1 border border-slate-500/20">
                    <button
                      onClick={() => setActivePdfSheet(Math.max(1, activePdfSheet - 1))}
                      disabled={activePdfSheet === 1}
                      className="p-1 rounded hover:bg-slate-500/20 disabled:opacity-40"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-xs px-2 font-bold">
                      Sheet {activePdfSheet} of 3
                    </span>
                    <button
                      onClick={() => setActivePdfSheet(Math.min(3, activePdfSheet + 1))}
                      disabled={activePdfSheet === 3}
                      className="p-1 rounded hover:bg-slate-500/20 disabled:opacity-40"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {activePdfSheet === 1
                      ? 'Sheet 1: Orthographic Views &amp; Isometric Projection'
                      : activePdfSheet === 2
                      ? 'Sheet 2: Section Cut A-A &amp; Exploded BOM Callouts'
                      : 'Sheet 3: GD&amp;T Tolerances &amp; Surface Finish Specs'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                    className="p-1.5 rounded-lg border border-slate-500/20 hover:bg-slate-500/10"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs w-12 text-center">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                    className="p-1.5 rounded-lg border border-slate-500/20 hover:bg-slate-500/10"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="px-2 py-1 rounded-lg border border-slate-500/20 hover:bg-slate-500/10 text-[11px]"
                  >
                    Fit
                  </button>
                </div>
              </div>

              {/* PDF Document Canvas / Sheets */}
              <div
                className={`flex-1 p-6 overflow-auto flex justify-center ${
                  isDark ? 'bg-[#080E1C]' : 'bg-slate-200'
                }`}
              >
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out'
                  }}
                  className="w-[900px] min-h-[620px] bg-white text-slate-900 border-2 border-slate-800 shadow-2xl p-6 relative font-mono text-xs select-none flex flex-col justify-between"
                >
                  {/* Drawing Outer ASME Border */}
                  <div className="absolute inset-2 border-2 border-slate-900 pointer-events-none" />
                  <div className="absolute inset-3 border border-slate-700 pointer-events-none" />

                  {/* Top Header Information */}
                  <div className="relative z-10 flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-slate-900 text-white font-black text-center leading-6 rounded-sm text-xs">
                        A
                      </div>
                      <div>
                        <div className="text-[10px] tracking-widest text-slate-500 uppercase">
                          Apex Aerospace Dynamics Corp &bull; PLM Engineering Division
                        </div>
                        <div className="text-sm font-black tracking-tight">{doc.title}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">ASME Y14.5M-2018</div>
                      <div className="text-[10px] text-slate-500">Units: MILLIMETERS (mm) &bull; Third Angle Projection</div>
                    </div>
                  </div>

                  {/* Sheet Content Area */}
                  <div className="relative z-10 my-4 flex-1 flex flex-col justify-around">
                    {activePdfSheet === 1 && (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Front View Blueprint */}
                        <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest self-start">
                            Front View (1:1)
                          </span>
                          <svg className="w-64 h-48 my-2" viewBox="0 0 240 180">
                            <rect x="40" y="30" width="160" height="120" rx="8" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
                            <circle cx="120" cy="90" r="45" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="6 3" />
                            <circle cx="120" cy="90" r="20" fill="#e0f2fe" stroke="#0f172a" strokeWidth="2" />
                            {/* Centerlines */}
                            <line x1="20" y1="90" x2="220" y2="90" stroke="#ef4444" strokeWidth="1" strokeDasharray="8 4 2 4" />
                            <line x1="120" y1="15" x2="120" y2="165" stroke="#ef4444" strokeWidth="1" strokeDasharray="8 4 2 4" />
                            {/* Dimension Callouts */}
                            <line x1="40" y1="160" x2="200" y2="160" stroke="#0f172a" strokeWidth="1" />
                            <text x="120" y="172" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="bold">
                              160.00 &plusmn;0.05 mm
                            </text>
                            <line x1="40" y1="155" x2="40" y2="165" stroke="#0f172a" strokeWidth="1" />
                            <line x1="200" y1="155" x2="200" y2="165" stroke="#0f172a" strokeWidth="1" />
                          </svg>
                          <div className="text-[9px] text-slate-500">Surface Roughness: Ra 0.8 &bull; Datum A [Primary]</div>
                        </div>

                        {/* Isometric 3D Projection */}
                        <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest self-start">
                            Isometric View (Ref Only)
                          </span>
                          <svg className="w-64 h-48 my-2" viewBox="0 0 240 180">
                            {/* Isometric stylized gear assembly */}
                            <polygon points="120,30 200,75 120,120 40,75" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
                            <polygon points="40,75 120,120 120,155 40,110" fill="#7dd3fc" stroke="#0369a1" strokeWidth="2" />
                            <polygon points="200,75 120,120 120,155 200,110" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
                            {/* Bore */}
                            <ellipse cx="120" cy="75" rx="30" ry="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
                            <text x="120" y="78" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="bold">
                              &Oslash;32.00 H7
                            </text>
                          </svg>
                          <div className="text-[9px] text-slate-500">CAD Source: {part.partNumber}.step &bull; Parametric</div>
                        </div>
                      </div>
                    )}

                    {activePdfSheet === 2 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-xs font-bold text-slate-800">Bill of Materials (BOM) Itemization &amp; Balloon Callouts</span>
                          <span className="text-[10px] text-slate-500">BOM Hierarchy: Indented EBOM Level 1</span>
                        </div>
                        <table className="w-full text-left text-[11px] border border-slate-400">
                          <thead className="bg-slate-200 border-b border-slate-400">
                            <tr>
                              <th className="p-1.5 border-r border-slate-400">Item</th>
                              <th className="p-1.5 border-r border-slate-400">Part Number</th>
                              <th className="p-1.5 border-r border-slate-400">Description</th>
                              <th className="p-1.5 border-r border-slate-400">Qty</th>
                              <th className="p-1.5 border-r border-slate-400">Material</th>
                              <th className="p-1.5">Tolerance Spec</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-300">
                              <td className="p-1.5 border-r border-slate-400 font-bold">1</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold text-cyan-700">{part.partNumber}</td>
                              <td className="p-1.5 border-r border-slate-400">{part.name}</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold">1</td>
                              <td className="p-1.5 border-r border-slate-400">{part.material}</td>
                              <td className="p-1.5">&plusmn;0.012 mm</td>
                            </tr>
                            <tr className="border-b border-slate-300 bg-slate-50">
                              <td className="p-1.5 border-r border-slate-400 font-bold">2</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold">PN-1004</td>
                              <td className="p-1.5 border-r border-slate-400">Sun Pinion Shaft Hardened</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold">1</td>
                              <td className="p-1.5 border-r border-slate-400">AISI 4340 Ni-Cr-Mo</td>
                              <td className="p-1.5">&plusmn;0.008 mm</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="p-1.5 border-r border-slate-400 font-bold">3</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold">PN-1003</td>
                              <td className="p-1.5 border-r border-slate-400">Planetary Helical Gear Set</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold">3</td>
                              <td className="p-1.5 border-r border-slate-400">Case Hardened 8620</td>
                              <td className="p-1.5">&plusmn;0.010 mm</td>
                            </tr>
                            <tr className="border-b border-slate-300 bg-slate-50">
                              <td className="p-1.5 border-r border-slate-400 font-bold">4</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold">PN-BRG-6204</td>
                              <td className="p-1.5 border-r border-slate-400">Deep Groove Ball Bearing 6204-2RS</td>
                              <td className="p-1.5 border-r border-slate-400 font-bold">2</td>
                              <td className="p-1.5 border-r border-slate-400">Chrome Steel 52100</td>
                              <td className="p-1.5">ABEC-7 / ISO P4</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activePdfSheet === 3 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-xs font-bold text-slate-800">GD&amp;T Feature Control Frames &amp; Surface Finish Matrix</span>
                          <span className="text-[10px] text-slate-500">ISO 1101 / ASME Y14.5-2018</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="border border-slate-400 p-3 rounded bg-slate-50">
                            <span className="font-bold block text-xs">Concentricity Callout</span>
                            <div className="mt-2 p-2 border border-slate-700 bg-white font-mono font-bold flex items-center space-x-2 text-xs">
                              <span className="border-r pr-2">&bull;&bull;</span>
                              <span className="border-r pr-2">&Oslash;0.012</span>
                              <span>A-B</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-2">Bore concentricity must remain &le; 12 &mu;m relative to datum axis A-B.</p>
                          </div>

                          <div className="border border-slate-400 p-3 rounded bg-slate-50">
                            <span className="font-bold block text-xs">Perpendicularity Datum A</span>
                            <div className="mt-2 p-2 border border-slate-700 bg-white font-mono font-bold flex items-center space-x-2 text-xs">
                              <span className="border-r pr-2">&perp;</span>
                              <span className="border-r pr-2">0.008</span>
                              <span>A</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-2">Flange face squareness within 8 &mu;m full indicator movement.</p>
                          </div>

                          <div className="border border-slate-400 p-3 rounded bg-slate-50">
                            <span className="font-bold block text-xs">Surface Roughness</span>
                            <div className="mt-2 p-2 border border-slate-700 bg-white font-mono font-bold text-xs">
                              <span>Ra 0.8 &mu;m Ground</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-2">Cylindrical grinding with CNC CBN wheel and post-superfinishing.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Official Title Block (ASME Standard) */}
                  <div className="relative z-10 border-2 border-slate-900 mt-2">
                    <div className="grid grid-cols-4 divide-x-2 divide-slate-900 text-[10px]">
                      <div className="p-2 space-y-1">
                        <div>DRAWN BY: <span className="font-bold">{doc.author}</span></div>
                        <div>CHECKED BY: <span className="font-bold">Marcus Vance, PE</span></div>
                        <div>APPROVED BY: <span className="font-bold">Chief Engineer</span></div>
                      </div>
                      <div className="p-2 space-y-1">
                        <div>DATE: <span className="font-bold">{doc.uploadDate}</span></div>
                        <div>PROJ: <span className="font-bold">PRJ-GBX-5000</span></div>
                        <div>SCALE: <span className="font-bold">1:1 FULL</span></div>
                      </div>
                      <div className="p-2 space-y-1">
                        <div>DWG NO: <span className="font-bold text-cyan-800">{doc.docNumber}</span></div>
                        <div>REV: <span className="font-bold text-rose-700">{doc.revision}</span></div>
                        <div>SHEET: <span className="font-bold">{activePdfSheet} OF 3</span></div>
                      </div>
                      <div className="p-2 bg-slate-100 flex flex-col justify-center items-center text-center">
                        <div className="font-black text-xs text-slate-900">APEX PLM VAULT</div>
                        <div className="text-[8px] text-emerald-700 font-bold flex items-center space-x-1 mt-1">
                          <CheckCircle2 className="w-2.5 h-2.5 inline" />
                          <span>DIGITALLY CERTIFIED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= DOC / DOCX OFFICE VIEWER ======================= */}
          {fileType === 'doc' && (
            <div className="flex-1 flex flex-col">
              {/* Word Document Toolbar */}
              <div
                className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
                  isDark ? 'bg-[#0E1726] border-[#1E293B]' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-blue-400 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Microsoft Word Document Preview (.docx)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    &bull; 1,420 words &bull; 4 pages &bull; Formatted ISO 9001 Specification
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg border border-slate-500/20 overflow-hidden text-xs">
                    <button
                      onClick={() => setActiveDocSection('scope')}
                      className={`px-2.5 py-1 ${activeDocSection === 'scope' ? 'bg-blue-500 text-white font-bold' : 'hover:bg-slate-500/10'}`}
                    >
                      1. Scope
                    </button>
                    <button
                      onClick={() => setActiveDocSection('specs')}
                      className={`px-2.5 py-1 ${activeDocSection === 'specs' ? 'bg-blue-500 text-white font-bold' : 'hover:bg-slate-500/10'}`}
                    >
                      2. Specifications
                    </button>
                    <button
                      onClick={() => setActiveDocSection('quality')}
                      className={`px-2.5 py-1 ${activeDocSection === 'quality' ? 'bg-blue-500 text-white font-bold' : 'hover:bg-slate-500/10'}`}
                    >
                      3. Quality &amp; Signoff
                    </button>
                  </div>
                </div>
              </div>

              {/* Office Document Paper Simulation */}
              <div
                className={`flex-1 p-6 sm:p-10 overflow-auto flex justify-center ${
                  isDark ? 'bg-[#080E1C]' : 'bg-slate-100'
                }`}
              >
                <div
                  className={`w-full max-w-4xl min-h-[640px] p-8 sm:p-12 rounded-xl shadow-xl border font-sans text-sm leading-relaxed ${
                    isDark ? 'bg-[#111B2E] border-[#1E293B] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {/* Formal Office Document Header */}
                  <div className="border-b pb-4 mb-6 flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-500 uppercase tracking-widest font-mono">
                        Technical Engineering Specification &bull; Confidential
                      </span>
                      <h1 className="text-xl sm:text-2xl font-bold mt-1 text-slate-100">{doc.title}</h1>
                      <div className="text-xs text-slate-400 mt-1 flex items-center space-x-4">
                        <span>Doc No: <strong className="text-cyan-400 font-mono">{doc.docNumber}</strong></span>
                        <span>Rev: <strong className="text-emerald-400 font-mono">{doc.revision}</strong></span>
                        <span>Author: <strong>{doc.author}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge-status badge-active text-xs">APPROVED</span>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">{doc.uploadDate}</div>
                    </div>
                  </div>

                  {/* Section Content */}
                  {activeDocSection === 'scope' && (
                    <div className="space-y-4">
                      <h2 className="text-base font-bold text-cyan-400 flex items-center space-x-2">
                        <span>1.0 Scope &amp; Functional Objective</span>
                      </h2>
                      <p>
                        This technical document defines the rigorous design criteria, operational envelope, and quality
                        verification protocols for the <strong className="text-white">{part.name} ({part.partNumber})</strong>.
                        The equipment is engineered to provide continuous high-torque speed reduction in high-reliability
                        aerospace and industrial robotic drive assemblies.
                      </p>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
                        <strong>Compliance Note:</strong> All manufacturing and inspection activities must comply with
                        AS9100 Rev D, ISO 9001:2015, and AGMA Class 12 precision gearing standards.
                      </div>

                      <h3 className="text-sm font-bold text-slate-300 pt-2">1.1 Applicable Reference Documents</h3>
                      <ul className="list-disc pl-5 text-xs space-y-1 text-slate-300">
                        <li>ASME Y14.5-2018: Dimensioning and Tolerancing Standard</li>
                        <li>AGMA 2001-D04: Fundamental Rating Factors and Calculation Methods for Involute Spur and Helical Gear Teeth</li>
                        <li>AMS 6415: Specification for Aircraft Quality Vacuum Arc Remelt (VAR) Alloy Steel</li>
                        <li>MIL-STD-810H: Environmental Engineering Considerations and Laboratory Tests</li>
                      </ul>
                    </div>
                  )}

                  {activeDocSection === 'specs' && (
                    <div className="space-y-4">
                      <h2 className="text-base font-bold text-cyan-400">2.0 Technical Specifications Matrix</h2>
                      <table className="w-full text-xs border border-slate-700/60 rounded-lg overflow-hidden">
                        <thead className="bg-slate-800 text-slate-200">
                          <tr>
                            <th className="p-2.5 text-left border-b border-slate-700">Parameter</th>
                            <th className="p-2.5 text-left border-b border-slate-700">Engineering Value</th>
                            <th className="p-2.5 text-left border-b border-slate-700">Tolerance / Unit</th>
                            <th className="p-2.5 text-left border-b border-slate-700">Verification Method</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          <tr>
                            <td className="p-2.5 font-semibold">Nominal Output Torque</td>
                            <td className="p-2.5 font-mono text-cyan-400">4,800</td>
                            <td className="p-2.5">Nm (&plusmn;5%)</td>
                            <td className="p-2.5">Dynamometer Bench Test</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold">Peak Emergency Torque</td>
                            <td className="p-2.5 font-mono text-cyan-400">7,200</td>
                            <td className="p-2.5">Nm (Max 10s)</td>
                            <td className="p-2.5">FEA Burst Simulation</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold">Maximum Input RPM</td>
                            <td className="p-2.5 font-mono text-cyan-400">6,500</td>
                            <td className="p-2.5">RPM</td>
                            <td className="p-2.5">Tachometer Op 50</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold">Gear Ratio</td>
                            <td className="p-2.5 font-mono text-cyan-400">25:1</td>
                            <td className="p-2.5">Exact Gearing</td>
                            <td className="p-2.5">Kinematic Calculation</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold">Torsional Backlash</td>
                            <td className="p-2.5 font-mono text-emerald-400">&le; 2.5</td>
                            <td className="p-2.5">Arcmin</td>
                            <td className="p-2.5">Rotary Encoder Laser Rig</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-semibold">Operating Temperature</td>
                            <td className="p-2.5 font-mono text-cyan-400">-40&deg;C to +125&deg;C</td>
                            <td className="p-2.5">Ambient Range</td>
                            <td className="p-2.5">Thermal Chamber Run</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeDocSection === 'quality' && (
                    <div className="space-y-4">
                      <h2 className="text-base font-bold text-cyan-400">3.0 Quality Sign-Off &amp; Approvals</h2>
                      <p>
                        This document has completed multi-disciplinary peer review across Systems Engineering,
                        Manufacturing Engineering, and Corporate Quality Assurance.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/40 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">Lead Design Engineer</span>
                          <div className="font-bold text-sm text-slate-200">{doc.author}</div>
                          <div className="text-[11px] text-emerald-400 font-mono">Status: Signed &bull; Verified</div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/40 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">Chief Reliability Auditor</span>
                          <div className="font-bold text-sm text-slate-200">David Kim, PE</div>
                          <div className="text-[11px] text-emerald-400 font-mono">Status: Approved</div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/40 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">VP of Engineering</span>
                          <div className="font-bold text-sm text-slate-200">Dr. Aris Thorne</div>
                          <div className="text-[11px] text-emerald-400 font-mono">Status: Released for Production</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= DFMEA RISK ASSESSMENT VIEWER ======================= */}
          {fileType === 'fmea' && (
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold flex items-center space-x-2 text-amber-400">
                    <ShieldAlert className="w-5 h-5" />
                    <span>AIAG-VDA Design Failure Mode &amp; Effects Analysis (DFMEA)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quantitative risk priority matrix for {part.partNumber} &bull; Maximum RPN Threshold: 120
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono font-bold">
                    Peak RPN: 168 (Tooth Fatigue)
                  </div>
                  <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                    Post-Mitigation Peak: 48
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700">
                    <tr>
                      <th className="p-3">Function / Item</th>
                      <th className="p-3">Potential Failure Mode</th>
                      <th className="p-3">Potential Effects</th>
                      <th className="p-3 text-center">Sev (S)</th>
                      <th className="p-3 text-center">Occ (O)</th>
                      <th className="p-3 text-center">Det (D)</th>
                      <th className="p-3 text-center font-bold text-amber-400">Initial RPN</th>
                      <th className="p-3">Recommended Mitigation</th>
                      <th className="p-3 text-center font-bold text-emerald-400">New RPN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-3 font-semibold">Sun Pinion Meshing</td>
                      <td className="p-3">High-cycle tooth root fatigue spalling</td>
                      <td className="p-3">Gear failure, loss of transmission</td>
                      <td className="p-3 text-center font-bold text-rose-400">8</td>
                      <td className="p-3 text-center font-bold text-amber-400">7</td>
                      <td className="p-3 text-center font-bold text-cyan-400">3</td>
                      <td className="p-3 text-center font-bold font-mono text-rose-400 bg-rose-500/10 rounded">
                        168
                      </td>
                      <td className="p-3 text-slate-300">Deep cryogenic hardening &amp; shot-peening to induce -800 MPa compressive stress</td>
                      <td className="p-3 text-center font-bold font-mono text-emerald-400 bg-emerald-500/10 rounded">
                        48
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Bore Shaft Fit</td>
                      <td className="p-3">Concentricity out-of-tolerance &gt;12&mu;m</td>
                      <td className="p-3">Excessive dynamic vibration, bearing wear</td>
                      <td className="p-3 text-center font-bold text-rose-400">7</td>
                      <td className="p-3 text-center font-bold text-amber-400">4</td>
                      <td className="p-3 text-center font-bold text-cyan-400">4</td>
                      <td className="p-3 text-center font-bold font-mono text-amber-400 bg-amber-500/10 rounded">
                        112
                      </td>
                      <td className="p-3 text-slate-300">Implement Renishaw in-process probe check after Op 30 precision reaming</td>
                      <td className="p-3 text-center font-bold font-mono text-emerald-400 bg-emerald-500/10 rounded">
                        28
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Lubrication Distribution</td>
                      <td className="p-3">Oil starvation in planet carrier pocket</td>
                      <td className="p-3">Thermal runaway, scuffing damage</td>
                      <td className="p-3 text-center font-bold text-rose-400">8</td>
                      <td className="p-3 text-center font-bold text-amber-400">3</td>
                      <td className="p-3 text-center font-bold text-cyan-400">4</td>
                      <td className="p-3 text-center font-bold font-mono text-amber-400 bg-amber-500/10 rounded">
                        96
                      </td>
                      <td className="p-3 text-slate-300">Add pressurized internal lubrication galley directly to carrier pin bearings</td>
                      <td className="p-3 text-center font-bold font-mono text-emerald-400 bg-emerald-500/10 rounded">
                        24
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= INSPECTION / QUALITY REPORT VIEWER ======================= */}
          {fileType === 'inspection' && (
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold flex items-center space-x-2 text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span>AS9102 First Article Inspection (FAIR) Form 3 Verification Report</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zeiss Prismo 3D Coordinate Measuring Machine (CMM) Automated Dimensional Scan
                  </p>
                </div>
                <span className="badge-status badge-active text-xs">CMM LAB CERTIFIED</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-slate-200 border-b border-slate-700">
                    <tr>
                      <th className="p-3">Char #</th>
                      <th className="p-3">Inspection Feature</th>
                      <th className="p-3">Nominal Spec</th>
                      <th className="p-3">Lower Tol</th>
                      <th className="p-3">Upper Tol</th>
                      <th className="p-3">Actual Measured</th>
                      <th className="p-3">Deviation</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-3 font-mono font-bold text-cyan-400">101</td>
                      <td className="p-3 font-semibold">Outer Gear Ring OD</td>
                      <td className="p-3 font-mono">180.000 mm</td>
                      <td className="p-3 font-mono">-0.020</td>
                      <td className="p-3 font-mono">+0.020</td>
                      <td className="p-3 font-mono font-bold text-slate-200">180.006 mm</td>
                      <td className="p-3 font-mono text-emerald-400">+0.006 mm</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          PASS
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-cyan-400">102</td>
                      <td className="p-3 font-semibold">Sun Pinion Bore Concentricity</td>
                      <td className="p-3 font-mono">0.000 mm</td>
                      <td className="p-3 font-mono">0.000</td>
                      <td className="p-3 font-mono">+0.012</td>
                      <td className="p-3 font-mono font-bold text-rose-400">0.018 mm</td>
                      <td className="p-3 font-mono text-rose-400">+0.006 mm</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          OOT / NCR
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-cyan-400">103</td>
                      <td className="p-3 font-semibold">Mounting Flange True Position</td>
                      <td className="p-3 font-mono">0.000 mm</td>
                      <td className="p-3 font-mono">0.000</td>
                      <td className="p-3 font-mono">+0.025</td>
                      <td className="p-3 font-mono font-bold text-slate-200">0.008 mm</td>
                      <td className="p-3 font-mono text-emerald-400">+0.008 mm</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          PASS
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= ROHS / REACH COMPLIANCE VIEWER ======================= */}
          {fileType === 'compliance' && (
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold flex items-center space-x-2 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span>EU RoHS &amp; REACH Environmental Material Compliance Certificate</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Directive 2011/65/EU and Regulation (EC) No 1907/2006 Declaration of Conformance
                  </p>
                </div>
                <span className="badge-status badge-active text-xs">EU CONFORMANT</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-slate-200 border-b border-slate-700">
                    <tr>
                      <th className="p-3">Regulated Chemical Substance</th>
                      <th className="p-3">CAS Number</th>
                      <th className="p-3">Permissible Max Threshold</th>
                      <th className="p-3">Lab Analysis Result</th>
                      <th className="p-3 text-center">Compliance Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-3 font-semibold">Lead (Pb)</td>
                      <td className="p-3 font-mono">7439-92-1</td>
                      <td className="p-3 font-mono">0.1% (1,000 ppm)</td>
                      <td className="p-3 font-mono text-emerald-400">&lt; 10 ppm (Not Detected)</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          COMPLIANT
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Cadmium (Cd)</td>
                      <td className="p-3 font-mono">7440-43-9</td>
                      <td className="p-3 font-mono">0.01% (100 ppm)</td>
                      <td className="p-3 font-mono text-emerald-400">&lt; 2 ppm (Not Detected)</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          COMPLIANT
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Hexavalent Chromium (Cr VI)</td>
                      <td className="p-3 font-mono">18540-29-9</td>
                      <td className="p-3 font-mono">0.1% (1,000 ppm)</td>
                      <td className="p-3 font-mono text-emerald-400">&lt; 5 ppm (Negative)</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          COMPLIANT
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Status Bar */}
        <div
          className={`px-5 py-3 border-t flex flex-wrap items-center justify-between text-xs shrink-0 ${
            isDark ? 'bg-[#111B2E] border-[#1E293B]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-4 text-slate-400">
            <span>
              Linked Part: <strong className="text-cyan-400 font-mono">{part.partNumber}</strong> ({part.name})
            </span>
            <span>
              Size: <strong className="font-mono text-slate-300">{doc.fileSize}</strong>
            </span>
            <span>
              Uploaded: <strong className="font-mono text-slate-300">{doc.uploadDate}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="btn-secondary btn-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
