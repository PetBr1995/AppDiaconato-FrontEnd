import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const [cpf, setCpf] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      console.log("1. Iniciando login...");
      console.log("Plataforma atual:", Platform.OS);
      console.log("CPF inserido:", cpf);

      // Validação do CPF
      if (!cpf || cpf.length !== 11 || isNaN(cpf)) {
        Alert.alert("Erro", "CPF inválido. Insira exatamente 11 dígitos numéricos.");
        console.log("2. Validação falhou: CPF inválido.");
        return;
      }

      // Ajuste da URL do backend dependendo da plataforma
      const baseURL = Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.10.4:3000";
      console.log("3. Base URL usada:", baseURL);

      // Requisição direta com axios (sem loginUser)
      console.log("4. Enviando requisição para o backend...");
      const response = await axios.post(
        `${baseURL}/api/usuarios/login`,
        { cpf },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("5. Resposta do backend:", response.data);

      // Verifica se o token foi recebido
      if (response.data.token) {
        console.log("6. Token recebido:", response.data.token);
        await AsyncStorage.setItem("userToken", response.data.token);
        console.log("7. Token salvo no AsyncStorage.");

        // Redirecionamento condicional
        if (response.data.user?.tipoUsuario === "admin") {
          console.log("8. Redirecionando para HomeAdmin...");
          navigation.navigate("HomeAdmin");
        } else {
          console.log("8. Redirecionando para Home...");
          navigation.navigate("Home");
        }
      } else {
        Alert.alert("Erro", "Token não recebido do servidor.");
        console.log("Erro: Token não recebido na resposta.");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      if (error.response) {
        console.log("Erro do backend:", error.response.data);
        Alert.alert("Erro", error.response.data.message || "Erro ao fazer login");
      } else if (error.request) {
        console.log("Nenhuma resposta recebida do servidor:", error.request);
        Alert.alert("Erro", "Sem resposta do servidor. Verifique a conexão.");
      } else {
        console.log("Erro na configuração da requisição:", error.message);
        Alert.alert("Erro", error.message || "Ocorreu um erro ao fazer login");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="CPF (11 dígitos)"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
        maxLength={11}
      />
      <TouchableOpacity style={styles.buttonEntrar} onPress={handleLogin}>
        <Text style={styles.buttonEntrarText}>ENTRAR</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Não tem conta? Registre-se aqui</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  link: {
    color: "darkblue",
    marginTop: 10,
    textAlign: "center",
  },
  buttonEntrar: {
    backgroundColor: "#f1901d",
    padding: 12,
    borderRadius: 5,
    marginTop: 6,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonEntrarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
});