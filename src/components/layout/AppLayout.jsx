import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const [stats, setStats] = useState({ agentCount: 0, activeSessions: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [agents, sessions] = await Promise.all([
          base44.entities.Agent.list(),
          base44.entities.Session.filter({ status: 'round1' }),
        ]);
        setStats({ agentCount: agents.length, activeSessions: sessions.length });
      } catch (e) {}
    };
    loadStats();

    const unsub = base44.entities.Agent.subscribe(() => {
      loadStats();
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <Sidebar stats={stats} />
      <main className="flex-1 ml-56 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}