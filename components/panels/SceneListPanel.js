'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSceneList } from '@/hooks/useSceneList';
import { createScene, deleteScene } from '@/lib/scenes';
import { deleteSceneAssets } from '@/lib/storage';
import FloatingPanel from './FloatingPanel';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function SceneListPanel({ currentSceneId, position = 'panel-left' }) {
  const { scenes, loading } = useSceneList();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const router = useRouter();

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || creating) return;

    setCreating(true);
    try {
      const id = await createScene(name);
      setNewName('');
      router.push(`/scenes/${id}`);
    } catch (err) {
      console.error('Failed to create scene:', err);
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSceneAssets(deleteTarget.id);
      await deleteScene(deleteTarget.id);
      if (currentSceneId === deleteTarget.id) {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to delete scene:', err);
    }
    setDeleteTarget(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <>
      <FloatingPanel title="Escenas" icon="📋" position={position} defaultCollapsed={true}>
        {loading ? (
          <div className="empty-state">
            <p>Cargando…</p>
          </div>
        ) : scenes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <p>No hay escenas.<br />Creá la primera.</p>
          </div>
        ) : (
          <div className="scene-list">
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className={`scene-item ${scene.id === currentSceneId ? 'active' : ''}`}
                onClick={() => router.push(`/scenes/${scene.id}`)}
              >
              <span className="scene-dot" />
                <span className="scene-name">{scene.name}</span>
                <button
                  className="scene-view"
                  title="Ver escena"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/view/${scene.id}`, '_blank');
                  }}
                >
                  👁
                </button>
                <button
                  className="scene-delete"
                  title="Eliminar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(scene);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="create-scene-row">
          <input
            type="text"
            placeholder="Nombre de escena…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={creating}
          />
          <button
            className="btn btn-primary btn-icon"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            title="Crear escena"
          >
            +
          </button>
        </div>
      </FloatingPanel>

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar escena"
          message={`¿Estás seguro de eliminar "${deleteTarget.name}"? Se borrarán todos los archivos asociados.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
