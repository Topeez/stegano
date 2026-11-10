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
    variant?: "primary" | "secondary";
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
    const primary = variant === "primary";
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
                borderRadius: 12,
                opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
                backgroundColor: primary
                    ? theme.primary
                    : theme.backgroundSelected,
            })}
        >
            {icon && (
                <ThemedIcon
                    name={icon}
                    size={20}
                    color={primary ? "#fff" : undefined}
                />
            )}
            <ThemedText bold style={primary ? { color: "#fff" } : undefined}>
                {title}
            </ThemedText>
        </Pressable>
    );
}
