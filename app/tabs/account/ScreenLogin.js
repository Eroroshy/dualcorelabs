import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { TextInput } from "react-native-paper";
import { supabase } from "../../subapaseClient";

export default function LoginScreen({ navigation }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSecure, setIsSecure] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error) {
            Alert.alert(t("login_error", "Login Error"), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert(
                t("attention", "Attention"), 
                t("email_required_for_recovery", "Please enter your email address first to send the recovery link.")
            );
            return;
        }
        try {
            const redirectUrl = 'kinetic://reset-password';
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
            if (error) throw error;
            Alert.alert(
                t("email_sent", "Email Sent"), 
                t("check_inbox_for_password_reset", "Check your inbox to reset your password.")
            );
        } catch (error) {
            Alert.alert(t("error", "Error"), error.message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer} 
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.innerContainer}>
                        <Text style={styles.title}>K I N E T I C</Text>

                        <View style={styles.card}>
                            <View style={styles.inputBlock}>
                                <Text style={styles.label}>{t("email_label", "EMAIL").toUpperCase()}</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    underlineColor="white"
                                    activeUnderlineColor="#88adff"
                                    cursorColor="#fff"
                                    textColor="#fff"
                                    style={styles.input}
                                    placeholder={t("email_placeholder", "email@example.com")}
                                    placeholderTextColor="#555"
                                    left={<TextInput.Icon icon="account" color="#777" />}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputBlock}>
                                <Text style={styles.label}>{t("password_label", "PASSWORD").toUpperCase()}</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    underlineColor="white"
                                    activeUnderlineColor="#88adff"
                                    cursorColor="#fff"
                                    textColor="#fff"
                                    secureTextEntry={isSecure}
                                    style={styles.input}
                                    placeholder="********"
                                    placeholderTextColor="#555"
                                    left={<TextInput.Icon icon="lock" color="#777" />}
                                    right={<TextInput.Icon icon={isSecure ? "eye" : "eye-off"} color="#777" onPress={() => setIsSecure(!isSecure)} />}
                                />
                            </View>

                            <TouchableOpacity onPress={handleResetPassword} style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>{t("forgot_password_question", "Forgot your password?")}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? t("logging_in", "LOGGING IN...") : t("log_in", "LOG IN")}</Text>
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <View>
                                    <Text style={styles.dividerText}>{t("or", "OR")}</Text>
                                </View>
                                <View style={styles.divider} />
                            </View>

                            <TouchableOpacity style={styles.buttonLink} onPress={() => navigation.navigate("Register")}>
                                <Text style={styles.buttonLinkText}>{t("create_account", "CREATE ACCOUNT")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0c0e10" },
    scrollContainer: { flexGrow: 1, justifyContent: "center" },
    innerContainer: { padding: 20 },
    title: { color: "#fff", fontSize: 32, textAlign: "center", marginBottom: 20, fontFamily: "Lexend_800ExtraBold" },
    card: { backgroundColor: "#171a1c", padding: 30, borderRadius: 12, marginTop: 20 },
    inputBlock: { marginBottom: 16 },
    label: { color: "#aaa", fontSize: 12, letterSpacing: 2, fontFamily: "Manrope_700Bold", marginBottom: 8 },
    input: { backgroundColor: "#232629", color: "#fff", borderRadius: 10, fontSize: 14 },
    button: { backgroundColor: "#719eff", padding: 18, borderRadius: 8, marginTop: 10 },
    buttonText: { textAlign: "center", fontFamily: "Lexend_800ExtraBold", fontSize: 16, color: "#002052", letterSpacing: 1 },
    buttonDisabled: { backgroundColor: "#aabfff" },
    buttonLink: { backgroundColor: "transparent", borderColor: "#719eff", borderWidth: 2, padding: 18, borderRadius: 8, marginTop: 10 },
    buttonLinkText: { textAlign: "center", fontFamily: "Lexend_800ExtraBold", fontSize: 16, color: "#719eff", letterSpacing: 1 },
    divider: { flex: 1, height: 1, backgroundColor: '#777' },
    dividerText: { width: 50, textAlign: 'center', color: '#777' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    forgotPassword: { alignSelf: "flex-end", marginBottom: 15 },
    forgotPasswordText: { color: "#88adff", fontFamily: "Manrope_500Medium", fontSize: 12 }
});