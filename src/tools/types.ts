export interface OcrResponse {
  pages: Array<{
    index: number;
    markdown: string;
    images?: Array<{ url: string; bbox?: any }>;
    tables?: Array<{ html?: string; markdown?: string }>;
    hyperlinks?: Array<{ text: string; url: string }>;
    header?: string | null;
    footer?: string | null;
    dimensions?: any;
    confidence_scores?: any;
  }>;
  model: string;
  usage_info?: any;
}

export interface TtsResponse {
  audio_data: string; // base64
  model: string;
}

export interface SttResponse {
  text: string;
  model: string;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
    speaker?: string;
  }>;
  language?: string;
}
