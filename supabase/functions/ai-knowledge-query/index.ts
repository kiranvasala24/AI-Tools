import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, documents } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const docsContext = documents?.length 
      ? documents.map((doc: any, idx: number) => `[${idx + 1}] ${doc.title}:\n${doc.content}`).join('\n\n')
      : 'No documents available.';

    const systemPrompt = `You are a knowledge assistant. Answer questions based on the provided documents.

Rules:
1. Only use information from the provided documents
2. Cite sources using [1], [2], etc.
3. If the answer isn't in the documents, say so clearly
4. Generate action items when relevant
5. Be concise but thorough

Documents:
${docsContext}

Respond in JSON format:
{
  "answer": "Your answer with [citations]",
  "citations": [1, 2],
  "summary": "Brief summary if applicable",
  "actionItems": ["action 1", "action 2"],
  "confidence": "high" | "medium" | "low"
}`;

    console.log("Calling AI gateway for knowledge query...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { answer: content, citations: [], confidence: "medium" };
    } catch {
      result = { answer: content, citations: [], confidence: "medium" };
    }

    console.log("Successfully generated knowledge response");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in ai-knowledge-query:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
