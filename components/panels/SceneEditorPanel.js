'use client';

import FloatingPanel from './FloatingPanel';
import FileUploader from '@/components/ui/FileUploader';

/**
 * Scene editor panel — upload/manage assets for a scene.
 * Rendered inside RightPanelStack with controlled collapse.
 */
export default function SceneEditorPanel({
  scene,
  uploadProgress,
  onUpload,
  onRemove,
  collapsed,
  onToggle,
}) {
  if (!scene) return null;

  return (
    <FloatingPanel
      title="Assets"
      icon="🎨"
      position=""
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <FileUploader
        label="Modelo GLB"
        icon="🧊"
        accept=".glb,.gltf"
        currentFile={scene.assets?.glb}
        uploadProgress={uploadProgress?.glb}
        onUpload={(file) => onUpload('glb', file)}
        onRemove={() => onRemove('glb')}
      />

      <FileUploader
        label="Splat SOG"
        icon="✨"
        accept=".sog,.ply,.splat"
        currentFile={scene.assets?.sog}
        uploadProgress={uploadProgress?.sog}
        onUpload={(file) => onUpload('sog', file)}
        onRemove={() => onRemove('sog')}
      />

      <div className="section-divider" />

      <FileUploader
        label="Skybox"
        icon="🌐"
        accept=".jpg,.jpeg,.png,.webp"
        currentFile={scene.assets?.skybox}
        uploadProgress={uploadProgress?.skybox}
        onUpload={(file) => onUpload('skybox', file)}
        onRemove={() => onRemove('skybox')}
      />

      <FileUploader
        label="Floor"
        icon="🟫"
        accept=".jpg,.jpeg,.png,.webp"
        currentFile={scene.assets?.floor}
        uploadProgress={uploadProgress?.floor}
        onUpload={(file) => onUpload('floor', file)}
        onRemove={() => onRemove('floor')}
      />
    </FloatingPanel>
  );
}
