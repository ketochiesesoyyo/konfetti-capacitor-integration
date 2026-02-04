/**
 * Admin Diagnostics Panel - Shows error details and schema status for debugging
 */

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, X, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  getDiagnosticErrors, 
  getSchemaChecks, 
  getEnvironmentInfo,
  getErrorRefCode,
  clearDiagnosticErrors,
  type DiagnosticError,
  type SchemaCheck,
} from "@/lib/adminDiagnostics";

interface AdminDiagnosticsPanelProps {
  onRefresh: () => void;
  schemaCompatible: boolean;
  usedFallback: boolean;
}

export const AdminDiagnosticsPanel = ({ 
  onRefresh, 
  schemaCompatible,
  usedFallback 
}: AdminDiagnosticsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const errors = getDiagnosticErrors();
  const schemaChecks = getSchemaChecks();
  const envInfo = getEnvironmentInfo();
  
  const hasErrors = errors.length > 0;
  const hasSchemaIssues = !schemaCompatible;
  const showPanel = hasErrors || hasSchemaIssues || usedFallback;

  if (!showPanel) return null;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Diagnóstico Admin
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              {envInfo.environment}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Summary Line */}
        <div className="flex flex-wrap gap-2 text-sm">
          {hasSchemaIssues && (
            <Badge variant="destructive">
              Schema incompatible
            </Badge>
          )}
          {usedFallback && (
            <Badge variant="secondary">
              Usando consultas de respaldo
            </Badge>
          )}
          {hasErrors && (
            <Badge variant="outline" className="text-amber-600">
              {errors.length} error(es) capturado(s)
            </Badge>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Schema Checks */}
            {schemaChecks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Comprobación de Schema
                </h4>
                <div className="space-y-1">
                  {schemaChecks.map((check, i) => (
                    <div 
                      key={i} 
                      className={`text-xs p-2 rounded flex items-center justify-between ${
                        check.passed 
                          ? 'bg-emerald-500/10 text-emerald-700' 
                          : 'bg-red-500/10 text-red-700'
                      }`}
                    >
                      <span>{check.name}</span>
                      <span>{check.passed ? '✓' : '✗'}</span>
                    </div>
                  ))}
                </div>
                
                {hasSchemaIssues && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Schema desactualizado</AlertTitle>
                    <AlertDescription>
                      El backend en Live parece estar detrás de la versión del código. 
                      Publica los últimos cambios para sincronizar.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Error List */}
            {errors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Errores Capturados</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => {
                      clearDiagnosticErrors();
                      onRefresh();
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {errors.map((error, i) => (
                    <ErrorCard key={i} error={error} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ErrorCard = ({ error }: { error: DiagnosticError }) => {
  return (
    <div className="text-xs p-2 bg-muted rounded border">
      <div className="flex items-center justify-between mb-1">
        <code className="text-amber-600 font-mono">{error.query}</code>
        <Badge variant="outline" className="text-[10px]">
          {getErrorRefCode(error)}
        </Badge>
      </div>
      <p className="text-red-600 font-medium">{error.message}</p>
      {error.code && (
        <p className="text-muted-foreground">Code: {error.code}</p>
      )}
      {error.hint && (
        <p className="text-muted-foreground mt-1">Hint: {error.hint}</p>
      )}
    </div>
  );
};

export default AdminDiagnosticsPanel;
