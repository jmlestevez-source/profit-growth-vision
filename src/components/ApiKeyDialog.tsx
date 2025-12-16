import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ExternalLink } from "lucide-react";
import { setFMPApiKey, getFMPApiKey } from "@/services/financialDataService";
import { toast } from "sonner";

export const ApiKeyDialog = () => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(getFMPApiKey());

  const handleSave = () => {
    if (apiKey.trim()) {
      setFMPApiKey(apiKey.trim());
      toast.success("API Key guardada correctamente");
      setOpen(false);
    } else {
      toast.error("Ingresa una API key válida");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Configurar API Key">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar API Key</DialogTitle>
          <DialogDescription>
            Para obtener datos financieros reales, necesitas una API key gratuita de Financial Modeling Prep.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key de FMP</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Tu API key aquí..."
            />
          </div>
          <a
            href="https://financialmodelingprep.com/developer/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Obtener API key gratuita (250 llamadas/día)
          </a>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
