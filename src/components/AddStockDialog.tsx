
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchStock, addStock } from "@/services/financeService";
import { Stock } from "@/types/finance";

interface AddStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddStockDialog: React.FC<AddStockDialogProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<Stock | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    try {
      const result = await searchStock(query);
      if (result) {
        setSearchResult(result);
      } else {
        setError("No se encontraron resultados. Intenta con otro símbolo o nombre.");
        setSearchResult(null);
      }
    } catch (err) {
      setError("Error al buscar. Inténtalo de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = () => {
    if (searchResult) {
      addStock(searchResult);
      resetDialog();
      onClose();
    }
  };

  const resetDialog = () => {
    setQuery("");
    setSearchResult(null);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetDialog();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir nueva acción</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Símbolo o nombre de la empresa (ej: AAPL, Apple)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          {searchResult && (
            <div className="bg-secondary p-4 rounded-md">
              <h3 className="text-lg font-medium">{searchResult.name}</h3>
              <p className="text-sm text-muted-foreground">Símbolo: {searchResult.symbol}</p>
              {searchResult.sector && (
                <p className="text-sm text-muted-foreground">Sector: {searchResult.sector}</p>
              )}
              <Button className="mt-2 w-full" onClick={handleAddStock}>
                Añadir a mi watchlist
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockDialog;
