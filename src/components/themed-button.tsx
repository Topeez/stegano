import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { ComponentProps } from "react";
import { Pressable } from "react-native";
import { ThemedIcon } from "./themed-icon";
import { ThemedText } from "./themed-text";

type Props = {
    title: string;
    icon?: ComponentProps<typeof ThemedIcon>["name"];
    onPress: () => void;
    variant?: "primary" | "secondary" | "accent";
    disabled?: boolean;
};

export function ThemedButton({
    title,
    icon,
    onPress,
    variant = "primary",
    disabled,
}: Props) {
    const theme = useTheme();
    const bg =
        variant === "primary"
            ? theme.primary
            : variant === "accent"
              ? theme.accent
              : theme.backgroundSelected;
    const fg =
        variant === "primary"
            ? theme.primaryText
            : variant === "accent"
              ? theme.accentText
              : theme.text;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: Spacing.two,
                padding: Spacing.three,
                borderRadius: 14,
                backgroundColor: bg,
                opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
        >
            {icon && <ThemedIcon name={icon} size={20} color={fg} />}
            <ThemedText bold style={{ color: fg }}>
                {title}
            </ThemedText>
        </Pressable>
    );
}
