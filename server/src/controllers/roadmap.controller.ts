import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Firestore } from '@google-cloud/firestore';
import axios from 'axios';

// Initialize Google Cloud clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const firestore = new Firestore();

// Types
interface RoadmapRequest {
  resumeText: string;
  interests: string;
  goal: string;
}

interface SkillNode {
  id: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type: 'current' | 'learningPath' | 'goal';
    description: string;
    resources: { title: string; url: string }[];
  };
}

interface SkillEdge {
  id: string;
  source: string;
  target: string;
}

interface RoadmapResponse {
  nodes: SkillNode[];
  edges: SkillEdge[];
  profileSummary: string;
}

interface HackerNewsStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
}

export const roadmapController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeText, interests, goal }: RoadmapRequest = req.body;

    // Validate input
    if (!resumeText || !interests || !goal) {
      res.status(400).json({ error: 'Missing required fields: resumeText, interests, and goal' });
      return;
    }

    console.log(`🎯 Generating roadmap for goal: ${goal}`);
    console.log(`📝 Resume length: ${resumeText.length} characters`);

    // Step 1: Extract skills from resume using Gemini AI
    const currentUserSkills = await extractSkillsFromResume(resumeText);
    console.log(`🔍 Extracted skills: ${currentUserSkills}`);

    // Step 2: Analyze market trends using Hacker News API
    const trendingSkills = await analyzeMarketTrends();
    console.log(`📈 Market trends analyzed`);

    // Step 3: Generate personalized roadmap using Gemini AI
    const roadmap = await generateRoadmap(currentUserSkills, interests, goal, trendingSkills);
    console.log(`🗺️ Roadmap generated with ${roadmap.nodes.length} nodes and ${roadmap.edges.length} edges`);

    // Step 4: Generate profile summary
    const profileSummary = await generateProfileSummary(currentUserSkills, interests, goal, roadmap);

    // Step 5: Store in Firestore
    await saveToFirestore({
      resumeText,
      interests,
      goal,
      currentSkills: currentUserSkills,
      trendingSkills,
      roadmap,
      profileSummary,
      createdAt: new Date()
    });

    // Step 6: Return response
    const response: RoadmapResponse = {
      nodes: roadmap.nodes,
      edges: roadmap.edges,
      profileSummary
    };

    res.json(response);
    console.log(`✅ Roadmap response sent successfully`);

  } catch (error) {
    console.error('❌ Error in roadmap controller:', error);
    res.status(500).json({ 
      error: 'Failed to generate roadmap',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Step 1: Extract skills from resume
async function extractSkillsFromResume(resumeText: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    const prompt = `Analyze the following resume text. Your task is to extract the user's technical skills. Return ONLY a comma-separated list of these skills. Do not add any explanation or formatting. For example: "JavaScript, React, Node.js, Python, SQL, Docker, AWS".

Resume Text:
---
${resumeText}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return response.trim() || 'No skills detected';
  } catch (error) {
    console.error('Error extracting skills:', error);
    throw new Error('Failed to extract skills from resume');
  }
}

// Step 2: Analyze market trends using Hacker News API
async function analyzeMarketTrends(): Promise<string> {
  try {
    // Fetch top stories from Hacker News
    const topStoriesResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topStoryIds = topStoriesResponse.data.slice(0, 20); // Get top 20 stories
    
    // Fetch story details
    const storyPromises = topStoryIds.map(async (id: number) => {
      const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      return storyResponse.data as HackerNewsStory;
    });
    
    const stories = await Promise.all(storyPromises);
    const storyTitles = stories
      .filter(story => story.title)
      .map(story => story.title)
      .join('\n');

    // Use Gemini to analyze trends
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    const prompt = `Analyze the following tech news headlines from Hacker News. Identify the key technologies, programming languages, frameworks, and skills that are currently trending in the tech industry. Return ONLY a comma-separated list of these trending skills. Do not add any explanation or formatting.

Headlines:
${storyTitles}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return response.trim() || 'No trending skills detected';
  } catch (error) {
    console.error('Error analyzing market trends:', error);
    return 'AI, Machine Learning, Cloud Computing, Web Development'; // Fallback
  }
}

// Step 3: Generate personalized roadmap
async function generateRoadmap(
  currentUserSkills: string, 
  userInterests: string, 
  careerGoal: string, 
  trendingSkills: string
): Promise<{ nodes: SkillNode[]; edges: SkillEdge[] }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    const prompt = `You are a world-class AI Career Advisor. Your task is to generate a personalized learning roadmap.

**User Profile:**
- Current Skills: ${currentUserSkills}
- Stated Interests: ${userInterests}
- Career Goal: ${careerGoal}

**Market Trends:**
- Currently trending skills in the tech industry are: ${trendingSkills}

**Your Task:**
Generate a learning roadmap for the user to achieve their career goal.
Your output MUST be a single, valid JSON object, and nothing else.
The JSON object must contain two keys: "nodes" and "edges", compatible with the 'react-flow' library.

- Each 'node' object must have: 'id', 'position: { x: 0, y: 0 }', and 'data: { label: string, type: "current" | "learningPath" | "goal", description: string, resources: { title: string, url: string }[] }'.
- 'current' type nodes are skills the user already has.
- 'learningPath' type nodes are skills the user needs to learn.
- 'goal' type node is the target role.
- Each 'edge' object must have: 'id', 'source' (a node id), and 'target' (a node id) to show learning dependencies.

Create a logical flow from the user's current skills to the final career goal. Incorporate the trending skills where relevant.

Example structure:
{
  "nodes": [
    {
      "id": "skill1",
      "position": {"x": 100, "y": 100},
      "data": {
        "label": "JavaScript",
        "type": "current",
        "description": "Core programming language",
        "resources": [{"title": "MDN Docs", "url": "https://developer.mozilla.org"}]
      }
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "source": "skill1",
      "target": "skill2"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the JSON response
    try {
      const roadmap = JSON.parse(response);
      
      // Validate the structure
      if (!roadmap.nodes || !roadmap.edges) {
        throw new Error('Invalid roadmap structure');
      }
      
      return roadmap;
    } catch (parseError) {
      console.error('Error parsing roadmap JSON:', parseError);
      // Return a fallback roadmap
      return generateFallbackRoadmap(currentUserSkills, careerGoal);
    }
  } catch (error) {
    console.error('Error generating roadmap:', error);
    throw new Error('Failed to generate roadmap');
  }
}

// Generate profile summary
async function generateProfileSummary(
  currentSkills: string, 
  interests: string, 
  goal: string, 
  roadmap: { nodes: SkillNode[]; edges: SkillEdge[] }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    const prompt = `You are a career advisor. Create a concise, professional summary (2-3 sentences) of the user's profile and career path.

**User Profile:**
- Current Skills: ${currentSkills}
- Interests: ${interests}
- Career Goal: ${goal}
- Learning Path: ${roadmap.nodes.filter(n => n.data.type === 'learningPath').length} skills to learn

Write a motivating summary that highlights their strengths and the clear path to their goal.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return response.trim() || 'Career profile analysis completed successfully.';
  } catch (error) {
    console.error('Error generating profile summary:', error);
    return 'Career profile analysis completed successfully.';
  }
}

// Fallback roadmap generator
function generateFallbackRoadmap(currentSkills: string, careerGoal: string): { nodes: SkillNode[]; edges: SkillEdge[] } {
  const skills = currentSkills.split(',').map(s => s.trim()).filter(s => s);
  
  const nodes: SkillNode[] = [
    // Current skills
    ...skills.map((skill, index) => ({
      id: `current-${index}`,
      position: { x: 100, y: 100 + index * 80 },
      data: {
        label: skill,
        type: 'current' as const,
        description: `Current skill: ${skill}`,
        resources: [{ title: 'Skill Documentation', url: '#' }]
      }
    })),
    // Learning path
    {
      id: 'learning-1',
      position: { x: 400, y: 200 },
      data: {
        label: 'Advanced Skills',
        type: 'learningPath' as const,
        description: 'Skills to develop for career advancement',
        resources: [{ title: 'Learning Resources', url: '#' }]
      }
    },
    // Goal
    {
      id: 'goal-1',
      position: { x: 700, y: 200 },
      data: {
        label: careerGoal,
        type: 'goal' as const,
        description: 'Your target career goal',
        resources: [{ title: 'Career Resources', url: '#' }]
      }
    }
  ];

  const edges: SkillEdge[] = [
    {
      id: 'edge-1',
      source: 'current-0',
      target: 'learning-1'
    },
    {
      id: 'edge-2',
      source: 'learning-1',
      target: 'goal-1'
    }
  ];

  return { nodes, edges };
}

// Save to Firestore
async function saveToFirestore(data: any): Promise<void> {
  try {
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      console.log('⚠️ Firestore not configured, skipping save');
      return;
    }

    await firestore.collection('career-profiles').add(data);
    console.log('💾 Career profile saved to Firestore');
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    // Don't throw error as this is optional
  }
}
