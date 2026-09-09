import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button, Card, Badge, Avatar, TextField } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { signOut, useAuthSession } from "@/modules/auth";
import { useKycStatus } from "@/modules/kyc";
import { useUserProfile } from "@/modules/profile";
import { usePendingRatings, useUserRatings } from "@/modules/ratings";

const AVATAR_OPTIONS = [
  { id: "🚗", label: "Roadtripper" },
  { id: "⛰️", label: "Mountain Trekker" },
  { id: "🧭", label: "Wayfarer" },
  { id: "⛺", label: "Camper" },
  { id: "🏙️", label: "Urban Commuter" },
  { id: "🌊", label: "Coastal Nomad" },
];

export default function Account() {
  const { session } = useAuthSession();
  const { status, isVerified, loading: kycLoading } = useKycStatus();
  const { profile, updateProfile, loading: profileLoading } = useUserProfile();
  const { ratings: userRatings, aggregate } = useUserRatings(
    session?.user.id,
    session?.user.id,
  );
  const { pending: pendingRatings } = usePendingRatings();

  // Edit Profile Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("🚗");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  function openEditModal() {
    setEditName(profile?.name ?? "");
    setEditPhone(profile?.phone ?? "");
    setEditAvatar(profile?.photoUrl ?? "🚗");
    setEditError(undefined);
    setIsEditing(true);
  }

  async function handleSaveProfile() {
    if (!editName.trim() || editName.trim().length < 2) {
      setEditError("Please enter your full legal name");
      return;
    }
    const digits = editPhone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setEditError("Please enter a valid 10-digit mobile number");
      return;
    }

    setEditSaving(true);
    setEditError(undefined);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: digits,
        photoUrl: editAvatar,
      });
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't update profile");
    } finally {
      setEditSaving(false);
    }
  }

  const displayName = profile?.name || session?.user.email?.split("@")[0] || "Traveler";
  const displayAvatar = profile?.photoUrl || "🚗";

  return (
    <Screen showBack title="My Account" showNavBar>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarEmoji}>{displayAvatar}</Text>
              {isVerified && (
                <View style={styles.verifiedDot}>
                  <Text style={styles.verifiedDotText}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.emailText} numberOfLines={1}>{session?.user.email ?? "No email"}</Text>
              {profile?.phone && (
                <Text style={styles.phoneText}>+91 {profile.phone}</Text>
              )}
            </View>
          </View>

          {/* Ratings & Social Bar */}
          <Pressable
            onPress={() => router.push("/ratings")}
            style={({ pressed }) => [styles.ratingBanner, pressed && styles.ratingBannerPressed]}
          >
            <View style={styles.ratingBannerLeft}>
              <Text style={styles.ratingBannerStars}>
                {aggregate.totalCount > 0 ? `★ ${aggregate.average.toFixed(1)}` : "★ New"}
              </Text>
              <Text style={styles.ratingBannerSub}>
                {aggregate.totalCount > 0
                  ? `${aggregate.totalCount} Rating${aggregate.totalCount === 1 ? "" : "s"} (${aggregate.count} Exchanged)`
                  : "No reviews yet"}
              </Text>
            </View>
            <Text style={styles.ratingBannerLink}>View All Reviews ›</Text>
          </Pressable>

          <View style={styles.badgesRow}>
            {isVerified ? (
              <Badge label="ID Verified Host" variant="verified" icon={<Text>✓</Text>} />
            ) : (
              <Badge label="Identity Unverified" variant="pending" icon={<Text>⚠️</Text>} />
            )}
            <Pressable onPress={openEditModal} style={styles.editProfileBtn}>
              <Text style={styles.editProfileText}>✏️ Edit Profile</Text>
            </Pressable>
          </View>

          {!isVerified && !kycLoading && (
            <Pressable
              onPress={() => router.push("/kyc")}
              style={styles.kycPrompt}
            >
              <View style={styles.kycPromptLeft}>
                <Text style={styles.kycPromptTitle}>Complete Government ID Verification</Text>
                <Text style={styles.kycPromptDesc}>Unlock host badge and build trust for roadtrips</Text>
              </View>
              <Text style={styles.kycPromptArrow}>→</Text>
            </Pressable>
          )}
        </Card>

        {/* Pending Ratings Alert Banner */}
        {pendingRatings.length > 0 && (
          <Pressable
            onPress={() => router.push("/ratings")}
            style={({ pressed }) => [styles.pendingAlertCard, pressed && styles.pendingAlertCardPressed]}
          >
            <Text style={styles.pendingAlertEmoji}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingAlertTitle}>
                {pendingRatings.length} Pending Review{pendingRatings.length === 1 ? "" : "s"}
              </Text>
              <Text style={styles.pendingAlertSub}>
                Rate your co-travelers to unlock double-blind exchanged ratings.
              </Text>
            </View>
            <Text style={styles.pendingAlertArrow}>→</Text>
          </Pressable>
        )}

        {/* Emergency Contact Quick Status */}
        <Card style={styles.menuCard}>
          <Text style={styles.menuSectionHeader}>EMERGENCY & SAFETY</Text>
          <Pressable
            onPress={() => router.push("/emergency-contact")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>🛡️</Text>
              <View>
                <Text style={styles.menuItemLabel}>Emergency SOS Contact</Text>
                <Text style={styles.menuItemSub}>
                  {profile?.emergencyContact?.name
                    ? `${profile.emergencyContact.name} (${profile.emergencyContact.phone})`
                    : "Tap to set up mandatory SOS contact"}
                </Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>
        </Card>

        {/* Settings Navigation List */}
        <Card style={styles.menuCard}>
          <Text style={styles.menuSectionHeader}>PROFILE & REPUTATION</Text>

          <Pressable
            onPress={() => session?.user.id && router.push({ pathname: "/profile/[id]", params: { id: session.user.id } })}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>👤</Text>
              <View>
                <Text style={styles.menuItemLabel}>View My Public Profile</Text>
                <Text style={styles.menuItemSub}>See how other roadtrippers view your profile</Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            onPress={() => router.push("/ratings")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>⭐</Text>
              <View>
                <Text style={styles.menuItemLabel}>Trip Ratings & Reviews</Text>
                <Text style={styles.menuItemSub}>
                  {userRatings.length > 0
                    ? `${userRatings.length} review${userRatings.length === 1 ? "" : "s"} received`
                    : "Pending ratings, received reviews & given feedback"}
                </Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            onPress={() => router.push("/favorites")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>📍</Text>
              <Text style={styles.menuItemLabel}>Favorite Destinations</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            onPress={() => router.push("/following")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>👥</Text>
              <Text style={styles.menuItemLabel}>Following Hosts</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>
        </Card>

        {/* Legal & Compliance Card */}
        <Card style={styles.menuCard}>
          <Text style={styles.menuSectionHeader}>LEGAL & SAFETY COMPLIANCE</Text>

          <Pressable
            onPress={() => router.push("/legal/grievance")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>⚖️</Text>
              <Text style={styles.menuItemLabel}>Grievance Officer (IT Rules 2021)</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            onPress={() => router.push("/legal/terms")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>📄</Text>
              <Text style={styles.menuItemLabel}>Terms of Service</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            onPress={() => router.push("/legal/privacy")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>🔒</Text>
              <Text style={styles.menuItemLabel}>Privacy Policy</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>
        </Card>

        {/* Sign Out Button */}
        <View style={styles.signOutWrap}>
          <Button
            label="Sign Out of Convoy"
            onPress={() => signOut()}
            variant="outline"
            size="lg"
            style={styles.signOutBtn}
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Traveler Profile</Text>
                <Pressable onPress={() => setIsEditing(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSub}>Update your name, contact phone, and avatar persona:</Text>

              {/* Avatar Selector */}
              <Text style={styles.modalFieldLabel}>Choose Avatar</Text>
              <View style={styles.modalAvatarGrid}>
                {AVATAR_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    style={[
                      styles.modalAvatarOption,
                      editAvatar === opt.id && styles.modalAvatarOptionSelected,
                    ]}
                    onPress={() => setEditAvatar(opt.id)}
                  >
                    <Text style={styles.modalAvatarEmoji}>{opt.id}</Text>
                    <Text style={styles.modalAvatarLabel}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              <TextField
                label="Full Legal Name"
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Harpreet Singh"
                autoCapitalize="words"
              />

              <TextField
                label="Mobile Phone (+91)"
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="98765 43210"
                keyboardType="phone-pad"
                maxLength={10}
              />

              {editError && (
                <Text style={styles.modalError}>{editError}</Text>
              )}

              <View style={styles.modalActions}>
                <Button
                  label="Save Profile Changes"
                  onPress={handleSaveProfile}
                  loading={editSaving}
                  size="lg"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: spacing.xxxl * 2,
  },
  profileCard: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  ratingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ratingBannerPressed: {
    backgroundColor: colors.lineLight,
  },
  ratingBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ratingBannerStars: {
    ...typography.captionBold,
    color: colors.gold,
    fontSize: 14,
  },
  ratingBannerSub: {
    ...typography.caption,
    color: colors.inkSoft,
    fontSize: 12,
  },
  ratingBannerLink: {
    ...typography.captionBold,
    color: colors.accent,
    fontSize: 11,
  },
  pendingAlertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  pendingAlertCardPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  pendingAlertEmoji: {
    fontSize: 24,
  },
  pendingAlertTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 13,
  },
  pendingAlertSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    marginTop: 1,
  },
  pendingAlertArrow: {
    ...typography.h3,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarEmoji: {
    fontSize: 32,
  },
  verifiedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.trust,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.paper,
  },
  verifiedDotText: {
    color: colors.paper,
    fontSize: 10,
    fontWeight: "bold",
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  nameText: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: 2,
  },
  emailText: {
    ...typography.caption,
    color: colors.inkSoft,
    marginBottom: 2,
  },
  phoneText: {
    ...typography.captionBold,
    color: colors.inkSubtle,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  editProfileBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  editProfileText: {
    ...typography.captionBold,
    color: colors.ink,
  },
  kycPrompt: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kycPromptLeft: {
    flex: 1,
  },
  kycPromptTitle: {
    ...typography.captionBold,
    color: colors.statusPending,
  },
  kycPromptDesc: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  kycPromptArrow: {
    ...typography.h2,
    color: colors.statusPending,
    marginLeft: spacing.md,
  },
  menuCard: {
    padding: 0,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  menuSectionHeader: {
    ...typography.overline,
    color: colors.inkSubtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: spacing.md,
    width: 24,
    textAlign: "center",
  },
  menuItemLabel: {
    ...typography.bodyMedium,
    color: colors.ink,
  },
  menuItemSub: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 1,
  },
  menuItemArrow: {
    ...typography.h2,
    color: colors.inkSubtle,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.lineLight,
    marginLeft: spacing.lg + 36,
  },
  signOutWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  signOutBtn: {
    borderColor: colors.line,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.inkSoft,
  },
  modalSub: {
    ...typography.caption,
    color: colors.inkSoft,
    marginBottom: spacing.lg,
  },
  modalFieldLabel: {
    ...typography.captionBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  modalAvatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalAvatarOption: {
    width: "30%",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.lineLight,
    borderRadius: radius.md,
    padding: spacing.xs,
    alignItems: "center",
  },
  modalAvatarOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  modalAvatarEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  modalAvatarLabel: {
    fontSize: 10,
    color: colors.ink,
    textAlign: "center",
  },
  modalError: {
    ...typography.captionBold,
    color: colors.statusFlagged,
    marginBottom: spacing.md,
  },
  modalActions: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});

