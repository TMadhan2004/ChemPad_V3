import { useRef, useEffect } from "react";

interface ChatMessage {
  role: string;
  text: string;
  hideInChat?: boolean;
  isError?: boolean;
  smiles?: string;
}

interface ChatFormProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  generateBotResponse: (history: ChatMessage[]) => void;
}

import * as KekuleUtils from '@src/utils/KekuleUtils';

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }: ChatFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ensure the input field has proper styling
    if (inputRef.current) {
      inputRef.current.style.borderRadius = "24px";
    }
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current) return;
    
    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;
    
    inputRef.current.value = "";

    // Extract SMILES from Kekule (current molecule)
    let smiles = '';
    try {
      smiles = KekuleUtils.getSmiles();
    } catch (e) {
      console.error('Could not extract SMILES:', e);
    }
    console.log('SMILES sent to bot:', smiles);

    // Update chat history with the user's message
    setChatHistory((history) => [...history, { role: "user", text: userMessage, smiles }]);

    // Generate the bot's response immediately, passing SMILES as context
    // Option 1: If generateBotResponse accepts extra context
    generateBotResponse([
      ...chatHistory,
      { role: "user", text: userMessage, smiles }
    ]);
    // Option 2: If generateBotResponse only accepts text, you can append the SMILES to the message or refactor as needed
    // generateBotResponse([...chatHistory, { role: "user", text: userMessage + (smiles ? `\n[SMILES: ${smiles}]` : '') }]);
  };


  return (
    <form onSubmit={handleFormSubmit} className="chat-form">
      <input 
        ref={inputRef} 
        placeholder="Ask something about ChemPad..." 
        className="message-input" 
        required 
      />
      <button type="submit" className="send-btn">
        <span className="material-symbols-rounded">send</span>
      </button>
    </form>
  );
};

export default ChatForm;