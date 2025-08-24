import React from 'react';
import { Card, CardContent } from './ui/card';
import { Mic, User, Bot } from 'lucide-react';

interface ConversationPart {
  text: string;
}

interface ConversationMessage {
  role: 'user' | 'model';
  parts: ConversationPart[];
}

interface ConversationDisplayProps {
  conversationHistory: ConversationMessage[];
}

export const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ 
  conversationHistory 
}) => {
  if (!conversationHistory || conversationHistory.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No conversation yet</p>
            <p className="text-sm">Start your interview to see the conversation here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 overflow-hidden">
      <CardContent className="p-0 h-full">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {conversationHistory.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'model' && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm leading-relaxed">
                  {message.parts[0]?.text || 'No text content'}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
