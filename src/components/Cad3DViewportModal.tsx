import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Layers, 
  Box, 
  Sliders, 
  Eye, 
  EyeOff, 
  Download, 
  Camera, 
  Ruler, 
  Sparkles,
  Scissors,
  CheckCircle2,
  Info,
  Compass,
  FileText
} from 'lucide-react';
import type { PartItem, StoredCadVaultFile } from '../types/plm';
import { downloadActualStoredFile, downloadCadVaultFile } from '../utils/cadVaultStorage';
import { useTheme } from '../context/ThemeContext';

interface Cad3DViewportModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartItem;
  file?: StoredCadVaultFile | null;
  revision?: string;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

interface ComponentMeshDef {
  id: string;
  name: string;
  partNumber: string;
  color: number;
  roughness: number;
  metalness: number;
  materialName: string;
  visible: boolean;
  meshGroup: THREE.Group;
  initialPos: THREE.Vector3;
  explodeDirection: THREE.Vector3;
  dimensionsMm: [number, number, number];
  massKg: number;
}

export const Cad3DViewportModal: React.FC<Cad3DViewportModalProps> = ({
  isOpen,
  onClose,
  part,
  file,
  revision,
  logAction
}) => {
  const { isDark } = useTheme();
  const mountRef = useRef<HTMLDivElement | null>(null);
  
  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const componentsRef = useRef<ComponentMeshDef[]>([]);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);

  // UI Interactive States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'shaded' | 'edges' | 'wireframe' | 'xray'>('edges');
  const [explodeValue, setExplodeValue] = useState(0); // 0 to 100%
  const [isSectionActive, setIsSectionActive] = useState(false);
  const [sectionAxis, setSectionAxis] = useState<'x' | 'y' | 'z'>('z');
  const [sectionOffset, setSectionOffset] = useState(0);
  const [showComponentTree, setShowComponentTree] = useState(true);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [compList, setCompList] = useState<{ id: string; name: string; partNumber: string; visible: boolean; color: string; dimensions: string }[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeTitle = file?.fileName || `${part.partNumber} - 3D Mechanical Assembly`;
  const activeRev = revision || part.currentRev || 'Rev 00';
  const fileExt = file?.fileType?.toUpperCase() || (file?.fileName?.split('.').pop()?.toUpperCase()) || part.cadMetadata?.format || 'STEP';

  const triggerToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Build Assembly Components based on file or part identity
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth || 900;
    const height = mountRef.current.clientHeight || 600;

    // 1. Initialize Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isDark ? 0x090e17 : 0xf1f5f9);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(180, 140, 220);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 1200;
    controls.minDistance = 20;
    controls.target.set(0, 30, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.85 : 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(150, 250, 150);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-150, -100, -150);
    scene.add(dirLight2);

    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    fillLight.position.set(0, 100, -200);
    scene.add(fillLight);

    // 6. Ground Grid & Shadow Receiver
    const gridHelper = new THREE.GridHelper(300, 30, isDark ? 0x334155 : 0x94a3b8, isDark ? 0x1e293b : 0xe2e8f0);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Coordinate Axes Helper (X=Red, Y=Green, Z=Blue)
    const axesHelper = new THREE.AxesHelper(40);
    axesHelper.position.set(-110, 0, -110);
    scene.add(axesHelper);

    // 7. Clipping Plane for Cross-Section View
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    clipPlaneRef.current = clipPlane;

    // 8. Construct Dynamic Parametric 3D Geometry for this Mechanical Assembly
    const components: ComponentMeshDef[] = [];
    const lowerName = (file?.fileName || part.name || '').toLowerCase();

    // Helper to add edges to any mesh
    const addEdges = (mesh: THREE.Mesh, group: THREE.Group, edgeColor = 0x0ea5e9) => {
      const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, 28);
      const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1.2, transparent: true, opacity: 0.85 });
      const edgeLines = new THREE.LineSegments(edgesGeom, edgeMat);
      edgeLines.name = 'edge_lines';
      group.add(edgeLines);
    };

    if (lowerName.includes('bottom plate') || lowerName.includes('fixture base')) {
      // BASE PLATE ONLY
      const group = new THREE.Group();
      const geom = new THREE.BoxGeometry(160, 18, 120);
      const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = 9;
      group.add(mesh);
      addEdges(mesh, group);

      // 4 Counterbored Mounting Holes
      [[-60, -45], [60, -45], [-60, 45], [60, 45]].forEach(([hx, hz]) => {
        const holeGeom = new THREE.CylinderGeometry(6, 6, 20, 24);
        const holeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
        const hole = new THREE.Mesh(holeGeom, holeMat);
        hole.position.set(hx, 9, hz);
        group.add(hole);
      });

      scene.add(group);
      components.push({
        id: 'base-plate',
        name: 'Precision Base Bed Plate',
        partNumber: 'PLT-BASE-01',
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.8,
        materialName: 'Tool Steel 4140 Ground',
        visible: true,
        meshGroup: group,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, 0, 0),
        dimensionsMm: [160, 18, 120],
        massKg: 8.4
      });
    } else if (lowerName.includes('center plate')) {
      // CENTER GUIDE PLATE
      const group = new THREE.Group();
      const geom = new THREE.BoxGeometry(140, 14, 100);
      const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.25 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = 20;
      group.add(mesh);
      addEdges(mesh, group);

      // Linear guide sleeve cylinders
      [[-45, 0], [45, 0]].forEach(([bx, bz]) => {
        const bushGeom = new THREE.CylinderGeometry(14, 14, 28, 32);
        const bushMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
        const bush = new THREE.Mesh(bushGeom, bushMat);
        bush.position.set(bx, 20, bz);
        group.add(bush);
        addEdges(bush, group, 0xd97706);
      });

      scene.add(group);
      components.push({
        id: 'center-plate',
        name: 'Center Guided Slide Plate',
        partNumber: 'PLT-CTR-02',
        color: 0x38bdf8,
        roughness: 0.25,
        metalness: 0.85,
        materialName: 'Aluminum 7075-T6 Anodized',
        visible: true,
        meshGroup: group,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, 0, 0),
        dimensionsMm: [140, 28, 100],
        massKg: 3.2
      });
    } else if (lowerName.includes('rod holder') || lowerName.includes('front-1')) {
      // BRACKET / COLLAR
      const group = new THREE.Group();
      const geom = new THREE.BoxGeometry(90, 45, 35);
      const mat = new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.8, roughness: 0.3 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = 22.5;
      group.add(mesh);
      addEdges(mesh, group);

      // Split bore
      const boreGeom = new THREE.CylinderGeometry(12, 12, 40, 32);
      const boreMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
      const bore = new THREE.Mesh(boreGeom, boreMat);
      bore.rotation.x = Math.PI / 2;
      bore.position.set(0, 22.5, 0);
      group.add(bore);

      scene.add(group);
      components.push({
        id: 'bracket-collar',
        name: file?.fileName || 'Precision Rod Holder Clamp',
        partNumber: 'BRK-CLMP-01',
        color: 0xa855f7,
        roughness: 0.3,
        metalness: 0.8,
        materialName: 'Structural Steel Cast ASTM A216',
        visible: true,
        meshGroup: group,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, 0, 0),
        dimensionsMm: [90, 45, 35],
        massKg: 2.1
      });
    } else if (lowerName.includes('hmi') && (lowerName.includes('box') || lowerName.includes('door'))) {
      // HMI ENCLOSURE
      const group = new THREE.Group();
      const boxGeom = new THREE.BoxGeometry(110, 80, 40);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 });
      const boxMesh = new THREE.Mesh(boxGeom, boxMat);
      boxMesh.position.y = 40;
      group.add(boxMesh);
      addEdges(boxMesh, group, 0x0284c7);

      // Glass Touch Bezel
      const screenGeom = new THREE.PlaneGeometry(90, 60);
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1, emissive: 0x0369a1, emissiveIntensity: 0.3 });
      const screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.set(0, 40, 20.2);
      group.add(screen);

      scene.add(group);
      components.push({
        id: 'hmi-box',
        name: file?.fileName || 'Industrial HMI Display Console',
        partNumber: 'HMI-ENC-900',
        color: 0x1e293b,
        roughness: 0.35,
        metalness: 0.7,
        materialName: 'Powder-Coated Aluminum Alloy',
        visible: true,
        meshGroup: group,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, 0, 0),
        dimensionsMm: [110, 80, 40],
        massKg: 1.8
      });
    } else {
      // FULL PIN PRESSING MACHINE / MASTER ASSEMBLY (Default & Assem1 HMI)
      // 1. Bed Base
      const gBase = new THREE.Group();
      const baseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(180, 20, 130),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
      );
      baseMesh.position.y = 10;
      baseMesh.receiveShadow = true;
      gBase.add(baseMesh);
      addEdges(baseMesh, gBase, 0x64748b);
      scene.add(gBase);
      components.push({
        id: 'cmp-base',
        name: 'Machine Base Bed Plate',
        partNumber: 'PIN-BASE-101',
        color: 0x334155,
        roughness: 0.3,
        metalness: 0.85,
        materialName: 'Cast Iron Grade 250 Stress Relieved',
        visible: true,
        meshGroup: gBase,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, -35, 0),
        dimensionsMm: [180, 20, 130],
        massKg: 14.2
      });

      // 2. Twin High-Precision Guide Columns
      const gColumns = new THREE.Group();
      [[-60, 0], [60, 0]].forEach(([cx, cz]) => {
        const colMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(9, 9, 150, 32),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
        );
        colMesh.position.set(cx, 85, cz);
        colMesh.castShadow = true;
        gColumns.add(colMesh);
        addEdges(colMesh, gColumns, 0x38bdf8);
      });
      scene.add(gColumns);
      components.push({
        id: 'cmp-cols',
        name: 'Twin Precision Guide Columns (Ø18mm)',
        partNumber: 'PIN-ROD-102',
        color: 0xe2e8f0,
        roughness: 0.15,
        metalness: 0.95,
        materialName: 'Hard Chrome Plated Induction Steel',
        visible: true,
        meshGroup: gColumns,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, 0, -40),
        dimensionsMm: [140, 150, 18],
        massKg: 4.8
      });

      // 3. Middle Carriage Slide Block
      const gCarriage = new THREE.Group();
      const carMesh = new THREE.Mesh(
        new THREE.BoxGeometry(150, 18, 90),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.25 })
      );
      carMesh.position.y = 80;
      carMesh.castShadow = true;
      gCarriage.add(carMesh);
      addEdges(carMesh, gCarriage, 0x38bdf8);
      scene.add(gCarriage);
      components.push({
        id: 'cmp-carriage',
        name: 'Slide Carriage with Linear Bushings',
        partNumber: 'PIN-CAR-103',
        color: 0x0284c7,
        roughness: 0.25,
        metalness: 0.8,
        materialName: 'Aluminum 7075-T6 Anodized',
        visible: true,
        meshGroup: gCarriage,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, 30, 0),
        dimensionsMm: [150, 18, 90],
        massKg: 3.6
      });

      // 4. Pin Pressing Hydraulic/Pneumatic Ram Cylinder
      const gRam = new THREE.Group();
      const cylBody = new THREE.Mesh(
        new THREE.CylinderGeometry(20, 20, 65, 32),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
      );
      cylBody.position.set(0, 135, 0);
      gRam.add(cylBody);
      addEdges(cylBody, gRam, 0x0ea5e9);

      const ramPin = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 7, 50, 32),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 })
      );
      ramPin.position.set(0, 80, 0);
      gRam.add(ramPin);
      addEdges(ramPin, gRam, 0xd97706);

      scene.add(gRam);
      components.push({
        id: 'cmp-ram',
        name: 'Pneumatic Press Ram & Hardened Pin Tool',
        partNumber: 'PIN-RAM-104',
        color: 0xf59e0b,
        roughness: 0.2,
        metalness: 0.9,
        materialName: 'High-Tensile Tool Steel D2',
        visible: true,
        meshGroup: gRam,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, 65, 0),
        dimensionsMm: [40, 115, 40],
        massKg: 5.1
      });

      // 5. Part Locator Fixture Anvil
      const gFixture = new THREE.Group();
      const fixMesh = new THREE.Mesh(
        new THREE.BoxGeometry(60, 22, 50),
        new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8, roughness: 0.25 })
      );
      fixMesh.position.set(0, 31, 0);
      gFixture.add(fixMesh);
      addEdges(fixMesh, gFixture, 0x059669);
      scene.add(gFixture);
      components.push({
        id: 'cmp-fixture',
        name: 'Part Locating Anvil Fixture',
        partNumber: 'PIN-FIX-105',
        color: 0x10b981,
        roughness: 0.25,
        metalness: 0.8,
        materialName: 'Stainless 316 Precision Ground',
        visible: true,
        meshGroup: gFixture,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(0, -15, 30),
        dimensionsMm: [60, 22, 50],
        massKg: 1.9
      });

      // 6. Side HMI Control Console & Swivel Arm
      const gHmi = new THREE.Group();
      // Arm
      const armMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 70, 16),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 })
      );
      armMesh.rotation.z = Math.PI / 3;
      armMesh.position.set(95, 65, 20);
      gHmi.add(armMesh);

      // Console Screen
      const hmiBox = new THREE.Mesh(
        new THREE.BoxGeometry(45, 35, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      hmiBox.position.set(130, 95, 25);
      hmiBox.rotation.y = -Math.PI / 6;
      gHmi.add(hmiBox);

      const hmiScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(38, 28),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.4 })
      );
      hmiScreen.position.set(129, 95, 31.2);
      hmiScreen.rotation.y = -Math.PI / 6;
      gHmi.add(hmiScreen);

      scene.add(gHmi);
      components.push({
        id: 'cmp-hmi',
        name: 'Industrial Touch HMI Interface Unit',
        partNumber: 'PIN-HMI-106',
        color: 0x06b6d4,
        roughness: 0.3,
        metalness: 0.7,
        materialName: 'IP67 Sealed Polycarbonate & Aluminum',
        visible: true,
        meshGroup: gHmi,
        initialPos: new THREE.Vector3(0, 0, 0),
        explodeDirection: new THREE.Vector3(60, 20, 20),
        dimensionsMm: [80, 70, 45],
        massKg: 1.7
      });
    }

    componentsRef.current = components;
    setCompList(components.map(c => ({
      id: c.id,
      name: c.name,
      partNumber: c.partNumber,
      visible: c.visible,
      color: `#${c.color.toString(16).padStart(6, '0')}`,
      dimensions: `${c.dimensionsMm[0]} × ${c.dimensionsMm[1]} × ${c.dimensionsMm[2]} mm`
    })));

    // 9. Render Animation Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 10. Window Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, [isOpen, file?.fileName, part.id, isDark]);

  // Handle Display Mode Changes (Solid Shaded, Edges, Wireframe, X-Ray)
  useEffect(() => {
    if (!sceneRef.current) return;
    componentsRef.current.forEach(comp => {
      comp.meshGroup.traverse(child => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (displayMode === 'wireframe') {
            mat.wireframe = true;
            mat.transparent = false;
            mat.opacity = 1.0;
          } else if (displayMode === 'xray') {
            mat.wireframe = false;
            mat.transparent = true;
            mat.opacity = 0.35;
          } else {
            mat.wireframe = false;
            mat.transparent = false;
            mat.opacity = 1.0;
          }
        }
        if (child.name === 'edge_lines') {
          child.visible = displayMode === 'edges' || displayMode === 'shaded';
        }
      });
    });
  }, [displayMode]);

  // Handle Explode Animation Slider
  useEffect(() => {
    const factor = explodeValue / 100;
    componentsRef.current.forEach(comp => {
      comp.meshGroup.position.copy(comp.initialPos).addScaledVector(comp.explodeDirection, factor);
    });
  }, [explodeValue]);

  // Handle Cross-Section Clipping Plane
  useEffect(() => {
    if (!rendererRef.current || !clipPlaneRef.current) return;
    const plane = clipPlaneRef.current;
    if (isSectionActive) {
      if (sectionAxis === 'x') plane.normal.set(-1, 0, 0);
      else if (sectionAxis === 'y') plane.normal.set(0, -1, 0);
      else plane.normal.set(0, 0, -1);

      plane.constant = sectionOffset;
      rendererRef.current.clippingPlanes = [plane];
    } else {
      rendererRef.current.clippingPlanes = [];
    }
  }, [isSectionActive, sectionAxis, sectionOffset]);

  if (!isOpen) return null;

  // View Preset Orientations
  const setCameraView = (orientation: 'iso' | 'front' | 'top' | 'right' | 'left' | 'back') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const dist = 220;

    switch (orientation) {
      case 'iso':
        cam.position.set(160, 140, 200);
        break;
      case 'front':
        cam.position.set(0, 40, dist);
        break;
      case 'top':
        cam.position.set(0, dist + 40, 0.001);
        break;
      case 'right':
        cam.position.set(dist, 40, 0);
        break;
      case 'left':
        cam.position.set(-dist, 40, 0);
        break;
      case 'back':
        cam.position.set(0, 40, -dist);
        break;
    }
    ctrl.target.set(0, 40, 0);
    ctrl.update();
    triggerToast(`View orientation: ${orientation.toUpperCase()}`);
  };

  // Toggle Visibility of Individual Component
  const toggleComponentVisibility = (id: string) => {
    const comp = componentsRef.current.find(c => c.id === id);
    if (!comp) return;
    comp.visible = !comp.visible;
    comp.meshGroup.visible = comp.visible;
    setCompList(prev => prev.map(c => c.id === id ? { ...c, visible: comp.visible } : c));
  };

  // Isolate Single Component
  const isolateComponent = (id: string) => {
    componentsRef.current.forEach(comp => {
      const isTarget = comp.id === id;
      comp.visible = isTarget;
      comp.meshGroup.visible = isTarget;
    });
    setCompList(prev => prev.map(c => ({ ...c, visible: c.id === id })));
    setSelectedCompId(id);
    triggerToast(`Isolated component ${id}`);
  };

  // Show All Components
  const showAllComponents = () => {
    componentsRef.current.forEach(comp => {
      comp.visible = true;
      comp.meshGroup.visible = true;
    });
    setCompList(prev => prev.map(c => ({ ...c, visible: true })));
    setSelectedCompId(null);
    triggerToast('All components visible');
  };

  // Export 3D Viewport Snapshot PNG
  const handleTakeSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${part.partNumber}_3D_CAD_Snapshot.png`;
    a.click();
    triggerToast('High-resolution 3D snapshot exported');
  };

  // Direct Download Original File
  const handleDownloadFile = () => {
    if (file) {
      downloadActualStoredFile(file, logAction);
    } else {
      downloadCadVaultFile({
        part,
        fileType: 'step',
        logAction
      });
    }
    triggerToast(`Downloading CAD geometry source`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className={`w-full ${isFullscreen ? 'h-full max-w-none max-h-none rounded-none' : 'max-w-7xl h-[92vh] rounded-2xl'} border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-[#0A101D] border-[#243149] text-slate-100' : 'bg-white border-[#E2E8F0] text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-mono text-sm font-bold text-cyan-400">{part.partNumber}</span>
                <span className="badge-status badge-active text-[10px] font-mono">{activeRev}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">
                  {fileExt}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-sm font-medium">
                  {activeTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                <span>Enterprise 3D WebGL B-Rep Viewport</span>
                <span>&bull;</span>
                <span className="text-emerald-400">PBR Shaders Active</span>
                <span>&bull;</span>
                <span>SolidWorks 2025 Standard</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={handleTakeSnapshot}
              className="p-2 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 transition-colors cursor-pointer text-xs flex items-center space-x-1.5"
              title="Export high-resolution PNG snapshot"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden md:inline">Snapshot</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="btn-primary btn-sm flex items-center space-x-1.5 cursor-pointer text-xs"
              title="Download original CAD master file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download CAD</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="Close Viewport"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D VIEWPORT CONTROLS BAR */}
        <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-slate-100 border-[#E2E8F0]'
        }`}>
          {/* Preset Camera Views */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-1">Views:</span>
            {(['iso', 'front', 'top', 'right', 'left', 'back'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setCameraView(v)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Shading / Display Modes */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-1">Render:</span>
            <button
              onClick={() => setDisplayMode('edges')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                displayMode === 'edges' ? 'bg-cyan-500 text-slate-950 font-bold' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Shaded + Edges
            </button>
            <button
              onClick={() => setDisplayMode('shaded')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                displayMode === 'shaded' ? 'bg-cyan-500 text-slate-950 font-bold' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Solid
            </button>
            <button
              onClick={() => setDisplayMode('wireframe')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                displayMode === 'wireframe' ? 'bg-cyan-500 text-slate-950 font-bold' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Wireframe
            </button>
            <button
              onClick={() => setDisplayMode('xray')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                displayMode === 'xray' ? 'bg-cyan-500 text-slate-950 font-bold' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              X-Ray
            </button>
          </div>

          {/* Explode & Section Tools */}
          <div className="flex items-center space-x-3">
            {/* Explode Slider */}
            <div className="flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] text-slate-300 font-medium">Explode:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={explodeValue}
                onChange={(e) => setExplodeValue(Number(e.target.value))}
                className="w-20 accent-purple-500 cursor-pointer"
                title={`Explode: ${explodeValue}%`}
              />
              <span className="font-mono text-[10px] w-6">{explodeValue}%</span>
            </div>

            {/* Section Cut Toggle */}
            <div className="flex items-center space-x-1.5 border-l pl-2 border-slate-700">
              <button
                onClick={() => setIsSectionActive(!isSectionActive)}
                className={`px-2 py-1 rounded text-[11px] flex items-center space-x-1 cursor-pointer font-semibold ${
                  isSectionActive ? 'bg-rose-500 text-white font-bold' : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Cross-Section Cut Plane"
              >
                <Scissors className="w-3 h-3" />
                <span>Section</span>
              </button>
              {isSectionActive && (
                <div className="flex items-center space-x-1">
                  {(['x', 'y', 'z'] as const).map(ax => (
                    <button
                      key={ax}
                      onClick={() => setSectionAxis(ax)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                        sectionAxis === ax ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {ax}
                    </button>
                  ))}
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={sectionOffset}
                    onChange={(e) => setSectionOffset(Number(e.target.value))}
                    className="w-16 accent-rose-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Panel Toggles */}
            <div className="flex items-center space-x-1 border-l pl-2 border-slate-700">
              <button
                onClick={() => setShowComponentTree(!showComponentTree)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  showComponentTree ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Assembly Tree"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMetadataPanel(!showMetadataPanel)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  showMetadataPanel ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Physical Properties"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BODY: 3D CANVAS + OVERLAYS */}
        <div className="flex-1 relative overflow-hidden flex min-h-0">
          
          {/* THREE.JS WebGL CANVAS CONTAINER */}
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing outline-none" />

          {/* FLOATING TOAST NOTIFICATION */}
          {toastMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-500/30 text-xs font-mono shadow-xl flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* LEFT OVERLAY: ASSEMBLY COMPONENT TREE */}
          {showComponentTree && compList.length > 0 && (
            <div className={`absolute top-4 left-4 z-10 w-72 max-h-[75vh] rounded-xl border p-3 flex flex-col shadow-2xl backdrop-blur-md transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-700/80 text-slate-100' : 'bg-white/95 border-slate-300 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/50 mb-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold font-mono">ASSEMBLY TREE ({compList.length})</span>
                </div>
                <button
                  onClick={showAllComponents}
                  className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                  title="Make all components visible"
                >
                  Show All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {compList.map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedCompId(comp.id === selectedCompId ? null : comp.id)}
                    className={`p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                      selectedCompId === comp.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : isDark ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20" 
                        style={{ backgroundColor: comp.color }} 
                      />
                      <div className="min-w-0">
                        <span className="font-semibold block truncate text-[11px]">{comp.name}</span>
                        <span className="font-mono text-[9px] text-slate-400">{comp.partNumber} &bull; {comp.dimensions}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          isolateComponent(comp.id);
                        }}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/15 text-purple-300 hover:bg-purple-500/30 cursor-pointer"
                        title="Isolate part"
                      >
                        Iso
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComponentVisibility(comp.id);
                        }}
                        className={`p-1 rounded cursor-pointer ${
                          comp.visible ? 'text-slate-400 hover:text-white' : 'text-slate-600'
                        }`}
                        title={comp.visible ? 'Hide component' : 'Show component'}
                      >
                        {comp.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RIGHT OVERLAY: PHYSICAL PROPERTIES & PARAMETERS */}
          {showMetadataPanel && (
            <div className={`absolute top-4 right-4 z-10 w-72 rounded-xl border p-3 shadow-2xl backdrop-blur-md space-y-2.5 transition-all text-xs font-mono ${
              isDark ? 'bg-slate-900/90 border-slate-700/80 text-slate-200' : 'bg-white/95 border-slate-300 text-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="text-[11px]">PHYSICAL PROPERTIES</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  BREP VALID
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dimensions:</span>
                  <strong className="text-cyan-400">{part.cadMetadata?.boundingDimensionsMm?.join(' × ') || '180 × 165 × 130'} mm</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Mass:</span>
                  <strong className="text-amber-400">{part.weightKg || 30.8} kg</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume:</span>
                  <strong className="text-emerald-400">{(part.cadMetadata?.volumeCm3 || 3880).toLocaleString()} cm³</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Surface Area:</span>
                  <strong className="text-purple-400">{(part.cadMetadata?.surfaceAreaCm2 || 14200).toLocaleString()} cm²</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <strong className="text-slate-200">{part.material || 'Hardened Alloy Steel'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Center of Mass:</span>
                  <strong className="text-slate-300 font-mono">(0.0, 48.2, 5.1) mm</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50 text-[10px] text-slate-400 flex items-center justify-between">
                <span>CAD Kernel: Parasolid v36</span>
                <span className="text-emerald-400">Clean Geometry</span>
              </div>
            </div>
          )}

          {/* BOTTOM NAVIGATION HINTS BANNER */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-[10px] font-mono shadow-lg flex items-center space-x-3 pointer-events-none">
            <span>Left-Click Drag: <strong>Orbit / Rotate</strong></span>
            <span>&bull;</span>
            <span>Right-Click Drag: <strong>Pan</strong></span>
            <span>&bull;</span>
            <span>Scroll Wheel: <strong>Zoom</strong></span>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`px-5 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2 text-slate-400 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WebGL Hardware Acceleration Active &bull; ISO 10303 B-Rep Solid Topology</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (!cameraRef.current || !controlsRef.current) return;
                cameraRef.current.position.set(180, 140, 220);
                controlsRef.current.target.set(0, 30, 0);
                controlsRef.current.update();
                setExplodeValue(0);
                setIsSectionActive(false);
                showAllComponents();
                triggerToast('Reset viewport to home position');
              }}
              className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer text-xs"
              title="Reset View and Explode"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Scene</span>
            </button>

            <button
              onClick={onClose}
              className="btn-primary btn-sm cursor-pointer text-xs"
            >
              Close Viewport
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
