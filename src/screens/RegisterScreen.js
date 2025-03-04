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
import { registerUser } from "../../api"; // Importe o método de registro
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [area, setArea] = useState("");
  const [congregacao, setCongregacao] = useState(""); // Agora será tratado como string
  const [email, setEmail] = useState("");
  const navigation = useNavigation();

  const handleRegister = async () => {
    try {
      // Validação dos campos
      if (!nome || !cpf || !area || !congregacao || !email) {
        Alert.alert("Erro", "Preencha todos os campos");
        return;
      }

      if (cpf.length !== 11 || isNaN(cpf)) {
        Alert.alert("Erro", "CPF inválido");
        return;
      }

      if (isNaN(area)) {
        Alert.alert("Erro", "Área deve ser um número");
        return;
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        Alert.alert("Erro", "Email inválido");
        return;
      }

      // Montar os dados do usuário
      const userData = {
        nome,
        cpf,
        area: parseInt(area), // Área continua como número
        congregacao, // Congregação agora é string, sem conversão
        email,
        tipoUsuario: "usuario", // Define o tipo de usuário como "usuario" por padrão
      };

      console.log("Dados enviados para o backend:", userData); // Log dos dados enviados

      // Ajuste da URL do backend dependendo da plataforma
      const baseURL = Platform.OS === "web" ? "https://201.75.89.242:3000" : "http://localhost:3000";

      // Chamar o backend para registrar o usuário
      await registerUser(userData, baseURL);

      // Exibir mensagem de sucesso e navegar para a tela de login
      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Erro ao registrar usuário:", error); // Log do erro

      // Exibir mensagem de erro para o usuário
      let errorMessage = "Ocorreu um erro ao registrar o usuário.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message; // Usar mensagem específica do backend, se disponível
      }
      Alert.alert("Erro", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="CPF (11 dígitos)"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
        maxLength={11}
      />
      <TextInput
        style={styles.input}
        placeholder="Área (número)"
        value={area}
        onChangeText={setArea}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Congregação"
        value={congregacao}
        onChangeText={setCongregacao}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TouchableOpacity onPress={handleRegister} style={styles.buttonRegistrar}>
        <Text style={styles.buttonRegistrarText}>REGISTRAR</Text>
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
  buttonRegistrar: {
    backgroundColor: "#f1901d",
    color: "white",
    padding: 12,
    borderRadius: 5,
    width: "100%",
    marginTop: 10,
    alignSelf: "center",
  },
  buttonRegistrarText: {
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
    color: "#ffffff",
  },
});