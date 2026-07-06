import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Searchbar } from 'react-native-paper';
// ⚡ Importación de la librería moderna para renderizar GIFs correctamente
import { Image } from 'expo-image';

// Función para traducir textos individuales en tiempo real
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

const CATEGORIES = ['all', 'chest', 'back', 'arms', 'shoulders', 'legs', 'core', 'cardio'];

const getCategoryTranslation = (cat, lang) => {
  const translations = {
    'all': { es: 'Todos', en: 'All' },
    'chest': { es: 'Pecho', en: 'Chest' },
    'back': { es: 'Espalda', en: 'Back' },
    'arms': { es: 'Brazos', en: 'Arms' },
    'shoulders': { es: 'Hombros', en: 'Shoulders' },
    'legs': { es: 'Piernas', en: 'Legs' },
    'core': { es: 'Core', en: 'Core' },
    'cardio': { es: 'Cardio', en: 'Cardio' },
  };
  return translations[cat]?.[lang] || cat;
};

// 🌟 DICCIONARIO DE PALABRAS CLAVE MULTIPLES PARA LA API
const KEYWORDS_MULTIPLES = {
  'chest': ['chest', 'pectoral'],
  'back': ['back', 'lats'],
  'shoulders': ['shoulder', 'deltoid'],
  'arms': ['arm', 'bicep', 'tricep', 'forearm'],
  'legs': ['leg', 'squat', 'calf', 'glute'],
  'core': ['crunch', 'plank', 'abs', 'sit-up'], 
  'cardio': ['jump', 'run', 'cardio', 'rope']    
};

export default function ScreenLibrary() {
  const navigation = useNavigation();
  const { i18n } = useTranslation(); 
  const [ejercicios, setEjercicios] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      obtenerEjercicios();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [buscar, activeFilter, i18n.language]);

  const obtenerEjercicios = async () => {
    try {
      setLoadingTranslation(true);
      let listaOriginal = [];

      // 1. COMPORTAMIENTO SI EL USUARIO ESCRIBE EN EL BUSCADOR
      if (buscar.trim() !== "") {
        const response = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(buscar.trim())}`);
        if (response.ok) {
          const result = await response.json();
          listaOriginal = result.data ? result.data : (Array.isArray(result) ? result : []);
        }
      } 
      // 2. FUNCIÓN DE MULTI-LLAMADO EN PARALELO
      else if (activeFilter !== "all") {
        const palabrasClave = KEYWORDS_MULTIPLES[activeFilter] || [activeFilter];

        const peticiones = palabrasClave.map(async (kw) => {
          try {
            const response = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/search?search=${kw}`);
            if (response.status === 404) return [];
            const result = await response.json();
            return result.data ? result.data : (Array.isArray(result) ? result : []);
          } catch (e) {
            return [];
          }
        });

        const resultadosCombinados = await Promise.all(peticiones);
        
        const mapaSinDuplicados = new Map();
        resultadosCombinados.flat().forEach(item => {
          const idUnico = item.exerciseId || item.id;
          if (idUnico && !mapaSinDuplicados.has(idUnico)) {
            mapaSinDuplicados.set(idUnico, item);
          }
        });

        listaOriginal = Array.from(mapaSinDuplicados.values());
      } 
      // 3. COMPORTAMIENTO POR DEFECTO (BOTÓN 'TODOS')
      else {
        const response = await fetch(`https://oss.exercisedb.dev/api/v1/exercises`);
        if (response.ok) {
          const result = await response.json();
          listaOriginal = result.data ? result.data : (Array.isArray(result) ? result : []);
        }
      }
      
      listaOriginal = listaOriginal.slice(0, 30);

      // Si la app está en español, traducimos la lista unificada
      if (i18n.language === 'es' && listaOriginal.length > 0) {
        const listaTraducida = await Promise.all(
          listaOriginal.map(async (item) => {
            const nombreTraducido = await traducirAlEspanol(item.name);
            return { ...item, name: nombreTraducido };
          })
        );
        setEjercicios(listaTraducida);
      } else {
        setEjercicios(listaOriginal);
      }
    } catch (error) {
      console.error("Error general al obtener ejercicios:", error);
      setEjercicios([]); 
    } finally {
      setLoadingTranslation(false);
    }
  };

  const capitalizeWords = (text) => {
    if (!text) return "";
    return text
      .replace(/\(.*?\)/g, "")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  };

  // Filtro local estricto para asegurar la máxima precisión visual en pantalla
  const ejerciciosFiltrados = useMemo(() => {
    if (!ejercicios) return null;
    if (activeFilter === 'all') return ejercicios;
    
    const keywordsMapLocal = {
      'back': ['back', 'lats', 'rhomboids', 'traps', 'spine', 'espalda', 'dorsal', 'lumbar'],
      'cardio': ['cardio', 'aerobic', 'heart', 'run', 'jump', 'carrera', 'salto', 'bike', 'step', 'rope'],
      'chest': ['chest', 'pectorals', 'pecs', 'pecho', 'pectoral'],
      'shoulders': ['shoulder', 'shoulders', 'delts', 'deltoids', 'hombro', 'deltoides'],
      'arms': ['arm', 'arms', 'biceps', 'triceps', 'forearms', 'wrist', 'brazo', 'bicep', 'tricep', 'antebrazo'],
      'legs': ['leg', 'legs', 'quads', 'hamstrings', 'glutes', 'thighs', 'calves', 'soleus', 'pierna', 'cuadriceps', 'femoral', 'gluteo', 'pantorrilla', 'squat'],
      'core': ['waist', 'core', 'abs', 'obliques', 'abdomen', 'cintura', 'abdominal', 'crunch', 'plank', 'sit-up']
    };

    const keywords = keywordsMapLocal[activeFilter] || [activeFilter];

    return ejercicios.filter((item) => {
      const itemString = JSON.stringify(item).toLowerCase();
      return keywords.some(kw => itemString.includes(kw));
    });
  }, [ejercicios, activeFilter]);

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
      onPress={() => navigation.navigate("Más Detalles", { id: item.exerciseId || item.id })}
    >
      <View style={styles.imageContainer}>
        {/* ⚡ Componente optimizado para GIFs */}
        <Image
          source={{ uri: item.gifUrl || "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png" }}
          style={styles.image}
          contentFit="cover"
          transition={400}
        />
        <View style={styles.overlay} />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{i18n.language === 'es' ? "EJERCICIO" : "EXERCISE"}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{capitalizeWords(item.name)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
        {loadingTranslation && (
          <ActivityIndicator size="small" color="#88adff" style={styles.miniLoader} />
        )}
      </View>

      <FlatList
        data={ejerciciosFiltrados} 
        keyExtractor={(item) => item.exerciseId || item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.content}>
            <Text style={styles.tag}>{i18n.language === 'es' ? "BASE DE CONOCIMIENTO" : "KNOWLEDGE BASE"}</Text>
            <Text style={styles.title}>
              {i18n.language === 'es' ? "EXPLORAR" : "EXPLORE"}{"\n"}
              <Text style={styles.highlight}>{i18n.language === 'es' ? "PRECISIÓN" : "PRECISION"}</Text>
            </Text>

            <Searchbar
              placeholder={i18n.language === 'es' ? "Buscar ejercicios..." : "Search exercises..."}
              placeholderTextColor="#777"
              value={buscar}
              onChangeText={setBuscar}
              style={styles.search}
              inputStyle={{ color: "#fff" }}
              iconColor="#88adff"
            />

            <View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filtersContainer}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      activeFilter === cat && styles.activeChip
                    ]}
                    onPress={() => {
                      setBuscar(""); 
                      setActiveFilter(cat);
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      activeFilter === cat && styles.activeChipText
                    ]}>
                      {getCategoryTranslation(cat, i18n.language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10" },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  listContent: { paddingBottom: 140 }, 
  loadingcontent: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginTop: 40, marginBottom: 10, padding: 16, backgroundColor: "#111416", alignItems: "center", position: 'relative' },
  headerTitle: { fontFamily: "Lexend_800ExtraBold", fontSize: 18, color: "#eeeef0" },
  miniLoader: { position: 'absolute', right: 20, bottom: 18 },
  tag: { color: "#88adff", fontSize: 14, letterSpacing: 2, fontFamily: "Manrope_600SemiBold" },
  title: { fontSize: 48, color: "#fff", fontFamily: "Lexend_800ExtraBold" },
  highlight: { color: "#719eff" },
  search: { backgroundColor: "#232629", borderRadius: 12, marginTop: 20, marginBottom: 16 },
  
  filtersContainer: { paddingBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#232629', marginRight: 10, borderWidth: 1, borderColor: '#333' },
  activeChip: { backgroundColor: '#88adff', borderColor: '#88adff' },
  chipText: { color: '#aaa', fontFamily: 'Manrope_600SemiBold', fontSize: 14 },
  activeChipText: { color: '#002052', fontFamily: 'Manrope_600SemiBold', fontWeight: 'bold' },

  card: { marginBottom: 16, marginHorizontal: 16, borderRadius: 16, overflow: "hidden" },
  imageContainer: { position: "relative", height: 160 },
  image: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  cardContent: { position: "absolute", bottom: 10, left: 12, right: 12 },
  cardTitle: { color: "#fff", fontSize: 16, fontFamily: "Lexend_700Bold" },
  badge: { position: "absolute", top: 10, left: 10, backgroundColor: "#88adff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, color: "#002052", fontWeight: "bold" },
});