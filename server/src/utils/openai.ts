// export function extractCleanJSON(content: string): string {
//   console.log("🧹 Cleaning JSON content...");
//   console.log("📄 Raw content preview:", content.substring(0, 200) + "...");

//   // Handle different response formats
//   let cleaned = content.trim();

//   // Remove markdown code blocks and any surrounding text
//   cleaned = cleaned
//     .replace(/```json\s*/gi, "")
//     .replace(/```\s*/g, "")
//     .trim();

//   // Look for JSON patterns even in mixed text responses
//   const jsonPatterns = [
//     // Standard JSON object
//     /\{[\s\S]*?\}/g,
//     // JSON after "here is" or similar phrases
//     /(?:here\s+is\s+.*?analysis:?\s*)?(\{[\s\S]*?\})/gi,
//     // JSON after markdown
//     /```json\s*(\{[\s\S]*?\})\s*```/gi,
//   ];

//   let jsonMatch = null;
//   for (const pattern of jsonPatterns) {
//     const matches = cleaned.match(pattern);
//     if (matches && matches.length > 0) {
//       // Get the largest/most complete JSON match
//       jsonMatch = matches.reduce((longest, current) =>
//         current.length > longest.length ? current : longest
//       );
//       break;
//     }
//   }

//   if (jsonMatch) {
//     cleaned = jsonMatch.trim();
//     console.log("🎯 Found JSON pattern:", cleaned.substring(0, 100) + "...");
//   }

//   // Clean up any remaining markdown or text prefixes
//   if (!cleaned.startsWith("{")) {
//     const jsonStart = cleaned.indexOf("{");
//     if (jsonStart !== -1) {
//       cleaned = cleaned.substring(jsonStart);
//     }
//   }

//   // Clean up any text after the JSON
//   if (cleaned.includes("}")) {
//     const lastBrace = cleaned.lastIndexOf("}");
//     // Count braces to find the complete JSON
//     let braceCount = 0;
//     let endIndex = -1;

//     for (let i = 0; i <= lastBrace; i++) {
//       if (cleaned[i] === "{") braceCount++;
//       if (cleaned[i] === "}") {
//         braceCount--;
//         if (braceCount === 0) {
//           endIndex = i;
//           break;
//         }
//       }
//     }

//     if (endIndex !== -1) {
//       cleaned = cleaned.substring(0, endIndex + 1);
//     }
//   }

//   // Final validation
//   if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
//     console.log(
//       "⚠️ Content doesn't appear to be valid JSON:",
//       cleaned.substring(0, 100)
//     );
//     throw new Error("Response is not in valid JSON format");
//   }

//   if (cleaned.length < 20) {
//     throw new Error("JSON response too short to be meaningful");
//   }

//   console.log("✅ JSON content cleaned successfully");
//   console.log("🔍 Final JSON preview:", cleaned.substring(0, 150) + "...");
//   return cleaned;
// }
export function extractCleanJSON(content: string): string {
  console.log("🧹 Cleaning JSON content...");
  console.log("📄 Raw content preview:", content.substring(0, 200) + "...");
  
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  
  // Try to find JSON object boundaries
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart === -1) {
    throw new Error("No JSON object found in response");
  }
  
  // Find the matching closing brace
  let braceCount = 0;
  let jsonEnd = -1;
  
  for (let i = jsonStart; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      braceCount++;
    } else if (cleaned[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        jsonEnd = i;
        break;
      }
    }
  }
  
  if (jsonEnd === -1) {
    console.log("⚠️ No matching closing brace found, using full content");
    jsonEnd = cleaned.length - 1;
  }
  
  const extracted = cleaned.substring(jsonStart, jsonEnd + 1);
  console.log("🎯 Found JSON pattern:", extracted.substring(0, 100) + "...");
  
  // Clean up the extracted JSON
  const finalCleaned = extracted.trim();
  console.log("✅ JSON content cleaned successfully");
  console.log("🔍 Final JSON preview:", finalCleaned.substring(0, 200) + "...");
  
  return finalCleaned;
}

export function parsePartialJSON(content: string): any {
  try {
    // Try to parse as-is first
    return JSON.parse(content);
  } catch (error) {
    console.log("🔧 Standard parsing failed, attempting repair...");
    
    // Remove trailing commas
    let repaired = content.replace(/,(\s*[}\]])/g, '$1');
    
    // Add missing closing braces if needed
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      repaired += '}'.repeat(missing);
    }
    
    try {
      return JSON.parse(repaired);
    } catch (secondError) {
      console.log("💥 Could not repair JSON:", secondError);
      throw new Error("Unable to parse or repair JSON response");
    }
  }
}