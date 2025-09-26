import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ManualBillScreen() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const router = useRouter();

  const createBill = async () => {
    try {
      const parsedAmount = parseFloat(amount);
      if (!name || !parsedAmount) {
        Alert.alert('Validation', 'Please provide a name and amount');
        return;
      }

      // Find a user to attach the bill to (in-app this would be current user)
      const { data: users } = await supabase.from('users').select('*').limit(1);
      if (!users || users.length === 0) {
        Alert.alert(
          'No user',
          'No user found. Run e2e-auth to create a test user.'
        );
        return;
      }
      const user = users[0];

      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          creator_id: user.user_id,
          total_amount: parsedAmount,
          status: 'pending',
        })
        .select('*')
        .single();
      if (billError) throw billError;

      Alert.alert('Bill created', `Bill ${billData.bill_id} created`);
      router.push('/');
    } catch (err) {
      console.error('Error creating bill:', err);
      Alert.alert('Error', 'Failed to create bill');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Bill</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Bill name"
        style={styles.input}
      />
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Total amount"
        style={styles.input}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={createBill}>
        <Text style={styles.buttonText}>Create Bill</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
