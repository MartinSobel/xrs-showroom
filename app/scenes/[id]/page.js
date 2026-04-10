'use client';

/**
 * Scene Page — fullscreen 3D viewer with floating panels.
 * Loads scene data from Firebase and renders GLB + SOG + environment.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useScene } from '@/hooks/useScene';
import SceneListPanel from '@/components/panels/SceneListPanel';
import SceneEditorPanel from '@/components/panels/SceneEditorPanel';
import TransformPanel from '@/components/panels/TransformPanel';
import OrbitPanel from '@/components/panels/OrbitPanel';
import RightPanelStack from '@/components/panels/RightPanelStack';

// Dynamic import for client-only 3D components (no SSR)
const Viewer3D = dynamic(() => import('@/components/viewer/Viewer3D'), { ssr: false });
const FpsCounter = dynamic(() => import('@/components/viewer/FpsCounter'), { ssr: false });

export default function ScenePage() {
  const params = useParams();
  const sceneId = params?.id;
  const viewerRef = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);

  // Track which assets have been loaded to avoid re-loading
  const loadedAssetsRef = useRef({
    glb: null,
    sog: null,
    skybox: null,
    floor: null,
  });

  const {
    scene,
    loading,
    error,
    uploadProgress,
    updateTransforms,
    updateOrbit,
    uploadAsset,
    removeAsset,
  } = useScene(sceneId);

  const handleViewerReady = useCallback(() => {
    setViewerReady(true);
  }, []);

  // Load/update assets when scene data changes and viewer is ready
  useEffect(() => {
    if (!viewerReady || !scene || !viewerRef.current) return;

    const v = viewerRef.current;
    const assets = scene.assets || {};
    const loaded = loadedAssetsRef.current;

    // GLB
    const glbUrl = assets.glb?.url || null;
    if (glbUrl !== loaded.glb) {
      loaded.glb = glbUrl;
      if (glbUrl) {
        v.loadGlb(glbUrl);
      } else {
        v.removeGlb();
      }
    }

    // SOG
    const sogUrl = assets.sog?.url || null;
    if (sogUrl !== loaded.sog) {
      loaded.sog = sogUrl;
      if (sogUrl) {
        v.loadSog(sogUrl);
      } else {
        v.removeSog();
      }
    }

    // Skybox texture
    const skyUrl = assets.skybox?.url || null;
    if (skyUrl !== loaded.skybox) {
      loaded.skybox = skyUrl;
      if (skyUrl) {
        v.loadSkyboxTexture(skyUrl);
      } else {
        v.removeSkyboxTexture();
      }
    }

    // Floor texture
    const floorUrl = assets.floor?.url || null;
    if (floorUrl !== loaded.floor) {
      loaded.floor = floorUrl;
      if (floorUrl) {
        v.loadFloorTexture(floorUrl);
      } else {
        v.removeFloorTexture();
      }
    }
  }, [viewerReady, scene]);

  // Apply transforms when they change from Firebase
  useEffect(() => {
    if (!viewerReady || !scene?.transforms || !viewerRef.current) return;

    const v = viewerRef.current;
    const t = scene.transforms;
    if (t.glb) v.applyTransform('glb', t.glb);
    if (t.sog) v.applyTransform('sog', t.sog);
    if (t.skybox) v.applyTransform('skybox', t.skybox);
    if (t.floor) v.applyTransform('floor', t.floor);
  }, [viewerReady, scene?.transforms]);

  // Apply orbit settings when they change from Firebase
  useEffect(() => {
    if (!viewerReady || !viewerRef.current) return;
    const orbit = scene?.orbit;
    if (orbit) {
      viewerRef.current.applyOrbit(orbit);
    }
  }, [viewerReady, scene?.orbit]);

  // Handle transform changes from the panel (live update + debounced save)
  const handleTransformChange = useCallback(
    (type, transforms) => {
      updateTransforms(type, transforms);
    },
    [updateTransforms]
  );

  // Apply transform immediately to 3D objects (no delay)
  const handleApplyTransform = useCallback(
    (type, transforms) => {
      if (viewerRef.current) {
        viewerRef.current.applyTransform(type, transforms);
      }
    },
    []
  );

  // Handle orbit changes from the panel (live update + debounced save)
  const handleOrbitChange = useCallback(
    (orbit) => {
      updateOrbit(orbit);
    },
    [updateOrbit]
  );

  // Apply orbit immediately to controls (no delay)
  const handleApplyOrbit = useCallback(
    (orbit) => {
      if (viewerRef.current) {
        viewerRef.current.applyOrbit(orbit);
      }
    },
    []
  );

  // Handle asset upload
  const handleUpload = useCallback(
    async (assetType, file) => {
      try {
        const result = await uploadAsset(assetType, file);
        // Reset loaded tracking so the effect will load the new asset
        loadedAssetsRef.current[assetType] = null;
      } catch (err) {
        console.error(`Upload failed [${assetType}]:`, err);
      }
    },
    [uploadAsset]
  );

  // Handle asset removal
  const handleRemove = useCallback(
    async (assetType) => {
      try {
        await removeAsset(assetType);
        loadedAssetsRef.current[assetType] = null;
      } catch (err) {
        console.error(`Remove failed [${assetType}]:`, err);
      }
    },
    [removeAsset]
  );

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loader-content">
          <div className="loader-spinner" />
          <div className="loader-title">Cargando escena…</div>
        </div>
      </div>
    );
  }

  if (error || !scene) {
    return (
      <div className="home-container">
        <div className="home-card animate-fade">
          <div className="home-header">
            <h1>Escena no encontrada</h1>
            <p>{error?.message || 'La escena solicitada no existe.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen 3D Viewer */}
      <Viewer3D ref={viewerRef} onReady={handleViewerReady} />

      {/* FPS Counter */}
      <FpsCounter />

      {/* Left Panel — Scene List */}
      <SceneListPanel currentSceneId={sceneId} position="panel-left" />

      {/* Right Panel Stack — Accordion: only one open at a time */}
      <RightPanelStack>
        {({ activePanel, toggle }) => (
          <>
            <SceneEditorPanel
              scene={scene}
              uploadProgress={uploadProgress}
              onUpload={handleUpload}
              onRemove={handleRemove}
              collapsed={activePanel !== 'assets'}
              onToggle={() => toggle('assets')}
            />

            <OrbitPanel
              scene={scene}
              onOrbitChange={handleOrbitChange}
              onApplyOrbit={handleApplyOrbit}
              collapsed={activePanel !== 'orbit'}
              onToggle={() => toggle('orbit')}
            />

            <TransformPanel
              scene={scene}
              onTransformChange={handleTransformChange}
              onApplyTransform={handleApplyTransform}
              collapsed={activePanel !== 'transform'}
              onToggle={() => toggle('transform')}
            />
          </>
        )}
      </RightPanelStack>
    </>
  );
}
