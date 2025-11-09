"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  OperationTrackingData,
  OperationDocument,
  OperationStage,
} from "@/types/operation-tracking";

interface OperationDocumentsTabProps {
  trackingData: OperationTrackingData;
  loading: boolean;
  onDocumentUpload: () => void;
}

export function OperationDocumentsTab({
  trackingData,
  loading,
  onDocumentUpload,
}: OperationDocumentsTabProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedStage, setSelectedStage] =
    useState<OperationStage>("scheduled");

  const handleFileUpload = async (
    files: FileList | null,
    documentType: string
  ) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // TODO: Implement file upload API
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("documentType", documentType);
      formData.append("stage", selectedStage);
      formData.append("operationId", trackingData.operation.id.toString());

      console.log("Uploading document:", documentType);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock delay

      onDocumentUpload();
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSignatureCapture = () => {
    // TODO: Open signature pad modal
    console.log("Opening signature capture");
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Cargando...</div>
    );
  }

  const documentsByStage = trackingData.documents.reduce((acc, doc) => {
    if (!acc[doc.stage]) {
      acc[doc.stage] = [];
    }
    acc[doc.stage].push(doc);
    return acc;
  }, {} as Record<OperationStage, OperationDocument[]>);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Subir Documentos y Evidencias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stage Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Etapa de la Operación
            </label>
            <div className="flex gap-2">
              {(
                [
                  "scheduled",
                  "in-transit",
                  "at-site",
                  "completed",
                ] as OperationStage[]
              ).map((stage) => (
                <Button
                  key={stage}
                  variant={selectedStage === stage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStage(stage)}
                >
                  {getStageLabel(stage)}
                </Button>
              ))}
            </div>
          </div>

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <UploadButton
              label="Foto en Origen"
              icon="photo"
              documentType="photo_origin"
              onUpload={handleFileUpload}
              disabled={uploading}
            />
            <UploadButton
              label="Foto en Destino"
              icon="photo"
              documentType="photo_destination"
              onUpload={handleFileUpload}
              disabled={uploading}
            />
            <UploadButton
              label="Foto de Carga"
              icon="photo"
              documentType="photo_cargo"
              onUpload={handleFileUpload}
              disabled={uploading}
            />
            <UploadButton
              label="Comprobante"
              icon="document"
              documentType="receipt"
              onUpload={handleFileUpload}
              disabled={uploading}
            />
          </div>

          {/* Signature Button */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignatureCapture}
            >
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Capturar Firma de Entrega
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signature Display */}
      {trackingData.signature && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Firma de Entrega Conforme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 bg-white">
                <img
                  src={trackingData.signature.signatureData}
                  alt="Firma de entrega"
                  className="max-h-32 mx-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="Firmante"
                  value={trackingData.signature.signerName}
                />
                {trackingData.signature.signerRut && (
                  <InfoField
                    label="RUT"
                    value={trackingData.signature.signerRut}
                  />
                )}
                {trackingData.signature.signerRole && (
                  <InfoField
                    label="Cargo"
                    value={trackingData.signature.signerRole}
                  />
                )}
                <InfoField
                  label="Fecha"
                  value={new Date(
                    trackingData.signature.signedAt
                  ).toLocaleString("es-CL")}
                />
              </div>
              {trackingData.signature.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Observaciones
                  </div>
                  <p className="text-foreground">
                    {trackingData.signature.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents by Stage */}
      {Object.keys(documentsByStage).length > 0 ? (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Documentos Cargados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(documentsByStage) as OperationStage[]).map(
              (stage) => (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getStageLabel(stage)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {documentsByStage[stage].length} documento(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {documentsByStage[stage].map((doc) => (
                      <DocumentCard key={doc.id} document={doc} />
                    ))}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p>No hay documentos cargados para esta operación</p>
              <p className="text-sm mt-1">
                Utiliza los botones de arriba para cargar evidencias
                fotográficas y documentos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="bg-muted border-border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-primary flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Control Documental
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Asocia fotos y documentos generados en terreno</li>
                <li>Captura firmas de entrega conforme</li>
                <li>
                  Toda la evidencia se incluirá en el informe PDF de la
                  operación
                </li>
                <li>
                  Los documentos quedan vinculados a la etapa correspondiente
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface UploadButtonProps {
  label: string;
  icon: "photo" | "document";
  documentType: string;
  onUpload: (files: FileList | null, documentType: string) => void;
  disabled?: boolean;
}

function UploadButton({
  label,
  icon,
  documentType,
  onUpload,
  disabled,
}: UploadButtonProps) {
  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = icon === "photo" ? "image/*" : "*/*";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      onUpload(target.files, documentType);
    };
    input.click();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon === "photo" ? (
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ) : (
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
      )}
      <span className="text-xs text-center font-medium text-foreground">
        {label}
      </span>
    </button>
  );
}

interface DocumentCardProps {
  document: OperationDocument;
}

function DocumentCard({ document }: DocumentCardProps) {
  const isImage = document.mimeType?.startsWith("image/");

  return (
    <div className="border border-border rounded-lg p-3 hover:border-primary transition-colors cursor-pointer">
      <div className="aspect-square bg-muted rounded flex items-center justify-center mb-2">
        {isImage ? (
          <img
            src={document.fileUrl}
            alt={document.fileName}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>
      <p className="text-xs font-medium text-foreground truncate">
        {document.fileName}
      </p>
      <p className="text-xs text-muted-foreground">
        {new Date(document.uploadedAt).toLocaleDateString("es-CL")}
      </p>
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}

function getStageLabel(stage: OperationStage): string {
  const labels: Record<OperationStage, string> = {
    scheduled: "Programada",
    "in-transit": "En Tránsito",
    "at-site": "En Faena",
    completed: "Finalizada",
  };
  return labels[stage];
}
