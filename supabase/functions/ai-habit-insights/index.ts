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
    const { habits, logs } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a supportive habit tracking coach. Analyze the user's habit data and provide personalized, actionable insights.

Be encouraging but honest. Identify patterns, suggest improvements, and celebrate wins.

Provide 2-4 specific insights in JSON format:
{
  "insights": [
    {
      "type": "pattern" | "suggestion" | "encouragement",
      "message": "Your insight here"
    }
  ],
  "overallScore": 0-100,
  "topPerformingHabit": "habit name or null",
  "needsAttention": "habit name or null"
}`;

    const habitsInfo = habits.map((h: any) => `- ${h.name} (${h.frequency})`).join('\n');
    const logsInfo = logs.map((l: any) => 
      `${l.habit_name} on ${l.logged_at}: ${l.completed ? '✓ Completed' : '✗ Missed'}${l.notes ? ` - "${l.notes}"` : ''}`
    ).join('\n');

    const userPrompt = `Analyze these habit tracking patterns:

Habits being tracked:
${habitsInfo}

Recent activity (last 14 days):
${logsInfo || 'No logs yet'}

Provide personalized insights.`;

    console.log("Calling AI gateway for habit insights...");

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
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [{ type: "suggestion", message: content }] };
    } catch {
      result = { insights: [{ type: "suggestion", message: content }] };
    }

    console.log("Successfully generated habit insights");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in ai-habit-insights:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
