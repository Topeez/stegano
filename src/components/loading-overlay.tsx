import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "./themed-text";

type Props = { label: string; progress: number };

export function LoadingOverlay({ label, progress }: Props) {
    const theme = useTheme();
    const p = useSharedValue(0);

    useEffect(() => {
        p.value = withTiming(progress, { duration: 250 });
    }, [progress, p]);

    const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(200)}
            style={[
                StyleSheet.absoluteFill,
                styles.backdrop,
                { backgroundColor: theme.background + "E6" },
            ]}
            pointerEvents="auto"
        >
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                    },
                ]}
            >
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText bold>{label}</ThemedText>
                <View
                    style={[
                        styles.track,
                        { backgroundColor: theme.backgroundSelected },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.fill,
                            { backgroundColor: theme.accent },
                            fill,
                        ]}
                    />
                </View>
                <ThemedText secondary style={{ fontSize: 13 }}>
                    {Math.round(progress * 100)} %
                </ThemedText>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.four,
    },
    card: {
        width: "100%",
        maxWidth: 360,
        alignItems: "center",
        gap: Spacing.three,
        padding: Spacing.four,
        borderRadius: 20,
        borderWidth: 1,
    },
    track: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
    fill: { height: "100%", borderRadius: 4 },
});
