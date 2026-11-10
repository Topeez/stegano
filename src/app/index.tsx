import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CapacityBar } from "@/components/capacity-bar";
import { LoadingOverlay } from "@/components/loading-overlay";
import { SegmentedControl } from "@/components/segmented-control";
import { Snowfall } from "@/components/snowfall";
import { ThemedButton } from "@/components/themed-button";
import { ThemedIcon } from "@/components/themed-icon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  capacityBytes,
  diffMap,
  embedMessage,
  extractMessage,
  lsbPlane,
  makeTestMessage,
  psnr,
  utf8Encode,
} from "@/lib/stego-core";
import { decodeImage, encodePng, type DecodedImage } from "@/lib/stego-image";
import { useThemeStore } from "@/store/theme-store";

type Mode = "embed" | "extract";
type View_ = "output" | "diff" | "lsb";
type Details = { uri: string; extension: string; sizeBytes: number };
type Result = {
    output: string;
    diff: string;
    lsb: string;
    psnr: number;
    changedPct: number;
};

const toUri = (b64: string) => `data:image/png;base64,${b64}`;

function Stat({ label, value }: { label: string; value: string }) {
    const theme = useTheme();
    return (
        <View
            style={[styles.stat, { backgroundColor: theme.backgroundSelected }]}
        >
            <ThemedText secondary style={{ fontSize: 12 }}>
                {label}
            </ThemedText>
            <ThemedText bold style={{ fontSize: 18 }}>
                {value}
            </ThemedText>
        </View>
    );
}

export default function HomeScreen() {
    const theme = useTheme();
    const { themePreference, setThemePreference, snow, toggleSnow } =
        useThemeStore();

    const [mode, setMode] = useState<Mode>("embed");
    const [image, setImage] = useState<DecodedImage | null>(null);
    const [details, setDetails] = useState<Details | null>(null);
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<Result | null>(null);
    const [resultView, setResultView] = useState<View_>("output");
    const [extracted, setExtracted] = useState("");
    const [loading, setLoading] = useState<{
        label: string;
        progress: number;
    } | null>(null);
    const busy = loading !== null;

    const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 60));
    const stage = async (label: string, progress: number) => {
        setLoading({ label, progress });
        await tick();
    };

    const capacity = useMemo(
        () => (image ? capacityBytes(image.width, image.height) : 0),
        [image],
    );
    const messageBytes = useMemo(() => utf8Encode(message).length, [message]);
    const ratio = capacity > 0 ? messageBytes / capacity : 0;

    const isLarge = message.length > 20000;
    const fillTest = (pct: number) =>
        setMessage(makeTestMessage(Math.floor(capacity * pct)));

    const pickImage = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 1,
        });
        if (res.canceled) return;

        try {
            await stage("Načítám obrázek...", 0.2);
            const uri = res.assets[0].uri;
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const info = await FileSystem.getInfoAsync(uri);

            await stage("Dekóduji pixely...", 0.6);
            const decoded = decodeImage(base64);

            setImage(decoded);
            setDetails({
                uri,
                extension: uri.split(".").pop()?.toLowerCase() ?? "?",
                sizeBytes: info.exists ? info.size : 0,
            });
            setResult(null);
            setExtracted("");
        } catch (e) {
            Alert.alert("Chyba", (e as Error).message);
        } finally {
            setLoading(null);
        }
    };

    const runEmbed = async () => {
        if (!image) return;
        try {
            await stage("Vkládám zprávu do pixelů…", 0.1);
            const out = embedMessage(
                image.pixels,
                image.width,
                image.height,
                message,
            );

            await stage("Počítám rozdílovou mapu…", 0.35);
            const diff = diffMap(image.pixels, out);
            const quality = psnr(image.pixels, out);

            await stage("Kóduji výsledný PNG…", 0.55);
            const output = encodePng(out, image.width, image.height);

            await stage("Vytvářím náhled rozdílů…", 0.75);
            const diffPng = encodePng(diff.pixels, image.width, image.height);

            await stage("Vytvářím LSB rovinu…", 0.9);
            const lsb = encodePng(lsbPlane(out), image.width, image.height);

            setResult({
                output,
                diff: diffPng,
                lsb,
                psnr: quality,
                changedPct: diff.changedPct,
            });
            setResultView("output");
            setLoading({ label: "Hotovo", progress: 1 });
            await tick();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Chyba", (e as Error).message);
        } finally {
            setLoading(null);
        }
    };

    const runExtract = async () => {
        if (!image) return;
        try {
            await stage("Čtu bity z obrázku…", 0.5);

            const msg = extractMessage(image.pixels, image.width, image.height);
            const ok = msg.endsWith("[KONEC]")
                ? "✓ konec zprávy sedí"
                : "✗ konec chybí";

            setExtracted(
                `${msg.slice(0, 300)}…\n\n${msg.length.toLocaleString("cs-CZ")} znaků · ${ok}`,
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            setExtracted("");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Chyba", (e as Error).message);
        } finally {
            setLoading(null);
        }
    };

    const writeResult = async () => {
        const path = `${FileSystem.cacheDirectory}stego-${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(path, result!.output, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return path;
    };

    const saveToGallery = async () => {
        try {
            await stage("Ukládám do galerie…", 0.4);
            const perm = await MediaLibrary.requestPermissionsAsync(true);
            if (!perm.granted)
                return Alert.alert("Chybí oprávnění ke galerii.");
            await MediaLibrary.saveToLibraryAsync(await writeResult());
            setLoading(null);
            Alert.alert("Uloženo", "PNG je v galerii.");
        } catch (e) {
            Alert.alert("Chyba", (e as Error).message);
        } finally {
            setLoading(null);
        }
    };

    const share = async () =>
        Sharing.shareAsync(await writeResult(), { mimeType: "image/png" });

    const shown = result
        ? resultView === "output"
            ? result.output
            : resultView === "diff"
              ? result.diff
              : result.lsb
        : null;

    return (
        <ThemedView style={styles.flex}>
            <SafeAreaView style={styles.flex}>
                <ScrollView contentContainerStyle={styles.content}>
                    <LinearGradient
                        colors={theme.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.hero}
                    >
                        <View style={{ flex: 1 }}>
                            <ThemedText
                                bold
                                style={[
                                    styles.title,
                                    { color: theme.primaryText },
                                ]}
                            >
                                Stegano LSB
                            </ThemedText>
                            <ThemedText
                                style={{
                                    color: theme.primaryText,
                                    opacity: 0.85,
                                }}
                            >
                                Ukryj zprávu do posledního bitu pixelů
                            </ThemedText>
                        </View>
                        <Pressable hitSlop={12} onPress={toggleSnow}>
                            <ThemedIcon
                                name={snow ? "snow" : "snow-outline"}
                                size={26}
                                color={theme.primaryText}
                            />
                        </Pressable>
                        <Pressable
                            hitSlop={12}
                            onPress={() =>
                                setThemePreference(
                                    themePreference === "dark"
                                        ? "light"
                                        : "dark",
                                )
                            }
                        >
                            <ThemedIcon
                                name={
                                    themePreference === "dark"
                                        ? "sunny-outline"
                                        : "moon-outline"
                                }
                                size={26}
                                color={theme.primaryText}
                            />
                        </Pressable>
                    </LinearGradient>

                    <SegmentedControl
                        options={[
                            { value: "embed", label: "Vložit" },
                            { value: "extract", label: "Načíst" },
                        ]}
                        value={mode}
                        onChange={setMode}
                    />

                    <ThemedButton
                        title="Vybrat obrázek"
                        icon="image-outline"
                        variant="secondary"
                        onPress={pickImage}
                        disabled={busy}
                    />

                    {image && details && (
                        <ThemedView element style={styles.card}>
                            <Image
                                source={{ uri: details.uri }}
                                style={styles.preview}
                                contentFit="contain"
                            />
                            <ThemedText secondary>
                                {image.width} × {image.height} px (
                                {(image.width * image.height).toLocaleString(
                                    "cs-CZ",
                                )}
                                ) · .{details.extension} ·{" "}
                                {(details.sizeBytes / 1024).toFixed(1)} kB
                            </ThemedText>
                            <ThemedText secondary numberOfLines={1}>
                                {details.uri}
                            </ThemedText>
                            <ThemedText bold>
                                Kapacita: {capacity.toLocaleString("cs-CZ")} B
                            </ThemedText>
                        </ThemedView>
                    )}

                    {mode === "embed" ? (
                        <>
                            <View style={styles.row}>
                                {[0.1, 0.25, 0.5].map((p) => (
                                    <Pressable
                                        key={p}
                                        disabled={!image}
                                        onPress={() => fillTest(p)}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor:
                                                    theme.backgroundSelected,
                                                opacity: image ? 1 : 0.4,
                                            },
                                        ]}
                                    >
                                        <ThemedText bold>
                                            {p * 100} %
                                        </ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                            <TextInput
                                value={
                                    isLarge
                                        ? `${message.slice(0, 200)}…\n(${messageBytes.toLocaleString("cs-CZ")} B vygenerováno)`
                                        : message
                                }
                                onChangeText={setMessage}
                                editable={!isLarge}
                                multiline
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        backgroundColor:
                                            theme.backgroundElement,
                                        borderColor: theme.border,
                                    },
                                ]}
                            />
                            <View style={{ gap: Spacing.two }}>
                                <CapacityBar ratio={ratio} />
                                <ThemedText secondary>
                                    {messageBytes} / {capacity} B (
                                    {Math.min(100, ratio * 100).toFixed(1)} %)
                                </ThemedText>
                            </View>
                            <ThemedButton
                                title={busy ? "Pracuji…" : "Vložit zprávu"}
                                icon="lock-closed-outline"
                                variant="accent"
                                onPress={runEmbed}
                                disabled={
                                    !image ||
                                    !message ||
                                    messageBytes > capacity ||
                                    busy
                                }
                            />

                            {result && shown && (
                                <ThemedView element style={styles.card}>
                                    <SegmentedControl
                                        options={[
                                            {
                                                value: "output",
                                                label: "Výstup",
                                            },
                                            { value: "diff", label: "Rozdíl" },
                                            { value: "lsb", label: "LSB" },
                                        ]}
                                        value={resultView}
                                        onChange={setResultView}
                                    />
                                    <Image
                                        source={{ uri: toUri(shown) }}
                                        style={styles.preview}
                                        contentFit="contain"
                                    />
                                    <View style={styles.row}>
                                        <Stat
                                            label="PSNR"
                                            value={`${result.psnr.toFixed(1)} dB`}
                                        />
                                        <Stat
                                            label="Změněné pixely"
                                            value={`${result.changedPct.toFixed(2)} %`}
                                        />
                                    </View>
                                    <ThemedButton
                                        title="Uložit do galerie (PNG)"
                                        icon="download-outline"
                                        onPress={saveToGallery}
                                    />
                                    <ThemedButton
                                        title="Sdílet jako soubor"
                                        icon="share-outline"
                                        variant="secondary"
                                        onPress={share}
                                    />
                                </ThemedView>
                            )}
                        </>
                    ) : (
                        <>
                            <ThemedButton
                                title="Načíst zprávu"
                                icon="lock-open-outline"
                                variant="accent"
                                onPress={runExtract}
                                disabled={!image}
                            />
                            <TextInput
                                value={extracted}
                                editable={false}
                                multiline
                                placeholder="Zde se zobrazí ukrytá zpráva"
                                placeholderTextColor={theme.textSecondary}
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        backgroundColor:
                                            theme.backgroundElement,
                                        borderColor: theme.border,
                                    },
                                ]}
                            />
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
            {snow && <Snowfall />}
            {loading && (
                <LoadingOverlay
                    label={loading.label}
                    progress={loading.progress}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: Spacing.three, gap: Spacing.three },
    hero: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.four,
        borderRadius: 20,
        gap: Spacing.three,
    },
    title: { fontSize: 26 },
    card: { padding: Spacing.three, borderRadius: 16, gap: Spacing.three },
    preview: { width: "100%", height: 240, borderRadius: 12 },
    chip: {
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
        borderRadius: 999,
    },
    input: {
        minHeight: 110,
        borderRadius: 14,
        borderWidth: 1,
        padding: Spacing.three,
        textAlignVertical: "top",
        fontSize: 15,
    },
    row: { flexDirection: "row", gap: Spacing.two },
    stat: {
        flex: 1,
        padding: Spacing.three,
        borderRadius: 12,
        gap: Spacing.half,
    },
});
