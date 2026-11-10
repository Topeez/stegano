import { useTheme } from "@/hooks/use-theme";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function CapacityBar({ ratio }: { ratio: number }) {
    const theme = useTheme();
    const p = useSharedValue(0);

    useEffect(() => {
        p.value = withTiming(Math.min(1, Math.max(0, ratio)), {
            duration: 300,
        });
    }, [ratio, p]);

    const fill = useAnimatedStyle(() => ({
        width: `${p.value * 100}%`,
        backgroundColor: interpolateColor(
            p.value,
            [0, 0.75, 1],
            [theme.primary, theme.primary, theme.accent],
        ),
    }));

    return (
        <View
            style={{
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.backgroundSelected,
                overflow: "hidden",
            }}
        >
            <Animated.View
                style={[{ height: "100%", borderRadius: 5 }, fill]}
            />
        </View>
    );
}
