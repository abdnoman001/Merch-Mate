import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { format, isValid } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { getSampleTrackerById, updateSampleTracker } from '../utils/storageService';

const ACCENT = '#9c27b0';
const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 64 - 12) / 2;

const STATUS_COLORS = {
    pending: '#6c757d',
    submitted: '#007bff',
    approved: '#28a745',
    rejected: '#dc3545',
    revision: '#e67e22',
};

const STATUS_LABELS = {
    pending: 'Pending',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    revision: 'Revision',
};

const STAGE_SHORT = {
    'Development Sample': 'Dev',
    'Proto Sample': 'Proto',
    'PP Sample': 'PP',
    'Counter Sample': 'Counter',
    'TOP Sample': 'TOP',
    'Shipment Sample': 'Ship',
};

export default function SampleDetailScreen({ route, navigation }) {
    const { colors } = useTheme();
    const { sampleId } = route.params;

    const [sample, setSample] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeStage, setActiveStage] = useState(0);
    const [fullscreenPhoto, setFullscreenPhoto] = useState(null);

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerField, setDatePickerField] = useState(null);
    const [datePickerValue, setDatePickerValue] = useState(new Date());

    const loadSample = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getSampleTrackerById(sampleId);
            if (data) setSample(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [sampleId]);

    useEffect(() => { loadSample(); }, [loadSample]);
    useEffect(() => {
        const unsub = navigation.addListener('focus', loadSample);
        return unsub;
    }, [navigation, loadSample]);

    // ─── Helpers ─────────────────────────────────────────────

    const save = async (updated) => {
        setSample(updated);
        await updateSampleTracker(sampleId, updated);
    };

    const patchStage = async (index, patch) => {
        const stages = [...sample.stages];
        stages[index] = { ...stages[index], ...patch };
        await save({ ...sample, stages, updatedAt: new Date().toISOString() });
    };

    const fmtDate = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        return isValid(dt) ? format(dt, 'dd MMM yyyy') : null;
    };

    // ─── Date picker ────────────────────────────────────────

    const openDatePicker = (field) => {
        const stage = sample.stages[activeStage];
        const existing = stage[field] ? new Date(stage[field]) : new Date();
        setDatePickerField(field);
        setDatePickerValue(isValid(existing) ? existing : new Date());
        setShowDatePicker(true);
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (event.type === 'dismissed') return;
        if (selectedDate) {
            setDatePickerValue(selectedDate);
            if (Platform.OS === 'android') {
                patchStage(activeStage, { [datePickerField]: selectedDate.toISOString() });
            }
        }
    };

    const confirmIOSDate = () => {
        patchStage(activeStage, { [datePickerField]: datePickerValue.toISOString() });
        setShowDatePicker(false);
    };

    // ─── Photos ─────────────────────────────────────────────

    const addPhoto = async (fromCamera) => {
        const permReq = fromCamera
            ? ImagePicker.requestCameraPermissionsAsync
            : ImagePicker.requestMediaLibraryPermissionsAsync;
        const { status } = await permReq();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', fromCamera
                ? 'Camera access is needed to take photos.'
                : 'Gallery access is needed to select photos.');
            return;
        }
        const launcher = fromCamera
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync;
        const result = await launcher({ quality: 0.8 });
        if (!result.canceled && result.assets?.[0]) {
            const stage = sample.stages[activeStage];
            await patchStage(activeStage, { photos: [...(stage.photos || []), result.assets[0].uri] });
        }
    };

    const deletePhoto = (i) => {
        Alert.alert('Delete Photo', 'Remove this photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const photos = sample.stages[activeStage].photos.filter((_, idx) => idx !== i);
                    patchStage(activeStage, { photos });
                }
            },
        ]);
    };

    // ─── Status actions ─────────────────────────────────────

    const setStatus = (status, extra = {}) => patchStage(activeStage, { status, ...extra });

    const statusActions = {
        pending: [
            { label: 'Mark Submitted', color: STATUS_COLORS.submitted, icon: '📨', onPress: () => setStatus('submitted', { submittedDate: new Date().toISOString() }) },
        ],
        submitted: [
            { label: 'Approve', color: STATUS_COLORS.approved, icon: '✅', onPress: () => setStatus('approved', { approvedDate: new Date().toISOString() }) },
            { label: 'Revision', color: STATUS_COLORS.revision, icon: '🔄', onPress: () => setStatus('revision') },
            { label: 'Reject', color: STATUS_COLORS.rejected, icon: '❌', onPress: () => setStatus('rejected', { approvedDate: new Date().toISOString() }) },
        ],
        rejected: [
            { label: 'Request Revision', color: STATUS_COLORS.revision, icon: '🔄', onPress: () => setStatus('revision') },
        ],
        revision: [
            { label: 'Mark Submitted', color: STATUS_COLORS.submitted, icon: '📨', onPress: () => setStatus('submitted', { submittedDate: new Date().toISOString() }) },
        ],
        approved: [],
    };

    // ─── Render ──────────────────────────────────────────────

    if (loading || !sample) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>{loading ? '🧪' : '⚠️'}</Text>
                <Text style={[styles.centerText, { color: colors.textSecondary }]}>
                    {loading ? 'Loading...' : 'Sample not found.'}
                </Text>
                {!loading && (
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryBtnText}>Go Back</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    const stage = sample.stages[activeStage];
    const stageColor = STATUS_COLORS[stage.status] || STATUS_COLORS.pending;
    const actions = statusActions[stage.status] || [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={[styles.infoBar, { backgroundColor: colors.card }]}>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Order</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{sample.orderNo}</Text>
                    </View>
                    <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Buyer</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{sample.buyerName}</Text>
                    </View>
                    <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Style</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{sample.style}</Text>
                    </View>
                </View>

                {/* Stepper */}
                <View style={[styles.stepperCard, { backgroundColor: colors.card }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepper}>
                        {sample.stages.map((s, i) => {
                            const c = STATUS_COLORS[s.status] || STATUS_COLORS.pending;
                            const sel = i === activeStage;
                            const last = i === sample.stages.length - 1;
                            return (
                                <View key={s.id} style={styles.stepWrap}>
                                    <View style={styles.stepRow}>
                                        <TouchableOpacity
                                            style={[styles.stepDot, { backgroundColor: c }, sel && styles.stepDotActive]}
                                            onPress={() => setActiveStage(i)}
                                            activeOpacity={0.7}>
                                            <Text style={styles.stepNum}>{i + 1}</Text>
                                        </TouchableOpacity>
                                        {!last && <View style={[styles.stepLine, { backgroundColor: STATUS_COLORS[sample.stages[i + 1].status] || '#ddd' }]} />}
                                    </View>
                                    <Text style={[styles.stepText, { color: sel ? c : colors.textSecondary }, sel && { fontWeight: '700' }]} numberOfLines={1}>
                                        {STAGE_SHORT[s.stageName] || s.stageName.substring(0, 5)}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Stage Detail */}
                <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
                    {/* Title + Status */}
                    <View style={styles.titleRow}>
                        <Text style={[styles.stageTitle, { color: colors.text }]}>{stage.stageName}</Text>
                        <View style={[styles.badge, { backgroundColor: stageColor + '18' }]}>
                            <View style={[styles.badgeDot, { backgroundColor: stageColor }]} />
                            <Text style={[styles.badgeText, { color: stageColor }]}>{STATUS_LABELS[stage.status]}</Text>
                        </View>
                    </View>

                    <View style={[styles.sep, { backgroundColor: colors.border }]} />

                    {/* Dates */}
                    <DateField
                        label="Submitted Date"
                        value={fmtDate(stage.submittedDate)}
                        onPress={() => openDatePicker('submittedDate')}
                        onClear={() => patchStage(activeStage, { submittedDate: null })}
                        colors={colors}
                    />
                    {(stage.status === 'approved' || stage.status === 'rejected') && (
                        <DateField
                            label={stage.status === 'approved' ? 'Approved Date' : 'Rejected Date'}
                            value={fmtDate(stage.approvedDate)}
                            onPress={() => openDatePicker('approvedDate')}
                            onClear={() => patchStage(activeStage, { approvedDate: null })}
                            colors={colors}
                        />
                    )}

                    <View style={[styles.sep, { backgroundColor: colors.border }]} />

                    {/* Buyer Comments */}
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Buyer Comments</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={stage.buyerComments || ''}
                        onChangeText={(t) => patchStage(activeStage, { buyerComments: t })}
                        placeholder="Enter buyer comments..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        textAlignVertical="top"
                    />

                    {/* Notes */}
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>Notes</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={stage.notes || ''}
                        onChangeText={(t) => patchStage(activeStage, { notes: t })}
                        placeholder="Add notes..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        textAlignVertical="top"
                    />

                    <View style={[styles.sep, { backgroundColor: colors.border }]} />

                    {/* Photos */}
                    <View style={styles.photoHeader}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Photos</Text>
                        <View style={styles.photoActions}>
                            <TouchableOpacity style={styles.photoBtn} onPress={() => addPhoto(true)}>
                                <Text style={styles.photoBtnText}>📷 Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoBtn} onPress={() => addPhoto(false)}>
                                <Text style={styles.photoBtnText}>🖼️ Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {stage.photos?.length > 0 ? (
                        <View style={styles.photoGrid}>
                            {stage.photos.map((uri, i) => (
                                <TouchableOpacity
                                    key={`p-${i}`}
                                    style={styles.photoWrap}
                                    onPress={() => setFullscreenPhoto(uri)}
                                    onLongPress={() => deletePhoto(i)}
                                    activeOpacity={0.8}>
                                    <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.emptyPhotos, { backgroundColor: colors.background }]}>
                            <Text style={{ fontSize: 28, marginBottom: 6 }}>🖼️</Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>No photos yet</Text>
                        </View>
                    )}

                    <View style={[styles.sep, { backgroundColor: colors.border }]} />

                    {/* Actions */}
                    {actions.length > 0 ? (
                        <View style={styles.actionRow}>
                            {actions.map((a) => (
                                <TouchableOpacity
                                    key={a.label}
                                    style={[styles.actionBtn, { backgroundColor: a.color }]}
                                    onPress={a.onPress}
                                    activeOpacity={0.8}>
                                    <Text style={styles.actionIcon}>{a.icon}</Text>
                                    <Text style={styles.actionLabel}>{a.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : stage.status === 'approved' ? (
                        <View style={[styles.approvedBanner, { backgroundColor: STATUS_COLORS.approved + '12' }]}>
                            <Text style={{ fontSize: 16, marginRight: 8 }}>✅</Text>
                            <Text style={[styles.approvedText, { color: STATUS_COLORS.approved }]}>This stage has been approved</Text>
                        </View>
                    ) : null}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Native Date Picker */}
            {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={datePickerValue}
                    mode="date"
                    display="calendar"
                    onChange={onDateChange}
                />
            )}

            {/* iOS Date Picker Modal */}
            {showDatePicker && Platform.OS === 'ios' && (
                <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                    <View style={styles.overlay}>
                        <View style={[styles.iosPickerCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.iosPickerTitle, { color: colors.text }]}>Select Date</Text>
                            <DateTimePicker
                                value={datePickerValue}
                                mode="date"
                                display="spinner"
                                onChange={onDateChange}
                                style={{ height: 180 }}
                            />
                            <View style={styles.iosPickerActions}>
                                <TouchableOpacity style={[styles.iosBtn, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => setShowDatePicker(false)}>
                                    <Text style={[styles.iosBtnText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.iosBtn, { backgroundColor: ACCENT }]} onPress={confirmIOSDate}>
                                    <Text style={[styles.iosBtnText, { color: '#fff' }]}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Fullscreen Photo */}
            <Modal visible={!!fullscreenPhoto} transparent animationType="fade" onRequestClose={() => setFullscreenPhoto(null)}>
                <View style={styles.fsOverlay}>
                    <TouchableOpacity style={styles.fsClose} onPress={() => setFullscreenPhoto(null)}>
                        <Text style={styles.fsCloseText}>✕</Text>
                    </TouchableOpacity>
                    {fullscreenPhoto && <Image source={{ uri: fullscreenPhoto }} style={styles.fsImage} resizeMode="contain" />}
                </View>
            </Modal>
        </View>
    );
}

// ─── Reusable date field component ──────────────────────────

function DateField({ label, value, onPress, onClear, colors }) {
    return (
        <View style={styles.dateField}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.dateRow}>
                <Text style={[styles.dateValue, { color: value ? colors.text : colors.textSecondary }]}>
                    {value || 'Not set'}
                </Text>
                <View style={styles.dateBtns}>
                    {value && (
                        <TouchableOpacity style={[styles.dateMiniBtn, { backgroundColor: colors.background }]} onPress={onClear}>
                            <Text style={{ fontSize: 12, color: STATUS_COLORS.rejected }}>Clear</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.dateMiniBtn, { backgroundColor: ACCENT + '15' }]} onPress={onPress}>
                        <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600' }}>📅 Pick</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
    centerText: { fontSize: 15, fontWeight: '500' },
    retryBtn: { backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 16 },
    retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    // Info bar
    infoBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    infoItem: { flex: 1, alignItems: 'center' },
    infoLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
    infoValue: { fontSize: 13, fontWeight: '700' },
    infoDivider: { width: 1, height: 28, marginHorizontal: 6 },

    // Stepper
    stepperCard: { marginHorizontal: 16, marginTop: 10, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    stepper: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 6 },
    stepWrap: { alignItems: 'center', width: 56 },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    stepDotActive: { borderWidth: 3, borderColor: 'rgba(0,0,0,0.12)', transform: [{ scale: 1.15 }] },
    stepNum: { color: '#fff', fontSize: 13, fontWeight: '700' },
    stepLine: { width: 24, height: 3, borderRadius: 2 },
    stepText: { fontSize: 10, marginTop: 5, textAlign: 'center' },

    // Detail card
    detailCard: { marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    stageTitle: { fontSize: 17, fontWeight: '700', flex: 1, marginRight: 10 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    sep: { height: 1, marginVertical: 14 },

    // Date field
    dateField: { marginBottom: 10 },
    fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateValue: { fontSize: 15, fontWeight: '500' },
    dateBtns: { flexDirection: 'row', gap: 6 },
    dateMiniBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

    // Text inputs
    textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 64, lineHeight: 20 },

    // Photos
    photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    photoActions: { flexDirection: 'row', gap: 6 },
    photoBtn: { backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    photoBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    photoWrap: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e9ecef' },
    photo: { width: '100%', height: '100%' },
    emptyPhotos: { alignItems: 'center', paddingVertical: 24, borderRadius: 10 },

    // Actions
    actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    actionBtn: { flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 },
    actionIcon: { fontSize: 15, marginRight: 6 },
    actionLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
    approvedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
    approvedText: { fontSize: 14, fontWeight: '600' },

    // iOS date picker modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
    iosPickerCard: { borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
    iosPickerTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    iosPickerActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    iosBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    iosBtnText: { fontSize: 15, fontWeight: '600' },

    // Fullscreen photo
    fsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
    fsClose: { position: 'absolute', top: 50, right: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    fsCloseText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    fsImage: { width: SCREEN_WIDTH - 32, height: SCREEN_WIDTH - 32, borderRadius: 8 },
});
