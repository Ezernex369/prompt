export type AppMode = 'translate' | 'guided' | 'advanced' | 'suno';

export interface TranslateFormState {
  thaiPrompt: string;
}

export interface GuidedFormState {
  role: string;
  action: string;
  goal: string;
}

export interface DialogueLine {
  id: number;
  speaker: string;
  line: string;
  timestamp: string;
}

export interface AdvancedFormState {
  subject: string;
  environment: string;
  shotSize: string;
  cameraAngle: string;
  cameraMovement: string;
  lightingStyle: string;
  visualStyle: string;
  filmStock: string;
  keywords: string;
  dialogueLines: DialogueLine[];
  mood: string;
  sceneLength: string;
  transition: string;
  reasoningStyle: string;
  generatedKnowledgeTopic: string;
}

export interface SunoFormState {
  lyrics: string;
  styleTags: string[];
  thematicContext: string;
  isInstrumental: boolean;
  lyricTheme: string;
}

export interface Message {
  text: string;
  type: 'success' | 'error';
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
}