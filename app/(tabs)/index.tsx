import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useNavigation } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../subapaseClient";

const StatCard = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <FontAwesome5 name={icon} size={20} color="#a1faff" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Views>
);

const ShortcutCard = ({ href, icon, title, subtitle }) => (
    <Link href={href} asChild>
      <TouchableOpacity style={styles.shortcutCard}>
        <View style={styles.shortcutIcon}>
            <MaterialCommunityIcons name={icon} size={28} color="#88adff" />
        </View>
        <View style={{flex: 1}}>
            <Text style={styles.shortcutTitle}>{title}</Text>
            <Text style={styles.shortcutSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#747578" />
      </TouchableOpacity>
    </Link>
);


export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("progreso")
          .select("*")
          .eq("usuario_id", user.id)
          .order("fecha", { ascending: false })
          .limit(5);

        if (error) throw error;
        setProgress(data || []);
      } catch (e) {
        console.error("Failed to fetch progress", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);
  
  const profile = user?.profile;
  const welcomeName = user?.user_metadata?.nombre || user?.nombre || "Atleta";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Summary */}
        <View style={styles.profileSummary}>
            <Text style={styles.welcomeMessage}>Hola de nuevo,</Text>
            <Text style={styles.userName}>{welcomeName}</Text>
            <View style={styles.statsRow}>
                <StatCard label="Peso" value={profile?.peso_kg ? `${profile.peso_kg} kg` : '--'} icon="weight-hanging" />
                <StatCard label="Altura" value={profile?.altura_cm ? `${profile.altura_cm} cm` : '--'} icon="ruler-vertical" />
                <StatCard label="Nivel" value={profile?.nivel_experiencia || 'N/A'} icon="medal" />
            </View>
        </View>

        {/* Navigation Shortcuts */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explorar</Text>
            <ShortcutCard href="/(tabs)/explore" icon="map-search" title="Buscar Gimnasios" subtitle="Encuentra gimnasios cerca de ti" />
            <ShortcutCard href="/(tabs)/history" icon="history" title="Historial de Progreso" subtitle="Revisa tus entrenamientos pasados" />
            <ShortcutCard href="/modal" icon="calculator-variant" title="Calculadoras Fitness" subtitle="Calcula IMC, calorías y más" />
        </View>

        {/* Recent Progress */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            {loading ? (
                <ActivityIndicator color="#88adff" />
            ) : progress.length > 0 ? (
                progress.map(item => (
                    <View key={item.id} style={styles.progressItem}>
                        <FontAwesome5 name="chart-line" size={16} color="#88adff" />
                        <Text style={styles.progressText}>
                            {new Date(item.fecha).toLocaleDateString()}: <Text style={{fontWeight: 'bold'}}>{item.valor}</Text> ({item.tipo_medida})
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={styles.noDataText}>No hay actividad reciente.</Text>
            )}
        </View>
      </View>
    </ScrollView>
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
    profileSummary: {
        backgroundColor: '#171a1c',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    welcomeMessage: {
        fontFamily: 'Manrope_400Regular',
        fontSize: 16,
        color: '#aaabad',
    },
    userName: {
        fontFamily: 'Lexend_700Bold',
        fontSize: 28,
        color: '#eeeef0',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    statCard: {
        alignItems: 'center',
        gap: 8,
    },
    statValue: {
        fontFamily: 'Lexend_600SemiBold',
        fontSize: 18,
        color: '#a1faff',
    },
    statLabel: {
        fontFamily: 'Manrope_500Medium',
        fontSize: 12,
        color: '#aaabad',
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontFamily: 'Lexend_600SemiBold',
        fontSize: 18,
        color: '#eeeef0',
        marginBottom: 12,
    },
    shortcutCard: {
        backgroundColor: '#171a1c',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 16,
    },
    shortcutIcon: {
        backgroundColor: 'rgba(136, 173, 255, 0.1)',
        borderRadius: 8,
        padding: 8,
    },
    shortcutTitle: {
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 14,
        color: '#eeeef0',
    },
    shortcutSubtitle: {
        fontFamily: 'Manrope_400Regular',
        fontSize: 12,
        color: '#aaabad',
        marginTop: 2,
    },
    progressItem: {
        backgroundColor: '#171a1c',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    progressText: {
        fontFamily: 'Manrope_400Regular',
        fontSize: 14,
        color: '#eeeef0',
    },
    noDataText: {
        fontFamily: 'Manrope_400Regular',
        fontSize: 14,
        color: '#aaabad',
        textAlign: 'center',
        marginTop: 10,
    },
});