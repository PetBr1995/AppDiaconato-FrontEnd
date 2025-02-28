import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function UserProfileScreen({ route }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = route.params?.id; // Recupera o ID do usuário dos parâmetros da rota
        if (!userId) {
          console.error("ID do usuário não encontrado.");
          return;
        }

        // Obtém o token JWT do AsyncStorage
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.error("Token não encontrado.");
          return;
        }

        // Ajuste da URL do backend dependendo da plataforma
        const baseURL = Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.10.4:3000";
        const response = await axios.get(
          `${baseURL}/api/usuarios/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Atualiza o estado com os dados do usuário
        setUser(response.data);
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [route]);

  if (loading) {
    return <ActivityIndicator size="large" color="#f1901d" />;
  }

  if (!user) {
    return <Text>Usuário não encontrado.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil do Usuário</Text>
      <Text>Nome: {user.nome}</Text>
      <Text>CPF: {user.cpf}</Text>
      <Text>Email: {user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});