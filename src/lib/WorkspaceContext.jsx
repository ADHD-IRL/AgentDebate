import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';

const WorkspaceContext = createContext(null);
const LOCAL_USER_KEY = 'warroom_local_user_id';
const WORKSPACE_KEY  = 'warroom_last_workspace';

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
    get:    (id) => entity.get?.(id),
  };
}

function buildDb() {
  const direct = (entity) => ({
    list:   (sort, limit) => entity.list(sort, limit),
    filter: (filters = {}, sort, limit) => entity.filter(filters, sort, limit),
    create: (data) => entity.create(data),
    update: (id, data) => entity.update(id, data),
    delete: (id) => entity.delete(id),
    get:    (id) => entity.get?.(id),
  });
  return {
    Agent:            direct(base44.entities.Agent),
    Session:          direct(base44.entities.Session),
    SessionAgent:     direct(base44.entities.SessionAgent),
    Scenario:         direct(base44.entities.Scenario),
    Domain:           direct(base44.entities.Domain),
    Threat:           direct(base44.entities.Threat),
    Chain:            direct(base44.entities.Chain),
    SessionSynthesis: direct(base44.entities.SessionSynthesis),
    AppConfig:        direct(base44.entities.AppConfig),
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
      // Check for existing membership
      const members = await base44.entities.WorkspaceMember.filter({ user_id: localUserId });

      if (members.length > 0) {
        // Load all workspaces and find the one we're a member of
        const allWs = await base44.entities.Workspace.list();
        const wsMap = Object.fromEntries(allWs.map(w => [w.id, w]));

        // Prefer last used workspace
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

      // No workspace found — create one automatically
      const ws = await base44.entities.Workspace.create({ name: 'My Workspace', owner_id: localUserId });
      await base44.entities.WorkspaceMember.create({ workspace_id: ws.id, user_id: localUserId, role: 'admin' });
      setWorkspace(ws);
      localStorage.setItem(WORKSPACE_KEY, ws.id);
    } catch (err) {
      console.error('Workspace init failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const db = useMemo(() => buildDb(), []);

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