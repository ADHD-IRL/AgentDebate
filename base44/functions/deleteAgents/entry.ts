import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_ids } = await req.json();

    if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
      return Response.json({ error: 'No agent IDs provided' }, { status: 400 });
    }

    let deleted = 0;
    for (const id of agent_ids) {
      try {
        await base44.entities.Agent.delete(id);
        deleted++;
      } catch (e) {
        console.error(`Failed to delete agent ${id}:`, e.message);
      }
    }

    return Response.json({ deleted, attempted: agent_ids.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});