import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Switch } from "react-native-paper";

import { AuthContext } from "../../context/AuthContext";

const MyComponent = () => {
  const [isSwitchOn, setIsSwitchOn] = React.useState(false);

  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />;
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);
  const profile = user?.profile;

  const avatarSource = profile?.foto_url
    ? { uri: profile.foto_url }
    : { uri: "https://www.mensfitness.com/.image/w_2560,q_auto:good,c_fill,ar_4:3/MjA3ODczMTcwMzk5NTY5MjE2/terry-crews.jpg?arena_f_auto" };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{profile?.nivel_experiencia?.toUpperCase() || "PRINCIPIANTE"}</Text>
          </View>
        </View>

        <Text style={styles.label}>Active Profile</Text>
        <Text style={styles.name}>{user?.nombre || "Usuario"}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile?.edad ?? "--"}</Text>
            <Text style={styles.statLabel}>Edad</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile?.peso_kg ? `${profile.peso_kg}kg` : "--"}</Text>
            <Text style={styles.statLabel}>Peso</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile?.altura_cm ? `${profile.altura_cm}cm` : "--"}</Text>
            <Text style={styles.statLabel}>Altura</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile?.objetivo || "-"}</Text>
            <Text style={styles.statLabel}>Objetivo</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Preferences</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="notifications" size={24} color="#88adff" />
              <View>
                <Text style={styles.rowTitle}>Push Notifications</Text>
                <Text style={styles.rowSubtitle}>Alerts for milestones</Text>
              </View>
            </View>
            <MyComponent style={styles.toggle} />
          </View>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="language" size={24} color="#88adff" />
              <View>
                <Text style={styles.rowTitle}>Language</Text>
                <Text style={styles.rowSubtitle}>English</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#747578" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("Editar Perfil")}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="lock" size={24} color="#88adff" />
              <View>
                <Text style={styles.rowTitle}>Editar perfil</Text>
                <Text style={styles.rowSubtitle}>Modificar información personal</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#747578" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.smallLabel}>Training Status</Text>
          <Text style={styles.status}>{profile?.nivel_experiencia ? `Nivel ${profile.nivel_experiencia}` : "Status desconocido"}</Text>
          <Text style={styles.rowSubtitle}>{profile?.objetivo ? `Objetivo: ${profile.objetivo}` : "No hay objetivo definido"}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out" size={20} color="#ff716c" />
          <Text style={styles.logoutText}>Sign Out Session</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 16,
  },
  rankBadge: {
    position: "absolute",
    bottom: 10,
    right: 40,
    backgroundColor: "#88adff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankText: {
    color: "#002052",
    fontWeight: "bold",
    fontSize: 12,
  },
  label: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#88adff",
    textAlign: "center",
    letterSpacing: 1,
  },
  name: {
    fontFamily: "Lexend_800ExtraBold",
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  statBlock: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Lexend_700Bold",
    fontSize: 20,
    color: "#a1faff",
  },
  statLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#aaabad",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#46484a",
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: "#171a1c",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  cardTitle: {
    fontFamily: "Lexend_700Bold",
    fontSize: 16,
    color: "#eeeef0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: "#eeeef0",
  },
  rowSubtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    color: "#aaabad",
  },
  toggle: {
    width: 40,
    height: 20,
    backgroundColor: "#88adff",
    borderRadius: 10,
  },
  smallLabel: {
    color: "#aaabad",
    fontSize: 12,
  },
  status: {
    fontFamily: "Lexend_700Bold",
    fontSize: 18,
    color: "#eeeef0",
  },
  logoutBtn: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff716c",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  logoutText: {
    fontFamily: "Manrope_700Bold",
    color: "#ff716c",
  },
});
