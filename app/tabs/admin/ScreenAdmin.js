import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Searchbar } from "react-native-paper";
import { supabase } from "../../subapaseClient";

// Diccionario local estricto para evitar Spanglish en la administración
const TEXTOS_ADMIN = {
  es: {
    tag: "Panel de Control",
    titulo: "GESTIÓN DE",
    sub: "USUARIOS",
    buscar_placeholder: "Buscar por nombre...",
    admin_label: "ADMINISTRADOR",
    tester_label: "PROBADOR (TESTER)",
    user_label: "USUARIO GENERAL",
    accion_pass: "Restablecer clave",
    accion_rol: "Cambiar Rol",
    accion_eliminar: "Eliminar",
    vacio: "No se encontraron usuarios activos.",
  },
  en: {
    tag: "Control Panel",
    titulo: "USER",
    sub: "MANAGEMENT",
    buscar_placeholder: "Search by name...",
    admin_label: "ADMINISTRATOR",
    tester_label: "TESTER",
    user_label: "GENERAL USER",
    accion_pass: "Reset Password",
    accion_rol: "Change Role",
    accion_eliminar: "Delete Account",
    vacio: "No active users found.",
  },
};

export default function ScreenAdmin() {
  const { i18n } = useTranslation();
  const [usuarios, setUsuarios] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(true);

  const idioma = i18n.language?.startsWith("es") ? "es" : "en";
  const txt = TEXTOS_ADMIN[idioma];

  useEffect(() => {
    cargarUsuarios();
  }, [buscar]);

  // Descarga los perfiles reales desde Supabase sin colapsar por la columna correo
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("perfiles") 
        .select("*")
        .order("nombre", { ascending: true });

      // Filtrado seguro únicamente por la columna 'nombre'
      if (buscar.trim() !== "") {
        query = query.ilike("nombre", `%${buscar}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función 1: Forzar restablecimiento de clave vía email
  const forzarRestablecimiento = async (email, nombre) => {
    if (!email) {
      Alert.alert(
        idioma === "es" ? "Aviso" : "Notice",
        idioma === "es" 
          ? `El perfil de ${nombre} no tiene un correo público vinculado en esta tabla.`
          : `The profile for ${nombre} does not have a public email linked in this table.`
      );
      return;
    }

    Alert.alert(
      idioma === "es" ? "Confirmar Acción" : "Confirm Action",
      idioma === "es" 
        ? `¿Enviar correo de recuperación a ${email}?`
        : `Send recovery email to ${email}?`,
      [
        { text: idioma === "es" ? "Cancelar" : "Cancel", style: "cancel" },
        {
          text: idioma === "es" ? "Enviar" : "Send",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) throw error;
              Alert.alert("Éxito", idioma === "es" ? "Enlace enviado." : "Link sent.");
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  // Función 2: Modificar el rol del usuario de manera cíclica
  const cambiarRolUsuario = async (userId, rolActual) => {
    const buildRol = rolActual || "user";
    const nuevoRol = buildRol === "tester" ? "user" : buildRol === "user" ? "admin" : "tester";
    
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ rol: nuevoRol })
        .eq("id", userId); 

      if (error) throw error;
      Alert.alert(
        "Éxito", 
        idioma === "es" ? `Rol cambiado a ${nuevoRol.toUpperCase()}` : `Role changed to ${nuevoRol.toUpperCase()}`
      );
      cargarUsuarios();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // Función 3: Eliminar perfil de la tabla
  const eliminarUsuario = async (userId, nombre) => {
    Alert.alert(
      idioma === "es" ? "¡PELIGRO!" : "DANGER!",
      idioma === "es"
        ? `¿Estás completamente seguro de eliminar a ${nombre}? Esta acción no se puede deshacer.`
        : `Are you absolutely sure you want to delete ${nombre}? This action cannot be undone.`,
      [
        { text: idioma === "es" ? "Cancelar" : "Cancel", style: "cancel" },
        {
          text: idioma === "es" ? "ELIMINAR" : "DELETE",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("perfiles").delete().eq("id", userId);
              if (error) throw error;
              Alert.alert("Éxito", idioma === "es" ? "Usuario eliminado." : "User deleted.");
              cargarUsuarios();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const renderUsuario = ({ item }) => {
    const esAdmin = item.rol === "admin";
    const esTester = item.rol === "tester";
    
    let etiquetaRol = txt.user_label;
    if (esAdmin) etiquetaRol = txt.admin_label;
    if (esTester) etiquetaRol = txt.tester_label;

    // Resguardo por si decides añadir la columna email/correo más adelante
    const userEmail = item.email || item.correo || (idioma === "es" ? "Sin correo registrado" : "No email registered");

    return (
      <View style={styles.userCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{item.nombre || "Atleta Anónimo"}</Text>
          <View style={[styles.roleBadge, esAdmin && styles.badgeAdmin, esTester && styles.badgeTester]}>
            <Text style={[styles.roleBadgeText, esAdmin && styles.textAdmin, esTester && styles.textTester]}>
              {etiquetaRol}
            </Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{userEmail}</Text>

        {/* BOTONES DE ACCIÓN */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => forzarRestablecimiento(item.email || item.correo, item.nombre)}
          >
            <Text style={styles.actionBtnText}>{txt.accion_pass}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnOutline]} 
            onPress={() => cambiarRolUsuario(item.id, item.rol)}
          >
            <Text style={[styles.actionBtnText, styles.textHighlight]}>{txt.accion_rol}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.btnDanger]} 
            onPress={() => eliminarUsuario(item.id, item.nombre)}
          >
            <Text style={styles.btnDangerText}>{txt.accion_eliminar}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>K I N E T I C</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.tag}>{txt.tag.toUpperCase()}</Text>
        <Text style={styles.title}>
          {txt.titulo}{"\n"}
          <Text style={styles.highlight}>{txt.sub}</Text>
        </Text>

        <Searchbar
          placeholder={txt.buscar_placeholder}
          placeholderTextColor="#777"
          value={buscar}
          onChangeText={setBuscar}
          style={styles.search}
          inputStyle={{ color: "#fff" }}
          iconColor="#88adff"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#88adff" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderUsuario}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>{txt.vacio}</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10" },
  header: { marginTop: 40, padding: 16, backgroundColor: "#111416", alignItems: "center" },
  headerTitle: { fontFamily: "Lexend_800ExtraBold", fontSize: 18, color: "#eeeef0" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  tag: { color: "#ff716c", fontSize: 14, letterSpacing: 2, fontFamily: "Manrope_600SemiBold" },
  title: { fontSize: 40, color: "#fff", fontFamily: "Lexend_800ExtraBold", lineHeight: 46, marginVertical: 4 },
  highlight: { color: "#ff8b87" },
  search: { backgroundColor: "#232629", borderRadius: 12, marginTop: 15, marginBottom: 20 },
  listContainer: { paddingBottom: 100 },
  emptyText: { color: "#747578", textAlign: "center", marginTop: 40, fontFamily: "Manrope_400Regular" },

  userCard: { backgroundColor: "#171a1c", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#24282c" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userName: { color: "#fff", fontSize: 16, fontFamily: "Lexend_700Bold" },
  userEmail: { color: "#747578", fontSize: 13, fontFamily: "Manrope_400Regular", marginTop: 2 },
  
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "#232629" },
  roleBadgeText: { fontSize: 10, fontFamily: "Lexend_700Bold", color: "#aaabad" },
  badgeAdmin: { backgroundColor: "rgba(255, 113, 108, 0.15)" },
  textAdmin: { color: "#ff716c" },
  badgeTester: { backgroundColor: "rgba(136, 173, 255, 0.15)" },
  textTester: { color: "#88adff" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 8 },
  actionBtn: { flex: 1, backgroundColor: "#232629", paddingVertical: 10, borderRadius: 6, alignItems: "center" },
  actionBtnText: { fontSize: 11, fontFamily: "Manrope_700Bold", color: "#eeeef0", textAlign: "center" },
  btnOutline: { borderWidth: 1, borderColor: "#88adff", backgroundColor: "transparent" },
  textHighlight: { color: "#88adff" },
  btnDanger: { backgroundColor: "rgba(255, 113, 108, 0.1)" },
  btnDangerText: { fontSize: 11, fontFamily: "Manrope_700Bold", color: "#ff716c" },
});