export const MODALITIES = [
  { value: 'online', label: 'TDS Online Student' },
  { value: 'in-person', label: 'TDS In-Person Student' },
] as const

export type ModalityValue = (typeof MODALITIES)[number]['value']

const modalityLabelMap = MODALITIES.reduce<Record<string, string>>((acc, modality) => {
  acc[modality.value] = modality.label
  return acc
}, {})

export const getModalityLabel = (value: string) => modalityLabelMap[value] ?? value
