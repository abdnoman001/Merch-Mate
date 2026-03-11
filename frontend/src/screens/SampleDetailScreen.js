import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { format, parse, isValid } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { getSampleTrackerById, updateSampleTracker } from '../utils/storageService';

const ACCENT = '#9c27b0';
const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_SIZE = (SCREEN_WIDTH - 32 - 16 - 12) / 2;

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

const STATUS_EMOJIS = {
    pending: '\u23F3',
    submitted: '\uD83D\uDCE8',
    approved: '\u2705',
    rejected: '\u274C',
    revision: '\uD83D\uDD04',
};

const STAGE_ABBREVIATIONS = {
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
    const [error, setError] = useState(null);
    const [selectedStageIndex, setSelectedStageIndex] = useState(0);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [dateModalField, setDateModalField] = useState(null);
    const [dateDay, setDateDay] = useState('');
    const [dateMonth, setDateMonth] = useState('');
    const [dateYear, setDateYear] = useState('');
    const [fullscreenPhoto, setFullscreenPhoto] = useState(null);

    const loadSample = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSampleTrackerById(sampleId);
            if (!data) {
                setError('Sample tracker not found.');
                return;
            }
            setSample(data);
        } catch (err) {
            setError('Failed to load sample tracker.');
        } finally {
            setLoading(false);
        }
    }, [sampleId]);

    useEffect(() => {
        loadSample();
    }, [loadSample]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadSample();
        });
        return unsubscribe;
    }, [navigation, loadSample]);

    const saveAndUpdate = async (updatedSample) => {
        setSample(updatedSample);
        await updateSampleTracker(sampleId, updatedSample);
    };

    const updateStage = async (stageIndex, updates) => {
        const updatedStages = [...sample.stages];
        updatedStages[stageIndex] = { ...updatedStages[stageIndex], ...updates };
        const updatedSample = { ...sample, stages: updatedStages };
        await saveAndUpdate(updatedSample);
    };

    // ─── Date modal helpers ───────────────────────────────────

    const openDateModal = (field) => {
        const stage = sample.stages[selectedStageIndex];
        const existingDate = stage[field];

        if (existingDate) {
            try {
                const d = new Date(existingDate);
                if (isValid(d)) {
                    setDateDay(String(d.getDate()));
                    setDateMonth(String(d.getMonth() + 1));
                    setDateYear(String(d.getFullYear()));
                } else {
                    setDateDay('');
                    setDateMonth('');
                    setDateYear('');
                }
            } catch {
                setDateDay('');
                setDateMonth('');
                setDateYear('');
            }
        } else {
            const now = new Date();
            setDateDay(String(now.getDate()));
            setDateMonth(String(now.getMonth() + 1));
            setDateYear(String(now.getFullYear()));
        }

        setDateModalField(field);
        setDateModalVisible(true);
    };

    const confirmDate = () => {
        const day = parseInt(dateDay, 10);
        const month = parseInt(dateMonth, 10);
        const year = parseInt(dateYear, 10);

        if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) {
            Alert.alert('Invalid Date', 'Please enter a valid date (DD/MM/YYYY).');
            return;
        }

        const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());

        if (!isValid(parsed)) {
            Alert.alert('Invalid Date', 'The date you entered is not valid.');
            return;
        }

        updateStage(selectedStageIndex, { [dateModalField]: parsed.toISOString() });
        setDateModalVisible(false);
        setDateModalField(null);
    };

    const clearDate = () => {
        updateStage(selectedStageIndex, { [dateModalField]: null });
        setDateModalVisible(false);
        setDateModalField(null);
    };

    // ─── Photo helpers ────────────────────────────────────────

    const pickImageFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your photo library to add photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            const stage = sample.stages[selectedStageIndex];
            const updatedPhotos = [...(stage.photos || []), uri];
            await updateStage(selectedStageIndex, { photos: updatedPhotos });
        }
    };

    const pickImageFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your camera to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            const stage = sample.stages[selectedStageIndex];
            const updatedPhotos = [...(stage.photos || []), uri];
            await updateStage(selectedStageIndex, { photos: updatedPhotos });
        }
    };

    const handleAddPhoto = () => {
        Alert.alert('Add Photo', 'Choose a source', [
            { text: 'Camera', onPress: pickImageFromCamera },
            { text: 'Gallery', onPress: pickImageFromGallery },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleDeletePhoto = (photoIndex) => {
        Alert.alert('Delete Photo', 'Are you sure you want to remove this photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const stage = sample.stages[selectedStageIndex];
                    const updatedPhotos = stage.photos.filter((_, i) => i !== photoIndex);
                    await updateStage(selectedStageIndex, { photos: updatedPhotos });
                },
            },
        ]);
    };

    // ─── Status action handlers ───────────────────────────────

    const handleMarkSubmitted = async () => {
        await updateStage(selectedStageIndex, {
            status: 'submitted',
            submittedDate: new Date().toISOString(),
        });
    };

    const handleApprove = async () => {
        await updateStage(selectedStageIndex, {
            status: 'approved',
            approvedDate: new Date().toISOString(),
        });
    };

    const handleRequestRevision = async () => {
        await updateStage(selectedStageIndex, {
            status: 'revision',
        });
    };

    const handleReject = async () => {
        await updateStage(selectedStageIndex, {
            status: 'rejected',
            approvedDate: new Date().toISOString(),
        });
    };

    // ─── Text field handlers ──────────────────────────────────

    const handleBuyerCommentsChange = (text) => {
        updateStage(selectedStageIndex, { buyerComments: text });
    };

    const handleNotesChange = (text) => {
        updateStage(selectedStageIndex, { notes: text });
    };

    // ─── Formatting helpers ───────────────────────────────────

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            if (isValid(d)) {
                return format(d, 'dd MMM yyyy');
            }
        } catch {
            // ignore
        }
        return null;
    };

    // ─── Render: Loading / Error ──────────────────────────────

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <Text style={styles.loadingEmoji}>{'\uD83E\uDDEA'}</Text>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading sample tracker...</Text>
            </View>
        );
    }

    if (error || !sample) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <Text style={styles.errorEmoji}>{'\u26A0\uFE0F'}</Text>
                <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Sample not found.'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadSample}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Derived data ─────────────────────────────────────────

    const selectedStage = sample.stages[selectedStageIndex];
    const stageStatusColor = STATUS_COLORS[selectedStage.status] || STATUS_COLORS.pending;

    // ─── Render: Main screen ──────────────────────────────────

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.backIcon, { color: colors.text }]}>{'\u2190'}</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Sample Tracker</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Order Info Section */}
                <View style={[styles.orderInfoCard, { backgroundColor: colors.card }]}>
                    <View style={styles.orderInfoRow}>
                        <View style={styles.orderInfoItem}>
                            <Text style={[styles.orderInfoLabel, { color: colors.textSecondary }]}>Order No.</Text>
                            <Text style={[styles.orderInfoValue, { color: colors.text }]} numberOfLines={1}>{sample.orderNo}</Text>
                        </View>
                        <View style={[styles.orderInfoDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.orderInfoItem}>
                            <Text style={[styles.orderInfoLabel, { color: colors.textSecondary }]}>Buyer</Text>
                            <Text style={[styles.orderInfoValue, { color: colors.text }]} numberOfLines={1}>{sample.buyerName}</Text>
                        </View>
                        <View style={[styles.orderInfoDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.orderInfoItem}>
                            <Text style={[styles.orderInfoLabel, { color: colors.textSecondary }]}>Style</Text>
                            <Text style={[styles.orderInfoValue, { color: colors.text }]} numberOfLines={1}>{sample.style}</Text>
                        </View>
                    </View>
                </View>

                {/* Horizontal Stepper */}
                <View style={[styles.stepperCard, { backgroundColor: colors.card }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepperContainer}>
                        {sample.stages.map((stage, index) => {
                            const color = STATUS_COLORS[stage.status] || STATUS_COLORS.pending;
                            const isSelected = index === selectedStageIndex;
                            const isLast = index === sample.stages.length - 1;
                            const abbrev = STAGE_ABBREVIATIONS[stage.stageName] || stage.stageName.substring(0, 4);

                            return (
                                <View key={stage.id} style={styles.stepWrapper}>
                                    <View style={styles.stepRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.stepCircle,
                                                { backgroundColor: color },
                                                isSelected && styles.stepCircleSelected,
                                            ]}
                                            onPress={() => setSelectedStageIndex(index)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.stepCircleText}>{index + 1}</Text>
                                        </TouchableOpacity>
                                        {!isLast && (
                                            <View style={[styles.stepLine, { backgroundColor: STATUS_COLORS[sample.stages[index + 1].status] || '#ccc' }]} />
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            styles.stepLabel,
                                            { color: isSelected ? color : colors.textSecondary },
                                            isSelected && styles.stepLabelSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {abbrev}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Selected Stage Detail Panel */}
                <View style={[styles.stageDetailCard, { backgroundColor: colors.card }]}>
                    {/* Stage Title & Status */}
                    <View style={styles.stageHeader}>
                        <View style={styles.stageTitleRow}>
                            <Text style={styles.stageEmoji}>{STATUS_EMOJIS[selectedStage.status] || '\u23F3'}</Text>
                            <Text style={[styles.stageTitle, { color: colors.text }]}>{selectedStage.stageName}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: stageStatusColor + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: stageStatusColor }]} />
                            <Text style={[styles.statusBadgeText, { color: stageStatusColor }]}>
                                {STATUS_LABELS[selectedStage.status] || 'Pending'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Submitted Date */}
                    <View style={styles.fieldSection}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{'\uD83D\uDCC5'} Submitted Date</Text>
                        <View style={styles.dateRow}>
                            <Text style={[styles.dateText, { color: colors.text }]}>
                                {formatDate(selectedStage.submittedDate) || 'Not set'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.setDateButton, { backgroundColor: ACCENT + '15' }]}
                                onPress={() => openDateModal('submittedDate')}
                            >
                                <Text style={[styles.setDateButtonText, { color: ACCENT }]}>Set Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Approved / Rejected Date (shown conditionally) */}
                    {(selectedStage.status === 'approved' || selectedStage.status === 'rejected') && (
                        <View style={styles.fieldSection}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                                {selectedStage.status === 'approved' ? '\u2705 Approved Date' : '\u274C Rejected Date'}
                            </Text>
                            <View style={styles.dateRow}>
                                <Text style={[styles.dateText, { color: colors.text }]}>
                                    {formatDate(selectedStage.approvedDate) || 'Not set'}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.setDateButton, { backgroundColor: ACCENT + '15' }]}
                                    onPress={() => openDateModal('approvedDate')}
                                >
                                    <Text style={[styles.setDateButtonText, { color: ACCENT }]}>Set Date</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Buyer Comments */}
                    <View style={styles.fieldSection}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{'\uD83D\uDCAC'} Buyer Comments</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={selectedStage.buyerComments || ''}
                            onChangeText={handleBuyerCommentsChange}
                            placeholder="Enter buyer comments..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Notes */}
                    <View style={styles.fieldSection}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{'\uD83D\uDCDD'} Notes</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={selectedStage.notes || ''}
                            onChangeText={handleNotesChange}
                            placeholder="Add notes..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Photo Gallery */}
                    <View style={styles.fieldSection}>
                        <View style={styles.photoHeaderRow}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{'\uD83D\uDCF7'} Photos</Text>
                            <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                                <Text style={styles.addPhotoIcon}>{'\u2795'}</Text>
                                <Text style={styles.addPhotoText}>Add Photo</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedStage.photos && selectedStage.photos.length > 0 ? (
                            <View style={styles.photoGrid}>
                                {selectedStage.photos.map((uri, photoIndex) => (
                                    <TouchableOpacity
                                        key={`photo-${photoIndex}-${uri}`}
                                        style={styles.photoWrapper}
                                        onPress={() => setFullscreenPhoto(uri)}
                                        onLongPress={() => handleDeletePhoto(photoIndex)}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={[styles.noPhotosContainer, { backgroundColor: colors.background }]}>
                                <Text style={styles.noPhotosEmoji}>{'\uD83D\uDDBC\uFE0F'}</Text>
                                <Text style={[styles.noPhotosText, { color: colors.textSecondary }]}>No photos yet</Text>
                                <Text style={[styles.noPhotosHint, { color: colors.textSecondary }]}>Tap "Add Photo" to get started</Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Status Action Buttons */}
                    <View style={styles.actionSection}>
                        {selectedStage.status === 'pending' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: STATUS_COLORS.submitted }]}
                                onPress={handleMarkSubmitted}
                            >
                                <Text style={styles.actionButtonIcon}>{'\uD83D\uDCE8'}</Text>
                                <Text style={styles.actionButtonText}>Mark Submitted</Text>
                            </TouchableOpacity>
                        )}

                        {selectedStage.status === 'submitted' && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: STATUS_COLORS.approved }]}
                                    onPress={handleApprove}
                                >
                                    <Text style={styles.actionButtonIcon}>{'\u2705'}</Text>
                                    <Text style={styles.actionButtonText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: STATUS_COLORS.revision }]}
                                    onPress={handleRequestRevision}
                                >
                                    <Text style={styles.actionButtonIcon}>{'\uD83D\uDD04'}</Text>
                                    <Text style={styles.actionButtonText}>Request Revision</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: STATUS_COLORS.rejected }]}
                                    onPress={handleReject}
                                >
                                    <Text style={styles.actionButtonIcon}>{'\u274C'}</Text>
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {selectedStage.status === 'rejected' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: STATUS_COLORS.revision }]}
                                onPress={handleRequestRevision}
                            >
                                <Text style={styles.actionButtonIcon}>{'\uD83D\uDD04'}</Text>
                                <Text style={styles.actionButtonText}>Request Revision</Text>
                            </TouchableOpacity>
                        )}

                        {selectedStage.status === 'revision' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: STATUS_COLORS.submitted }]}
                                onPress={handleMarkSubmitted}
                            >
                                <Text style={styles.actionButtonIcon}>{'\uD83D\uDCE8'}</Text>
                                <Text style={styles.actionButtonText}>Mark Submitted</Text>
                            </TouchableOpacity>
                        )}

                        {selectedStage.status === 'approved' && (
                            <View style={[styles.finalStateBanner, { backgroundColor: STATUS_COLORS.approved + '15' }]}>
                                <Text style={styles.finalStateEmoji}>{'\u2705'}</Text>
                                <Text style={[styles.finalStateText, { color: STATUS_COLORS.approved }]}>
                                    This stage has been approved
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Date Picker Modal */}
            <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.dateModalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.dateModalTitle, { color: colors.text }]}>
                            {dateModalField === 'submittedDate' ? 'Set Submitted Date' : 'Set Date'}
                        </Text>
                        <Text style={[styles.dateModalSubtitle, { color: colors.textSecondary }]}>
                            Enter date in DD / MM / YYYY format
                        </Text>

                        <View style={styles.dateInputRow}>
                            <View style={styles.dateInputWrapper}>
                                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Day</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    value={dateDay}
                                    onChangeText={setDateDay}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="DD"
                                    placeholderTextColor={colors.textSecondary}
                                    textAlign="center"
                                />
                            </View>
                            <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                            <View style={styles.dateInputWrapper}>
                                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Month</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    value={dateMonth}
                                    onChangeText={setDateMonth}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="MM"
                                    placeholderTextColor={colors.textSecondary}
                                    textAlign="center"
                                />
                            </View>
                            <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>/</Text>
                            <View style={[styles.dateInputWrapper, { flex: 1.5 }]}>
                                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Year</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    value={dateYear}
                                    onChangeText={setDateYear}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    placeholder="YYYY"
                                    placeholderTextColor={colors.textSecondary}
                                    textAlign="center"
                                />
                            </View>
                        </View>

                        <View style={styles.dateModalActions}>
                            <TouchableOpacity
                                style={[styles.dateModalButton, styles.dateModalClearButton, { borderColor: colors.border }]}
                                onPress={clearDate}
                            >
                                <Text style={[styles.dateModalClearText, { color: colors.textSecondary }]}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateModalButton, styles.dateModalCancelButton, { borderColor: colors.border }]}
                                onPress={() => setDateModalVisible(false)}
                            >
                                <Text style={[styles.dateModalCancelText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateModalButton, styles.dateModalConfirmButton]}
                                onPress={confirmDate}
                            >
                                <Text style={styles.dateModalConfirmText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Fullscreen Photo Modal */}
            <Modal visible={!!fullscreenPhoto} transparent animationType="fade" onRequestClose={() => setFullscreenPhoto(null)}>
                <View style={styles.fullscreenOverlay}>
                    <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenPhoto(null)}>
                        <Text style={styles.fullscreenCloseText}>{'\u2715'}</Text>
                    </TouchableOpacity>
                    {fullscreenPhoto && (
                        <Image source={{ uri: fullscreenPhoto }} style={styles.fullscreenImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    // ─── Layout ───────────────────────────────────────────────
    container: {
        flex: 1,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    scrollContent: {
        flex: 1,
    },

    // ─── Header ───────────────────────────────────────────────
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
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    placeholder: {
        width: 40,
    },

    // ─── Loading / Error ──────────────────────────────────────
    loadingEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 15,
        fontWeight: '500',
    },
    errorEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: ACCENT,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    // ─── Order Info Card ──────────────────────────────────────
    orderInfoCard: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    orderInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    orderInfoLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    orderInfoValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    orderInfoDivider: {
        width: 1,
        height: 32,
        marginHorizontal: 8,
    },

    // ─── Horizontal Stepper ───────────────────────────────────
    stepperCard: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 8,
    },
    stepWrapper: {
        alignItems: 'center',
        width: 58,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleSelected: {
        borderWidth: 3,
        borderColor: 'rgba(0,0,0,0.15)',
        transform: [{ scale: 1.15 }],
    },
    stepCircleText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    stepLine: {
        width: 24,
        height: 3,
        borderRadius: 1.5,
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 6,
        textAlign: 'center',
    },
    stepLabelSelected: {
        fontWeight: '700',
    },

    // ─── Stage Detail Card ────────────────────────────────────
    stageDetailCard: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    stageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stageTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    stageEmoji: {
        fontSize: 22,
        marginRight: 10,
    },
    stageTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },

    // ─── Field sections ───────────────────────────────────────
    fieldSection: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateText: {
        fontSize: 15,
        fontWeight: '500',
    },
    setDateButton: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
    },
    setDateButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        minHeight: 72,
        lineHeight: 20,
    },

    // ─── Photo Gallery ────────────────────────────────────────
    photoHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    addPhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ACCENT,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    addPhotoIcon: {
        fontSize: 12,
        marginRight: 6,
        color: '#fff',
    },
    addPhotoText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    photoWrapper: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#e9ecef',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    noPhotosContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 28,
        borderRadius: 12,
    },
    noPhotosEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    noPhotosText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    noPhotosHint: {
        fontSize: 12,
    },

    // ─── Action Buttons ───────────────────────────────────────
    actionSection: {
        marginTop: 4,
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    finalStateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    finalStateEmoji: {
        fontSize: 18,
        marginRight: 8,
    },
    finalStateText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // ─── Date Modal ───────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    dateModalContent: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    dateModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    dateModalSubtitle: {
        fontSize: 13,
        marginBottom: 20,
    },
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateInputLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 6,
        textAlign: 'center',
    },
    dateInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: '600',
    },
    dateSeparator: {
        fontSize: 22,
        fontWeight: '300',
        marginHorizontal: 6,
        paddingBottom: 10,
    },
    dateModalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    dateModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateModalClearButton: {
        borderWidth: 1,
    },
    dateModalClearText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateModalCancelButton: {
        borderWidth: 1,
    },
    dateModalCancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateModalConfirmButton: {
        backgroundColor: ACCENT,
    },
    dateModalConfirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    // ─── Fullscreen Photo Modal ───────────────────────────────
    fullscreenOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullscreenClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    fullscreenCloseText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    fullscreenImage: {
        width: SCREEN_WIDTH - 32,
        height: SCREEN_WIDTH - 32,
        borderRadius: 8,
    },
});
