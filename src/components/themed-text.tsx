import { useTheme } from "@/hooks/use-theme";
import { Text, type TextProps } from "react-native";

type Props = TextProps & { secondary?: boolean; bold?: boolean };

export function ThemedText({ secondary, bold, style, ...rest }: Props) {
    const theme = useTheme();
    return (
        <Text
            style={[
                {
                    color: secondary ? theme.textSecondary : theme.text,
                    fontSize: 15,
                },
                bold && { fontWeight: "700" },
                style,
            ]}
            {...rest}
        />
    );
}
