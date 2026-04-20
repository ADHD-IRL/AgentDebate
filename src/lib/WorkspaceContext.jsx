import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { localDb } from '@/lib/localDb';

const WorkspaceContext = createContext(null);
const LOCAL_USER_KEY = 'agd_local_user_id';
const WORKSPACE_KEY  = 'agd_last_workspace';

function getLocalUserId() {
  let id = localStorage.getItem(LOCAL_USER_KEY);
  if (!id) {
    id = 'local-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem(LOCAL_USER_KEY, id);
  }
  return id;
}

function scopedEntity(entity, workspaceId) {
  return {
    list:   (sort, limit) => entity.filter({ workspace_id: workspaceId }, sort, limit),
    filter: (filters = {}, sort, limit) => entity.filter({ ...filters, workspace_id: workspaceId }, sort, limit),
    create: (data) => entity.create({ ...data, workspace_id: workspaceId }),
    update: (id, data) => entity.update(id, data),
    delete: (id) => entity.delete(id),
    get:    (id) => entity.get(id),
    subscribe: (cb) => entity.subscribe(cb),
  };
}

export const WorkspaceProvider = ({ children }) => {
  const localUserId = getLocalUserId();
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { initWorkspace(); }, []);

  const initWorkspace = async () => {
    setIsLoading(true);
    try {
      const members = await localDb.entities.WorkspaceMember.filter({ user_id: localUserId });

      if (members.length > 0) {
        const allWs = await localDb.entities.Workspace.list();
        const wsMap = Object.fromEntries(allWs.map(w => [w.id, w]));
        const persistedId = localStorage.getItem(WORKSPACE_KEY);
        const persisted = persistedId ? members.find(m => m.workspace_id === persistedId) : null;
        const member = persisted || members[0];
        const ws = wsMap[member.workspace_id];
        if (ws) {
          setWorkspace(ws);
          localStorage.setItem(WORKSPACE_KEY, ws.id);
          setIsLoading(false);
          return;
        }
      }

      const ws = await localDb.entities.Workspace.create({ name: 'My Workspace', owner_id: localUserId });
      await localDb.entities.WorkspaceMember.create({ workspace_id: ws.id, user_id: localUserId, role: 'admin' });
      setWorkspace(ws);
      localStorage.setItem(WORKSPACE_KEY, ws.id);
    } catch (err) {
      console.error('Workspace init failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const db = useMemo(() => {
    if (!workspace) return null;
    const e = localDb.entities;
    return {
      Agent:            scopedEntity(e.Agent, workspace.id),
      Session:          scopedEntity(e.Session, workspace.id),
      SessionAgent:     scopedEntity(e.SessionAgent, workspace.id),
      Scenario:         scopedEntity(e.Scenario, workspace.id),
      Domain:           scopedEntity(e.Domain, workspace.id),
      Threat:           scopedEntity(e.Threat, workspace.id),
      Chain:            scopedEntity(e.Chain, workspace.id),
      SessionSynthesis: scopedEntity(e.SessionSynthesis, workspace.id),
      AppConfig:        scopedEntity(e.AppConfig, workspace.id),
    };
  }, [workspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, db, isLoading, localUserId }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
};
