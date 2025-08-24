import { Request, Response } from 'express';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Firestore } from '@google-cloud/firestore';

// Initialize Google Cloud clients
const speechClient = new SpeechClient();
const ttsClient = new TextToSpeechClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const firestore = new Firestore();

// Types
interface ConversationPart {
  text: string;
}

interface ConversationMessage {
  role: 'user' | 'model';
  parts: ConversationPart[];
}

interface InterviewRequest {
  audio: string;
  conversationHistory: ConversationMessage[];
  jobRole: string;
}

interface InterviewResponse {
  newHistory: ConversationMessage[];
  responseAudio: string;
}

// System prompt for Gemini AI
const getSystemPrompt = (jobRole: string): string => `
You are an expert technical interviewer named 'Alex'. Your goal is to conduct a realistic and challenging mock interview.

- The user is applying for the role of: ${jobRole}.
- Your tone should be professional, encouraging, but firm.
- Ask a mix of behavioral, technical, and role-specific questions.
- Keep your questions concise. Ask only one question at a time.
- After the user provides an answer, provide brief, constructive feedback in 1-2 sentences before asking the next question. Example: "That's a solid explanation of the concept, but you could have mentioned X. Now, let's move on. My next question is..."
- Start the interview by introducing yourself and stating the role you are interviewing for.
- If this is the first message (empty conversation history), start with an introduction and your first question.
- Keep your responses under 150 words to maintain natural speech flow.
`;

export const interviewController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { audio, conversationHistory, jobRole }: InterviewRequest = req.body;

    // Validate input
    if (!audio || !jobRole) {
      res.status(400).json({ error: 'Missing required fields: audio and jobRole' });
      return;
    }

    console.log(`🎤 Processing interview for role: ${jobRole}`);
    console.log(`📝 Conversation history length: ${conversationHistory?.length || 0}`);

    // Step 1: Decode base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log(`🔊 Audio buffer size: ${audioBuffer.length} bytes`);

    // Step 2: Transcribe audio using Google Cloud Speech-to-Text
    const transcription = await transcribeAudio(audioBuffer);
    console.log(`📝 User said: "${transcription}"`);

    // Step 3: Prepare conversation history for Gemini
    const updatedHistory = [...(conversationHistory || [])];
    
    // Add user's transcribed response
    if (transcription.trim()) {
      updatedHistory.push({
        role: 'user',
        parts: [{ text: transcription }]
      });
    }

    // Step 4: Get AI response from Gemini
    const aiResponse = await getAIResponse(updatedHistory, jobRole);
    console.log(`🤖 AI response: "${aiResponse}"`);

    // Step 5: Generate speech from AI response
    const responseAudio = await generateSpeech(aiResponse);
    console.log(`🔊 Generated audio response: ${responseAudio.length} characters`);

    // Step 6: Update conversation history with AI response
    updatedHistory.push({
      role: 'model',
      parts: [{ text: aiResponse }]
    });

    // Step 7: Save to Firestore (optional)
    await saveToFirestore(jobRole, updatedHistory);

    // Step 8: Return response
    const response: InterviewResponse = {
      newHistory: updatedHistory,
      responseAudio
    };

    res.json(response);
    console.log(`✅ Interview response sent successfully`);

  } catch (error) {
    console.error('❌ Error in interview controller:', error);
    res.status(500).json({ 
      error: 'Failed to process interview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to transcribe audio
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const audio = {
      content: audioBuffer.toString('base64')
    };

    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      model: 'latest_long',
      useEnhanced: true,
    };

    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join(' ');

    return transcription || '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// Helper function to get AI response from Gemini
async function getAIResponse(conversationHistory: ConversationMessage[], jobRole: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    const systemPrompt = getSystemPrompt(jobRole);
    
    // Prepare messages for Gemini
    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory
    ];

    const result = await model.generateContent({
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300,
      },
    });

    const response = result.response.text();
    return response || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new Error('Failed to get AI response');
  }
}

// Helper function to generate speech from text
async function generateSpeech(text: string): Promise<string> {
  try {
    const request = {
      input: { text: text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F',
        ssmlGender: 'FEMALE' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.9,
        pitch: 0,
        volumeGainDb: 0,
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    if (response.audioContent) {
      return response.audioContent.toString('base64');
    } else {
      throw new Error('No audio content generated');
    }
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech');
  }
}

// Helper function to save to Firestore
async function saveToFirestore(jobRole: string, conversationHistory: ConversationMessage[]): Promise<void> {
  try {
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      console.log('⚠️ Firestore not configured, skipping save');
      return;
    }

    const interviewData = {
      jobRole,
      createdAt: new Date(),
      history: conversationHistory.map(msg => ({
        role: msg.role,
        text: msg.parts[0]?.text || ''
      })),
      updatedAt: new Date()
    };

    await firestore.collection('interviews').add(interviewData);
    console.log('💾 Interview saved to Firestore');
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    // Don't throw error as this is optional
  }
}
