import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export async function analyzeImage(imageFile, language = 'en') {
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash", "gemini-pro"];

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            
            const base64Data = await fileToGenerativePart(imageFile);

            const langInstruction = language === 'hi'
                ? "Provide the 'title' and 'description' values in HINDI language (Devanagari script). Keep 'category' in English."
                : "Provide the 'title' and 'description' values in English.";

            const prompt = `Analyze this image of a civic issue. Identify the problem.
        ${langInstruction}
        Return a JSON object with these keys:
        - "title": A short, concise title for the issue.
        - "description": A detailed description of what is observed.
        - "category": Choose the BEST match from this list (Always in English): "Potholes & Road Damage", "Street Lighting", "Waste Management", "Water & Sewage", "Public Spaces".
        - If clearly NOT a civic issue, select "Not a Civic Issue".
        Do not include markdown formatting. Just raw JSON.`;

            const result = await model.generateContent([prompt, base64Data]);
            const response = await result.response;
            const text = response.text();

            try {
                
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanedText);
            } catch (e) {
                console.error("Failed to parse AI response", text);
                
                return {
                    title: "Reported Issue",
                    description: text.substring(0, 200)
                };
            }
        } catch (error) {
            console.warn(`Model ${modelName} failed:`, error.message);
            
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                throw error;
            }
            
        }
    }
}

async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


export async function detectDuplicateIssue(newImageFile, candidateIssues) {
    console.log("DEBUG: detectDuplicateIssue called with", candidateIssues.length, "candidates");
    if (!candidateIssues || candidateIssues.length === 0) {
        return { isDuplicate: false, matchedIssueId: null, reason: "No existing issues to check against" };
    }

    const modelName = "gemini-2.5-flash";
    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        
        const newImagePart = await fileToGenerativePart(newImageFile);

        
        const candidateParts = [];
        const validCandidates = [];

        for (const candidate of candidateIssues) {
            try {
                if (!candidate.imageUrl) continue;
                const response = await fetch(candidate.imageUrl);
                const blob = await response.blob();

                
                const arrayBuffer = await blob.arrayBuffer();
                const base64Data = Buffer.from(arrayBuffer).toString('base64');

                const part = {
                    inlineData: {
                        data: base64Data,
                        mimeType: blob.type
                    }
                };
                candidateParts.push(part);
                validCandidates.push(candidate);
            } catch (e) {
                console.warn(`Failed to fetch/process candidate image for ${candidate.id}`, e);
            }
        }

        if (validCandidates.length === 0) {
            return { isDuplicate: false, matchedIssueId: null, reason: "No valid candidate images to compare" };
        }

        
        const promptText = `
Analyze the "New Image" (Image #1) and compare it against the Candidate Images (Image #2 onward).
You are comparing CIVIC ISSUES (infrastructure problems).

YOUR MISSION: Act as a forensic image analyst. Your goal is to find PROOF that these images are DIFFERENT.
You are looking for "STRUCTURAL DIFFERENCES" that prove these are two separate physical issues.

STRUCTURAL DIFFERENCES (Proves NON-duplicate):
- Different crack patterns (e.g., one is Y-shaped, one is straight)
- Different background landmarks (e.g., one has a blue shop, one has a red wall)
- Different pavement texture (e.g., asphalt vs. concrete)
- Different surrounding objects (e.g., conflicting pole locations)

NON-STRUCTURAL DIFFERENCES (Ignore these):
- Lighting changes (day vs. night, sunny vs. cloudy)
- Camera angle/Zoom (close-up vs. wide shot)
- Wet vs. Dry surface
- Cars/People moving in the background

For each candidate comparison:
1. Identify visual features of the New Image.
2. Identify visual features of the Candidate Image.
3. HUNT FOR STRUCTURAL DIFFERENCES. List them.
4. If (and ONLY if) you cannot find structural differences, look for POSITIVE MATCHING DETAILS to confirm.
5. Assign a "similarityScore" from 0 to 100.
   - 100: Identical image file.
   - 90-99: Same physical object, different angle/lighting. High certainty.
   - 80-89: Very similar, likely same, but minor ambiguity.
   - < 80: Different issues or not enough evidence.

Return a JSON object with this EXACT structure:
{
  "matchFound": boolean, 
  "matchedCandidateId": "string or null", 
  "confidence": "high/medium/low", 
  "similarityScore": number, 
  "structuralDifferences": ["diff1", "diff2", ...],
  "matchingFeatures": ["match1", "match2", ...],
  "reason": "Explain the decision. Focus on differences found or the specific matching features."
}

CRITICAL RULES:
- If you find ANY structural difference, "matchFound" MUST be FALSE.
- "matchingFeatures" must be specific (e.g., "Identical crack shape"), NOT generic ("Both are roads").
- Be skeptical. False negatives are better than false positives.
`;

        const contentParts = [newImagePart, ...candidateParts, promptText];
        const result = await model.generateContent(contentParts);
        const response = await result.response;
        const text = response.text();

        console.log("🤖 AI Analysis Raw Output:", text);

        
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn("Could not find JSON in AI response:", text);
            return { isDuplicate: false, matchedIssueId: null, reason: "Invalid AI response format" };
        }

        const json = JSON.parse(jsonMatch[0]);

        
        if (typeof json.matchFound !== 'boolean' || !json.similarityScore) {
            console.warn("Invalid AI response structure:", json);
            return { isDuplicate: false, matchedIssueId: null, reason: "Invalid AI response structure from Gemini" };
        }

        

        
        const hasPassingScore = json.similarityScore >= 85;

        
        
        
        const structuralDiffs = json.structuralDifferences || [];
        const hasCriticalDiffs = structuralDiffs.length > 0 && json.similarityScore < 90;

        
        const specificFeatures = (json.matchingFeatures || []).filter(f => {
            const lower = f.toLowerCase();
            const genericTerms = ['both are', 'similar', 'same type', 'background', 'generic'];
            return !genericTerms.some(t => lower.includes(t));
        });
        const hasPositiveConfirmation = specificFeatures.length >= 2;

        console.log(`🔍 Validation: Score ${json.similarityScore} (Pass: ${hasPassingScore}), Diffs: ${structuralDiffs.length} (Critical: ${hasCriticalDiffs}), Features: ${specificFeatures.length}`);

        
        
        
        const isDuplicate = json.matchFound && hasPassingScore && !hasCriticalDiffs;

        if (isDuplicate) {
            console.log(`✅ DUPLICATE CONFIRMED: ${json.matchedCandidateId} (Score: ${json.similarityScore})`);
            return {
                isDuplicate: true,
                matchedIssueId: json.matchedCandidateId,
                reason: `High Similarity (${json.similarityScore}%). ${json.reason}`,
                matchingFeatures: json.matchingFeatures,
                similarityScore: json.similarityScore
            };
        } else {
            console.log(`❌ Duplicate Rejected: Score ${json.similarityScore}, Diffs found: ${structuralDiffs.length > 0}`);
            return {
                isDuplicate: false,
                matchedIssueId: null,
                reason: json.reason || "Low similarity or structural differences found",
                similarityScore: json.similarityScore
            };
        }

    } catch (error) {
        console.error("Duplicate Detection Failed:", error);
        return { isDuplicate: false, matchedIssueId: null, reason: `AI Error: ${error.message}` };
    }
}


export async function detectDuplicateText(newAnalysis, candidateIssues) {
    if (!candidateIssues || candidateIssues.length === 0) {
        return { isDuplicate: false, matchedIssueId: null, similarityScore: 0, reason: "No candidates" };
    }

    const modelName = "gemini-2.5-flash";
    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const candidatesText = candidateIssues.map(c =>
            `ID: ${c.id} | Title: "${c.title}" | Description: "${c.description || c.issue}"`
        ).join("\n");

        const prompt = `
        Compare the "New Issue" against the "Candidate Issues" to find duplicates based on MEANING.
        
        New Issue:
        Title: "${newAnalysis.title}"
        Description: "${newAnalysis.description}"
        Category: "${newAnalysis.category}"

        Candidate Issues:
        ${candidatesText}

        Task:
        1. Analyze if the New Issue describes the SAME problem at the SAME location as any Candidate Issue.
        2. Assign a "similarityScore" (0-100) based on semantic overlap.
           - >85: Likely duplicate (Same specific object/problem).
           - 50-85: Similar category but maybe different specific instance.
           - <50: Different issues.
        3. Identify the checks:
           - same_object: Do they describe the exact same pothole/light/garbage pile?
           - same_location_context: Do the descriptions imply the same specific spot?

        Return JSON:
        {
          "bestMatchId": "string or null",
          "similarityScore": number (0-100),
          "reason": "Short explanation",
          "matchFound": boolean 
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanText);

        if (json.matchFound && json.similarityScore > 85) {
            return {
                isDuplicate: true,
                matchedIssueId: json.bestMatchId,
                similarityScore: json.similarityScore,
                reason: json.reason
            };
        }

        return {
            isDuplicate: false,
            matchedIssueId: null,
            similarityScore: json.similarityScore || 0,
            reason: json.reason || "No high match found"
        };

    } catch (error) {
        console.error("Text Duplicate Detection Failed:", error);
        return { isDuplicate: false, matchedIssueId: null, reason: "AI Error" };
    }
}
