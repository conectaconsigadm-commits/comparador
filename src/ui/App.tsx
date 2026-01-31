import { useState, useEffect, useCallback } from 'react'
import { AppShell } from './layout/AppShell'
import { UploadScreen } from './screens/UploadScreen'
import {
  ProcessingScreen,
  type ProcessingProgress,
  type ProcessingDetails,
} from './screens/ProcessingScreen'
import type { StepItem } from './components/StepList'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Screen = 'upload' | 'processing'

interface UploadData {
  bankLines: number
  prefFormat: string
  prefExtracted: number
  showPartialWarning: boolean
}

// ─────────────────────────────────────────────────────────────
// STEPS DO PROCESSAMENTO
// ─────────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Lendo TXT do banco',
  'Extraindo dados da prefeitura',
  'Normalizando matrículas e valores',
  'Comparando resultados',
  'Gerando Excel para download',
]

function getSteps(currentStep: number): StepItem[] {
  return STEP_LABELS.map((label, index) => ({
    label,
    state:
      index < currentStep
        ? 'done'
        : index === currentStep
        ? 'active'
        : 'pending',
  }))
}

function getStepMessage(currentStep: number): string {
  if (currentStep < 2) return 'Lendo arquivos...'
  if (currentStep < 3) return 'Normalizando dados...'
  if (currentStep < 4) return 'Comparação em andamento…'
  return 'Gerando Excel...'
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen] = useState<Screen>('upload')
  const [uploadData, setUploadData] = useState<UploadData | null>(null)

  // Progresso simulado
  const [percent, setPercent] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  // Handler do botão "Gerar relatório"
  const handleGenerate = useCallback(
    (data: {
      bankLines: number
      prefFormat: string
      prefExtracted: number
      showPartialWarning: boolean
    }) => {
      setUploadData(data)
      setPercent(0)
      setCurrentStep(0)
      setScreen('processing')
    },
    []
  )

  // Voltar para upload
  const handleBack = useCallback(() => {
    setScreen('upload')
    setPercent(0)
    setCurrentStep(0)
  }, [])

  // Simular progresso
  useEffect(() => {
    if (screen !== 'processing') return

    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.random() * 8 + 2
      })

      setCurrentStep((_prev) => {
        const newPercent = percent + 10
        if (newPercent < 20) return 0
        if (newPercent < 40) return 1
        if (newPercent < 60) return 2
        if (newPercent < 80) return 3
        return 4
      })
    }, 700)

    return () => clearInterval(interval)
  }, [screen, percent])

  // Dados do progresso
  const progress: ProcessingProgress = {
    percent,
    currentStep,
    steps: getSteps(currentStep),
  }

  const details: ProcessingDetails = uploadData
    ? {
        bankLines: uploadData.bankLines,
        prefFormat: uploadData.prefFormat,
        prefExtracted: uploadData.prefExtracted,
        message: getStepMessage(currentStep),
      }
    : {}

  return (
    <AppShell>
      {screen === 'upload' && <UploadScreen onGenerate={handleGenerate} />}
      {screen === 'processing' && (
        <ProcessingScreen
          progress={progress}
          details={details}
          showPartialWarning={uploadData?.showPartialWarning}
          onCancel={handleBack}
          onBack={handleBack}
        />
      )}
    </AppShell>
  )
}

export default App
