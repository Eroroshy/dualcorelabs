import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-paper";
import { auth } from "../../../firebase.config";

export default function LoginScreen({ navigation }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSecure, setIsSecure] = useState(true);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Fill all fields");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            Alert.alert("Login error", error.message);
        }
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>K I N E T I C</Text>

            {/* INPUT CARD */}
            <View style={styles.card}>
                <View style={styles.inputBlock}>
                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        underlineColor="white"
                        activeUnderlineColor="#88adff"
                        cursorColor="#fff"
                        textColor="#fff"
                        style={styles.input}
                        placeholder="email@example.com"
                        placeholderTextColor="#555"
                        left={<TextInput.Icon icon="account" color="#777" />}
                    />

                </View>

                <View style={styles.inputBlock}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <TextInput
                        type="password"
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

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>LOG IN</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <View>
                        <Text style={styles.dividerText}>OR</Text>
                    </View>
                    <View style={styles.divider} />
                </View>

                <TouchableOpacity style={styles.buttonLink} onPress={() => navigation.navigate("Register")}>
                    <Text style={styles.buttonLinkText}>CREATE ACCOUNT</Text>
                </TouchableOpacity>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0c0e10",
        justifyContent: "center",
        padding: 20,
    },

    title: {
        color: "#fff",
        fontSize: 32,
        textAlign: "center",
        marginBottom: 20,
        fontFamily: "Lexend_800ExtraBold",
    },

    // INPUT CARD

    card: {
        backgroundColor: "#171a1c",
        padding: 30,
        borderRadius: 12,
        marginTop: 20,
    },

    inputBlock: {
        marginBottom: 16,
    },

    label: {
        color: "#aaa",
        fontSize: 12,
        letterSpacing: 2,
        fontFamily: "Manrope_700Bold",
        marginBottom: 8
    },

    input: {
        backgroundColor: "#232629",
        color: "#fff",
        borderRadius: 10,
        fontSize: 14
    },

    // BUTTON

    button: {
        backgroundColor: "#719eff",
        padding: 18,
        borderRadius: 8,
        marginTop: 10,
    },

    buttonText: {
        textAlign: "center",
        fontFamily: "Lexend_800ExtraBold",
        fontSize: 16,
        color: "#002052",
        letterSpacing: 1
    },

    buttonLink: {
        backgroundColor: "transparent",
        borderColor: "#719eff",
        borderWidth: 2,
        padding: 18,
        borderRadius: 8,
        marginTop: 10,
    },

    buttonLinkText: {
        textAlign: "center",
        fontFamily: "Lexend_800ExtraBold",
        fontSize: 16,
        color: "#719eff",
        letterSpacing: 1
    },

    // DIVIDER

    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#777'
    },

    dividerText: {
        width: 50,
        textAlign: 'center',
        color: '#777'
    },

    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
});