import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return Response.json({ error: 'URL is required' }, { status: 400 });

    // Fetch the page content
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WARROOM-Bot/1.0)' },
    });
    if (!pageRes.ok) return Response.json({ error: `Failed to fetch URL: ${pageRes.status}` }, { status: 400 });

    const html = await pageRes.text();

    // Strip HTML tags to get plain text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 12000); // cap to avoid huge prompts

    // Use LLM to extract scenario-relevant content
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a red team analyst preparing a scenario briefing for a structured threat analysis session.

Given the following web page content, extract and synthesize the most relevant information into a concise, structured scenario context document. Focus on:
- Key facts, events, or situation details
- Threat actors, vulnerabilities, or risks mentioned
- Organizational or technical environment described
- Any timelines, impacts, or consequences

Write in a factual, intelligence-briefing style. Be concise but thorough. Do NOT include disclaimers, commentary, or meta-text — just the extracted briefing content.

Web page content:
---
${text}
---

Output a clean scenario context document (3-6 paragraphs).`,
    });

    return Response.json({ context: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});