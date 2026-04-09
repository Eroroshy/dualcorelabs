import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ScreenRoutine() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hypertrophy A</Text>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>00:42:15</Text>
        </View>

        <View>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>8,420 kg</Text>
        </View>
      </View>

      {/* EXERCISE CARD */}
      <View style={styles.card}>
        <Text style={styles.exercise}>Bench Press</Text>

        {[1, 2].map((set) => (
          <View key={set} style={styles.setRow}>
            <Text style={styles.setNumber}>{set}</Text>

            <TextInput style={styles.input} placeholder="Kg" />
            <TextInput style={styles.input} placeholder="Reps" />

            <TouchableOpacity style={styles.doneBtn}>
              <Text style={{ color: "#88adff" }}>✓</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addSet}>
          <Text style={{ color: "#aaa" }}>+ Add Set</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10", padding: 16 },

  title: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Lexend_800ExtraBold",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },

  statLabel: { color: "#aaa", fontSize: 12 },
  statValue: { color: "#a1faff", fontSize: 20 },

  card: {
    backgroundColor: "#171a1c",
    padding: 16,
    borderRadius: 12,
  },

  exercise: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },

  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },

  setNumber: {
    color: "#88adff",
    width: 20,
  },

  input: {
    backgroundColor: "#232629",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    flex: 1,
  },

  doneBtn: {
    padding: 10,
  },

  addSet: {
    marginTop: 10,
    alignItems: "center",
  },
});