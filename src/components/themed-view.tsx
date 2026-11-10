import { useTheme } from "@/hooks/use-theme";
import { View, type ViewProps } from "react-native";

type Props = ViewProps & { element?: boolean };

export function ThemedView({ element, style, ...rest }: Props) {
    const theme = useTheme();
    return (
        <View
            style={[
                {
                    backgroundColor: element
                        ? theme.backgroundElement
                        : theme.background,
                },
                style,
            ]}
            {...rest}
        />
    );
}
