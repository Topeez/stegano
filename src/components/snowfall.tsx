import { useTheme } from "@/hooks/use-theme";
import { Canvas, Circle, useClock } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

type Flake = {
    x: number;
    y: number;
    r: number;
    speed: number;
    sway: number;
    swaySpeed: number;
    phase: number;
    opacity: number;
};

type FlakeViewProps = {
    flake: Flake;
    clock: SharedValue<number>;
    height: number;
    color: string;
};

function FlakeView({ flake, clock, height, color }: FlakeViewProps) {
    const cx = useDerivedValue(
        () =>
            flake.x +
            Math.sin((clock.value / 1000) * flake.swaySpeed + flake.phase) *
                flake.sway,
    );
    const cy = useDerivedValue(() => {
        const travel = height + flake.r * 4;
        return (
            ((flake.y + (clock.value / 1000) * flake.speed) % travel) -
            flake.r * 2
        );
    });
    return (
        <Circle
            cx={cx}
            cy={cy}
            r={flake.r}
            color={color}
            opacity={flake.opacity}
        />
    );
}

type Props = { count?: number };

export function Snowfall({ count = 40 }: Props) {
    const theme = useTheme();
    const { width, height } = useWindowDimensions();
    const clock = useClock();

    const flakes = useMemo<Flake[]>(
        () =>
            Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                r: 1.5 + Math.random() * 3,
                speed: 25 + Math.random() * 50,
                sway: 6 + Math.random() * 18,
                swaySpeed: 0.5 + Math.random() * 1.2,
                phase: Math.random() * Math.PI * 2,
                opacity: 0.4 + Math.random() * 0.5,
            })),
        [count, width, height],
    );

    return (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {flakes.map((flake, i) => (
                <FlakeView
                    key={i}
                    flake={flake}
                    clock={clock}
                    height={height}
                    color={theme.snow}
                />
            ))}
        </Canvas>
    );
}
