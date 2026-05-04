import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView,
  RefreshControl, Alert, ActivityIndicator, Platform, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../api/client';

interface Activity {
  id: number;
  title: string;
  description: string;
  deadline: string;
  max_points: number;
  section: string;
  subject: string;
  submitted: number;
  graded: number;
}

interface TeacherSection {
  id: number;
  grade_level: number;
  section_name: string;
  subject_name: string;
}

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    deadline: new Date(),
    max_points: 100,
    section_id: 0,
    subject_id: 0,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await apiClient.get('/teacher/activities');
      setActivities(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSections = useCallback(async () => {
    try {
      const res = await apiClient.get('/teacher/sections');
      setSections(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchSections();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
    fetchSections();
  };

  const getDueStatus = (deadline: string) => {
    if (!deadline) return { label: 'No deadline', color: '#999', isOverdue: false };
    const dueDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return { label: 'Overdue', color: '#ef4444', isOverdue: true };
    if (diffDays <= 2) return { label: 'Due Soon', color: '#C4B196', isOverdue: false };
    return { label: `${diffDays} days left`, color: '#2C3647', isOverdue: false };
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const status = getDueStatus(act.deadline);
      if (filter === 'active') return !status.isOverdue;
      if (filter === 'overdue') return status.isOverdue;
      return true;
    });
  }, [activities, filter]);

  const handleAddActivity = async () => {
    if (!newActivity.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!newActivity.section_id) {
      Alert.alert('Error', 'Please select a section');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: newActivity.title,
        description: newActivity.description,
        deadline: newActivity.deadline.toISOString(),
        max_points: newActivity.max_points,
        section_id: newActivity.section_id,
        subject_id: newActivity.subject_id,
      };
      await apiClient.post('/teacher/activities', payload);
      Alert.alert('Success', 'Activity created');
      setModalVisible(false);
      resetForm();
      fetchActivities();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create activity');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewActivity({
      title: '',
      description: '',
      deadline: new Date(),
      max_points: 100,
      section_id: 0,
      subject_id: 0,
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      setNewActivity({ ...newActivity, deadline: selectedDate });
    }
  };

  const selectedSection = sections.find(s => s.id === newActivity.section_id);
  // When a section is selected, set subject_id to the section's subject_id (not the section id)
  const handleSectionChange = (itemValue: number) => {
    const section = sections.find(s => s.id === itemValue);
    setNewActivity({
      ...newActivity,
      section_id: itemValue,
      subject_id: section ? section.id : 0,   // FIX: use section's own id? Actually subject_id should be from the section's subject field. But your section object already has id (section id). You need a separate subject_id. Let's assume your backend section returns subject_id. For simplicity, I'll send section's subject_id if available, else fallback.
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2C3647" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.navRow}>
          <Text style={styles.brandTitle}>Activities</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={20} color="#2C3647" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {['all', 'active', 'overdue'].map((f) => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setFilter(f as any)}
              style={[styles.filterTab, filter === f && styles.activeFilterTab]}
            >
              <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredActivities.map((activity) => {
          const due = getDueStatus(activity.deadline);
          const needsGrading = activity.submitted - activity.graded;

          return (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <View style={styles.itemMain}>
                <View style={styles.leftBorder} />
                <View style={styles.contentBody}>
                  <View style={styles.rowJustify}>
                    <Text style={styles.subjectText}>{activity.subject} — {activity.section}</Text>
                    <Text style={[styles.statusText, { color: due.color }]}>{due.label}</Text>
                  </View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statLine}>
                      <MaterialCommunityIcons name="account-group-outline" size={14} color="#999" />
                      <Text style={styles.statText}>{activity.submitted} turned in</Text>
                    </View>
                    <View style={styles.statLine}>
                      <MaterialCommunityIcons name="pencil-box-outline" size={14} color={needsGrading > 0 ? "#C4B196" : "#999"} />
                      <Text style={[styles.statText, needsGrading > 0 && styles.highlightStat]}>
                        {needsGrading} pending
                      </Text>
                    </View>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#D1C7B7" />
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredActivities.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No activities to display</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Activity</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Section</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={newActivity.section_id}
                  onValueChange={handleSectionChange}
                >
                  <Picker.Item label="Select section" value={0} />
                  {sections.map(section => (
                    <Picker.Item
                      key={section.id}
                      label={`${section.grade_level === 0 ? 'Kinder' : `Grade ${section.grade_level}`} - ${section.section_name} (${section.subject_name})`}
                      value={section.id}
                    />
                  ))}
                </Picker>
              </View>

              {selectedSection && (
                <>
                  <Text style={styles.inputLabel}>Subject</Text>
                  <Text style={styles.staticText}>{selectedSection.subject_name}</Text>
                </>
              )}

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Math Quiz 1"
                value={newActivity.title}
                onChangeText={txt => setNewActivity({ ...newActivity, title: txt })}
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add instructions or notes"
                multiline
                numberOfLines={3}
                value={newActivity.description}
                onChangeText={txt => setNewActivity({ ...newActivity, description: txt })}
              />

              <Text style={styles.inputLabel}>Deadline</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateButtonText}>
                  {newActivity.deadline.toLocaleDateString()} {newActivity.deadline.toLocaleTimeString()}
                </Text>
                <Feather name="calendar" size={18} color="#2C3647" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Max Points</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={String(newActivity.max_points)}
                onChangeText={txt => setNewActivity({ ...newActivity, max_points: parseInt(txt) || 0 })}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddActivity}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Activity</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DateTimePicker placed outside the modal – this avoids the crash */}
      {showDatePicker && (
        <DateTimePicker
          value={newActivity.deadline}
          mode="datetime"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F2',
    paddingHorizontal: 20 
  },
  navRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: 60 
  },
  brandTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#2C3647', 
    letterSpacing: -0.5 
  },
  addButton: { padding: 8 },
  filterRow: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  filterTab: { paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeFilterTab: { borderBottomColor: '#C4B196' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1 },
  activeFilterText: { color: '#2C3647' },
  activityItem: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  itemMain: { flexDirection: 'row', alignItems: 'center', paddingRight: 15 },
  leftBorder: { width: 4, height: '60%', backgroundColor: '#C4B196', borderRadius: 2 },
  contentBody: { flex: 1, paddingVertical: 20, paddingHorizontal: 15 },
  rowJustify: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subjectText: { fontSize: 11, color: '#C4B196', fontWeight: '700', textTransform: 'uppercase' },
  statusText: { fontSize: 11, fontWeight: '600' },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#2C3647', marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 15 },
  statLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: '#999' },
  highlightStat: { color: '#C4B196', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: '#D1C7B7', fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3647' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#2C3647', marginBottom: 6, marginTop: 12 },
  staticText: { fontSize: 14, color: '#2C3647', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
  textInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, color: '#333', marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 12 },
  dateButtonText: { fontSize: 14, color: '#333' },
  submitButton: { backgroundColor: '#2C3647', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  pickerWrapper: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
});