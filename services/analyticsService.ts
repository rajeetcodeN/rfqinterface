import { InteractionEvent, SessionIntent, IntentLevel } from '../types';

// In-memory store for the session (mocking a backend)
let currentSessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
const eventLog: InteractionEvent[] = [];
let sessionScore = 0;

export const initSession = () => {
  currentSessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
  sessionScore = 0;
  logEvent('page_view', 'Customer started exploratory session');
};

export const logEvent = (
  action: InteractionEvent['action'], 
  details?: string, 
  metadata?: any
) => {
  const event: InteractionEvent = {
    id: `evt_${Date.now()}`,
    sessionId: currentSessionId,
    timestamp: Date.now(),
    action,
    details,
    metadata
  };

  eventLog.push(event);
  updateIntentScore(action);
  
  // In a real app, this would beacon to an API endpoint
  console.log('[Signal Capture]', action, details, `Score: ${sessionScore}`);
  
  return event;
};

// Calculate intent based on behavioral weight
const updateIntentScore = (action: InteractionEvent['action']) => {
  switch (action) {
    case 'page_view':
      sessionScore += 5;
      break;
    case 'material_change':
      // Trying different materials implies evaluation
      sessionScore += 10; 
      break;
    case 'quantity_change':
      // Checking price breaks implies commercial intent
      sessionScore += 15; 
      break;
    case 'dimension_edit':
      // User correcting AI data means high engagement
      sessionScore += 25; 
      break;
    case 'upload_attempt':
      // Has specific geometry to price
      sessionScore += 50; 
      break;
    case 'view_estimate':
      sessionScore += 20;
      break;
    case 'submit_rfq':
      sessionScore += 100;
      break;
  }
};

export const getIntentLevel = (): IntentLevel => {
  if (sessionScore > 80) return 'High (Commitment)';
  if (sessionScore > 30) return 'Medium (Evaluation)';
  return 'Low (Browsing)';
};

export const getSessionScore = () => sessionScore;

// Helper to generate mock stream for the dashboard
export const generateMockStream = (): InteractionEvent[] => {
  const actions: InteractionEvent['action'][] = ['material_change', 'quantity_change', 'upload_attempt', 'view_estimate'];
  const materials = ['Steel C45', 'Alu 6061', 'SS 304'];
  
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `mock_${Date.now()}_${i}`,
    sessionId: `anon_${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now() - (i * 1000 * 60), // minutes ago
    action: actions[Math.floor(Math.random() * actions.length)],
    details: `Evaluated ${materials[Math.floor(Math.random() * materials.length)]}`,
  }));
};