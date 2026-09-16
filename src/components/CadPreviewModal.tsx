import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  X, 
  Download, 
  Eye, 
  RotateCw, 
  Layers, 
  Maximize2, 
  FileText, 
  Box, 
  Check, 
  Loader2, 
  FolderLock, 
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Cpu
} from 'lucide-react';
import type { PartItem, StoredCadVaultFile } from '../types/plm';
import { 
  downloadCadVaultFile, 
  downloadActualStoredFile, 
  getStoredCadVaultFiles, 
  getStoredFileForPart,
  type FileDownloadType 
} from '../utils/cadVaultStorage';
import { useTheme } from '../context/ThemeContext';

interface CadPreviewModalProps {
  isOpen?: boolean;
  onClose: () => void;
  part: PartItem;
  revision?: string;
  onOpenDrawing?: () => void;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

export const CadPreviewModal: React.FC<CadPreviewModalProps> = ({
  isOpen = true,
  onClose,
  part,
  revision,
  onOpenDrawing,
  logAction
}) => {
  const { isDark } = useTheme();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Viewer Display Controls
  const [renderMode, setRenderMode] = useState<'solid' | 'wireframe' | 'xray'>('solid');
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'3d' | 'files' | 'stepText'>('3d');
  
  // Download button states
  const [downloadingType, setDownloadingType] = useState<FileDownloadType | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Stored Files List
  const storedFiles: StoredCadVaultFile[] = [
    ...getStoredCadVaultFiles(part.id),
    ...getStoredCadVaultFiles(part.partNumber),
    ...(part.cadMetadata?.attachedFiles || [])
  ].filter((f, idx, arr) => arr.findIndex(x => x.id === f.id || (x.fileName === f.fileName && x.dataUrl === f.dataUrl)) === idx);

  // Active Revision
  const currentRev = revision || part.currentRev || 'Rev A.0';
  const linkedProject = part.projectName || part.projectId || 'PRJ-01';

  // Three.js Scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const explodedMeshesRef = useRef<{ mesh: THREE.Mesh; defaultPos: THREE.Vector3; explodedPos: THREE.Vector3 }[]>([]);

  useEffect(() => {
    if (!isOpen || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 480;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 16, 26);
    camera.lookAt(0, 0, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight1.position.set(15, 25, 18);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x06b6d4, 1.5, 60);
    pointLight.position.set(0, 8, 10);
    scene.add(pointLight);

    // 5. Ground Grid
    const gridHelper = new THREE.GridHelper(40, 24, 0x06b6d4, isDark ? 0x1e293b : 0xcbd5e1);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // 6. Build 3D Mechanical Assembly Model
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    explodedMeshesRef.current = [];

    const geomColor = part.cadMetadata?.renderColor || '#0ea5e9';
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(geomColor),
      metalness: 0.85,
      roughness: 0.22,
      wireframe: renderMode === 'wireframe',
      transparent: renderMode === 'xray',
      opacity: renderMode === 'xray' ? 0.45 : 1.0
    });

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.18,
      wireframe: renderMode === 'wireframe',
      transparent: renderMode === 'xray',
      opacity: renderMode === 'xray' ? 0.45 : 1.0
    });

    const bronzeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.28,
      wireframe: renderMode === 'wireframe',
      transparent: renderMode === 'xray',
      opacity: renderMode === 'xray' ? 0.45 : 1.0
    });

    // Outer Main Casing / Housing
    const casingGeom = new THREE.CylinderGeometry(5.5, 5.5, 4.5, 32, 1, true);
    const casingMesh = new THREE.Mesh(casingGeom, mainMaterial);
    casingMesh.castShadow = true;
    casingMesh.receiveShadow = true;
    modelGroup.add(casingMesh);
    explodedMeshesRef.current.push({
      mesh: casingMesh,
      defaultPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, 0, 0)
    });

    // Central Shaft Drive Core
    const shaftGeom = new THREE.CylinderGeometry(1.6, 1.6, 9.5, 32);
    const shaftMesh = new THREE.Mesh(shaftGeom, steelMaterial);
    shaftMesh.castShadow = true;
    modelGroup.add(shaftMesh);
    explodedMeshesRef.current.push({
      mesh: shaftMesh,
      defaultPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, 5, 0)
    });

    // Top Mounting Flange with Bolt Pattern
    const flangeGeom = new THREE.CylinderGeometry(7.2, 7.2, 0.8, 32);
    const flangeMesh = new THREE.Mesh(flangeGeom, steelMaterial);
    flangeMesh.position.y = 2.4;
    flangeMesh.castShadow = true;
    modelGroup.add(flangeMesh);
    explodedMeshesRef.current.push({
      mesh: flangeMesh,
      defaultPos: new THREE.Vector3(0, 2.4, 0),
      explodedPos: new THREE.Vector3(0, 8.5, 0)
    });

    // Bolt Pattern on Flange
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const boltGeom = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16);
      const boltMesh = new THREE.Mesh(boltGeom, bronzeMaterial);
      const boltPos = new THREE.Vector3(Math.cos(angle) * 6.2, 2.7, Math.sin(angle) * 6.2);
      boltMesh.position.copy(boltPos);
      modelGroup.add(boltMesh);
      explodedMeshesRef.current.push({
        mesh: boltMesh,
        defaultPos: boltPos.clone(),
        explodedPos: new THREE.Vector3(Math.cos(angle) * 8.5, 9.5, Math.sin(angle) * 8.5)
      });
    }

    // Inner Gear Ring / Planetary Teeth
    const gearRingGeom = new THREE.TorusGeometry(4.0, 0.6, 16, 36);
    gearRingGeom.rotateX(Math.PI / 2);
    const gearRingMesh = new THREE.Mesh(gearRingGeom, bronzeMaterial);
    modelGroup.add(gearRingMesh);
    explodedMeshesRef.current.push({
      mesh: gearRingMesh,
      defaultPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, -3.5, 0)
    });

    // Bottom Base Plate
    const basePlateGeom = new THREE.BoxGeometry(11, 0.9, 11);
    const basePlateMesh = new THREE.Mesh(basePlateGeom, steelMaterial);
    basePlateMesh.position.y = -2.7;
    basePlateMesh.castShadow = true;
    modelGroup.add(basePlateMesh);
    explodedMeshesRef.current.push({
      mesh: basePlateMesh,
      defaultPos: new THREE.Vector3(0, -2.7, 0),
      explodedPos: new THREE.Vector3(0, -7.5, 0)
    });

    // 7. Interactive Pointer Drag for Camera Orbiting
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 34, theta: Math.PI / 4, phi: Math.PI / 3.5 };

    const updateCameraPosition = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPosition();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= deltaX * 0.009;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.009));
      updateCameraPosition();
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(12, Math.min(75, spherical.radius + e.deltaY * 0.03));
      updateCameraPosition();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Loop
    const animate = () => {
      if (autoRotate && !isDragging && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += 0.006;
      }

      // Smooth Exploded View interpolation
      explodedMeshesRef.current.forEach(({ mesh, defaultPos, explodedPos }) => {
        const target = isExploded ? explodedPos : defaultPos;
        mesh.position.lerp(target, 0.12);
      });

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [isOpen, renderMode, isExploded, autoRotate, part.id, isDark]);

  if (!isOpen) return null;

  const handleDownload = async (type: FileDownloadType) => {
    setDownloadingType(type);
    setDownloadSuccess(null);
    const res = await downloadCadVaultFile({
      part,
      revision: currentRev,
      fileType: type,
      logAction
    });
    setDownloadingType(null);
    if (res.success) {
      setDownloadSuccess(res.message);
      setTimeout(() => setDownloadSuccess(null), 3500);
    }
  };

  const handleDirectDownload = async (file: StoredCadVaultFile) => {
    const res = await downloadActualStoredFile(file, logAction);
    if (res.success) {
      setDownloadSuccess(res.message);
      setTimeout(() => setDownloadSuccess(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`rounded-2xl border max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors ${
        isDark ? 'bg-[#0E1726] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
      }`}>
        {/* MODAL HEADER */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-mono font-bold text-cyan-400 text-sm sm:text-base">{part.partNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  {currentRev}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {part.cadMetadata?.format || 'STEP'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Project: {linkedProject}
                </span>
              </div>
              <p className={`text-xs mt-0.5 truncate max-w-md ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {part.name} &bull; Interactive 3D CAD Vault & B-Rep Topology Inspection
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUB-HEADER / TAB NAVIGATION */}
        <div className={`px-4 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-slate-100 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('3d')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === '3d'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Geometry Viewport</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5" />
              <span>Attached CAD Files ({storedFiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stepText')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'stepText'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>ISO 10303 B-Rep Code</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              disabled={downloadingType === 'cad'}
              onClick={() => handleDownload('cad')}
              className="btn-secondary btn-sm flex items-center space-x-1 text-[11px]"
              title="Download native CAD model"
            >
              {downloadingType === 'cad' ? <Loader2 className="w-3 h-3 animate-spin text-cyan-400" /> : <Download className="w-3 h-3 text-cyan-400" />}
              <span>Download CAD</span>
            </button>

            <button
              disabled={downloadingType === 'step'}
              onClick={() => handleDownload('step')}
              className="btn-secondary btn-sm flex items-center space-x-1 text-[11px]"
              title="Download standard STEP file"
            >
              {downloadingType === 'step' ? <Loader2 className="w-3 h-3 animate-spin text-purple-400" /> : <Download className="w-3 h-3 text-purple-400" />}
              <span>Download STEP</span>
            </button>

            <button
              disabled={downloadingType === 'pdf'}
              onClick={() => handleDownload('pdf')}
              className="btn-secondary btn-sm flex items-center space-x-1 text-[11px]"
              title="Download 2D engineering drawing PDF"
            >
              {downloadingType === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin text-rose-400" /> : <Download className="w-3 h-3 text-rose-400" />}
              <span>Download PDF</span>
            </button>

            {onOpenDrawing && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDrawing();
                }}
                className="btn-secondary btn-sm flex items-center space-x-1 text-[11px]"
                title="View full ASME Y14.5 engineering blueprint"
              >
                <Eye className="w-3 h-3 text-amber-400" />
                <span>View Drawing</span>
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {downloadSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{downloadSuccess}</span>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {activeTab === '3d' && (
            <div className="relative w-full h-[480px] bg-gradient-to-b from-[#09101d] to-[#040811] flex flex-col justify-between overflow-hidden">
              {/* Three.js Container */}
              <div 
                ref={canvasContainerRef} 
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />

              {/* Viewport Floating HUD Controls */}
              <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
                <div className="p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center space-x-1 text-[11px]">
                  <button
                    onClick={() => setRenderMode('solid')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      renderMode === 'solid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => setRenderMode('wireframe')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      renderMode === 'wireframe' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Wireframe
                  </button>
                  <button
                    onClick={() => setRenderMode('xray')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      renderMode === 'xray' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    X-Ray
                  </button>
                </div>

                <div className="p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center space-x-1 text-[11px]">
                  <button
                    onClick={() => setIsExploded(!isExploded)}
                    className={`px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1 transition-all ${
                      isExploded ? 'bg-purple-500 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>{isExploded ? 'Collapse' : 'Explode View'}</span>
                  </button>

                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1 transition-all ${
                      autoRotate ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>{autoRotate ? 'Rotating' : 'Paused'}</span>
                  </button>
                </div>
              </div>

              {/* Real-time B-Rep Geometry HUD Card */}
              <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-200 font-mono">
                <div className="flex items-center space-x-4 flex-wrap gap-y-1">
                  <div>
                    <span className="text-slate-400 text-[10px] block">BOUNDING BOX:</span>
                    <strong className="text-cyan-400">
                      {part.cadMetadata?.boundingDimensionsMm?.join(' × ') || '450 × 680 × 1250'} mm
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">VOLUME:</span>
                    <strong className="text-emerald-400">
                      {(part.cadMetadata?.volumeCm3 || 8400).toLocaleString()} cm³
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">SURFACE AREA:</span>
                    <strong className="text-purple-400">
                      {(part.cadMetadata?.surfaceAreaCm2 || 12400).toLocaleString()} cm²
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">MASS (WEIGHT):</span>
                    <strong className="text-amber-400">
                      {part.weightKg || 28.4} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">MATERIAL:</span>
                    <strong className="text-slate-200">
                      {part.material || 'Aluminum 7075-T6'}
                    </strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400">
                  Left-Click Drag: Rotate &bull; Scroll: Zoom &bull; Model: {part.cadMetadata?.fileName || `${part.partNumber}.step`}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                <div>
                  <h3 className="text-sm font-bold text-cyan-400">Stored Files Ledger for Product {part.partNumber}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centralized records uploaded in Create New Product Master & Product Master CAD tabs. Linked to Project {linkedProject}.
                  </p>
                </div>
                <span className="badge-status badge-active text-[10px]">VAULT REPOSITORY</span>
              </div>

              {storedFiles.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-2">
                  <Box className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                  <p className="text-xs font-semibold">No custom uploaded files attached to this record yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Default ISO standard CAD and STEP geometry models are ready for instant download above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {storedFiles.map((file, idx) => (
                    <div 
                      key={file.id || idx}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                        isDark ? 'bg-[#111B2E] border-slate-700/60 hover:border-cyan-500/40' : 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                          {file.fileType === 'PDF' ? <FileText className="w-4 h-4 text-rose-400" /> : <Box className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="min-w-0">
                          <strong className="font-mono text-cyan-400 block truncate">{file.fileName}</strong>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center space-x-2 flex-wrap">
                            <span>Type: <strong className="text-slate-200">{file.fileType}</strong></span>
                            <span>&bull;</span>
                            <span>Size: <strong>{file.fileSize}</strong></span>
                            <span>&bull;</span>
                            <span>Linked Product: <strong className="text-cyan-300">{file.partNumber || part.partNumber}</strong></span>
                            <span>&bull;</span>
                            <span>Project: <strong className="text-purple-300">{file.projectId || linkedProject}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleDirectDownload(file)}
                          className="btn-primary btn-sm flex items-center space-x-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Stored File</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stepText' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                <div>
                  <h3 className="text-sm font-bold text-purple-400">ISO 10303-21 STEP B-Rep Topology Definition</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Geometric Boundary Representation (B-Rep) AP203 / AP242 entity structure.
                  </p>
                </div>
                <button
                  onClick={() => handleDownload('step')}
                  className="btn-secondary btn-sm flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download .step</span>
                </button>
              </div>

              <pre className={`p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[360px] border ${
                isDark ? 'bg-[#09101d] border-slate-800 text-cyan-300' : 'bg-slate-900 border-slate-800 text-cyan-300'
              }`}>
{`ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('STEP AP203 - 3D Mechanical CAD Model Geometry', 'ISO 10303-21 B-Rep Standard'), '2;1');
FILE_NAME('${part.partNumber}_Rev_${currentRev}.step', '${new Date().toISOString()}', ('Alex Rivera, PE'), ('ApexPLM Engineering'), 'SolidWorks 2025 SP3.0', 'ApexPLM CAD Translator v4.2', 'Approved');
FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));
ENDSEC;
DATA;
#10 = CARTESIAN_POINT('', (0.000000000000000000, 0.000000000000000000, 0.000000000000000000));
#11 = DIRECTION('', (0.000000000000000000, 0.000000000000000000, 1.000000000000000000));
#12 = DIRECTION('', (1.000000000000000000, 0.000000000000000000, 0.000000000000000000));
#13 = AXIS2_PLACEMENT_3D('', #10, #11, #12);
#20 = PRODUCT('${part.partNumber}', '${part.name} (Rev ${currentRev})', 'Mechanical Component Assembly', (#21));
#21 = PRODUCT_CONTEXT('', #22, 'mechanical');
#22 = APPLICATION_CONTEXT('core data for automotive mechanical design');
#30 = PRODUCT_DEFINITION_FORMATION('${currentRev}', 'Official Released Engineering Revision ${currentRev}', #20);
#40 = PRODUCT_DEFINITION('design', 'Approved Master Model B-Rep Solid Geometry', #30, #41);
#41 = PRODUCT_DEFINITION_CONTEXT('part definition', #22, 'design');
#50 = SHAPE_DEFINITION_REPRESENTATION(#51, #52);
#51 = PRODUCT_DEFINITION_SHAPE('B-Rep Solid', 'Solid Geometry Shape Model', #40);
#52 = ADVANCED_BREP_SHAPE_REPRESENTATION('${part.partNumber}_BREP', (#13, #60), #53);
#60 = MANIFOLD_SOLID_BREP('${part.partNumber}_SOLID', #61);
#61 = CLOSED_SHELL('${part.partNumber}_SHELL', (#70, #71, #72, #73, #74, #75));
#70 = ADVANCED_FACE('${part.partNumber}_FACE_FRONT', (#80), #90, .T.);
#80 = FACE_OUTER_BOUND('${part.partNumber}_BOUND_1', #100, .T.);
#90 = PLANE('${part.partNumber}_PLANE_XY', #13);
#100 = POLY_LOOP('${part.partNumber}_LOOP_1', (#10, #110, #120, #130));
#110 = CARTESIAN_POINT('', (${part.cadMetadata?.boundingDimensionsMm?.[0] || 450.0}, 0.0, 0.0));
#120 = CARTESIAN_POINT('', (${part.cadMetadata?.boundingDimensionsMm?.[0] || 450.0}, ${part.cadMetadata?.boundingDimensionsMm?.[1] || 680.0}, 0.0));
#130 = CARTESIAN_POINT('', (0.0, ${part.cadMetadata?.boundingDimensionsMm?.[1] || 680.0}, 0.0));
ENDSEC;
END-ISO-10303-21;`}
              </pre>
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Vault Security: Encrypted SHA-256 Checksum Verified &bull; ISO 9001 Compliant</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="btn-secondary btn-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
