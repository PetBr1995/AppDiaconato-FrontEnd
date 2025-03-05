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

export default function RegisterScreen() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [area, setArea] = useState("");
  const [congregacao, setCongregacao] = useState("");
  const [email, setEmail] = useState("");
  const navigation = useNavigation();

  // Função para validar CPF
  const isValidCpf = (cpf) => {
    if (!cpf || cpf.length !== 11 || isNaN(cpf)) return false;

    // Remove qualquer sequência repetida (ex.: 11111111111)
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    const calculateDigit = (digits, weights) => {
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        sum += parseInt(digits[i]) * weights[i];
      }
      const remainder = (sum * 10) % 11;
      return remainder === 10 || remainder === 11 ? 0 : remainder;
    };

    const digits = cpf.split("").map(Number);
    const firstDigit = calculateDigit(digits.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const secondDigit = calculateDigit(digits.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

    return firstDigit === digits[9] && secondDigit === digits[10];
  };

  const handleRegister = async () => {
    try {
      // Validação dos campos
      if (!nome || !cpf || !area || !congregacao || !email) {
        Alert.alert("Erro", "Preencha todos os campos");
        return;
      }

      if (!isValidCpf(cpf)) {
        Alert.alert("Erro", "CPF inválido. Insira um CPF real e válido.");
        alert('CPF inválido!')
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
        area: parseInt(area),
        congregacao,
        email,
        tipoUsuario: "usuario", // Define o tipo de usuário como "usuario" por padrão
      };

      console.log("Dados enviados para o backend:", userData);

      // Ajuste da URL do backend dependendo da plataforma
      const baseURL = Platform.OS === "web" ? "https://appdiaconato.ddns.net:3000" : "http://localhost:3000";

      // Chamar o backend para registrar o usuário diretamente com axios
      console.log("Enviando requisição para o backend...");
      const response = await axios.post(
        `${baseURL}/api/usuarios/register`,
        userData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Resposta do backend:", response.data);

      // Exibir mensagem de sucesso e navegar para a tela de login
      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      alert('Usuário cadastrado com sucesso!')
      navigation.navigate("Login");
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);

      // Exibir mensagem de erro para o usuário
      let errorMessage = "Ocorreu um erro ao registrar o usuário.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
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