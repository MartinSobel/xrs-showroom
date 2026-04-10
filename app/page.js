'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSceneList } from '@/hooks/useSceneList';
import { createScene, deleteScene } from '@/lib/scenes';
import { deleteSceneAssets } from '@/lib/storage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function HomePage() {
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
    } catch (err) {
      console.error('Failed to delete scene:', err);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="home-container">
      <div className="home-card animate-fade">
        <div className="home-header">
          <h1>XRS Showroom</h1>
          <p>Gestión de escenas 3D</p>
        </div>

        <div className="panel-body">
          {loading ? (
            <div className="empty-state">
              <p>Cargando escenas…</p>
            </div>
          ) : scenes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <p>No hay escenas todavía.<br />Creá la primera para comenzar.</p>
            </div>
          ) : (
            <div className="scene-list">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="scene-item"
                  onClick={() => router.push(`/scenes/${scene.id}`)}
                >
                  <span className="scene-dot" />
                  <span className="scene-name">{scene.name}</span>
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
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <div className="create-scene-row">
            <input
              type="text"
              placeholder="Nombre de escena…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar escena"
          message={`¿Estás seguro de eliminar "${deleteTarget.name}"? Se borrarán todos los archivos asociados.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
