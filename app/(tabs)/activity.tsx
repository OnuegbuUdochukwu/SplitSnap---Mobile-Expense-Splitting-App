import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown 
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

interface Transaction {
  id: string;
  type: 'bill' | 'payment_sent' | 'payment_received';
  title: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  group?: string;
}

// Mock data - will be replaced with real data from Supabase
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'bill',
    title: 'Dinner at Mama Cass',
    amount: -2850,
    date: '2025-01-07T19:30:00Z',
    status: 'completed',
    group: 'Friends',
  },
  {
    id: '2',
    type: 'payment_received',
    title: 'Payment from John',
    amount: 1200,
    date: '2025-01-07T15:20:00Z',
    status: 'completed',
  },
  {
    id: '3',
    type: 'payment_sent',
    title: 'Settled with Sarah',
    amount: -850,
    date: '2025-01-06T12:15:00Z',
    status: 'completed',
  },
  {
    id: '4',
    type: 'bill',
    title: 'Uber ride split',
    amount: -450,
    date: '2025-01-05T22:45:00Z',
    status: 'pending',
  },
];

export default function ActivityScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'bills' | 'payments'>('all');

  useEffect(() => {
    // For now, use mock data
    setTransactions(mockTransactions);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === 'all') return true;
    if (filterType === 'bills') return transaction.type === 'bill';
    if (filterType === 'payments') return transaction.type.includes('payment');
    return true;
  });

  const totalSpent = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalReceived = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'bill':
        return <Receipt size={20} color="#EF4444" />;
      case 'payment_sent':
        return <ArrowUpRight size={20} color="#F59E0B" />;
      case 'payment_received':
        return <ArrowDownLeft size={20} color="#10B981" />;
      default:
        return <Receipt size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view activity</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.summaryAmount}>₦{totalReceived.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Received</Text>
          </View>
          <View style={styles.summaryCard}>
            <TrendingDown size={24} color="#EF4444" />
            <Text style={styles.summaryAmount}>₦{totalSpent.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Spent</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'all' && styles.activeFilterTab,
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterType === 'all' && styles.activeFilterTabText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'bills' && styles.activeFilterTab,
            ]}
            onPress={() => setFilterType('bills')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterType === 'bills' && styles.activeFilterTabText,
              ]}
            >
              Bills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'payments' && styles.activeFilterTab,
            ]}
            onPress={() => setFilterType('payments')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterType === 'payments' && styles.activeFilterTabText,
              ]}
            >
              Payments
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {filteredTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {filteredTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.transactionIcon}>
                    {getTransactionIcon(transaction.type)}
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                      {transaction.title}
                    </Text>
                    {transaction.group && (
                      <Text style={styles.transactionGroup}>
                        {transaction.group}
                      </Text>
                    )}
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.transactionAmount}>
                    <Text
                      style={[
                        styles.amountText,
                        { color: transaction.amount >= 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      ₦{Math.abs(transaction.amount).toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(transaction.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No transactions</Text>
              <Text style={styles.emptyStateSubtext}>
                Your transaction history will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeFilterTab: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  transactionGroup: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});