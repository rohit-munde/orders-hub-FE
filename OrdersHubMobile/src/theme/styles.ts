import { StyleSheet } from 'react-native';
import { radii, spacing, ThemeColors, typography } from './tokens';

export function createAppStyles(colors: ThemeColors) {
  return {
    appScreen: StyleSheet.create({
      safeArea: { flex: 1 },
      content: { flex: 1 },
    }),

    brandMark: StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      },
      small: { width: 76, height: 76, borderRadius: 24 },
      large: { width: 168, height: 168, borderRadius: 36 },
      symbol: { color: colors.text, fontSize: 36, fontWeight: '600' },
      largeSymbol: { fontSize: 64 },
      googleGlyph: {
        color: colors.onPrimary,
        fontSize: 25,
        lineHeight: 30,
        fontWeight: '800',
      },
    }),

    securityLabel: StyleSheet.create({
      label: {
        fontSize: typography.caption,
        lineHeight: 20,
        textAlign: 'center',
      },
    }),

    primaryButton: StyleSheet.create({
      button: {
        minHeight: 70,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
      },
      content: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
      leading: { position: 'absolute', left: 20 },
      label: {
        color: colors.onPrimary,
        fontSize: typography.body,
        fontWeight: '500',
      },
      pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
      disabled: { opacity: 0.55 },
      loading: { color: colors.onPrimary },
    }),

    inlineMessage: StyleSheet.create({
      container: {
        backgroundColor: colors.dangerSurface,
        borderRadius: radii.md,
        padding: spacing.md,
      },
      text: {
        color: colors.danger,
        fontSize: typography.caption,
        lineHeight: 20,
        textAlign: 'center',
      },
    }),

    login: StyleSheet.create({
      screen: { paddingHorizontal: spacing.xl },
      heading: {
        position: 'absolute',
        top: '17%',
        left: spacing.lg,
        right: spacing.lg,
        alignItems: 'center',
      },
      title: {
        color: colors.text,
        fontSize: typography.display,
        fontWeight: '300',
        letterSpacing: -1.4,
      },
      subtitle: {
        marginTop: spacing.lg,
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 26,
        fontWeight: '500',
        textAlign: 'center',
      },
      authArea: {
        position: 'absolute',
        top: '38%',
        left: spacing.xl,
        right: spacing.xl,
        gap: spacing.lg,
      },
      footer: {
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        bottom: spacing.xl,
      },
    }),

    onboarding: StyleSheet.create({
      screen: { paddingHorizontal: spacing.xl },
      skipButton: {
        position: 'absolute',
        top: spacing.lg,
        right: spacing.xl,
        zIndex: 1,
      },
      skipText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontWeight: '500',
      },
      hero: {
        position: 'absolute',
        top: '20%',
        left: spacing.xl,
        right: spacing.xl,
        alignItems: 'center',
      },
      title: {
        marginTop: 44,
        color: colors.text,
        fontSize: typography.title,
        lineHeight: 40,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: -0.8,
      },
      description: {
        marginTop: spacing.md,
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 27,
        textAlign: 'center',
      },
      pageIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
      },
      dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: colors.subtle,
      },
      activeDot: { width: 28, backgroundColor: colors.primary },
      actions: {
        position: 'absolute',
        left: spacing.xl,
        right: spacing.xl,
        bottom: spacing.xxl,
        gap: 64,
      },
    }),

    splash: StyleSheet.create({
      screen: { paddingHorizontal: spacing.xl },
      brandGroup: {
        position: 'absolute',
        top: '28%',
        left: 0,
        right: 0,
        alignItems: 'center',
      },
      title: {
        marginTop: spacing.xxl,
        color: colors.text,
        fontSize: typography.display,
        fontWeight: '300',
        letterSpacing: -1.4,
      },
      subtitle: {
        marginTop: spacing.sm,
        color: colors.textMuted,
        fontSize: typography.body,
        fontWeight: '500',
      },
      footer: {
        position: 'absolute',
        left: spacing.xl,
        right: spacing.xl,
        bottom: spacing.xxl,
      },
    }),

    home: StyleSheet.create({
      screen: { flex: 1 },
      listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
      },
      sectionTitle: {
        marginTop: spacing.xl,
        marginBottom: spacing.md,
        color: colors.text,
        fontSize: typography.body,
        fontWeight: '600',
      },
      separator: { height: spacing.md },
      footer: {
        paddingVertical: spacing.lg,
        color: colors.textMuted,
        fontSize: typography.caption,
        textAlign: 'center',
      },
      error: { color: colors.danger },
      loading: { color: colors.text },
    }),

    homeHeader: StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
      },
      greeting: { color: colors.textMuted, fontSize: typography.body },
      name: {
        marginTop: spacing.xs,
        color: colors.text,
        fontSize: typography.title,
        lineHeight: 38,
        fontWeight: '600',
      },
      actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
      },
      notificationButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
      },
      bell: { color: colors.text, fontSize: 24 },
      notificationDot: {
        position: 'absolute',
        bottom: 5,
        width: 5,
        height: 5,
        borderRadius: radii.pill,
        backgroundColor: colors.text,
      },
      avatar: {
        width: 52,
        height: 52,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
      },
      avatarText: {
        color: colors.onPrimary,
        fontSize: 22,
        fontWeight: '600',
      },
    }),

    spending: StyleSheet.create({
      spendingCard: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.primary,
      },
      label: { color: colors.onPrimaryMuted, fontSize: typography.body },
      amount: {
        marginTop: spacing.sm,
        color: colors.onPrimary,
        fontSize: 46,
        lineHeight: 54,
        fontWeight: '500',
        letterSpacing: -1.4,
      },
      comparison: {
        marginTop: spacing.xs,
        color: colors.onPrimaryMuted,
        fontSize: typography.label,
      },
      metrics: {
        marginTop: spacing.md,
        flexDirection: 'row',
        gap: spacing.sm,
      },
      metricCard: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        backgroundColor: colors.surface,
      },
      metricLabel: { color: colors.textMuted, fontSize: 15 },
      metricValue: {
        marginTop: spacing.xs,
        color: colors.text,
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '500',
      },
    }),

    bottomNavigation: StyleSheet.create({
      container: {
        height: 70,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        backgroundColor: colors.surface,
      },
      item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      },
      icon: { color: colors.subtle, fontSize: 27, lineHeight: 29 },
      label: { color: colors.textMuted, fontSize: 11 },
      active: { color: colors.text },
    }),

    orderRow: StyleSheet.create({
      card: {
        flexDirection: 'row',
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        backgroundColor: colors.surface,
        gap: spacing.md,
      },
      merchant: {
        width: 54,
        height: 54,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
      },
      merchantInitial: {
        color: colors.onMerchant,
        fontSize: 24,
        fontWeight: '500',
      },
      details: { flex: 1, minWidth: 0 },
      titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.sm,
      },
      title: {
        flex: 1,
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 24,
        fontWeight: '600',
      },
      price: { color: colors.text, fontSize: 17, fontWeight: '600' },
      inbox: {
        marginTop: spacing.xs,
        color: colors.textMuted,
        fontSize: typography.caption,
      },
      badges: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing.sm,
      },
      statusBadge: {
        minHeight: 28,
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
      },
      statusText: { fontSize: 13, fontWeight: '600' },
      otpBadge: {
        minHeight: 28,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: colors.text,
        borderRadius: radii.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      otpLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
      },
      otpValue: {
        color: colors.text,
        fontSize: typography.caption,
        fontWeight: '700',
        letterSpacing: 1.2,
      },
    }),
  };
}

export type AppStyles = ReturnType<typeof createAppStyles>;
