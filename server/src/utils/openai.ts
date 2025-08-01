export function extractCleanJSON(content: string): string {
  console.log("🧹 Cleaning JSON content...");
  console.log("📄 Raw content preview:", content.substring(0, 200) + "...");

  // Handle different response formats
  let cleaned = content.trim();

  // Remove markdown code blocks and any surrounding text
  cleaned = cleaned
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Look for JSON patterns even in mixed text responses
  const jsonPatterns = [
    // Standard JSON object
    /\{[\s\S]*?\}/g,
    // JSON after "here is" or similar phrases
    /(?:here\s+is\s+.*?analysis:?\s*)?(\{[\s\S]*?\})/gi,
    // JSON after markdown
    /```json\s*(\{[\s\S]*?\})\s*```/gi,
  ];

  let jsonMatch = null;
  for (const pattern of jsonPatterns) {
    const matches = cleaned.match(pattern);
    if (matches && matches.length > 0) {
      // Get the largest/most complete JSON match
      jsonMatch = matches.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      );
      break;
    }
  }

  if (jsonMatch) {
    cleaned = jsonMatch.trim();
    console.log("🎯 Found JSON pattern:", cleaned.substring(0, 100) + "...");
  }

  // Clean up any remaining markdown or text prefixes
  if (!cleaned.startsWith("{")) {
    const jsonStart = cleaned.indexOf("{");
    if (jsonStart !== -1) {
      cleaned = cleaned.substring(jsonStart);
    }
  }

  // Clean up any text after the JSON
  if (cleaned.includes("}")) {
    const lastBrace = cleaned.lastIndexOf("}");
    // Count braces to find the complete JSON
    let braceCount = 0;
    let endIndex = -1;

    for (let i = 0; i <= lastBrace; i++) {
      if (cleaned[i] === "{") braceCount++;
      if (cleaned[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex !== -1) {
      cleaned = cleaned.substring(0, endIndex + 1);
    }
  }

  // Final validation
  if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
    console.log(
      "⚠️ Content doesn't appear to be valid JSON:",
      cleaned.substring(0, 100)
    );
    throw new Error("Response is not in valid JSON format");
  }

  if (cleaned.length < 20) {
    throw new Error("JSON response too short to be meaningful");
  }

  console.log("✅ JSON content cleaned successfully");
  console.log("🔍 Final JSON preview:", cleaned.substring(0, 150) + "...");
  return cleaned;
}
