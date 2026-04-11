import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Searchbar } from 'react-native-paper';

export default function ScreenLibrary() {

  const navigation = useNavigation();

  const [ejercicios, setEjercicios] = useState(null);
  const [buscar, setBuscar] = useState("");

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
      .replace(/\(.*?\)/g, "")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  };

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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("Más Detalles", { id: item.exerciseId })
      }
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.gifUrl || "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png"}}
          style={styles.image}
        />

        <View style={styles.overlay} />

        {/* BADGE */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EXERCISE</Text>
        </View>

        {/* TEXT */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            {capitalizeWords(item.name)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <FlatList
        data={ejercicios}
        keyExtractor={(item) => item.exerciseId}
        renderItem={renderItem}

        ListHeaderComponent={
          <View style={styles.content}>
            <Text style={styles.tag}>KNOWLEDGE BASE</Text>

            <Text style={styles.title}>
              EXPLORE{"\n"}
              <Text style={styles.highlight}>PRECISION</Text>
            </Text>

            <Searchbar
              placeholder="Search exercises..."
              placeholderTextColor="#777"
              value={buscar}
              onChangeText={setBuscar}
              style={styles.search}
              inputStyle={{ color: "#fff" }}
              iconColor="#88adff"
            />
          </View>
        }

        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
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
  },

  loadingcontent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

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

  search: {
    backgroundColor: "#232629",
    borderRadius: 12,
    marginVertical: 20,
  },

  // CARD

  card: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },

  imageContainer: {
    position: "relative",
    height: 160,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  cardContent: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Lexend_700Bold",
  },

  // BADGE

  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#88adff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  badgeText: {
    fontSize: 10,
    color: "#002052",
    fontWeight: "bold",
  },

});