import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { sendToGemini } from "./gemini";

const themes = {
  dark: {
    background: "#101218",
    surface: "#1d2028",
    headerBorder: "#2b2d36",
    border: "#383a45",
    brandSurface: "#27243e",
    accent: "#a8a2ff",
    accentText: "#b4adff",
    title: "#f1f0f7",
    text: "#f1f0f7",
    secondaryText: "#a5a7b2",
    subtitle: "#9b9daa",
    buttonSurface: "#252630",
    buttonText: "#d8d6e3",
    userBubble: "#343343",
    assistantBubble: "#1d2028",
    inputPlaceholder: "#858895",
    errorSurface: "#402629",
    errorText: "#ffc4c4",
    sendText: "#171624",
  },
  light: {
    background: "#f7f7fb",
    surface: "#ffffff",
    headerBorder: "#e5e6ed",
    border: "#d8d9e2",
    brandSurface: "#edeaff",
    accent: "#6558d3",
    accentText: "#6558d3",
    title: "#1c1c24",
    text: "#252530",
    secondaryText: "#626370",
    subtitle: "#6c6d79",
    buttonSurface: "#edecf5",
    buttonText: "#393747",
    userBubble: "#e8e4ff",
    assistantBubble: "#ffffff",
    inputPlaceholder: "#777984",
    errorSurface: "#ffeded",
    errorText: "#9d2222",
    sendText: "#ffffff",
  },
};

function getErrorMessage(error) {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  let response;
  try {
    response = JSON.parse(error.message);
  } catch (parseError) {
    if (!(parseError instanceof SyntaxError)) throw parseError;
    return error.message || "Something went wrong. Please try again.";
  }

  const apiError =
    response && typeof response === "object" ? response.error : null;
  if (apiError?.code === 503 || apiError?.status === "UNAVAILABLE") {
    return "Gemini is temporarily busy. Your prompt is still in the box—wait a moment, then tap Send to retry.";
  }
  if (apiError?.code === 429 || apiError?.status === "RESOURCE_EXHAUSTED") {
    return "Gemini is receiving too many requests. Wait a little, then try again.";
  }

  if (/timed? ?out|timeout|aborted/i.test(error.message)) {
    return "Gemini took too long to respond. Check your connection, then try again.";
  }

  return (
    (typeof apiError?.message === "string" && apiError.message) ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const scrollView = useRef(null);
  const activeRequestId = useRef(0);
  const theme = isDarkMode ? themes.dark : themes.light;

  function handleNewChat() {
    activeRequestId.current += 1;
    setMessages([]);
    setInput("");
    setError("");
    setIsSending(false);
  }

  async function handleSend() {
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const requestId = ++activeRequestId.current;
    const history = messages.map(({ role, text }) => ({ role, text }));
    setMessages((current) => [...current, { role: "user", text: prompt }]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const reply = await sendToGemini(prompt, history);
      if (requestId !== activeRequestId.current) return;
      setMessages((current) => [...current, { role: "model", text: reply }]);
    } catch (sendError) {
      if (requestId !== activeRequestId.current) return;
      setMessages((current) => current.slice(0, -1));
      setInput(prompt);
      setError(getErrorMessage(sendError));
    } finally {
      if (requestId === activeRequestId.current) setIsSending(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View style={[styles.header, { borderBottomColor: theme.headerBorder }]}>
          <View style={[styles.brandMark, { backgroundColor: theme.brandSurface }]}>
            <Text style={[styles.brandMarkText, { color: theme.accentText }]}>✦</Text>
          </View>
          <View>
            <Text style={[styles.title, { color: theme.title }]}>Gemini</Text>
            <Text style={[styles.subtitle, { color: theme.subtitle }]}>
              Your AI assistant
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            onPress={() => setIsDarkMode((current) => !current)}
            style={[
              styles.themeButton,
              { backgroundColor: theme.buttonSurface },
            ]}
          >
            <Text style={[styles.themeButtonText, { color: theme.buttonText }]}>
              {isDarkMode ? "Light" : "Dark"}
            </Text>
          </Pressable>
          {messages.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start a new chat"
              onPress={handleNewChat}
              style={[styles.newChatButton, { backgroundColor: theme.buttonSurface }]}
            >
              <Text style={[styles.newChatText, { color: theme.buttonText }]}>
                New chat
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          ref={scrollView}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollView.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <Text style={[styles.welcomeSpark, { color: theme.accent }]}>✦</Text>
              <Text style={[styles.welcomeTitle, { color: theme.title }]}>
                What can I help with?
              </Text>
              <Text style={[styles.welcomeCopy, { color: theme.secondaryText }]}>
                Ask a question, explore an idea, or get help with something
                you&apos;re working on.
              </Text>
            </View>
          ) : (
            messages.map((message, index) => (
              <View
                key={`${index}-${message.role}`}
                style={[
                  styles.messageRow,
                  message.role === "user" && styles.userMessageRow,
                ]}
              >
                {message.role !== "user" && (
                  <View style={[styles.assistantMark, { backgroundColor: theme.brandSurface }]}>
                    <Text style={[styles.assistantMarkText, { color: theme.accentText }]}>
                      ✦
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    {
                      backgroundColor:
                        message.role === "user"
                          ? theme.userBubble
                          : theme.assistantBubble,
                    },
                    message.role === "user" && styles.userBubble,
                    message.role !== "user" && styles.assistantBubble,
                  ]}
                >
                  <Text style={[styles.messageText, { color: theme.text }]}>
                    {message.text}
                  </Text>
                </View>
              </View>
            ))
          )}
          {isSending && (
            <View style={styles.loadingRow}>
              <View style={[styles.assistantMark, { backgroundColor: theme.brandSurface }]}>
                <Text style={[styles.assistantMarkText, { color: theme.accentText }]}>
                  ✦
                </Text>
              </View>
              <ActivityIndicator color={theme.accent} size="small" />
              <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
                Thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        {error ? (
          <View
            accessibilityRole="alert"
            style={[styles.errorBanner, { backgroundColor: theme.errorSurface }]}
          >
            <Text style={[styles.errorText, { color: theme.errorText }]}>{error}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.composer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            accessibilityLabel="Message Gemini"
            style={[styles.input, { color: theme.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Message Gemini"
            placeholderTextColor={theme.inputPlaceholder}
            multiline
            maxLength={4000}
            editable={!isSending}
            textAlignVertical="center"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={handleSend}
            disabled={!input.trim() || isSending}
            style={[
              styles.sendButton,
              { backgroundColor: theme.accent },
              (!input.trim() || isSending) && styles.sendButtonDisabled,
            ]}
          >
            <Text style={[styles.sendButtonText, { color: theme.sendText }]}>↑</Text>
          </Pressable>
        </View>
        <Text style={[styles.disclaimer, { color: theme.subtitle }]}>
          Gemini can make mistakes. Check important information.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#101218",
  },
  container: {
    flex: 1,
    backgroundColor: "#101218",
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2b2d36",
  },
  brandMark: {
    width: 38,
    height: 38,
    marginRight: 12,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27243e",
  },
  brandMarkText: {
    fontSize: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  newChatButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  themeButton: {
    marginLeft: "auto",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  themeButtonText: {
    fontSize: 13,
  },
  newChatText: {
    fontSize: 13,
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  welcome: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  welcomeSpark: {
    fontSize: 42,
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 25,
    fontWeight: "600",
    textAlign: "center",
  },
  welcomeCopy: {
    maxWidth: 310,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  assistantMark: {
    width: 28,
    height: 28,
    marginRight: 9,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27243e",
  },
  assistantMarkText: {
    fontSize: 17,
  },
  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
  },
  userBubble: {
    borderTopRightRadius: 5,
  },
  assistantBubble: {
    borderTopLeftRadius: 5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  loadingText: {
    marginLeft: 9,
    fontSize: 13,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 11,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
  },
  composer: {
    minHeight: 54,
    maxHeight: 140,
    marginHorizontal: 14,
    paddingLeft: 16,
    paddingRight: 7,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 28,
  },
  input: {
    flex: 1,
    maxHeight: 112,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    marginLeft: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    fontSize: 23,
    fontWeight: "600",
    lineHeight: 27,
  },
  disclaimer: {
    paddingTop: 8,
    paddingBottom: 9,
    fontSize: 11,
    textAlign: "center",
  },
});