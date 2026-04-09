import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ScreenLibrary() {

  const [ejercicios, setEjercicios] = useState([]);
  const [buscar, setBuscar] = useState('Bench Press');

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      obtenerEjercicios();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [buscar]);

  const obtenerEjercicios = () => {
    fetch(`https://oss.exercisedb.dev/api/v1/exercises/search?search=${buscar}`)
      .then((response) => response.json())
      .then((result) => setEjercicios(result.data))
      .catch((error) => console.error(error));
  };

const capitalizeWords = (text) => {
  return text
    .replace(/\(.*?\)/g, "") // quita (male)
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
};

console.log(ejercicios);
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <FlatList
        data={ejercicios}
        keyExtractor={(item) => item.exerciseId}
        ListHeaderComponent={
          <>
            <View style={styles.content}>
              <Text style={styles.tag}>KNOWLEDGE BASE</Text>

              <Text style={styles.title}>
                EXPLORE{"\n"}
                <Text style={styles.highlight}>PRECISION</Text>
              </Text>

              <TextInput
                placeholder="Search exercises..."
                placeholderTextColor="#777"
                style={styles.search}
                value={buscar}
                onChangeText={setBuscar}
              />
            </View>
          </>
        }

        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>{capitalizeWords(item.name)}</Text>
            <Text style={styles.cardDesc}>{item.name}</Text>
          </TouchableOpacity>
        )}

      />
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

  search: {
    backgroundColor: "#232629",
    padding: 14,
    borderRadius: 12,
    marginVertical: 20,
    color: "#fff",
  },

  card: {
    backgroundColor: "#171a1c",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
  },

  cardDesc: {
    color: "#aaa",
  },
});