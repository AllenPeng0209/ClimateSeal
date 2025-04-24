import React, { useState, useEffect } from 'react';

export function useChatHistory(chatId: string) {
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fetchChatHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chat/${chatId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        const data = await response.json();
        setChatHistory(data);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [chatId, isClient]);

  return { chatHistory, isLoading };
} 