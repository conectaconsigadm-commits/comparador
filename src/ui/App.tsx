import { useState, useCallback, useRef } from 'react'
import { AppShell } from './layout/AppShell'
import { UploadScreen } from './screens/UploadScreen'
import {
  ProcessingScreen,
  type ProcessingProgress,
  type ProcessingDetails,
} from './screens/ProcessingScreen'
import { ResultScreen } from './screens/ResultScreen'
import type { StepItem } from './components/StepList'
import type { ReconciliationResult, DiagnosticsItem } from '../core/domain/types'
import { Reconciler } from '../core/reconcile/Reconciler'
import { ExcelExporter } from '../core/export/ExcelExporter'
import { downloadBlob } from '../core/export/download'
import {
  type UploadState,
  type BankParsedData,
  type PrefeituraParsedData,
  generateExcelFilename,
} from './state/appState'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type Screen = 'upload' | 'processing' | 'result'

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
  switch (currentStep) {
    case 0:
      return 'Lendo TXT do banco...'
    case 1:
      return 'Extraindo dados da prefeitura...'
    case 2:
      return 'Normalizando matrículas e valores...'
    case 3:
      return 'Comparação em andamento…'
    case 4:
      return 'Gerando Excel para download...'
    default:
      return 'Finalizando...'
  }
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────

function App() {
  // Tela atual
  const [screen, setScreen] = useState<Screen>('upload')

  // Dados do upload
  const [uploadState, setUploadState] = useState<UploadState>({})

  // Resultado e Excel
  const [result, setResult] = useState<ReconciliationResult | null>(null)
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null)

  // Progresso
  const [percent, setPercent] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [_processingError, setProcessingError] = useState<string | null>(null)

  // Ref para controle de cancelamento
  const cancelledRef = useRef(false)

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DO UPLOAD
  // ─────────────────────────────────────────────────────────────

  const handleBankParsed = useCallback((data: BankParsedData | null) => {
    setUploadState((prev) => ({ ...prev, bankParsed: data ?? undefined }))
  }, [])

  const handlePrefParsed = useCallback((data: PrefeituraParsedData | null) => {
    setUploadState((prev) => ({ ...prev, prefParsed: data ?? undefined }))
  }, [])

  // ─────────────────────────────────────────────────────────────
  // PIPELINE REAL
  // ─────────────────────────────────────────────────────────────

  const runPipeline = useCallback(async () => {
    const { bankParsed, prefParsed } = uploadState

    if (!bankParsed || !prefParsed) {
      setProcessingError('Dados não disponíveis')
      return
    }

    cancelledRef.current = false
    const diagnostics: DiagnosticsItem[] = []

    try {
      // Step 0: Banco já lido (10%)
      setCurrentStep(0)
      setPercent(10)
      await delay(300)
      if (cancelledRef.current) return

      // Step 1: Prefeitura já lida (25%)
      setCurrentStep(1)
      setPercent(25)
      await delay(300)
      if (cancelledRef.current) return

      // Step 2: Normalização (30%)
      setCurrentStep(2)
      setPercent(30)
      await delay(200)
      if (cancelledRef.current) return

      // Step 3: Reconciliação (60%)
      setCurrentStep(3)
      setPercent(40)

      let reconciliationResult: ReconciliationResult

      try {
        const reconciler = new Reconciler()
        reconciliationResult = reconciler.reconcile(
          bankParsed.rows,
          prefParsed.rows
        )

        // Adicionar diagnósticos do parsing
        reconciliationResult.diagnostics = [
          ...bankParsed.diagnostics,
          ...prefParsed.diagnostics,
          ...reconciliationResult.diagnostics,
        ]

        // Usar competência do banco ou prefeitura
        if (!reconciliationResult.summary.competencia) {
          reconciliationResult.summary.competencia =
            bankParsed.competencia || prefParsed.competencia
        }
      } catch (error) {
        diagnostics.push({
          severity: 'error',
          code: 'RECONCILE_ERROR',
          message: `Erro na reconciliação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        })
        reconciliationResult = {
          summary: {
            extracao: 'parcial',
            counts: {
              bateu: 0,
              so_no_banco: 0,
              so_na_prefeitura: 0,
              divergente: 0,
              diagnostico: 1,
            },
          },
          items: [],
          diagnostics,
        }
      }

      setPercent(60)
      await delay(300)
      if (cancelledRef.current) return

      // Step 4: Gerar Excel (90%)
      setCurrentStep(4)
      setPercent(75)

      let blob: Blob | null = null

      try {
        const exporter = new ExcelExporter()
        blob = await exporter.export(reconciliationResult)
      } catch (error) {
        reconciliationResult.diagnostics.push({
          severity: 'error',
          code: 'EXPORT_ERROR',
          message: `Erro ao gerar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        })
      }

      setPercent(90)
      await delay(200)
      if (cancelledRef.current) return

      // Finalizar
      setPercent(100)
      setResult(reconciliationResult)
      setExcelBlob(blob)

      await delay(300)
      if (cancelledRef.current) return

      setScreen('result')
    } catch (error) {
      setProcessingError(
        error instanceof Error ? error.message : 'Erro desconhecido'
      )
    }
  }, [uploadState])

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE NAVEGAÇÃO
  // ─────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    setPercent(0)
    setCurrentStep(0)
    setProcessingError(null)
    setScreen('processing')
    // Iniciar pipeline no próximo tick
    setTimeout(() => runPipeline(), 100)
  }, [runPipeline])

  const handleBack = useCallback(() => {
    cancelledRef.current = true
    setScreen('upload')
    setPercent(0)
    setCurrentStep(0)
    setProcessingError(null)
    setResult(null)
    setExcelBlob(null)
  }, [])

  const handleNewUpload = useCallback(() => {
    cancelledRef.current = true
    setScreen('upload')
    setUploadState({})
    setPercent(0)
    setCurrentStep(0)
    setProcessingError(null)
    setResult(null)
    setExcelBlob(null)
  }, [])

  const handleDownload = useCallback(() => {
    if (excelBlob && result) {
      const filename = generateExcelFilename(result.summary.competencia)
      downloadBlob(excelBlob, filename)
    }
  }, [excelBlob, result])

  // ─────────────────────────────────────────────────────────────
  // VALIDAÇÃO PARA GERAR
  // ─────────────────────────────────────────────────────────────

  const canGenerate =
    uploadState.bankParsed &&
    uploadState.bankParsed.rows.length > 0 &&
    uploadState.prefParsed &&
    uploadState.prefParsed.rows.length > 0 &&
    uploadState.prefParsed.formato !== 'unknown'

  // ─────────────────────────────────────────────────────────────
  // DADOS DO PROGRESSO
  // ─────────────────────────────────────────────────────────────

  const progress: ProcessingProgress = {
    percent: Math.min(percent, 100),
    currentStep,
    steps: getSteps(currentStep),
  }

  const details: ProcessingDetails = uploadState.bankParsed
    ? {
        bankLines: uploadState.bankParsed.lines,
        prefFormat: uploadState.prefParsed?.formato || 'Desconhecido',
        prefExtracted: uploadState.prefParsed?.extracted || 0,
        message: getStepMessage(currentStep),
      }
    : {}

  const showPartialWarning = uploadState.prefParsed?.extracao === 'parcial'

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <AppShell>
      {screen === 'upload' && (
        <UploadScreen
          onGenerate={handleGenerate}
          onBankParsed={handleBankParsed}
          onPrefParsed={handlePrefParsed}
          canGenerate={!!canGenerate}
        />
      )}
      {screen === 'processing' && (
        <ProcessingScreen
          progress={progress}
          details={details}
          showPartialWarning={showPartialWarning}
          onCancel={handleBack}
          onBack={handleBack}
        />
      )}
      {screen === 'result' && result && (
        <ResultScreen
          result={result}
          onNewUpload={handleNewUpload}
          onDownload={handleDownload}
          canDownload={!!excelBlob}
        />
      )}
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default App
