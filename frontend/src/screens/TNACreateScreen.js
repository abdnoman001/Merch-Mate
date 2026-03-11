import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDays, format, parse, isValid } from 'date-fns';
import uuid from 'react-native-uuid';
import { useTheme } from '../context/ThemeContext';
import { saveTNA } from '../utils/storageService';
import { getTNANotificationSupportMessage, scheduleTNANotifications } from '../utils/tnaNotifications';

const ACCENT = '#e67e22';

const DEFAULT_MILESTONES = [
    { name: 'Order Confirmation', offset: -90, owner: 'merchandiser' },
    { name: 'Fabric Booking', offset: -75, owner: 'merchandiser' },
    { name: 'Fabric In-house', offset: -55, owner: 'merchandiser' },
    { name: 'Trims & Accessories', offset: -45, owner: 'merchandiser' },
    { name: 'PP Sample Submission', offset: -35, owner: 'merchandiser' },
    { name: 'PP Sample Approval', offset: -28, owner: 'buyer' },
    { name: 'Bulk Production Start', offset: -21, owner: 'factory' },
    { name: 'Inline Inspection', offset: -14, owner: 'factory' },
    { name: 'Final Inspection', offset: -7, owner: 'factory' },
    { name: 'Ex-Factory (Shipment)', offset: 0, owner: 'merchandiser' },
];

const OWNER_OPTIONS = ['merchandiser', 'factory', 'buyer'];

const getOwnerEmoji = (owner) => {
    switch (owner) {
        case 'merchandiser': return '👔';
        case 'factory': return '🏭';
        case 'buyer': return '🛒';
        default: return '👤';
    }
};

const getOwnerColor = (owner) => {
    switch (owner) {
        case 'merchandiser': return '#3498db';
        case 'factory': return '#e74c3c';
        case 'buyer': return '#27ae60';
        default: return '#95a5a6';
    }
};

const TNACreateScreen = ({ navigation }) => {
    const { colors } = useTheme();

    // Form fields
    const [orderNo, setOrderNo] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [style, setStyle] = useState('');
    const [shipmentDate, setShipmentDate] = useState(null);
    const [milestones, setMilestones] = useState([]);

    // Date picker modal
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateDay, setDateDay] = useState('');
    const [dateMonth, setDateMonth] = useState('');
    const [dateYear, setDateYear] = useState('');

    // Milestone editing
    const [editingMilestoneId, setEditingMilestoneId] = useState(null);
    const [editingField, setEditingField] = useState(null); // 'date' or 'owner'

    // Milestone date edit modal
    const [showMilestoneDatePicker, setShowMilestoneDatePicker] = useState(false);
    const [milestoneDateDay, setMilestoneDateDay] = useState('');
    const [milestoneDateMonth, setMilestoneDateMonth] = useState('');
    const [milestoneDateYear, setMilestoneDateYear] = useState('');

    // Owner picker modal
    const [showOwnerPicker, setShowOwnerPicker] = useState(false);

    // Add custom milestone modal
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [newMilestoneName, setNewMilestoneName] = useState('');
    const [newMilestoneDay, setNewMilestoneDay] = useState('');
    const [newMilestoneMonth, setNewMilestoneMonth] = useState('');
    const [newMilestoneYear, setNewMilestoneYear] = useState('');
    const [newMilestoneOwner, setNewMilestoneOwner] = useState('merchandiser');

    const [saving, setSaving] = useState(false);

    // Generate milestones from shipment date
    const generateMilestones = (shipDate) => {
        return DEFAULT_MILESTONES.map((template) => ({
            id: uuid.v4(),
            name: template.name,
            dueDate: format(addDays(shipDate, template.offset), 'yyyy-MM-dd'),
            owner: template.owner,
            completedAt: null,
        }));
    };

    // Handle shipment date confirmation
    const handleConfirmDate = () => {
        const day = parseInt(dateDay, 10);
        const month = parseInt(dateMonth, 10);
        const year = parseInt(dateYear, 10);

        if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2020) {
            Alert.alert('Invalid Date', 'Please enter a valid date (DD / MM / YYYY).');
            return;
        }

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());

        if (!isValid(parsed)) {
            Alert.alert('Invalid Date', 'The date you entered is not valid.');
            return;
        }

        setShipmentDate(parsed);
        setMilestones(generateMilestones(parsed));
        setShowDatePicker(false);
    };

    // Handle milestone date edit confirmation
    const handleConfirmMilestoneDate = () => {
        const day = parseInt(milestoneDateDay, 10);
        const month = parseInt(milestoneDateMonth, 10);
        const year = parseInt(milestoneDateYear, 10);

        if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2020) {
            Alert.alert('Invalid Date', 'Please enter a valid date (DD / MM / YYYY).');
            return;
        }

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());

        if (!isValid(parsed)) {
            Alert.alert('Invalid Date', 'The date you entered is not valid.');
            return;
        }

        setMilestones((prev) =>
            prev.map((m) =>
                m.id === editingMilestoneId ? { ...m, dueDate: format(parsed, 'yyyy-MM-dd') } : m
            )
        );
        setShowMilestoneDatePicker(false);
        setEditingMilestoneId(null);
    };

    // Handle owner change
    const handleSelectOwner = (owner) => {
        setMilestones((prev) =>
            prev.map((m) =>
                m.id === editingMilestoneId ? { ...m, owner } : m
            )
        );
        setShowOwnerPicker(false);
        setEditingMilestoneId(null);
    };

    // Open milestone date editor
    const openMilestoneDateEditor = (milestone) => {
        const parsed = parse(milestone.dueDate, 'yyyy-MM-dd', new Date());
        setMilestoneDateDay(String(parsed.getDate()));
        setMilestoneDateMonth(String(parsed.getMonth() + 1));
        setMilestoneDateYear(String(parsed.getFullYear()));
        setEditingMilestoneId(milestone.id);
        setShowMilestoneDatePicker(true);
    };

    // Open owner picker
    const openOwnerPicker = (milestone) => {
        setEditingMilestoneId(milestone.id);
        setShowOwnerPicker(true);
    };

    // Delete milestone
    const handleDeleteMilestone = (milestoneId) => {
        Alert.alert('Delete Milestone', 'Are you sure you want to remove this milestone?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => setMilestones((prev) => prev.filter((m) => m.id !== milestoneId)),
            },
        ]);
    };

    // Add custom milestone
    const handleAddMilestone = () => {
        if (!newMilestoneName.trim()) {
            Alert.alert('Missing Name', 'Please enter a milestone name.');
            return;
        }

        const day = parseInt(newMilestoneDay, 10);
        const month = parseInt(newMilestoneMonth, 10);
        const year = parseInt(newMilestoneYear, 10);

        if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2020) {
            Alert.alert('Invalid Date', 'Please enter a valid date (DD / MM / YYYY).');
            return;
        }

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());

        if (!isValid(parsed)) {
            Alert.alert('Invalid Date', 'The date you entered is not valid.');
            return;
        }

        const newMilestone = {
            id: uuid.v4(),
            name: newMilestoneName.trim(),
            dueDate: format(parsed, 'yyyy-MM-dd'),
            owner: newMilestoneOwner,
            completedAt: null,
        };

        setMilestones((prev) => {
            const updated = [...prev, newMilestone];
            updated.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            return updated;
        });

        setNewMilestoneName('');
        setNewMilestoneDay('');
        setNewMilestoneMonth('');
        setNewMilestoneYear('');
        setNewMilestoneOwner('merchandiser');
        setShowAddMilestone(false);
    };

    // Open add milestone modal with pre-filled date if shipment date exists
    const openAddMilestoneModal = () => {
        if (shipmentDate) {
            setNewMilestoneDay(String(shipmentDate.getDate()));
            setNewMilestoneMonth(String(shipmentDate.getMonth() + 1));
            setNewMilestoneYear(String(shipmentDate.getFullYear()));
        } else {
            setNewMilestoneDay('');
            setNewMilestoneMonth('');
            setNewMilestoneYear('');
        }
        setNewMilestoneName('');
        setNewMilestoneOwner('merchandiser');
        setShowAddMilestone(true);
    };

    // Save TNA
    const handleSave = async () => {
        if (!orderNo.trim()) {
            Alert.alert('Validation Error', 'Please enter the Order No.');
            return;
        }
        if (!buyerName.trim()) {
            Alert.alert('Validation Error', 'Please enter the Buyer Name.');
            return;
        }
        if (!style.trim()) {
            Alert.alert('Validation Error', 'Please enter the Style.');
            return;
        }
        if (!shipmentDate) {
            Alert.alert('Validation Error', 'Please select a Shipment Date.');
            return;
        }
        if (milestones.length === 0) {
            Alert.alert('Validation Error', 'Please add at least one milestone.');
            return;
        }

        setSaving(true);
        try {
            const tna = {
                id: uuid.v4(),
                orderId: uuid.v4(),
                orderNo: orderNo.trim(),
                buyerName: buyerName.trim(),
                style: style.trim(),
                shipmentDate: format(shipmentDate, 'yyyy-MM-dd'),
                milestones,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await saveTNA(tna);
            const notificationResult = await scheduleTNANotifications(tna);
            const supportMessage = !notificationResult.supported ? getTNANotificationSupportMessage() : null;
            const successMessage = supportMessage
                ? `TNA has been created successfully.\n\n${supportMessage}`
                : 'TNA has been created successfully.';

            Alert.alert('Success', successMessage, [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Error saving TNA:', error);
            Alert.alert('Error', 'Failed to save TNA. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Format date for display
    const formatDisplayDate = (dateStr) => {
        const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
        return format(parsed, 'dd MMM yyyy');
    };

    // Render date picker modal
    const renderDatePickerModal = (
        visible,
        onClose,
        onConfirm,
        dayVal,
        setDayVal,
        monthVal,
        setMonthVal,
        yearVal,
        setYearVal,
        title
    ) => (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Enter date as DD / MM / YYYY
                    </Text>
                    <View style={styles.dateInputRow}>
                        <View style={styles.dateInputGroup}>
                            <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Day</Text>
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={dayVal}
                                onChangeText={setDayVal}
                                placeholder="DD"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                        <View style={styles.dateInputGroup}>
                            <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Month</Text>
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={monthVal}
                                onChangeText={setMonthVal}
                                placeholder="MM"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                        <View style={styles.dateInputGroup}>
                            <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Year</Text>
                            <TextInput
                                style={[styles.dateInput, styles.dateInputYear, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                keyboardType="number-pad"
                                maxLength={4}
                                value={yearVal}
                                onChangeText={setYearVal}
                                placeholder="YYYY"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.border }]} onPress={onClose}>
                            <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
                            <Text style={styles.modalConfirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>📋</Text>
                    <Text style={styles.headerTitle}>Create TNA</Text>
                    <Text style={styles.headerSubtitle}>Time & Action Calendar</Text>
                </View>

                {/* Order Info Card */}
                <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: ACCENT }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>📦</Text>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Order Information</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Order No. *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={orderNo}
                                onChangeText={setOrderNo}
                                placeholder="e.g. PO-2024-001"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Buyer Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={buyerName}
                                onChangeText={setBuyerName}
                                placeholder="e.g. H&M, Zara"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Style *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={style}
                                onChangeText={setStyle}
                                placeholder="e.g. SS24-POLO-001"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Shipment Date *</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => {
                                    if (shipmentDate) {
                                        setDateDay(String(shipmentDate.getDate()));
                                        setDateMonth(String(shipmentDate.getMonth() + 1));
                                        setDateYear(String(shipmentDate.getFullYear()));
                                    } else {
                                        setDateDay('');
                                        setDateMonth('');
                                        setDateYear('');
                                    }
                                    setShowDatePicker(true);
                                }}
                            >
                                <Text style={styles.dateButtonIcon}>📅</Text>
                                <Text style={[styles.dateButtonText, { color: shipmentDate ? colors.text : colors.textSecondary }]}>
                                    {shipmentDate ? format(shipmentDate, 'dd MMM yyyy') : 'Tap to select date'}
                                </Text>
                                <Text style={[styles.dateButtonArrow, { color: colors.textSecondary }]}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Milestones Card */}
                {milestones.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: ACCENT }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>🎯</Text>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Milestones</Text>
                            <View style={styles.milestoneBadge}>
                                <Text style={styles.milestoneBadgeText}>{milestones.length}</Text>
                            </View>
                        </View>
                        <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                            Tap date or owner to edit. Swipe left or tap trash to delete.
                        </Text>
                        <View style={styles.milestoneList}>
                            {milestones.map((milestone, index) => (
                                <View
                                    key={milestone.id}
                                    style={[
                                        styles.milestoneRow,
                                        { borderBottomColor: colors.border },
                                        index === milestones.length - 1 && { borderBottomWidth: 0 },
                                    ]}
                                >
                                    <View style={styles.milestoneIndex}>
                                        <Text style={styles.milestoneIndexText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.milestoneInfo}>
                                        <Text style={[styles.milestoneName, { color: colors.text }]}>
                                            {milestone.name}
                                        </Text>
                                        <View style={styles.milestoneMetaRow}>
                                            <TouchableOpacity
                                                style={[styles.milestoneMetaChip, { backgroundColor: colors.background }]}
                                                onPress={() => openMilestoneDateEditor(milestone)}
                                            >
                                                <Text style={styles.milestoneMetaIcon}>📅</Text>
                                                <Text style={[styles.milestoneMetaText, { color: colors.text }]}>
                                                    {formatDisplayDate(milestone.dueDate)}
                                                </Text>
                                                <Text style={[styles.editHint, { color: ACCENT }]}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.milestoneMetaChip,
                                                    { backgroundColor: getOwnerColor(milestone.owner) + '15' },
                                                ]}
                                                onPress={() => openOwnerPicker(milestone)}
                                            >
                                                <Text style={styles.milestoneMetaIcon}>
                                                    {getOwnerEmoji(milestone.owner)}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.milestoneMetaText,
                                                        { color: getOwnerColor(milestone.owner) },
                                                    ]}
                                                >
                                                    {milestone.owner}
                                                </Text>
                                                <Text style={[styles.editHint, { color: ACCENT }]}>Edit</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => handleDeleteMilestone(milestone.id)}
                                    >
                                        <Text style={styles.deleteBtnText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Add Milestone Button */}
                <TouchableOpacity
                    style={[styles.addMilestoneBtn, { borderColor: ACCENT }]}
                    onPress={openAddMilestoneModal}
                >
                    <Text style={styles.addMilestoneBtnIcon}>➕</Text>
                    <Text style={[styles.addMilestoneBtnText, { color: ACCENT }]}>Add Custom Milestone</Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonIcon}>💾</Text>
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Saving...' : 'SAVE TNA'}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Shipment Date Picker Modal */}
            {renderDatePickerModal(
                showDatePicker,
                () => setShowDatePicker(false),
                handleConfirmDate,
                dateDay,
                setDateDay,
                dateMonth,
                setDateMonth,
                dateYear,
                setDateYear,
                'Select Shipment Date'
            )}

            {/* Milestone Date Edit Modal */}
            {renderDatePickerModal(
                showMilestoneDatePicker,
                () => { setShowMilestoneDatePicker(false); setEditingMilestoneId(null); },
                handleConfirmMilestoneDate,
                milestoneDateDay,
                setMilestoneDateDay,
                milestoneDateMonth,
                setMilestoneDateMonth,
                milestoneDateYear,
                setMilestoneDateYear,
                'Edit Milestone Date'
            )}

            {/* Owner Picker Modal */}
            <Modal visible={showOwnerPicker} transparent animationType="fade" onRequestClose={() => { setShowOwnerPicker(false); setEditingMilestoneId(null); }}>
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Owner</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Who is responsible for this milestone?
                        </Text>
                        <View style={styles.ownerOptions}>
                            {OWNER_OPTIONS.map((owner) => (
                                <TouchableOpacity
                                    key={owner}
                                    style={[
                                        styles.ownerOption,
                                        { backgroundColor: getOwnerColor(owner) + '15', borderColor: getOwnerColor(owner) + '40' },
                                    ]}
                                    onPress={() => handleSelectOwner(owner)}
                                >
                                    <Text style={styles.ownerOptionEmoji}>{getOwnerEmoji(owner)}</Text>
                                    <Text style={[styles.ownerOptionText, { color: getOwnerColor(owner) }]}>
                                        {owner.charAt(0).toUpperCase() + owner.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.modalCancelBtn, { borderColor: colors.border, marginTop: 16 }]}
                            onPress={() => { setShowOwnerPicker(false); setEditingMilestoneId(null); }}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Milestone Modal */}
            <Modal visible={showAddMilestone} transparent animationType="fade" onRequestClose={() => setShowAddMilestone(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Custom Milestone</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Milestone Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newMilestoneName}
                                onChangeText={setNewMilestoneName}
                                placeholder="e.g. Lab Dip Approval"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Due Date *</Text>
                        <View style={styles.dateInputRow}>
                            <View style={styles.dateInputGroup}>
                                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Day</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    value={newMilestoneDay}
                                    onChangeText={setNewMilestoneDay}
                                    placeholder="DD"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                            <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                            <View style={styles.dateInputGroup}>
                                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Month</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    value={newMilestoneMonth}
                                    onChangeText={setNewMilestoneMonth}
                                    placeholder="MM"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                            <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                            <View style={styles.dateInputGroup}>
                                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Year</Text>
                                <TextInput
                                    style={[styles.dateInput, styles.dateInputYear, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    value={newMilestoneYear}
                                    onChangeText={setNewMilestoneYear}
                                    placeholder="YYYY"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>Owner</Text>
                        <View style={styles.ownerOptionsRow}>
                            {OWNER_OPTIONS.map((owner) => (
                                <TouchableOpacity
                                    key={owner}
                                    style={[
                                        styles.ownerChip,
                                        newMilestoneOwner === owner && {
                                            backgroundColor: getOwnerColor(owner) + '20',
                                            borderColor: getOwnerColor(owner),
                                        },
                                        newMilestoneOwner !== owner && {
                                            backgroundColor: colors.background,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => setNewMilestoneOwner(owner)}
                                >
                                    <Text style={styles.ownerChipEmoji}>{getOwnerEmoji(owner)}</Text>
                                    <Text
                                        style={[
                                            styles.ownerChipText,
                                            {
                                                color: newMilestoneOwner === owner
                                                    ? getOwnerColor(owner)
                                                    : colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        {owner.charAt(0).toUpperCase() + owner.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity
                                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                                onPress={() => setShowAddMilestone(false)}
                            >
                                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddMilestone}>
                                <Text style={styles.modalConfirmText}>Add Milestone</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        backgroundColor: ACCENT,
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        marginHorizontal: 16,
    },
    headerIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
    },

    // Cards
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    cardIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    cardContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cardHint: {
        fontSize: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        lineHeight: 18,
    },

    // Inputs
    inputWrapper: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },

    // Date button
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dateButtonIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    dateButtonText: {
        fontSize: 15,
        flex: 1,
    },
    dateButtonArrow: {
        fontSize: 10,
    },

    // Milestone badge
    milestoneBadge: {
        backgroundColor: ACCENT + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    milestoneBadgeText: {
        fontSize: 12,
        color: ACCENT,
        fontWeight: '700',
    },

    // Milestone list
    milestoneList: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    milestoneIndex: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: ACCENT + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    milestoneIndexText: {
        fontSize: 12,
        fontWeight: '700',
        color: ACCENT,
    },
    milestoneInfo: {
        flex: 1,
    },
    milestoneName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    milestoneMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    milestoneMetaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    milestoneMetaIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    milestoneMetaText: {
        fontSize: 12,
        fontWeight: '500',
    },
    editHint: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    deleteBtn: {
        padding: 8,
        marginLeft: 4,
    },
    deleteBtnText: {
        fontSize: 18,
    },

    // Add milestone button
    addMilestoneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    addMilestoneBtnIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    addMilestoneBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },

    // Save button
    saveButton: {
        flexDirection: 'row',
        backgroundColor: ACCENT,
        marginHorizontal: 16,
        marginTop: 8,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        marginBottom: 20,
    },
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    dateInputGroup: {
        flex: 1,
    },
    dateInputLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    dateInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    dateInputYear: {
        fontSize: 16,
    },
    dateSeparator: {
        fontSize: 20,
        fontWeight: '300',
        marginHorizontal: 8,
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: ACCENT,
        alignItems: 'center',
    },
    modalConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },

    // Owner picker
    ownerOptions: {
        gap: 10,
    },
    ownerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    ownerOptionEmoji: {
        fontSize: 22,
        marginRight: 12,
    },
    ownerOptionText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Owner chips (add milestone modal)
    ownerOptionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    ownerChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    ownerChipEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    ownerChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default TNACreateScreen;
