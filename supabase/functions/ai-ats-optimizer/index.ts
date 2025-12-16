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
    const { resumeContent, targetRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze resumes for ATS compatibility and provide optimization suggestions.

Evaluate:
1. Keyword optimization for the target role
2. Formatting and structure
3. Quantifiable achievements
4. Skills alignment

Respond in JSON format:
{
  "score": 0-100,
  "missingKeywords": ["keyword1", "keyword2"],
  "weakSections": ["section1", "section2"],
  "suggestions": [
    {
      "category": "keywords" | "format" | "content" | "structure",
      "priority": "high" | "medium" | "low",
      "suggestion": "specific suggestion"
    }
  ],
  "optimizedSummary": "An ATS-optimized professional summary",
  "optimizedBullets": ["optimized bullet 1", "optimized bullet 2"]
}`;

    const userPrompt = `Analyze this resume for the role: ${targetRole}

Resume Content:
${resumeContent}

Provide ATS analysis and optimization suggestions.`;

    console.log("Calling AI gateway for ATS analysis...");

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
          { role: "user", content: userPrompt },
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
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 50, suggestions: [] };
    } catch {
      result = { score: 50, suggestions: [], rawAnalysis: content };
    }

    console.log("Successfully generated ATS analysis");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in ai-ats-optimizer:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
