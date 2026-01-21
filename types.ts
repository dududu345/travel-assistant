
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface TravelPolicyQuery {
  unit: string;
  level: string;
  destination: string;
}
