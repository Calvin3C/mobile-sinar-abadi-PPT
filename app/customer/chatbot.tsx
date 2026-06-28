import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { Send, MessageCircle, Bot, User, AlertCircle } from 'lucide-react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, Shadows } from '../../constants/theme';
import api from '../../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

// Simple markdown-like renderer for AI responses
function renderFormattedText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    // Handle bold text (**text**)
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const lineElements: React.ReactNode[] = [];

    parts.forEach((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        lineElements.push(
          <Text key={`${lineIdx}-${partIdx}`} style={{ fontWeight: Fonts.bold }}>
            {part.slice(2, -2)}
          </Text>
        );
      } else {
        // Handle bullet points
        const bulletMatch = part.match(/^(\s*[-•]\s+)(.*)/);
        if (bulletMatch) {
          lineElements.push(
            <Text key={`${lineIdx}-${partIdx}`}>
              {'  • '}{bulletMatch[2]}
            </Text>
          );
        } else {
          lineElements.push(
            <Text key={`${lineIdx}-${partIdx}`}>{part}</Text>
          );
        }
      }
    });

    elements.push(
      <Text key={`line-${lineIdx}`} style={styles.messageLineText}>
        {lineElements}
        {lineIdx < lines.length - 1 ? '\n' : ''}
      </Text>
    );
  });

  return elements;
}

// Typing indicator with animated dots
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );

    const anim1 = createDotAnimation(dot1, 0);
    const anim2 = createDotAnimation(dot2, 200);
    const anim3 = createDotAnimation(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => { anim1.stop(); anim2.stop(); anim3.stop(); };
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.typingBubble}>
      <View style={styles.typingAvatarContainer}>
        <Bot size={14} color={Colors.primary} />
      </View>
      <View style={styles.typingDotsContainer}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, dotStyle(dot)]} />
        ))}
      </View>
    </View>
  );
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    scrollToEnd();

    try {
      // Build history payload matching the web's format
      const history = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await api.post('/chatbot', { history });

      const aiReply = response.data?.reply;
      if (aiReply) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: aiReply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('No reply from AI');
      }
    } catch (error: any) {
      const isNetworkError = !error.response;
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: isNetworkError
          ? 'Terjadi kesalahan jaringan, silakan coba lagi.'
          : 'Maaf, saya sedang tidak dapat terhubung dengan server saat ini.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      scrollToEnd();
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageBubbleWrapper, isUser ? styles.userBubbleWrapper : styles.assistantBubbleWrapper]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Bot size={16} color={Colors.primary} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          item.isError && styles.errorBubble,
        ]}>
          {item.isError && (
            <View style={styles.errorHeader}>
              <AlertCircle size={14} color={Colors.danger} />
              <Text style={styles.errorHeaderText}>Error</Text>
            </View>
          )}
          {isUser ? (
            <Text style={styles.userMessageText}>{item.text}</Text>
          ) : (
            <View style={styles.assistantMessageContent}>
              {renderFormattedText(item.text)}
            </View>
          )}
        </View>
        {isUser && (
          <View style={[styles.avatarContainer, styles.userAvatarContainer]}>
            <User size={16} color={Colors.white} />
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <MessageCircle size={40} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Halo! Saya Konsultan Proyek{'\n'}Sinar Abadi. 👋</Text>
      <Text style={styles.emptySubtitle}>
        Tanyakan kebutuhan material bangunan Anda, dan saya akan merekomendasikan produk serta menghitung kebutuhan Anda.
      </Text>
      <View style={styles.suggestionContainer}>
        {[
          'Butuh berapa sak semen untuk ukuran 4x5 meter?',
          'Rekomendasi cat tembok untuk ruang tamu',
          'Hitung kebutuhan pipa untuk 2 kamar mandi',
        ].map((suggestion, idx) => (
          <Pressable
            key={idx}
            style={styles.suggestionChip}
            onPress={() => {
              setInputText(suggestion);
            }}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.chatContent,
          messages.length === 0 && styles.chatContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
        onContentSizeChange={scrollToEnd}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Tanya sesuatu..."
            placeholderTextColor={Colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
        </View>
        <Pressable
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Send size={20} color={Colors.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chatContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: Fonts.extrabold,
    color: Colors.textMain,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  suggestionContainer: {
    gap: Spacing.sm,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  suggestionText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: Fonts.medium,
    textAlign: 'center',
  },

  // Message Bubbles
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  userBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  assistantBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  userAvatarContainer: {
    backgroundColor: Colors.primary,
    marginRight: 0,
    marginLeft: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm,
  },
  assistantBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  errorBubble: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  errorHeaderText: {
    fontSize: FontSizes.xs,
    fontWeight: Fonts.bold,
    color: Colors.danger,
  },
  userMessageText: {
    fontSize: FontSizes.base,
    color: Colors.white,
    lineHeight: 22,
  },
  assistantMessageContent: {
    // Container for formatted text
  },
  messageLineText: {
    fontSize: FontSizes.base,
    color: Colors.textMain,
    lineHeight: 22,
  },

  // Typing Indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typingAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderBottomLeftRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 6,
    ...Shadows.sm,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.xs,
    maxHeight: 120,
  },
  textInput: {
    fontSize: FontSizes.base,
    color: Colors.textMain,
    minHeight: 40,
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
    ...Shadows.sm,
  },
});
