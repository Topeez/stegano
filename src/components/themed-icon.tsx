import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Ionicons> & { inverted?: boolean };

export function ThemedIcon({ inverted = false, color, ...props }: Props) {
    const theme = useTheme();
    return (
        <Ionicons
            color={color ?? (inverted ? theme.textInverted : theme.text)}
            {...props}
        />
    );
}
