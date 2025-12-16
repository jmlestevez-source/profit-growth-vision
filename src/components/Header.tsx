import React from "react";
import { Button } from "@/components/ui/button";
import { ApiKeyDialog } from "./ApiKeyDialog";

interface HeaderProps {
  onAddStockClick: () => void;
  onRefreshData: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddStockClick, onRefreshData }) => {
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Profit Growth Vision</h1>
          <p className="text-sm text-muted-foreground">
            Monitoriza el crecimiento financiero de tus acciones
          </p>
        </div>
        <div className="flex gap-2">
          <ApiKeyDialog />
          <Button variant="outline" onClick={onRefreshData}>
            Actualizar datos
          </Button>
          <Button onClick={onAddStockClick}>
            Añadir acción
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
