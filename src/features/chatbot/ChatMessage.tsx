import ChatbotIcon from './ChatbotIcon';

interface ChatMessageProps {
  chat: {
    role: string;
    text: string;
    hideInChat?: boolean;
    isError?: boolean;
  };
}

const ChatMessage = ({ chat }: ChatMessageProps) => {
  if (chat.hideInChat) return null;
  
  return (
    <div className={`message ${chat.role === "user" ? "user-message" : "bot-message"} ${chat.isError ? "error" : ""}`}>
      {chat.role === "bot" && <div className="bot-icon"><ChatbotIcon /></div>}
      <div className="message-content">
  {chat.role === "bot"
    ? <span dangerouslySetInnerHTML={{ __html: chat.text }} />
    : chat.text}
</div>
    </div>
  );
};

export default ChatMessage;