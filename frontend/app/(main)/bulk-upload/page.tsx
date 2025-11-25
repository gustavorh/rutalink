"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ParseResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: unknown;
  }>;
  data: unknown[];
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: unknown;
  }>;
  duplicates: string[];
  createdOperations: number[];
  message?: string;
}

enum UploadStep {
  WELCOME = 0,
  DOWNLOAD_TEMPLATE = 1,
  SELECT_FILE = 2,
  VALIDATE_FILE = 3,
  UPLOAD_RESULTS = 4,
}

const STEP_TITLES = {
  [UploadStep.WELCOME]: "Bienvenido a la Carga Masiva",
  [UploadStep.DOWNLOAD_TEMPLATE]: "Descargar Plantilla",
  [UploadStep.SELECT_FILE]: "Seleccionar Archivo",
  [UploadStep.VALIDATE_FILE]: "Validar Archivo",
  [UploadStep.UPLOAD_RESULTS]: "Resultados de la Carga",
};

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>(
    UploadStep.WELCOME
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [user, setUser] = useState<{ operatorId: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    const currentUser = getUser();
    setUser(currentUser);
  }, [router]);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const blob = await api.operations.downloadExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plantilla-operaciones-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (
      !file.type.includes("spreadsheet") &&
      !file.type.includes("excel") &&
      !file.name.endsWith(".xlsx")
    ) {
      alert("El archivo debe ser un archivo Excel (.xlsx)");
      return;
    }
    setSelectedFile(file);
    setParseResult(null);
    setUploadResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleParseFile = async () => {
    if (!selectedFile || !user) return;

    try {
      setIsParsing(true);
      const result = await api.operations.parseExcelFile(selectedFile);
      setParseResult(result);
    } catch (error) {
      console.error("Error parsing file:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !parseResult) return;

    try {
      setIsUploading(true);
      const result = await api.operations.batchUploadFromFile(
        selectedFile,
        parseInt(user.operatorId, 10)
      );
      setUploadResult(result);
    } catch (error) {
      console.error("Error uploading operations:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setUploadResult(null);
    setCurrentStep(UploadStep.WELCOME);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const nextStep = () => {
    if (currentStep < UploadStep.UPLOAD_RESULTS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > UploadStep.WELCOME) {
      setCurrentStep(currentStep - 1);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setCurrentStep(UploadStep.WELCOME);
  };

  const getStepProgress = () => {
    return ((currentStep + 1) / Object.keys(UploadStep).length) * 2 * 100;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case UploadStep.WELCOME:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                ¡Te ayudamos a cargar tus operaciones!
              </h3>
              <p className="text-muted-foreground">
                Te guiaremos paso a paso para cargar múltiples operaciones desde
                un archivo Excel de forma fácil y segura.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <p className="font-medium">Descargar plantilla</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Obtén el formato correcto
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <p className="font-medium">Subir archivo</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Selecciona tu archivo Excel
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <p className="font-medium">Validar y cargar</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Revisamos y cargamos
                </p>
              </div>
            </div>
          </div>
        );

      case UploadStep.DOWNLOAD_TEMPLATE:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Descarga la plantilla Excel
              </h3>
              <p className="text-muted-foreground">
                La plantilla contiene el formato correcto y las instrucciones
                para cargar tus operaciones.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">
                La plantilla incluye:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Columnas con el formato correcto</li>
                <li>• Instrucciones detalladas</li>
                <li>• Ejemplos de datos válidos</li>
                <li>• Validaciones automáticas</li>
              </ul>
            </div>

            <Button
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="w-full"
              size="lg"
            >
              {isDownloadingTemplate ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Descargando plantilla...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Descargar Plantilla Excel
                </>
              )}
            </Button>
          </div>
        );

      case UploadStep.SELECT_FILE:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Selecciona tu archivo Excel
              </h3>
              <p className="text-muted-foreground">
                Arrastra y suelta tu archivo aquí o haz clic para seleccionarlo.
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileInputChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Cambiar Archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      Arrastra el archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Solo archivos .xlsx
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar Archivo
                  </Button>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600">
                  ✓ Archivo seleccionado correctamente
                </p>
              </div>
            )}
          </div>
        );

      case UploadStep.VALIDATE_FILE:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Validar archivo
              </h3>
              <p className="text-muted-foreground">
                Vamos a revisar tu archivo antes de cargar las operaciones.
              </p>
            </div>

            {selectedFile && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!parseResult ? (
              <Button
                onClick={handleParseFile}
                disabled={isParsing || !selectedFile}
                className="w-full"
                size="lg"
              >
                {isParsing ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Validando archivo...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Validar Archivo
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {parseResult.totalRows}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Filas</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {parseResult.validRows}
                    </p>
                    <p className="text-sm text-muted-foreground">Válidas</p>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {parseResult.errors.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Errores</p>
                  </div>
                </div>

                {parseResult.success ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm font-medium text-green-600">
                      ✓ El archivo es válido y está listo para cargar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">
                      Errores encontrados:
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {parseResult.errors.slice(0, 5).map((error, index) => (
                        <div
                          key={index}
                          className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                        >
                          <p className="text-sm font-medium text-foreground">
                            Fila {error.row} - Campo: {error.field}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {error.message}
                          </p>
                        </div>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          ... y {parseResult.errors.length - 5} errores más
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case UploadStep.UPLOAD_RESULTS:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  uploadResult?.success ? "bg-green-500/10" : "bg-red-500/10"
                }`}
              >
                <svg
                  className={`w-8 h-8 ${
                    uploadResult?.success ? "text-green-600" : "text-red-600"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {uploadResult?.success ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {uploadResult?.success
                  ? "¡Carga completada!"
                  : "Carga con errores"}
              </h3>
              <p className="text-muted-foreground">
                {uploadResult?.success
                  ? "Tus operaciones se han cargado exitosamente."
                  : "Algunos registros no pudieron ser procesados."}
              </p>
            </div>

            {uploadResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {uploadResult.totalRows}
                    </p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {uploadResult.successCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Exitosas</p>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {uploadResult.errorCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Errores</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {uploadResult.duplicates.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Duplicados</p>
                  </div>
                </div>

                {uploadResult.message && (
                  <div
                    className={`p-4 rounded-lg ${
                      uploadResult.success
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        uploadResult.success ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {uploadResult.message}
                    </p>
                  </div>
                )}

                {uploadResult.createdOperations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">
                      Operaciones creadas (
                      {uploadResult.createdOperations.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {uploadResult.createdOperations
                        .slice(0, 10)
                        .map((id, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-green-500/10"
                          >
                            #{id}
                          </Badge>
                        ))}
                      {uploadResult.createdOperations.length > 10 && (
                        <Badge variant="outline" className="bg-muted">
                          +{uploadResult.createdOperations.length - 10} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderModalFooter = () => {
    switch (currentStep) {
      case UploadStep.WELCOME:
        return (
          <div className="flex justify-end">
            <Button onClick={nextStep} size="lg">
              Comenzar
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        );

      case UploadStep.DOWNLOAD_TEMPLATE:
        return (
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Anterior
            </Button>
            <Button onClick={nextStep}>
              Continuar
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        );

      case UploadStep.SELECT_FILE:
        return (
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Anterior
            </Button>
            <Button onClick={nextStep} disabled={!selectedFile}>
              Continuar
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        );

      case UploadStep.VALIDATE_FILE:
        return (
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Anterior
            </Button>
            {parseResult?.success && (
              <Button
                onClick={async () => {
                  await handleUpload();
                  setCurrentStep(UploadStep.UPLOAD_RESULTS);
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Cargando...
                  </>
                ) : (
                  <>
                    Cargar Operaciones
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </>
                )}
              </Button>
            )}
          </div>
        );

      case UploadStep.UPLOAD_RESULTS:
        return (
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Cargar Otro Archivo
            </Button>
            <Button onClick={() => router.push("/operations")}>
              Ver Operaciones
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Carga Masiva de Operaciones"
        description="Carga múltiples operaciones desde un archivo Excel (.xlsx)"
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Carga Masiva de Operaciones
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Te guiaremos paso a paso para cargar múltiples operaciones desde
                un archivo Excel de forma fácil y segura.
              </p>
            </div>
            <Button onClick={openModal} size="lg" className="mt-4">
              Iniciar Carga Masiva
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              {STEP_TITLES[currentStep]}
            </DialogTitle>
            <div className="space-y-2">
              <Progress value={getStepProgress()} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Paso {currentStep + 1} de {Object.keys(UploadStep).length / 2}
              </p>
            </div>
          </DialogHeader>

          <div className="py-6">{renderStepContent()}</div>

          <div className="border-t pt-4">{renderModalFooter()}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
