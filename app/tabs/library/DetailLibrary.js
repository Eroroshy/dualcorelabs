import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DetailLibrary({ route }) {

    const { id } = route.params;
    const navigation = useNavigation();

    const [ejercicios, setEjercicios] = useState(null);

    const obtenerEjercicios = () => {
        fetch(`https://oss.exercisedb.dev/api/v1/exercises/${id}`)
            .then((response) => response.json())
            .then((result) => setEjercicios(result.data))
            .catch((error) => console.error(error));
    };

    useEffect(() => {
        obtenerEjercicios();
    }, []);

    if (!ejercicios) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>K I N E T I C</Text>
                </View>

                <View style={styles.loadingcontent}>
                    <ActivityIndicator size="large" color="#88adff" />
                </View>
            </View>
        );
    }

    const formatStep = (text) => {
        return text.replace(/Step:\d+/i, "").trim();
    };


    return (

        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>K I N E T I C</Text>
            </View>

            <ScrollView style={styles.container}>

                <View style={styles.content}>

                    {/* GIF */}
                    <Image
                        source={{ uri: ejercicios.gifUrl }}
                        style={styles.image}
                    />

                    {/* TITLE */}
                    <Text style={styles.title}>
                        {ejercicios.name.toUpperCase()}
                    </Text>

                    {/* TAGS */}
                    <Text style={styles.tag}>
                        {ejercicios.targetMuscles?.join(", ").toUpperCase()}
                    </Text>

                    {/* CARD */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Instructions</Text>

                        {ejercicios.instructions?.map((step, index) => (
                            <View key={index} style={styles.stepRow}>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepNumber}>{index + 1}</Text>
                                </View>

                                <Text style={styles.stepText}>
                                    {formatStep(step)}
                                </Text>
                            </View>
                        ))}
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#0c0e10",
    },

    header: {
        marginTop: 40,
        padding: 16,
        backgroundColor: "#111416",
        alignItems: "center",
    },

    headerTitle: {
        fontFamily: "Lexend_800ExtraBold",
        fontSize: 18,
        color: "#eeeef0",
    },

    content: {
        padding: 16,
    },

    loadingcontent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    image: {
        width: "100%",
        height: 350,
        borderRadius: 12,
        marginBottom: 16,
    },

    title: {
        fontSize: 24,
        color: "#fff",
        fontFamily: "Lexend_800ExtraBold",
        marginBottom: 4,
        textAlign: "center",
    },

    tag: {
        color: "#88adff",
        marginBottom: 16,
        letterSpacing: 1,
        textAlign: "center",
    },

    card: {
        backgroundColor: "#171a1c",
        borderRadius: 12,
        padding: 16,
    },

    cardTitle: {
        fontSize: 16,
        color: "#eeeef0",
        fontFamily: "Lexend_700Bold",
        marginBottom: 12,
    },

    stepRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },

    stepBadge: {
        backgroundColor: "#88adff",
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    stepNumber: {
        color: "#002052",
        fontWeight: "bold",
        fontSize: 12,
    },

    stepText: {
        color: "#aaabad",
        flex: 1,
        lineHeight: 18,
    },

});