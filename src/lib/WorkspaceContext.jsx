import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { supabaseDb } from '@/lib/supabaseDb';
import { useAuth } from '@/lib/AuthContext';
import { setWorkspaceApiKey } from '@/lib/llm';

const WorkspaceContext = createContext(null);
const WORKSPACE_KEY = 'agd_last_workspace';

function scopedEntity(entity, workspaceId, userId, { noCreatedBy = false } = {}) {
  const byPayload = noCreatedBy ? {} : { created_by: userId };
  return {
    list:      (sort, limit) => entity.filter({ workspace_id: workspaceId }, sort, limit),
    filter:    (filters = {}, sort, limit) => entity.filter({ ...filters, workspace_id: workspaceId }, sort, limit),
    create:    (data) => entity.create({ ...data, workspace_id: workspaceId, ...byPayload }),
    update:    (id, data) => entity.update(id, data),
    delete:    (id) => entity.delete(id),
    get:       (id) => entity.get(id),
    subscribe: (cb) => entity.subscribe(cb),
  };
}

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setWorkspace(null);
      setIsLoading(false);
      return;
    }
    initWorkspace(user.id);
  }, [isAuthenticated, user]);

  const initWorkspace = async (userId) => {
    setIsLoading(true);
    try {
      // Load workspaces the user is a member of
      const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', userId);

      if (members?.length > 0) {
        const ids = members.map(m => m.workspace_id);
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', ids);

        const persistedId = localStorage.getItem(WORKSPACE_KEY);
        const ws = workspaces?.find(w => w.id === persistedId) ?? workspaces?.[0];

        if (ws) {
          activateWorkspace(ws);
          return;
        }
      }

      // No workspace — create one automatically
      const { data: ws } = await supabase
        .from('workspaces')
        .insert({ name: 'My Workspace', owner_id: userId })
        .select()
        .single();

      if (ws) {
        await supabase.from('workspace_members').insert({
          workspace_id: ws.id,
          user_id: userId,
          role: 'admin',
        });
        activateWorkspace(ws);
      }
    } catch (err) {
      console.error('Workspace init failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activateWorkspace = (ws) => {
    setWorkspace(ws);
    localStorage.setItem(WORKSPACE_KEY, ws.id);
    // Make the workspace API key available to llm.js
    if (ws.anthropic_api_key) {
      setWorkspaceApiKey(ws.anthropic_api_key);
    }
  };

  const refreshWorkspace = async () => {
    if (!workspace) return;
    const { data } = await supabase.from('workspaces').select('*').eq('id', workspace.id).single();
    if (data) activateWorkspace(data);
  };

  const db = useMemo(() => {
    if (!workspace || !user) return null;
    const e = supabaseDb.entities;
    return {
      Agent:            scopedEntity(e.Agent, workspace.id, user.id),
      Session:          scopedEntity(e.Session, workspace.id, user.id),
      SessionAgent:     scopedEntity(e.SessionAgent, workspace.id, user.id, { noCreatedBy: true }),
      Scenario:         scopedEntity(e.Scenario, workspace.id, user.id),
      Domain:           scopedEntity(e.Domain, workspace.id, user.id),
      Threat:           scopedEntity(e.Threat, workspace.id, user.id),
      Chain:            scopedEntity(e.Chain, workspace.id, user.id),
      SessionSynthesis: scopedEntity(e.SessionSynthesis, workspace.id, user.id, { noCreatedBy: true }),
      SessionMessage:   scopedEntity(e.SessionMessage, workspace.id, user.id, { noCreatedBy: true }),
      AppConfig:        scopedEntity(e.AppConfig, workspace.id, user.id),
    };
  }, [workspace, user]);

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      db,
      isLoading,
      localUserId: user?.id,
      refreshWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
};
