import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "./themed-text";

type Props<T extends string> = {
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
}: Props<T>) {
    const theme = useTheme();
    const [width, setWidth] = useState(0);
    const index = options.findIndex((o) => o.value === value);
    const segment = width / options.length;
    const x = useSharedValue(0);

    useEffect(() => {
        x.value = withSpring(index * segment, { damping: 40, stiffness: 300 });
    }, [index, segment, x]);

    const indicator = useAnimatedStyle(() => ({
        transform: [{ translateX: x.value }],
    }));

    return (
        <View
            onLayout={(e) =>
                setWidth(e.nativeEvent.layout.width - Spacing.one * 2)
            }
            style={[styles.wrap, { backgroundColor: theme.backgroundElement }]}
        >
            <Animated.View
                style={[
                    styles.indicator,
                    { width: segment, backgroundColor: theme.primary },
                    indicator,
                ]}
            />
            {options.map((o) => (
                <Pressable
                    key={o.value}
                    style={styles.item}
                    onPress={() => onChange(o.value)}
                >
                    <ThemedText
                        bold
                        style={{
                            color:
                                o.value === value
                                    ? theme.primaryText
                                    : theme.text,
                        }}
                    >
                        {o.label}
                    </ThemedText>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flexDirection: "row", borderRadius: 14, padding: Spacing.one },
    indicator: {
        position: "absolute",
        top: Spacing.one,
        bottom: Spacing.one,
        left: Spacing.one,
        borderRadius: 11,
    },
    item: { flex: 1, alignItems: "center", paddingVertical: Spacing.two + 2 },
});
