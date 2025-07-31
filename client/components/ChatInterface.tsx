import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MessageCircle, 
  Send, 
  X, 
  ChefHat, 
  Sparkles, 
  Clock, 
  Utensils, 
  Heart,
  Zap,
  Apple,
  Coffee
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatInterfaceProps {
  children: React.ReactNode;
}

export default function ChatInterface({ children }: ChatInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'שלום! אני כאן לעזור לך לבחור מה לאכול. ספר לי על ההעדפות שלך, הדיאטה שלך, או פשוט שאל אותי מה מומלץ לאכול עכשיו! 🍽️',
      isUser: false,
      timestamp: new Date(),
      suggestions: ['מה מומלץ לארוחת בוקר?', 'אני רוצה משהו בריא', 'יש לי 30 דקות לבישול', 'אני צמחוני']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const swipeProgress = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const chatIconScale = useRef(new Animated.Value(1)).current;

  // Animate chat icon periodically
  useEffect(() => {
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(chatIconScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(chatIconScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(pulseAnimation, 3000);
      });
    };

    const timer = setTimeout(pulseAnimation, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to left swipes from the left edge
        return (
          evt.nativeEvent.pageX < 50 && 
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          gestureState.dx > 10
        );
      },
      onPanResponderGrant: () => {
        // Start tracking the swipe
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0) {
          const progress = Math.min(gestureState.dx / (screenWidth * 0.3), 1);
          swipeProgress.setValue(progress);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const shouldOpen = gestureState.dx > screenWidth * 0.15 && gestureState.dx > 0;
        
        if (shouldOpen) {
          openChat();
        } else {
          // Reset swipe progress
          Animated.spring(swipeProgress, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const openChat = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(swipeProgress, {
        toValue: 0,
        useNativeDriver: false,
      })
    ]).start();
  };

  const closeChat = () => {
    Animated.spring(translateX, {
      toValue: screenWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate AI response (for UX/UI demo)
    setTimeout(() => {
      const responses = [
        {
          text: 'זה נשמע מעולה! בהתבסס על מה שאמרת, אני ממליץ על סלט קינואה עם ירקות צבעוניים וחלבון לבחירתך. זה מזין, טעים ומתאים לדיאטה בריאה.',
          suggestions: ['איך מכינים קינואה?', 'אפשרויות חלבון', 'עוד רעיונות לסלטים']
        },
        {
          text: 'לארוחת בוקר אני ממליץ על שייק חלבון עם בננה, שיבולת שועל ושקדים. זה נותן אנרגיה לכל הבוקר ומכיל חלבון איכותי.',
          suggestions: ['מתכון לשייק', 'חלופות לבננה', 'עוד רעיונות לבוקר']
        },
        {
          text: 'עבור ארוחה מהירה, אני מציע טוסט אבוקדו עם ביצה, או סלט טונה מהיר. שתי האפשרויות לוקחות פחות מ-10 דקות להכנה.',
          suggestions: ['מתכון טוסט אבוקדו', 'רעיונות לסלט טונה', 'עוד ארוחות מהירות']
        }
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse.text,
        isUser: false,
        timestamp: new Date(),
        suggestions: randomResponse.suggestions,
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Swipe indicator overlay
  const swipeIndicatorOpacity = swipeProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 1],
  });

  const swipeIndicatorScale = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <View style={styles.container}>
      {/* Main content with pan responder */}
      <View style={styles.mainContent} {...panResponder.panHandlers}>
        {children}
      </View>

      {/* Floating Chat Icon */}
      <Animated.View 
        style={[
          styles.floatingChatIcon,
          {
            transform: [{ scale: chatIconScale }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.chatIconButton}
          onPress={openChat}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#16A085', '#1ABC9C']}
            style={styles.chatIconGradient}
          >
            <MessageCircle size={28} color="#FFFFFF" />
            <View style={styles.chatIconBadge}>
              <ChefHat size={12} color="#16A085" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipe indicator */}
      <Animated.View 
        style={[
          styles.swipeIndicator,
          {
            opacity: swipeIndicatorOpacity,
            transform: [{ scale: swipeIndicatorScale }]
          }
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['#16A085', '#1ABC9C']}
          style={styles.swipeIndicatorGradient}
        >
          <MessageCircle size={32} color="#FFFFFF" />
          <Text style={styles.swipeIndicatorText}>החלק ימינה לצ'אט</Text>
        </LinearGradient>
      </Animated.View>

      {/* Chat Interface */}
      {isOpen && (
        <Animated.View 
          style={[
            styles.chatContainer,
            {
              transform: [{ translateX }]
            }
          ]}
        >
          <LinearGradient
            colors={['#F8F9FA', '#FFFFFF']}
            style={styles.chatGradient}
          >
            <SafeAreaView style={styles.chatSafeArea}>
              {/* Chat Header */}
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <View style={styles.chatIconContainer}>
                    <LinearGradient
                      colors={['#16A085', '#1ABC9C']}
                      style={styles.chatHeaderIconGradient}
                    >
                      <ChefHat size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View>
                    <Text style={styles.chatTitle}>יועץ תזונה AI</Text>
                    <Text style={styles.chatSubtitle}>מה נאכל היום?</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeChat}
                  accessibilityLabel="סגור צ'אט"
                  accessibilityRole="button"
                >
                  <X size={24} color="#2C3E50" />
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <ScrollView 
                ref={scrollViewRef}
                style={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((message) => (
                  <View key={message.id} style={styles.messageWrapper}>
                    <View style={[
                      styles.messageBubble,
                      message.isUser ? styles.userMessage : styles.botMessage
                    ]}>
                      {!message.isUser && (
                        <View style={styles.botIconContainer}>
                          <Sparkles size={16} color="#16A085" />
                        </View>
                      )}
                      <Text style={[
                        styles.messageText,
                        message.isUser ? styles.userMessageText : styles.botMessageText
                      ]}>
                        {message.text}
                      </Text>
                      <Text style={[
                        styles.messageTime,
                        message.isUser ? styles.userMessageTime : styles.botMessageTime
                      ]}>
                        {message.timestamp.toLocaleTimeString('he-IL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>

                    {/* Suggestions */}
                    {message.suggestions && (
                      <View style={styles.suggestionsContainer}>
                        {message.suggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionButton}
                            onPress={() => handleSuggestionPress(suggestion)}
                          >
                            <LinearGradient
                              colors={['#E8F8F5', '#F0FDF4']}
                              style={styles.suggestionGradient}
                            >
                              <Text style={styles.suggestionText}>{suggestion}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <View style={styles.typingContainer}>
                    <View style={styles.typingBubble}>
                      <View style={styles.typingDots}>
                        <View style={[styles.typingDot, styles.typingDot1]} />
                        <View style={[styles.typingDot, styles.typingDot2]} />
                        <View style={[styles.typingDot, styles.typingDot3]} />
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Input Area */}
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
              >
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="שאל אותי מה לאכול..."
                    placeholderTextColor="#A0AEC0"
                    multiline
                    maxLength={500}
                    textAlign="right"
                    onSubmitEditing={() => sendMessage(inputText)}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!inputText.trim() || isTyping) && styles.sendButtonDisabled
                    ]}
                    onPress={() => sendMessage(inputText)}
                    disabled={!inputText.trim() || isTyping}
                  >
                    <LinearGradient
                      colors={
                        inputText.trim() && !isTyping 
                          ? ['#16A085', '#1ABC9C'] 
                          : ['#E2E8F0', '#CBD5E0']
                      }
                      style={styles.sendButtonGradient}
                    >
                      <Send size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Quick actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity 
                    style={styles.quickAction}
                    onPress={() => sendMessage('מה מומלץ לארוחת בוקר?')}
                  >
                    <Coffee size={16} color="#16A085" />
                    <Text style={styles.quickActionText}>ארוחת בוקר</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAction}
                    onPress={() => sendMessage('משהו מהיר להכנה')}
                  >
                    <Clock size={16} color="#16A085" />
                    <Text style={styles.quickActionText}>מהיר</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAction}
                    onPress={() => sendMessage('משהו בריא ומזין')}
                  >
                    <Heart size={16} color="#16A085" />
                    <Text style={styles.quickActionText}>בריא</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickAction}
                    onPress={() => sendMessage('רעיונות לחטיפים')}
                  >
                    <Apple size={16} color="#16A085" />
                    <Text style={styles.quickActionText}>חטיפים</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  floatingChatIcon: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 999,
  },
  chatIconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  chatIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chatIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIndicator: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  swipeIndicatorGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  swipeIndicatorText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  chatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  chatGradient: {
    flex: 1,
  },
  chatSafeArea: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  chatHeaderIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-SemiBold',
    color: '#1A202C',
  },
  chatSubtitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#718096',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
  },
  userMessage: {
    backgroundColor: '#16A085',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 8,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    paddingTop: 20,
  },
  botIconContainer: {
    position: 'absolute',
    top: -8,
    left: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    lineHeight: 22,
    textAlign: 'right',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#1A202C',
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    marginTop: 8,
    textAlign: 'right',
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  botMessageTime: {
    color: '#A0AEC0',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  suggestionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  suggestionGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#16A085',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#16A085',
  },
  typingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A085',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    color: '#1A202C',
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#16A085',
  },
});