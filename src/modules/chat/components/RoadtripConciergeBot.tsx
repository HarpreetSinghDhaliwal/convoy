import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card, Avatar } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";

interface BotMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

const INITIAL_BOT_MESSAGES: BotMessage[] = [
  {
    id: "m-1",
    sender: "bot",
    text: "👋 Hey Roadtripper! I'm your Convoy AI Roadtrip Concierge. How can I assist your journey today?",
    time: "Just now",
  },
  {
    id: "m-2",
    sender: "bot",
    text: "Ask me about scenic routes, best highway dhabas 🍲, fuel cost splitting ⛽, luggage etiquette 🎒, or road safety tips 🛡️!",
    time: "Just now",
  },
];

const SUGGESTIONS = [
  "🍲 Best Dhabas on Delhi-Manali NH44",
  "⛽ How is fuel split calculated?",
  "🎒 Carpool boot luggage etiquette",
  "🛡️ Emergency & SOS safety tips",
  "🎵 Top roadtrip playlist vibes",
];

export function RoadtripConciergeBot() {
  const [messages, setMessages] = useState<BotMessage[]>(INITIAL_BOT_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  function getBotResponse(query: string): string {
    const q = query.toLowerCase();

    if (q.includes("dhaba") || q.includes("food") || q.includes("eat") || q.includes("restaurant") || q.includes("manali")) {
      return "🍲 Top Highway Pitstops:\n• Murthal (NH44): Sukhdev Dhaba & Gulshan Dhaba for piping hot tandoori parathas with white butter & kulhad chai ☕.\n• Karnal: Haveli for authentic Punjabi thali & clean washrooms.\n• Mandi-Kullu: River-view cafes along the Beas River for Maggi & mountain coffee.";
    }

    if (q.includes("fuel") || q.includes("cost") || q.includes("split") || q.includes("price") || q.includes("toll")) {
      return "⛽ Fuel Split Principles on Convoy:\n• Standard shared formula: (Total Distance km × ₹8/km + Tolls) ÷ Total Vehicle Occupants.\n• Hosts publish transparent per-seat fuel contributions so everyone shares travel costs fairly with zero surge pricing!";
    }

    if (q.includes("luggage") || q.includes("bag") || q.includes("boot") || q.includes("space")) {
      return "🎒 Roadtrip Luggage Best Practices:\n1. 1 Medium duffel or cabin bag + 1 personal backpack per traveler.\n2. Coordinate in trip chat if bringing sports gear, trekking bags, or bulky items.\n3. Keep essentials (water, powerbank, jacket) with you in the cabin.";
    }

    if (q.includes("safety") || q.includes("sos") || q.includes("emergency") || q.includes("women")) {
      return "🛡️ Safety on Convoy:\n• 1-Tap SOS Button in every trip chat alerts your emergency contacts & Convoy safety team.\n• Verified badges require Govt ID/Driving License KYC.\n• Women-Only filters allow solo women to travel strictly with verified female co-passengers.";
    }

    if (q.includes("music") || q.includes("playlist") || q.includes("aux") || q.includes("song")) {
      return "🎵 Roadtrip Music Vibes:\n• Mountain Drives: Indie acoustic, Prateek Kuhad, Kishore Kumar classics, Coldplay.\n• Night Highway Cruising: Synthwave, Punjabi beats, Coke Studio melodies.\n• Tip: Always share Spotify/Apple Music playlist links in your trip group chat beforehand!";
    }

    return "🚙 That's a great roadtrip question! Connect with fellow travelers in your trip group chat to coordinate exact pickup timings, music playlists, and scenic photo stops along your route. Have an amazing drive!";
  }

  function handleSendText(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: BotMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = getBotResponse(text);
      const botMsg: BotMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: reply,
        time: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 600);
  }

  return (
    <View style={styles.container}>
      {/* Suggestions Chips Bar */}
      <View style={styles.suggestionsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SUGGESTIONS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.suggestionsContent}
          renderItem={({ item }) => (
            <Pressable style={styles.chip} onPress={() => handleSendText(item)}>
              <Text style={styles.chipText}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Messages Feed */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const isUser = item.sender === "user";
          return (
            <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
              {!isUser && (
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarEmoji}>🤖</Text>
                </View>
              )}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextBot}>{item.text}</Text>
                <Text style={isUser ? styles.timeUser : styles.timeBot}>{item.time}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          typing ? (
            <View style={[styles.msgRow, styles.msgRowBot]}>
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarEmoji}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleBot, { paddingVertical: spacing.sm }]}>
                <Text style={styles.typingText}>Concierge is writing…</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputDock}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything about roadtrips, routes, fuel..."
            placeholderTextColor={colors.inkSubtle}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSendText()}
          />
          <Button
            label="Send"
            onPress={() => handleSendText()}
            disabled={!input.trim()}
            variant="primary"
            size="md"
            style={styles.sendBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  suggestionsWrap: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  suggestionsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    ...typography.caption,
    color: colors.ink,
    fontSize: 12,
  },
  messagesList: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  msgRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginVertical: 2,
  },
  msgRowUser: {
    justifyContent: "flex-end",
  },
  msgRowBot: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  botAvatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: radius.xs,
  },
  bubbleBot: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleTextUser: {
    ...typography.body,
    color: colors.inkLight,
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextBot: {
    ...typography.body,
    color: colors.ink,
    fontSize: 13.5,
    lineHeight: 19,
  },
  timeUser: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
    marginTop: 4,
  },
  timeBot: {
    fontSize: 10,
    color: colors.inkSubtle,
    textAlign: "right",
    marginTop: 4,
  },
  typingText: {
    ...typography.caption,
    color: colors.inkMuted,
    fontStyle: "italic",
  },
  inputDock: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
    alignItems: "center",
    ...shadows.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    fontSize: 13.5,
    color: colors.ink,
  },
  sendBtn: {
    minWidth: 70,
  },
});
