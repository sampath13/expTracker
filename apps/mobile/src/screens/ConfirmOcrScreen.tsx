import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScanStore } from '@store';
import type { HomeStackParamList, OcrItem, ConfidenceTier } from '@types';
import theme from '@theme';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'ConfirmOCR'>;

const { colors, spacing } = theme;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function confidenceColor(tier: ConfidenceTier): string {
  switch (tier) {
    case 'HIGH':
      return colors.success;
    case 'MEDIUM':
      return colors.warning;
    case 'LOW':
      return colors.error;
  }
}

interface EditableItem extends OcrItem {
  localId: string;
}

function blankItem(): EditableItem {
  return {
    localId: generateId(),
    rawText: '',
    matchedName: '',
    qty: 1,
    unit: 'pcs',
    unitPrice: 0,
    total: 0,
    confidence: 'LOW',
  };
}

function InlineTextInput({
  value,
  onChange,
  onDone,
  style,
  keyboardType,
}: {
  value: string;
  onChange: (v: string) => void;
  onDone: () => void;
  style?: any;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  const [text, setText] = useState(value);
  const textRef = useRef(text);
  textRef.current = text;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return () => {
      onChangeRef.current(textRef.current);
    };
  }, []);

  return (
    <TextInput
      style={[styles.inlineInput, style]}
      value={text}
      onChangeText={setText}
      onBlur={() => {
        onChange(text);
        onDone();
      }}
      onSubmitEditing={() => {
        onChange(text);
        onDone();
      }}
      keyboardType={keyboardType}
      autoFocus
      selectTextOnFocus
    />
  );
}

function InlineNumberInput({
  value,
  onChange,
  onDone,
}: {
  value: number;
  onChange: (v: number) => void;
  onDone: () => void;
}) {
  const [text, setText] = useState(String(value));
  const textRef = useRef(text);
  textRef.current = text;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return () => {
      const parsed = parseFloat(textRef.current);
      onChangeRef.current(isNaN(parsed) ? 0 : parsed);
    };
  }, []);

  const commit = useCallback(() => {
    const parsed = parseFloat(text);
    onChange(isNaN(parsed) ? 0 : parsed);
    onDone();
  }, [text, onChange, onDone]);

  return (
    <TextInput
      style={styles.inlineNumberInput}
      value={text}
      onChangeText={setText}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="decimal-pad"
      autoFocus
      selectTextOnFocus
    />
  );
}

function ItemConfidenceDot({ tier }: { tier: ConfidenceTier }) {
  return <View style={[styles.dot, { backgroundColor: confidenceColor(tier) }]} />;
}

function ItemRow({
  item,
  index,
  editingCell,
  onStartEdit,
  onUpdateItem,
  onDelete,
}: {
  item: EditableItem;
  index: number;
  editingCell: { index: number; field: string } | null;
  onStartEdit: (index: number, field: string) => void;
  onUpdateItem: (index: number, updates: Partial<EditableItem>) => void;
  onDelete: (index: number) => void;
}) {
  const isEditing = (field: string) =>
    editingCell?.index === index && editingCell?.field === field;

  const displayTotal = (item.qty * item.unitPrice).toFixed(2);

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemMain}>
        <View style={styles.confCol}>
          <ItemConfidenceDot tier={item.confidence} />
        </View>

        <View style={styles.nameCol}>
          {item.confidence === 'LOW' ? (
            isEditing('name') ? (
              <InlineTextInput
                value={item.matchedName}
                onChange={v => onUpdateItem(index, { matchedName: v })}
                onDone={() => onStartEdit(-1, '')}
                style={styles.nameInput}
              />
            ) : (
              <TouchableOpacity onPress={() => onStartEdit(index, 'name')}>
                <Text style={styles.itemName}>
                  {item.matchedName || 'Tap to categorise'}
                </Text>
                <Text style={styles.rawLabel}>raw: {item.rawText}</Text>
              </TouchableOpacity>
            )
          ) : (
            isEditing('name') ? (
              <InlineTextInput
                value={item.matchedName}
                onChange={v => onUpdateItem(index, { matchedName: v })}
                onDone={() => onStartEdit(-1, '')}
                style={styles.nameInput}
              />
            ) : (
              <TouchableOpacity onPress={() => onStartEdit(index, 'name')}>
                <Text style={styles.itemName}>{item.matchedName}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.qtyCol}>
          {isEditing('qty') ? (
            <InlineNumberInput
              value={item.qty}
              onChange={v => onUpdateItem(index, { qty: v })}
              onDone={() => onStartEdit(-1, '')}
            />
          ) : (
            <TouchableOpacity onPress={() => onStartEdit(index, 'qty')}>
              <Text style={styles.itemField}>{item.qty}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.unitCol}>
          {isEditing('unit') ? (
            <InlineTextInput
              value={item.unit}
              onChange={v => onUpdateItem(index, { unit: v })}
              onDone={() => onStartEdit(-1, '')}
              style={styles.unitInput}
            />
          ) : (
            <TouchableOpacity onPress={() => onStartEdit(index, 'unit')}>
              <Text style={styles.itemField}>{item.unit}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.priceCol}>
          {isEditing('unitPrice') ? (
            <InlineNumberInput
              value={item.unitPrice}
              onChange={v => onUpdateItem(index, { unitPrice: v })}
              onDone={() => onStartEdit(-1, '')}
            />
          ) : (
            <TouchableOpacity onPress={() => onStartEdit(index, 'unitPrice')}>
              <Text style={styles.itemField}>${item.unitPrice.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.totalCol}>
          <Text style={styles.itemTotal}>${displayTotal}</Text>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(index)}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {item.confidence === 'MEDIUM' && item.candidateMatches && item.candidateMatches.length > 0 && (
        <View style={styles.candidateRow}>
          <Text style={styles.candidateLabel}>
            Is this <Text style={styles.candidateBold}>{item.matchedName}</Text>?
          </Text>
          <View style={styles.candidateButtons}>
            <TouchableOpacity
              style={styles.candidateBtn}
              onPress={() => onUpdateItem(index, { confidence: 'HIGH' })}
            >
              <Text style={styles.candidateBtnText}>Yes</Text>
            </TouchableOpacity>
            {item.candidateMatches.map((c, ci) => (
              <TouchableOpacity
                key={ci}
                style={styles.candidateBtn}
                onPress={() =>
                  onUpdateItem(index, {
                    matchedName: c.name,
                    unitPrice: c.price,
                    confidence: 'HIGH',
                  })
                }
              >
                <Text style={styles.candidateBtnText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.candidateBtn, styles.candidateBtnNo]}
              onPress={() => onStartEdit(index, 'name')}
            >
              <Text style={styles.candidateBtnText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function ConfirmOcrScreen() {
  const navigation = useNavigation<NavProp>();
  const { ocrResult, resetScan } = useScanStore();

  const [items, setItems] = useState<EditableItem[]>([]);
  const [retailer, setRetailer] = useState('');
  const [date, setDate] = useState('');
  const [editingCell, setEditingCell] = useState<{
    index: number;
    field: string;
  } | null>(null);

  useEffect(() => {
    if (ocrResult) {
      setItems(ocrResult.items.map(item => ({ ...item, localId: generateId() })));
      setRetailer(ocrResult.retailer);
      setDate(ocrResult.date);
    }
  }, [ocrResult]);

  const updateItem = useCallback(
    (index: number, updates: Partial<EditableItem>) => {
      setItems(prev => {
        const next = [...prev];
        next[index] = { ...next[index], ...updates };
        return next;
      });
    },
    [],
  );

  const deleteItem = useCallback((index: number) => {
    Alert.alert('Delete item', 'Remove this item from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setItems(prev => prev.filter((_, i) => i !== index)),
      },
    ]);
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, blankItem()]);
  }, []);

  const startEdit = useCallback(
    (index: number, field: string) => {
      setEditingCell(index >= 0 ? { index, field } : null);
    },
    [],
  );

  const handleConfirmAll = useCallback(() => {
    Alert.alert('Confirm All', 'Submit these items as final?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          // TODO: submit confirmed bill via API
          Alert.alert('Done', 'Bill confirmed');
          resetScan();
          navigation.goBack();
        },
      },
    ]);
  }, [navigation, resetScan]);

  const grandTotal = items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0,
  );

  if (!ocrResult) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Scan Data</Text>
          <Text style={styles.emptySubtitle}>
            Scan a receipt first to review items.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <View style={styles.header}>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Retailer</Text>
        {editingCell?.field === 'retailer' ? (
          <InlineTextInput
            value={retailer}
            onChange={setRetailer}
            onDone={() => setEditingCell(null)}
            style={styles.fieldInput}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setEditingCell({ index: -1, field: 'retailer' })}
          >
            <Text style={styles.fieldValue}>{retailer}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Date</Text>
        {editingCell?.field === 'date' ? (
          <InlineTextInput
            value={date}
            onChange={setDate}
            onDone={() => setEditingCell(null)}
            style={styles.fieldInput}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setEditingCell({ index: -1, field: 'date' })}
          >
            <Text style={styles.fieldValue}>{date}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.colHeaders}>
        <View style={styles.confCol} />
        <Text style={[styles.colHeaderText, styles.nameCol]}>Item</Text>
        <Text style={[styles.colHeaderText, styles.qtyCol]}>Qty</Text>
        <Text style={[styles.colHeaderText, styles.unitCol]}>Unit</Text>
        <Text style={[styles.colHeaderText, styles.priceCol]}>Price</Text>
        <Text style={[styles.colHeaderText, styles.totalCol]}>Total</Text>
        <View style={styles.deleteBtn} />
      </View>
    </View>
  );

  const ListFooter = (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.addButton} onPress={addItem}>
        <Text style={styles.addButtonText}>+ Add Missing Item</Text>
      </TouchableOpacity>

      {items.length === 0 && (
        <Text style={styles.emptyItemsText}>
          No items yet. Tap above to add one.
        </Text>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          items.length === 0 && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirmAll}
        disabled={items.length === 0}
      >
        <Text style={styles.confirmButtonText}>Confirm All</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={items}
          keyExtractor={item => item.localId}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader}
          renderItem={({ item, index }) => (
            <ItemRow
              item={item}
              index={index}
              editingCell={editingCell}
              onStartEdit={startEdit}
              onUpdateItem={updateItem}
              onDelete={deleteItem}
            />
          )}
          ListFooterComponent={ListFooter}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.background },

  /* empty state */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyItemsText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    marginVertical: spacing.lg,
  },

  /* header */
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flex: 1,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  colHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },

  /* item row */
  itemRow: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confCol: { width: 20, alignItems: 'center' },
  nameCol: { flex: 3, paddingHorizontal: spacing.xs },
  qtyCol: { width: 40, alignItems: 'center' },
  unitCol: { width: 36, alignItems: 'center' },
  priceCol: { width: 60, alignItems: 'flex-end' },
  totalCol: { width: 60, alignItems: 'flex-end' },

  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  rawLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemField: {
    fontSize: 13,
    color: colors.text,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  /* inline inputs */
  inlineInput: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    minWidth: 60,
  },
  inlineNumberInput: {
    fontSize: 13,
    color: colors.text,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  nameInput: { flex: 1 },
  unitInput: { minWidth: 30 },

  /* delete */
  deleteBtn: { width: 28, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 16, color: colors.error, fontWeight: '600' },

  /* candidate picker */
  candidateRow: {
    marginTop: spacing.sm,
    marginLeft: 20,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.warning,
    paddingVertical: spacing.xs,
  },
  candidateLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  candidateBold: { fontWeight: '600', color: colors.text },
  candidateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  candidateBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  candidateBtnNo: {
    backgroundColor: colors.border,
  },
  candidateBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primaryDark,
  },

  /* dot */
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  /* footer */
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },

  /* list */
  listContent: {
    flexGrow: 1,
  },
});
