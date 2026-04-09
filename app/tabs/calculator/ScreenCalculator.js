import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ScreenCalculator() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [result, setResult] = useState(0);

  // Epley formula: 1RM = w * (1 + r / 30)
  const calculate1RM = () => {
    const w = parseFloat(weight);
    const r = parseFloat(reps);
    if (!w || !r) return;
    if (r == "1") return setResult(w);
    const oneRM = w * (1 + r / 30);
    setResult(Math.round(oneRM));
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* TITLE */}
        <Text style={styles.tag}>PERFORMANCE TOOLS</Text>
        <Text style={styles.title}>
          MAXIMUM{"\n"}<Text style={styles.highlight}>POTENTIAL</Text>
        </Text>

        <Text style={styles.text}>
          {"Calculate your estimated 1-Rep Max using the Epley formula.\n\nPrecision data for elite performance."}
        </Text>

        {/* INPUT CARD */}
        <View style={styles.card}>
          <View style={styles.inputBlock}>
            <Text style={styles.label}>WEIGHT LIFTED</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0 kgs"
              placeholderTextColor="#555"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>NUMBER OF REPS</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#555"
              value={reps}
              onChangeText={setReps}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={calculate1RM}>
            <Text style={styles.buttonText}>CALCULATE MAX</Text>
          </TouchableOpacity>
        </View>

        {/* RESULT */}
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>ESTIMATED 1 RM</Text>
          <Text style={styles.result}>{result}</Text>
          <Text style={styles.resultLabel}>KGS</Text>
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

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // HEADER

  header: {
    marginTop: 40,
    marginBottom: 10,
    padding: 16,
    backgroundColor: "#111416",
    alignItems: "center",
  },

  headerTitle: {
    fontFamily: "Lexend_800ExtraBold",
    fontSize: 18,
    color: "#eeeef0",
  },

  // TITLE

  tag: {
    color: "#88adff",
    fontSize: 14,
    letterSpacing: 2,
  },

  title: {
    fontSize: 48,
    color: "#fff",
    fontFamily: "Lexend_800ExtraBold",
  },

  highlight: {
    color: "#719eff",
  },

  text: {
    color: "#aaa",
    marginTop: 15,
    marginBottom: 20,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: "Manrope_400Regular",
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
    padding: 25,
    fontSize: 18,
  },

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
  },

  //RESULT

  resultCard: {
    backgroundColor: "#171a1c",
    padding: 30,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },

  resultLabel: {
    color: "#88adff",
    fontSize: 15,
    fontFamily: "Lexend_700Bold",
    letterSpacing: 2,
  },

  result: {
    fontSize: 72,
    color: "#fff",
    fontFamily: "Lexend_800ExtraBold",
  },

  unit: {
    color: "#aaa",
    fontFamily: "Lexend_700Bold",
  },
});