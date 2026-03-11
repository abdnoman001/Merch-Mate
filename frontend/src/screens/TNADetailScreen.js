import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { differenceInDays, format, startOfDay, parse, isValid, addDays } from 'date-fns';
import uuid from 'react-native-uuid';
import { useTheme } from '../context/ThemeContext';
import { getTNAById, updateTNA, deleteTNA } from '../utils/storageService';
import { scheduleTNANotifications, cancelMilestoneNotifications } from '../utils/tnaNotifications';

const ACCENT = '#e67e22';

const STATUS_COLORS = {
    'on-track': '#28a745',
    'at-risk': '#ffc107',
    'delayed': '#dc3545',
    'completed': '#6c757d',
};

const OWNER_OPTIONS = ['merchandiser', 'factory', 'buyer'];

const OWNER_EMOJI = {
    merchandiser: '\uD83D\uDC64',
    factory: '\uD83C\uDFED',
    buyer: '\uD83D\uDED2',
};

const computeMilestoneStatus = (milestone) => {
    if (milestone.completedAt) return 'completed';
    const today = startOfDay(new Date());
    const due = startOfDay(new Date(milestone.dueDate));
    const daysUntil = differenceInDays(due, today);
    if (daysUntil < 0) return 'delayed';
    if (daysUntil <= 3) return 'at-risk';
    return 'on-track';
};

const computeOverallProgress = (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.completedAt).length;
    return Math.round((completed / milestones.length) * 100);
};

const TNADetailScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { tnaId } = route.params;

    const [tna, setTna] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [editNotes, setEditNotes] = useState('');
    const [editOwner, setEditOwner] = useState('merchandiser');
    const [editDueDay, setEditDueDay] = useState('');
    const [editDueMonth, setEditDueMonth] = useState('');
    const [editDueYear, setEditDueYear] = useState('');

    // Add milestone modal
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newOwner, setNewOwner] = useState('merchandiser');
    const [newDueDay, setNewDueDay] = useState('');
    const [newDueMonth, setNewDueMonth] = useState('');
    const [newDueYear, setNewDueYear] = useState('');

    const loadTNA = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTNAById(tnaId);
            if (!data) {
                setError('TNA not found.');
                setLoading(false);
                return;
            }
            // Recalculate statuses
            const updatedMilestones = (data.milestones || []).map((m) => ({
                ...m,
                status: computeMilestoneStatus(m),
            }));
            setTna({ ...data, milestones: updatedMilestones });
            setLoading(false);
        } catch (err) {
            console.error('Error loading TNA:', err);
            setError('Failed to load TNA details.');
            setLoading(false);
        }
    }, [tnaId]);

    useEffect(() => {
        loadTNA();
        const unsubscribe = navigation.addListener('focus', () => {
            loadTNA();
        });
        return unsubscribe;
    }, [navigation, loadTNA]);

    const persistAndRefresh = async (updatedTNA) => {
        const success = await updateTNA(tnaId, updatedTNA);
        if (success) {
            try {
                await scheduleTNANotifications(updatedTNA);
            } catch (e) {
                // Notification scheduling may fail silently
            }
            await loadTNA();
        } else {
            Alert.alert('Error', 'Failed to save changes.');
        }
    };

    // --- Edit milestone modal ---
    const openEditModal = (milestone) => {
        setSelectedMilestone(milestone);
        setEditNotes(milestone.notes || '');
        setEditOwner(milestone.owner || 'merchandiser');
        const due = new Date(milestone.dueDate);
        if (isValid(due)) {
            setEditDueDay(String(due.getDate()));
            setEditDueMonth(String(due.getMonth() + 1));
            setEditDueYear(String(due.getFullYear()));
        } else {
            setEditDueDay('');
            setEditDueMonth('');
            setEditDueYear('');
        }
        setModalVisible(true);
    };

    const handleMarkCompleted = async () => {
        if (!selectedMilestone || !tna) return;
        const updatedMilestones = tna.milestones.map((m) =>
            m.id === selectedMilestone.id
                ? { ...m, completedAt: new Date().toISOString(), status: 'completed' }
                : m
        );
        const updatedTNA = { ...tna, milestones: updatedMilestones };
        try {
            await cancelMilestoneNotifications(tnaId, selectedMilestone.id);
        } catch (e) {
            // Ignore
        }
        await persistAndRefresh(updatedTNA);
        setSelectedMilestone({ ...selectedMilestone, completedAt: new Date().toISOString(), status: 'completed' });
    };

    const handleUndoComplete = async () => {
        if (!selectedMilestone || !tna) return;
        const updatedMilestones = tna.milestones.map((m) =>
            m.id === selectedMilestone.id
                ? { ...m, completedAt: null, status: computeMilestoneStatus({ ...m, completedAt: null }) }
                : m
        );
        const updatedTNA = { ...tna, milestones: updatedMilestones };
        await persistAndRefresh(updatedTNA);
        setSelectedMilestone({ ...selectedMilestone, completedAt: null });
    };

    const handleSaveEdit = async () => {
        if (!selectedMilestone || !tna) return;
        const day = parseInt(editDueDay, 10);
        const month = parseInt(editDueMonth, 10);
        const year = parseInt(editDueYear, 10);
        if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
            Alert.alert('Invalid Date', 'Please enter a valid day, month, and year.');
            return;
        }
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) {
            Alert.alert('Invalid Date', 'The date entered is not valid.');
            return;
        }

        const updatedMilestones = tna.milestones.map((m) => {
            if (m.id === selectedMilestone.id) {
                const updated = {
                    ...m,
                    notes: editNotes,
                    owner: editOwner,
                    dueDate: parsedDate.toISOString(),
                };
                updated.status = computeMilestoneStatus(updated);
                return updated;
            }
            return m;
        });
        const updatedTNA = { ...tna, milestones: updatedMilestones };
        await persistAndRefresh(updatedTNA);
        setModalVisible(false);
        setSelectedMilestone(null);
    };

    // --- Add milestone ---
    const openAddModal = () => {
        setNewName('');
        setNewOwner('merchandiser');
        const tomorrow = addDays(new Date(), 7);
        setNewDueDay(String(tomorrow.getDate()));
        setNewDueMonth(String(tomorrow.getMonth() + 1));
        setNewDueYear(String(tomorrow.getFullYear()));
        setAddModalVisible(true);
    };

    const handleAddMilestone = async () => {
        if (!newName.trim()) {
            Alert.alert('Required', 'Please enter a milestone name.');
            return;
        }
        const day = parseInt(newDueDay, 10);
        const month = parseInt(newDueMonth, 10);
        const year = parseInt(newDueYear, 10);
        if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
            Alert.alert('Invalid Date', 'Please enter a valid day, month, and year.');
            return;
        }
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) {
            Alert.alert('Invalid Date', 'The date entered is not valid.');
            return;
        }

        const newMilestone = {
            id: uuid.v4(),
            name: newName.trim(),
            dueDate: parsedDate.toISOString(),
            owner: newOwner,
            completedAt: null,
            notes: '',
            status: computeMilestoneStatus({ dueDate: parsedDate.toISOString(), completedAt: null }),
        };
        const updatedMilestones = [...(tna.milestones || []), newMilestone];
        // Sort milestones by due date
        updatedMilestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        const updatedTNA = { ...tna, milestones: updatedMilestones };
        await persistAndRefresh(updatedTNA);
        setAddModalVisible(false);
    };

    // --- Delete milestone ---
    const handleDeleteMilestone = (milestone) => {
        Alert.alert(
            'Delete Milestone',
            `Are you sure you want to delete "${milestone.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelMilestoneNotifications(tnaId, milestone.id);
                        } catch (e) {
                            // Ignore
                        }
                        const updatedMilestones = tna.milestones.filter((m) => m.id !== milestone.id);
                        const updatedTNA = { ...tna, milestones: updatedMilestones };
                        await persistAndRefresh(updatedTNA);
                        // Close modal if this milestone was being edited
                        if (selectedMilestone && selectedMilestone.id === milestone.id) {
                            setModalVisible(false);
                            setSelectedMilestone(null);
                        }
                    },
                },
            ]
        );
    };

    // --- Delete entire TNA ---
    const handleDeleteTNA = () => {
        Alert.alert(
            'Delete TNA',
            'Are you sure you want to delete this entire TNA record? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteTNA(tnaId);
                        if (success) {
                            navigation.goBack();
                        } else {
                            Alert.alert('Error', 'Failed to delete TNA.');
                        }
                    },
                },
            ]
        );
    };

    const formatDueDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return isValid(date) ? format(date, 'dd MMM yyyy') : 'Invalid date';
        } catch {
            return 'Invalid date';
        }
    };

    const formatShipmentDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return isValid(date) ? format(date, 'dd MMM yyyy') : '--';
        } catch {
            return '--';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'on-track': return 'On Track';
            case 'at-risk': return 'At Risk';
            case 'delayed': return 'Delayed';
            case 'completed': return 'Completed';
            default: return status || 'Unknown';
        }
    };

    // --- Render ---
    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Text style={styles.loadingEmoji}>{'\u23F3'}</Text>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading TNA details...</Text>
            </View>
        );
    }

    if (error || !tna) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Text style={styles.errorEmoji}>{'\u26A0\uFE0F'}</Text>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error || 'TNA not found.'}</Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: ACCENT }]} onPress={loadTNA}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.card, marginTop: 10 }]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.retryBtnText, { color: colors.text }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const milestones = tna.milestones || [];
    const overallProgress = computeOverallProgress(milestones);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.backIcon, { color: colors.text }]}>{'\u2190'}</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>TNA Details</Text>
                <TouchableOpacity style={[styles.deleteHeaderBtn, { backgroundColor: '#dc354520' }]} onPress={handleDeleteTNA}>
                    <Text style={styles.deleteHeaderIcon}>{'\uD83D\uDDD1\uFE0F'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Order Info Card */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={[styles.cardHeaderRow, { borderBottomColor: colors.border }]}>
                        <Text style={styles.cardEmoji}>{'\uD83D\uDCCB'}</Text>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Order Information</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Order No.</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{tna.orderNo || '--'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Buyer</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{tna.buyer || '--'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Style</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{tna.style || '--'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Shipment Date</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{formatShipmentDate(tna.shipmentDate)}</Text>
                        </View>
                        {/* Progress bar */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressLabelRow}>
                                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Overall Progress</Text>
                                <Text style={[styles.progressPercent, { color: ACCENT }]}>{overallProgress}%</Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                                <View style={[styles.progressBarFill, { width: `${overallProgress}%`, backgroundColor: ACCENT }]} />
                            </View>
                            <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
                                {milestones.filter((m) => m.completedAt).length} of {milestones.length} milestones completed
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Milestones Timeline */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{'\uD83C\uDFAF'} Milestones</Text>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: ACCENT }]} onPress={openAddModal}>
                        <Text style={styles.addBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>

                {milestones.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                        <Text style={styles.emptyEmoji}>{'\uD83D\uDCC5'}</Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Milestones</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap "+ Add" to create your first milestone.</Text>
                    </View>
                ) : (
                    <View style={styles.timelineContainer}>
                        {milestones.map((milestone, index) => {
                            const statusColor = STATUS_COLORS[milestone.status] || '#6c757d';
                            const isCompleted = milestone.status === 'completed';
                            const isLast = index === milestones.length - 1;

                            return (
                                <TouchableOpacity
                                    key={milestone.id}
                                    style={styles.timelineRow}
                                    activeOpacity={0.7}
                                    onPress={() => openEditModal(milestone)}
                                    onLongPress={() => handleDeleteMilestone(milestone)}
                                >
                                    {/* Timeline line + dot */}
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineDot, { backgroundColor: statusColor }]}>
                                            {isCompleted && <Text style={styles.dotCheck}>{'\u2713'}</Text>}
                                        </View>
                                        {!isLast && (
                                            <View style={[styles.timelineLine, { borderLeftColor: colors.border }]} />
                                        )}
                                    </View>

                                    {/* Milestone content card */}
                                    <View style={[styles.milestoneCard, { backgroundColor: colors.card, borderLeftColor: statusColor }]}>
                                        <View style={styles.milestoneHeader}>
                                            <Text
                                                style={[
                                                    styles.milestoneName,
                                                    { color: colors.text },
                                                    isCompleted && styles.milestoneNameCompleted,
                                                ]}
                                                numberOfLines={2}
                                            >
                                                {milestone.name}
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.milestoneDeleteBtn, { backgroundColor: '#dc354515' }]}
                                                onPress={() => handleDeleteMilestone(milestone)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Text style={styles.milestoneDeleteIcon}>{'\uD83D\uDDD1\uFE0F'}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.milestoneMetaRow}>
                                            <Text style={[styles.milestoneDueDate, { color: colors.textSecondary }]}>
                                                {'\uD83D\uDCC5'} {formatDueDate(milestone.dueDate)}
                                            </Text>
                                        </View>

                                        <View style={styles.milestoneTagsRow}>
                                            {/* Owner badge */}
                                            <View style={[styles.ownerBadge, { backgroundColor: ACCENT + '18' }]}>
                                                <Text style={styles.ownerBadgeEmoji}>{OWNER_EMOJI[milestone.owner] || '\uD83D\uDC64'}</Text>
                                                <Text style={[styles.ownerBadgeText, { color: ACCENT }]}>
                                                    {milestone.owner || 'merchandiser'}
                                                </Text>
                                            </View>
                                            {/* Status badge */}
                                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                                                <View style={[styles.statusDotSmall, { backgroundColor: statusColor }]} />
                                                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                                    {getStatusLabel(milestone.status)}
                                                </Text>
                                            </View>
                                        </View>

                                        {milestone.notes ? (
                                            <Text style={[styles.milestoneNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                                                {'\uD83D\uDCDD'} {milestone.notes}
                                            </Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Milestone Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => { setModalVisible(false); setSelectedMilestone(null); }}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHandle} />
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {'\u270F\uFE0F'} Edit Milestone
                            </Text>
                            {selectedMilestone && (
                                <Text style={[styles.modalMilestoneName, { color: ACCENT }]}>
                                    {selectedMilestone.name}
                                </Text>
                            )}

                            {/* Mark completed / undo */}
                            {selectedMilestone && !selectedMilestone.completedAt ? (
                                <TouchableOpacity
                                    style={[styles.completeBtn, { backgroundColor: '#28a745' }]}
                                    onPress={handleMarkCompleted}
                                >
                                    <Text style={styles.completeBtnText}>{'\u2713'} Mark as Completed</Text>
                                </TouchableOpacity>
                            ) : selectedMilestone && selectedMilestone.completedAt ? (
                                <TouchableOpacity
                                    style={[styles.completeBtn, { backgroundColor: '#6c757d' }]}
                                    onPress={handleUndoComplete}
                                >
                                    <Text style={styles.completeBtnText}>{'\u21A9\uFE0F'} Undo Completion</Text>
                                </TouchableOpacity>
                            ) : null}

                            {/* Due date */}
                            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Due Date</Text>
                            <View style={styles.dateInputRow}>
                                <View style={styles.dateInputWrapper}>
                                    <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Day</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        value={editDueDay}
                                        onChangeText={setEditDueDay}
                                        placeholder="DD"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                                <View style={styles.dateInputWrapper}>
                                    <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Month</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        value={editDueMonth}
                                        onChangeText={setEditDueMonth}
                                        placeholder="MM"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                                <View style={[styles.dateInputWrapper, { flex: 1.5 }]}>
                                    <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Year</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        value={editDueYear}
                                        onChangeText={setEditDueYear}
                                        placeholder="YYYY"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                            </View>

                            {/* Owner */}
                            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Owner</Text>
                            <View style={styles.ownerRow}>
                                {OWNER_OPTIONS.map((owner) => (
                                    <TouchableOpacity
                                        key={owner}
                                        style={[
                                            styles.ownerOption,
                                            { backgroundColor: colors.background, borderColor: colors.border },
                                            editOwner === owner && { borderColor: ACCENT, backgroundColor: ACCENT + '15' },
                                        ]}
                                        onPress={() => setEditOwner(owner)}
                                    >
                                        <Text style={styles.ownerOptionEmoji}>{OWNER_EMOJI[owner]}</Text>
                                        <Text
                                            style={[
                                                styles.ownerOptionText,
                                                { color: colors.textSecondary },
                                                editOwner === owner && { color: ACCENT, fontWeight: '700' },
                                            ]}
                                        >
                                            {owner}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Notes */}
                            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Notes</Text>
                            <TextInput
                                style={[styles.notesInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={editNotes}
                                onChangeText={setEditNotes}
                                placeholder="Add notes for this milestone..."
                                placeholderTextColor={colors.textSecondary}
                            />

                            {/* Save & Cancel */}
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: ACCENT }]} onPress={handleSaveEdit}>
                                <Text style={styles.saveBtnText}>{'\uD83D\uDCBE'} Save Changes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { backgroundColor: colors.background }]}
                                onPress={() => { setModalVisible(false); setSelectedMilestone(null); }}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>

                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Add Milestone Modal */}
            <Modal
                visible={addModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHandle} />
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {'\u2795'} Add Milestone
                            </Text>

                            {/* Name */}
                            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Milestone Name</Text>
                            <TextInput
                                style={[styles.textInputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="e.g. Fabric Booking"
                                placeholderTextColor={colors.textSecondary}
                            />

                            {/* Due date */}
                            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Due Date</Text>
                            <View style={styles.dateInputRow}>
                                <View style={styles.dateInputWrapper}>
                                    <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Day</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        value={newDueDay}
                                        onChangeText={setNewDueDay}
                                        placeholder="DD"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                                <View style={styles.dateInputWrapper}>
                                    <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Month</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        value={newDueMonth}
                                        onChangeText={setNewDueMonth}
                                        placeholder="MM"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                                <View style={[styles.dateInputWrapper, { flex: 1.5 }]}>
                                    <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Year</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        value={newDueYear}
                                        onChangeText={setNewDueYear}
                                        placeholder="YYYY"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                            </View>

                            {/* Owner */}
                            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Owner</Text>
                            <View style={styles.ownerRow}>
                                {OWNER_OPTIONS.map((owner) => (
                                    <TouchableOpacity
                                        key={owner}
                                        style={[
                                            styles.ownerOption,
                                            { backgroundColor: colors.background, borderColor: colors.border },
                                            newOwner === owner && { borderColor: ACCENT, backgroundColor: ACCENT + '15' },
                                        ]}
                                        onPress={() => setNewOwner(owner)}
                                    >
                                        <Text style={styles.ownerOptionEmoji}>{OWNER_EMOJI[owner]}</Text>
                                        <Text
                                            style={[
                                                styles.ownerOptionText,
                                                { color: colors.textSecondary },
                                                newOwner === owner && { color: ACCENT, fontWeight: '700' },
                                            ]}
                                        >
                                            {owner}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Add button */}
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: ACCENT }]} onPress={handleAddMilestone}>
                                <Text style={styles.saveBtnText}>{'\u2795'} Add Milestone</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { backgroundColor: colors.background }]}
                                onPress={() => setAddModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>

                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    scrollContent: {
        flex: 1,
        padding: 16,
    },

    // Loading / Error
    loadingEmoji: {
        fontSize: 40,
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 15,
        fontWeight: '500',
    },
    errorEmoji: {
        fontSize: 40,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 48,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    deleteHeaderBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteHeaderIcon: {
        fontSize: 18,
    },

    // Card
    card: {
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    cardEmoji: {
        fontSize: 20,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    cardBody: {
        padding: 16,
    },

    // Info rows
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e020',
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Progress
    progressSection: {
        marginTop: 16,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    progressPercent: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 8,
        borderRadius: 4,
    },
    progressSubtext: {
        fontSize: 12,
        marginTop: 6,
    },

    // Section header
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    // Empty state
    emptyCard: {
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        textAlign: 'center',
    },

    // Timeline
    timelineContainer: {
        paddingLeft: 4,
    },
    timelineRow: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timelineLeft: {
        width: 32,
        alignItems: 'center',
    },
    timelineDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        zIndex: 2,
    },
    dotCheck: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    timelineLine: {
        flex: 1,
        borderLeftWidth: 2,
        marginTop: -2,
    },

    // Milestone card
    milestoneCard: {
        flex: 1,
        marginLeft: 10,
        marginBottom: 12,
        borderRadius: 16,
        borderLeftWidth: 4,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    milestoneHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    milestoneName: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    milestoneNameCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    milestoneDeleteBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    milestoneDeleteIcon: {
        fontSize: 14,
    },
    milestoneMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    milestoneDueDate: {
        fontSize: 13,
    },
    milestoneTagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    ownerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ownerBadgeEmoji: {
        fontSize: 12,
    },
    ownerBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 5,
    },
    statusDotSmall: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    milestoneNotes: {
        fontSize: 12,
        marginTop: 6,
        fontStyle: 'italic',
        lineHeight: 18,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
        maxHeight: '85%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ccc',
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalMilestoneName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Complete / Undo button
    completeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    completeBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },

    // Date input
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateInputLabel: {
        fontSize: 11,
        marginBottom: 4,
        textAlign: 'center',
    },
    dateInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    dateSeparator: {
        fontSize: 20,
        fontWeight: '300',
        marginBottom: 12,
        marginHorizontal: 2,
    },

    // Owner selector
    ownerRow: {
        flexDirection: 'row',
        gap: 8,
    },
    ownerOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 4,
    },
    ownerOptionEmoji: {
        fontSize: 20,
    },
    ownerOptionText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },

    // Notes input
    notesInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        minHeight: 90,
        lineHeight: 20,
    },

    // Text input field (add modal)
    textInputField: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },

    // Save / Cancel buttons
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 24,
        shadowColor: '#e67e22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 10,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default TNADetailScreen;
