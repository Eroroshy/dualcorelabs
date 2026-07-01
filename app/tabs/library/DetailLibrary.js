import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const traducirAlEspanol = async (texto) => {
  if (!texto) return "";
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(texto)}`
    );
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    return texto;
  }
};

export default function DetailLibrary({ route }) {
  const { id } = route.params;
  const { i18n } = useTranslation();
  const [ejercicios, setEjercicios] = useState(null);

  const obtenerEjercicios = async () => {
    try {
      setEjercicios(null); // Resetea para pintar el loading si cambia el idioma
      const response = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/${id}`);
      const result = await response.json();
      const ex = result.data;

      // ⚡ CONDICIÓN MÁGICA: Si el idioma seleccionado es Español, traduce toda la ficha técnica
      if (i18n.language === 'es') {
        const nombreTraducido = await traducirAlEspanol(ex.name);
        
        const musculosTraducidos = await Promise.all(
          (ex.targetMuscles || []).map(m => traducirAlEspanol(m))
        );
        
        const instruccionesTraducidas = await Promise.all(
          (ex.instructions || []).map(step => traducirAlEspanol(step))
        );

        setEjercicios({
          ...ex,
          name: nombreTraducido,
          targetMuscles: musculosTraducidos,
          instructions: instruccionesTraducidas
        });
      } else {
        // 🇬🇧 Si está en Inglés, renderiza los textos nativos sin llamadas a traductores
        setEjercicios(ex);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerEjercicios();
  }, [id, i18n.language]); // Re-ejecuta de inmediato si el usuario cambia el idioma dentro de la pantalla

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          <Image source={{ uri: ejercicios.gifUrl }} style={styles.image} />

          <Text style={styles.title}>{ejercicios.name.toUpperCase()}</Text>

          <Text style={styles.tag}>{ejercicios.targetMuscles?.join(", ").toUpperCase()}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.language === 'es' ? "Instrucciones" : "Instructions"}</Text>

            {ejercicios.instructions?.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{formatStep(step)}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10" },
  scrollContent: { paddingBottom: 140 }, 
  header: { marginTop: 40, padding: 16, backgroundColor: "#111416", alignItems: "center" },
  headerTitle: { fontFamily: "Lexend_800ExtraBold", fontSize: 18, color: "#eeeef0" },
  content: { padding: 16 },
  loadingcontent: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 350, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 24, color: "#fff", fontFamily: "Lexend_800ExtraBold", marginBottom: 4, textAlign: "center" },
  tag: { color: "#88adff", marginBottom: 16, letterSpacing: 1, textAlign: "center", fontFamily: "Manrope_600SemiBold" },
  card: { backgroundColor: "#171a1c", borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, color: "#eeeef0", fontFamily: "Lexend_700Bold", marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  stepBadge: { backgroundColor: "#88adff", width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center", marginRight: 10 },
  stepNumber: { color: "#002052", fontWeight: "bold", fontSize: 12 },
  stepText: { color: "#aaabad", flex: 1, lineHeight: 18, fontFamily: "Manrope_400Regular" },
});